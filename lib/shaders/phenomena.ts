/**
 * Scene 03 — each field of exploration, as its phenomenon. One canvas lies
 * behind the whole list; every row keeps its own band (uBands) and its own
 * presence (uShow), so hovering from one row to the next crossfades in
 * place — nothing travels. A row's phenomenon grows out from where the
 * pointer came in (uGrow, from the origin stored in its band), and every
 * one answers the pointer (uMouse, eased by the stage):
 *
 *   0 thermal    isotherms rising; the pointer is a heat source they bulge around
 *   1 em         a dipole's field lines; one pole follows the pointer
 *   2 electric   equipotentials running with pulses; the pointer adds a charge
 *   3 materials  a lattice lit by diffraction rings radiating from the pointer
 *   4 signal     traces on a graticule; a scope cursor at the pointer swells them
 */

import { simplex2D, thermalRamp } from "./noise";

export const PHENOMENA = 5;

export const phenomenaFragment = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uMouse;
  // per row: top, bottom (canvas uv from the top), entry origin x (uv), entry origin y (0..1 in band)
  uniform vec4 uBands[${PHENOMENA}];
  uniform float uShow[${PHENOMENA}];
  uniform float uGrow[${PHENOMENA}];

  varying vec2 vUv;

  ${simplex2D}
  ${thermalRamp}

  const vec3 PAPER = vec3(0.925, 0.910, 0.875);

  // Coverage of contour lines of v (spacing s), width in px, given |∇v| per px.
  float contour(float v, float s, float gradPx, float width) {
    float d = abs(fract(v / s - 0.5) - 0.5) * s / max(gradPx, 1e-6);
    return 1.0 - smoothstep(width * 0.5, width * 0.5 + 1.0, d);
  }

  void main() {
    vec2 frag = vec2(vUv.x, 1.0 - vUv.y);
    float edge = 3.0 / uResolution.y;

    // Which row's band this fragment lies in (bands never overlap).
    int row = -1;
    vec4 band = vec4(0.0);
    float show = 0.0;
    float grow = 0.0;
    for (int i = 0; i < ${PHENOMENA}; i++) {
      vec4 b = uBands[i];
      if (frag.y >= b.x && frag.y <= b.y && uShow[i] > 0.001) {
        row = i;
        band = b;
        show = uShow[i] * smoothstep(b.x, b.x + edge, frag.y) * smoothstep(b.y, b.y - edge, frag.y);
        grow = uGrow[i];
      }
    }
    if (row < 0 || show < 0.001) { gl_FragColor = vec4(0.0); return; }

    // Band-local units: one unit is the band's height.
    float bh = max((band.y - band.x) * uResolution.y, 1.0);
    float W = uResolution.x / bh;
    vec2 q = vec2(frag.x * uResolution.x / bh, (frag.y - band.x) * uResolution.y / bh);
    float px = 1.0 / bh;
    float t = uTime;

    // The pointer, in the same units (it may lie outside the band).
    vec2 mouseFrag = vec2(uMouse.x, 1.0 - uMouse.y);
    vec2 m = vec2(mouseFrag.x * uResolution.x / bh, (mouseFrag.y - band.x) * uResolution.y / bh);
    float near = exp(-dot(q - m, q - m) * 0.9);

    vec3 col = vec3(0.0);
    float a = 0.0;

    if (row == 0) {
      // Thermal: isotherms rising, bulging around the pointer's heat.
      vec2 p = vec2(q.x * 0.8, q.y * 1.2 + t * 0.35);
      float h = fbm3(p) * 0.9 + (1.0 - q.y) * 0.55 + exp(-dot(q - m, q - m) * 1.6) * 0.9;
      float g = length(vec2(dFdx(h), dFdy(h)));
      float lines = 1.0 - smoothstep(0.6, 1.6, abs(fract(h * 6.0 - 0.5) - 0.5) / max(g * 6.0, 1e-5));
      float k = clamp(h, 0.0, 1.2);
      vec3 c = mix(vec3(0.55, 0.10, 0.04), HOT, smoothstep(0.1, 0.8, k));
      c = mix(c, vec3(1.0, 0.86, 0.7), smoothstep(0.95, 1.2, k));
      col = c * lines * 0.6;
      a = lines * 0.6;
    } else if (row == 1 || row == 2) {
      // A dipole; for EM one pole is carried by the pointer, for electricity
      // the pointer adds a third charge between them.
      vec2 rest0 = vec2(W * 0.66, 0.5 + 0.05 * sin(t * 0.4));
      vec2 c1 = vec2(W * 0.86, 0.5 - 0.05 * sin(t * 0.4));
      vec2 c0 = row == 1 ? mix(rest0, m, clamp(near * 3.0, 0.0, 0.85)) : rest0;
      vec2 d0 = q - c0;
      vec2 d1 = q - c1;
      vec2 d2 = q - m;
      float r0 = max(dot(d0, d0), 1e-4);
      float r1 = max(dot(d1, d1), 1e-4);
      float r2 = max(dot(d2, d2), 1e-4);
      float q2 = row == 2 ? 0.6 : 0.0;

      float psi = atan(d0.y, d0.x) - atan(d1.y, d1.x);
      float phi = 0.5 * log(r0) - 0.5 * log(r1) + q2 * 0.5 * log(r2);
      vec2 e = d0 / r0 - d1 / r1 + q2 * d2 / r2;
      float fade = smoothstep(0.02, 0.09, min(min(sqrt(r0), sqrt(r1)), row == 2 ? sqrt(r2) : 9.0));
      float gradPx = length(e) * px;

      if (row == 1) {
        // 2π / 20: a whole number of lines per charge, so atan never seams.
        float field = contour(psi, 0.3141593, gradPx, 1.2) * fade * mix(0.25, 1.0, smoothstep(0.4, 3.0, length(e)));
        col = COLD * field * 0.9;
        a = field * 0.9;
      } else {
        float equip = contour(phi, 0.22, gradPx, 1.2) * fade;
        float pulse = pow(0.5 + 0.5 * sin(abs(phi) * 9.0 - t * 3.0), 6.0);
        col = SIGNAL * equip * 0.8 * (0.45 + 0.9 * pulse);
        a = equip * (0.35 + 0.6 * pulse);
      }
    } else if (row == 3) {
      // Materials: a lattice lit by diffraction rings radiating from the pointer.
      const float N = 7.0;
      vec2 lp = q * N;
      vec2 cell = vec2(lp.x - 0.5 * floor(lp.y), lp.y);
      float node = smoothstep(0.16, 0.05, length(fract(cell) - 0.5));
      float r = length(q - m);
      float ring = pow(0.5 + 0.5 * cos(r * 40.0 - t * 2.6), 8.0) * smoothstep(2.2, 0.1, r);
      float lit = node * (0.16 + 0.95 * ring);
      col = mix(STEEL, PAPER, ring) * lit;
      a = lit;
    } else {
      // Signal: traces on a graticule, swelling under a scope cursor at the pointer.
      vec2 gd = abs(fract(q * 4.0 - 0.5) - 0.5) / (4.0 * px);
      float grid = (1.0 - smoothstep(0.0, 1.0, min(gd.x, gd.y))) * 0.12;
      float swell = 1.0 + 1.6 * exp(-pow((q.x - m.x) * 1.4, 2.0));
      float traces = 0.0;
      for (int i = 0; i < 3; i++) {
        float fi = float(i);
        float y = 0.5 + 0.18 * swell * sin(q.x * (2.2 + fi * 1.3) - t * (1.6 + fi * 0.5) + fi * 2.1) * exp(-mod(q.x + t * 0.4 + fi, W) * 0.08);
        traces += (1.0 - smoothstep(0.6, 1.8, abs(q.y - y) / px)) * (0.9 - fi * 0.22);
      }
      float scope = (1.0 - smoothstep(0.4, 1.4, abs(q.x - m.x) / px)) * 0.5 * smoothstep(-0.2, 0.2, min(m.y, 1.0 - m.y) + 0.2);
      col = mix(STEEL, PAPER, 0.5) * (grid + traces) + HOT * scope;
      a = grid + traces + scope;
    }

    // Grows out from where the pointer came in, then stays.
    vec2 origin = vec2(band.z * uResolution.x / bh, band.w);
    float reach = grow * (W * 1.15 + 1.0);
    float grown = 1.0 - smoothstep(reach - 0.6, reach, length(q - origin));

    // col is coverage-weighted; output straight alpha for the blend.
    float cover = clamp(a, 0.0, 1.0);
    float mask = mix(0.35, 1.0, smoothstep(0.1, 0.55, frag.x)) * show * grown;
    gl_FragColor = vec4(min(col / max(cover, 1e-4), vec3(1.0)), cover * mask);
  }
`;
