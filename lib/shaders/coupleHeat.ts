/**
 * Scene 04 — the heat inside the thermoelectric couple diagram, drawn in
 * the diagram's own coordinates (its SVG viewBox: 480 × 600, from y −40),
 * under the SVG's outlines. uStep runs 0 → 4 with the scene:
 *
 *   1  heat haze pouring into the hot plate, which glows
 *   2  conduction down both legs: hot at the top, cold at the foot
 *   3  carriers sparking down the legs
 *   4  the load warms as current flows
 */

import { simplex2D, thermalRamp } from "./noise";

export const coupleHeatFragment = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec2 uResolution;
  uniform float uStep;

  varying vec2 vUv;

  ${simplex2D}
  ${thermalRamp}

  float box(vec2 p, vec2 lo, vec2 hi) {
    vec2 d = max(lo - p, p - hi);
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
  }

  float stepOn(float n) { return clamp(uStep - (n - 1.0), 0.0, 1.0); }

  void main() {
    vec2 p = vec2(vUv.x * 480.0, -40.0 + (1.0 - vUv.y) * 600.0);
    float t = uTime;
    vec3 col = vec3(0.0);
    float a = 0.0;

    // 1 — heat pouring into the hot plate, and the plate's glow.
    float s1 = stepOn(1.0);
    if (s1 > 0.0) {
      float above = smoothstep(-40.0, 0.0, p.y) * smoothstep(42.0, 30.0, p.y) * smoothstep(205.0, 235.0, p.x) * smoothstep(395.0, 365.0, p.x);
      float haze = smoothstep(0.0, 0.8, fbm3(vec2(p.x * 0.018, p.y * 0.03 - t * 1.3)) + 0.25) * above;
      float glow = exp(-max(box(p, vec2(80.0, 40.0), vec2(400.0, 70.0)), 0.0) * 0.06);
      col += HOT * (haze * 0.5 + glow * 0.35) * s1;
      a += (haze * 0.5 + glow * 0.35) * s1;
    }

    // 2 — conduction down the legs, hot top to cold foot.
    float s2 = stepOn(2.0);
    float legP = box(p, vec2(120.0, 70.0), vec2(200.0, 370.0));
    float legN = box(p, vec2(290.0, 70.0), vec2(370.0, 370.0));
    float inLeg = 1.0 - smoothstep(-1.0, 1.0, min(legP, legN));
    if (s2 > 0.0 && inLeg > 0.0) {
      float T = 1.0 - clamp((p.y - 70.0) / 300.0, 0.0, 1.0);
      float churn = fbm3(vec2(p.x * 0.03, p.y * 0.02 - t * 0.9)) * 0.5 + 0.5;
      float k = clamp(T * 0.85 + (churn - 0.5) * 0.35, 0.0, 1.0);
      float body = (0.35 + 0.45 * churn) * inLeg;
      col += thermal(k) * body * s2;
      a += body * s2;
    }
    // the cold plates answer
    float cold = exp(-max(min(box(p, vec2(96.0, 370.0), vec2(224.0, 396.0)), box(p, vec2(266.0, 370.0), vec2(394.0, 396.0))), 0.0) * 0.08);
    col += COLD * cold * 0.3 * s2;
    a += cold * 0.3 * s2;

    // 3 — carriers sparking down the legs.
    float s3 = stepOn(3.0);
    if (s3 > 0.0 && inLeg > 0.0) {
      vec2 g = vec2(p.x / 9.0, (p.y - t * 70.0) / 22.0);
      vec2 id = floor(g);
      vec2 f = fract(g) - 0.5;
      float r = hash12(id);
      float spark = step(0.86, r) * smoothstep(0.35, 0.0, length(f * vec2(1.0, 0.45)));
      col += mix(HOT, vec3(1.0), 0.4) * spark * inLeg * s3;
      a += spark * inLeg * s3;
    }

    // 4 — the load warms.
    float s4 = stepOn(4.0);
    if (s4 > 0.0) {
      float load = exp(-length((p - vec2(240.0, 488.0)) / vec2(42.0, 18.0)) * 2.2) * (0.75 + 0.25 * sin(t * 6.0));
      col += HOT * load * 0.7 * s4;
      a += load * 0.7 * s4;
    }

    float cover = clamp(a, 0.0, 1.0);
    gl_FragColor = vec4(min(col / max(cover, 1e-4), vec3(1.0)), cover * 0.9);
  }
`;
