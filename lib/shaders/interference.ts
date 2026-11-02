/**
 * Fig. 02 — two coherent point sources in a ripple tank. Each emits a
 * circular wave; where they meet, they add. The wavefronts are drawn as
 * lines — crests in paper, troughs in cold blue — lit by the local
 * amplitude of the sum, so the nodal lines, where the waves cancel, fall
 * dark between them. The second source follows the pointer over the plate;
 * uWave shortens the wavelength as the section scrolls.
 */

import { simplex2D } from "./noise";

export const interferenceFragment = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uMouse;
  uniform float uWave;

  varying vec2 vUv;

  ${simplex2D}

  void main() {
    float aspect = uResolution.x / uResolution.y;
    vec2 p = (vUv - 0.5) * vec2(aspect, 1.0);
    float t = uTime * 2.4;
    float k = mix(30.0, 56.0, uWave);

    // Source A drifts slowly; source B is the probe when it's over the plate.
    vec2 a = vec2(-0.28 * aspect, 0.06 * sin(uTime * 0.3));
    bool over = all(greaterThan(uMouse, vec2(0.0))) && all(lessThan(uMouse, vec2(1.0)));
    vec2 rest = vec2(0.24 * aspect + 0.05 * sin(uTime * 0.21), -0.08 + 0.06 * cos(uTime * 0.27));
    vec2 b = over ? (uMouse - 0.5) * vec2(aspect, 1.0) : rest;

    float r1 = length(p - a);
    float r2 = length(p - b);
    // Amplitude falls off as each circular wave spreads.
    float a1 = 1.0 / (1.0 + r1 * 2.2);
    float a2 = 1.0 / (1.0 + r2 * 2.2);
    float h = a1 * sin(r1 * k - t) + a2 * sin(r2 * k - t);
    // The envelope of the sum: large where the waves agree, zero on nodal lines.
    float amp = sqrt(max(a1 * a1 + a2 * a2 + 2.0 * a1 * a2 * cos(k * (r1 - r2)), 0.0));
    float lit = smoothstep(0.08, 0.85, amp / (a1 + a2));

    float g = max(fwidth(h), 1e-5);
    float crest = 1.0 - smoothstep(0.0, 1.4, abs(h - 0.6 * amp) / g);
    float trough = 1.0 - smoothstep(0.0, 1.4, abs(h + 0.6 * amp) / g);

    vec3 col = vec3(0.045, 0.049, 0.058);
    col += vec3(0.30, 0.49, 1.0) * max(h, 0.0) * lit * 0.25;
    col += vec3(0.925, 0.910, 0.875) * crest * lit * 0.85;
    col += vec3(0.30, 0.49, 1.0) * trough * lit * 0.55;

    // The sources themselves.
    col += vec3(1.0, 0.42, 0.16) * smoothstep(0.022, 0.0, length(p - a));
    col += vec3(1.0, 0.42, 0.16) * smoothstep(0.022, 0.0, length(p - b));

    // Plate edges fall off; a little grain, like film.
    vec2 v = vUv - 0.5;
    col *= 1.0 - 0.9 * dot(v, v);
    col += (hash12(vUv * uResolution + fract(uTime) * 41.0) - 0.5) * 0.03;
    gl_FragColor = vec4(col, 1.0);
  }
`;
