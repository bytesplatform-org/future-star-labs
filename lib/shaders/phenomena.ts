/**
 * Scene 03 — each field of exploration, as its phenomenon. One canvas lies
 * behind the whole list; the shader works only inside a band (uBand) that
 * travels to the active row, and draws that row's field:
 *
 *   thermal      isotherms of heat rising through the band
 *   em           field lines of a dipole
 *   electric     equipotentials, with pulses running out along them
 *   materials    a crystal lattice lit by diffraction rings
 *   signal       oscilloscope traces on a graticule
 *
 * uModeA = (thermal, em, electric, materials), uModeB = signal — weights
 * eased between rows, so one phenomenon dissolves into the next.
 */

import { simplex2D, thermalRamp } from "./noise";

export const phenomenaFragment = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uBand;
  uniform float uShow;
  uniform vec4 uModeA;
  uniform float uModeB;

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
    float inBand = smoothstep(uBand.x, uBand.x + edge, frag.y) * smoothstep(uBand.y, uBand.y - edge, frag.y);
    float show = inBand * uShow;
    if (show < 0.001) { gl_FragColor = vec4(0.0); return; }

    // Band-local units: one unit is the band's height.
    float bh = max((uBand.y - uBand.x) * uResolution.y, 1.0);
    float W = uResolution.x / bh;
    vec2 q = vec2(frag.x * uResolution.x / bh, (frag.y - uBand.x) * uResolution.y / bh);
    float px = 1.0 / bh; // one device px in band units
    float t = uTime;

    vec3 col = vec3(0.0);
    float a = 0.0;

    // ── thermal: isotherms rising ─────────────────────────────────────
    if (uModeA.x > 0.001) {
      vec2 p = vec2(q.x * 0.8, q.y * 1.2 + t * 0.35);
      float h = fbm3(p) * 0.9 + (1.0 - q.y) * 0.55;
      float g = length(vec2(dFdx(h), dFdy(h)));
      float lines = 1.0 - smoothstep(0.6, 1.6, abs(fract(h * 6.0 - 0.5) - 0.5) / max(g * 6.0, 1e-5));
      float k = clamp(h, 0.0, 1.0);
      vec3 c = mix(vec3(0.55, 0.10, 0.04), HOT, smoothstep(0.1, 0.8, k));
      col += c * lines * 0.55 * uModeA.x;
      a += lines * 0.55 * uModeA.x;
    }

    // ── em / electric: a dipole on the right of the band ─────────────
    if (uModeA.y + uModeA.z > 0.001) {
      vec2 c0 = vec2(W * 0.66, 0.5 + 0.05 * sin(t * 0.4));
      vec2 c1 = vec2(W * 0.86, 0.5 - 0.05 * sin(t * 0.4));
      vec2 d0 = q - c0;
      vec2 d1 = q - c1;
      float r0 = max(dot(d0, d0), 1e-4);
      float r1 = max(dot(d1, d1), 1e-4);
      float psi = atan(d0.y, d0.x) - atan(d1.y, d1.x);
      float phi = 0.5 * log(r0) - 0.5 * log(r1);
      float e = length(d0 / r0 - d1 / r1);
      float fade = smoothstep(0.02, 0.09, min(sqrt(r0), sqrt(r1)));
      float gradPx = e * px;

      // 2π / 20: a whole number of lines per charge, so atan never seams.
      float field = contour(psi, 0.3141593, gradPx, 1.2) * fade * mix(0.25, 1.0, smoothstep(0.4, 3.0, e));
      col += COLD * field * 0.9 * uModeA.y;
      a += field * 0.9 * uModeA.y;

      float equip = contour(phi, 0.22, gradPx, 1.2) * fade;
      float pulse = pow(0.5 + 0.5 * sin(abs(phi) * 9.0 - t * 3.0), 6.0);
      vec3 sig = SIGNAL * (0.45 + 0.9 * pulse);
      col += sig * equip * 0.8 * uModeA.z;
      a += equip * (0.35 + 0.6 * pulse) * uModeA.z;
    }

    // ── materials: a lattice under diffraction ───────────────────────
    if (uModeA.w > 0.001) {
      const float N = 7.0; // lattice spacing: rows per band height
      vec2 lp = q * N;
      vec2 cell = vec2(lp.x - 0.5 * floor(lp.y), lp.y);
      vec2 f = fract(cell) - 0.5;
      float node = smoothstep(0.16, 0.05, length(f));
      vec2 src = vec2(W * 0.78, 0.5);
      float r = length(q - src);
      float ring = pow(0.5 + 0.5 * cos(r * 40.0 - t * 2.2), 8.0) * smoothstep(1.6, 0.1, r);
      float lit = node * (0.18 + 0.9 * ring);
      col += mix(STEEL, PAPER, ring) * lit * uModeA.w;
      a += lit * uModeA.w;
    }

    // ── signal: traces on a graticule ────────────────────────────────
    if (uModeB > 0.001) {
      float grid = 0.0;
      vec2 g = q * 4.0;
      vec2 gd = abs(fract(g - 0.5) - 0.5) / (4.0 * px);
      grid = (1.0 - smoothstep(0.0, 1.0, min(gd.x, gd.y))) * 0.12;
      float traces = 0.0;
      for (int i = 0; i < 3; i++) {
        float fi = float(i);
        float y = 0.5 + 0.22 * sin(q.x * (2.2 + fi * 1.3) - t * (1.6 + fi * 0.5) + fi * 2.1) * exp(-mod(q.x + t * 0.4 + fi, W) * 0.08);
        traces += (1.0 - smoothstep(0.6, 1.8, abs(q.y - y) / px)) * (0.9 - fi * 0.22);
      }
      col += mix(STEEL, PAPER, 0.5) * (grid + traces) * uModeB;
      a += (grid + traces) * uModeB;
    }

    // Quiet under the titles on the left, fuller toward the right.
    // col is coverage-weighted; output straight alpha for the blend.
    float cover = clamp(a, 0.0, 1.0);
    float mask = mix(0.35, 1.0, smoothstep(0.1, 0.55, frag.x)) * show;
    gl_FragColor = vec4(min(col / max(cover, 1e-4), vec3(1.0)), cover * mask);
  }
`;
