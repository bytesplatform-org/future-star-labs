/**
 * Scene 06 — a conductor between two junctions. Temperature runs from the
 * cold junction (left) to the hot one (right); charge carriers jitter in
 * proportion to the local temperature and drift toward the cold end in
 * proportion to ΔT. With no difference they agitate in place — no net
 * current. Reverse the difference and the drift reverses.
 *
 *   uCold, uHot   junction temperatures, normalised 0..1
 *   uDrift        eased signed ΔT (−1..1)
 *   uPhase        ∫ uDrift dt, integrated on the CPU so the stream never
 *                 jumps when the controls move
 */

import { simplex2D, thermalRamp } from "./noise";

export const seebeckFragment = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec2 uResolution;
  uniform float uCold;
  uniform float uHot;
  uniform float uDrift;
  uniform float uPhase;

  varying vec2 vUv;

  #define LANES 56.0

  ${simplex2D}
  ${thermalRamp}

  // Temperature as seen: a perceptual curve onto the ramp, so a few
  // hundred degrees already reads warm.
  float tone(float T) { return pow(clamp(T, 0.0, 1.0), 0.5); }

  void main() {
    vec2 uv = vUv;
    float aspect = uResolution.x / uResolution.y;
    float t = uTime;

    // Local temperature along the conductor.
    float x = smoothstep(0.06, 0.94, uv.x);
    float T = mix(uCold, uHot, x);
    float k = tone(T);

    // The conductor: a band whose edges breathe with heat.
    float edgeNoise = fbm3(vec2(uv.x * 3.0, t * 0.15)) * 0.025 * (0.3 + T);
    float halfH = 0.3 + edgeNoise;
    float band = smoothstep(0.0, 0.01, halfH - abs(uv.y - 0.5));

    // Heat shimmer: hotter regions displace what's seen through them.
    vec2 shimmer = vec2(0.0, fbm3(vec2(uv.x * 6.0, uv.y * 4.0 - t * 0.8)) * 0.01 * T);
    vec2 sp = uv + shimmer;

    // Carriers: many fine lanes, each with its own phase, speed and spacing.
    float lane = floor(sp.y * LANES);
    float ly = fract(sp.y * LANES) - 0.5;
    float rnd = hash12(vec2(lane, 3.7));
    float speed = 0.4 + 0.24 * rnd;
    float spacing = 0.05 + 0.05 * rnd;

    // Drift runs hot → cold (right to left for a positive ΔT); agitation is
    // a fast local wobble on top, stronger where it's hotter.
    float along = sp.x * aspect + rnd * 7.0 + uPhase * speed;
    float cell = floor(along / spacing);
    float local = fract(along / spacing) - 0.5;
    float agitation = 0.15 + 0.85 * T;
    float jitterX = snoise(vec2(cell * 1.7, t * (1.5 + 7.0 * T) + lane)) * 0.3 * agitation;
    float jitterY = snoise(vec2(cell * 2.3 + 11.0, t * (1.5 + 7.0 * T) + lane)) * 0.28 * agitation;
    float alive = step(0.55, hash12(vec2(cell, lane)));

    // Points at rest, short streaks under drift.
    float stretch = 1.0 + abs(uDrift) * 3.0;
    vec2 d = vec2((local - jitterX) * spacing * LANES / stretch, ly - jitterY);
    float r = length(d);
    float carrier = (smoothstep(0.2, 0.04, r) + 0.35 * smoothstep(0.5, 0.0, r)) * alive;

    vec3 heat = thermal(k);
    vec3 col = vec3(0.040, 0.044, 0.052);

    // The body of the conductor carries the gradient itself.
    float body = band * (0.07 + 0.16 * k) * (0.85 + 0.15 * sin(uv.x * aspect * 140.0));
    col += heat * body;
    // Faint edges, like the outline of a sample.
    col += heat * 0.35 * (smoothstep(0.004, 0.0, abs(abs(uv.y - 0.5) - halfH)));
    col += mix(heat, vec3(1.0), 0.25) * carrier * band * (0.55 + 0.9 * k);

    // Junction plates at each end.
    float plateBand = smoothstep(0.0, 0.01, 0.34 - abs(uv.y - 0.5));
    float plateL = smoothstep(0.035, 0.03, uv.x) * plateBand;
    float plateR = smoothstep(0.965, 0.97, uv.x) * plateBand;
    col += thermal(tone(uCold)) * plateL * 0.9 + thermal(tone(uHot)) * plateR * 0.9;

    // Radiant glow off each junction.
    col += thermal(tone(uHot)) * exp(-(1.0 - uv.x) * 6.0) * 0.22 * uHot;
    col += thermal(tone(uCold)) * exp(-uv.x * 6.0) * 0.08 * (1.0 - uCold);

    vec2 v = uv - 0.5;
    col *= 1.0 - 0.4 * dot(v, v);
    col += (hash12(uv * uResolution + fract(t) * 57.0) - 0.5) * 0.024;
    col = col / (1.0 + col * 0.3);
    gl_FragColor = vec4(col, 1.0);
  }
`;
