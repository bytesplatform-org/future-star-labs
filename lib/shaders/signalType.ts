/**
 * The footer wordmark as a signal. A wave runs along it and the letters
 * ride it — displaced vertically, split into cold and warm fringes where
 * it moves fastest — with an oscilloscope trace drawn through the middle.
 * At rest a single wave packet crosses every few seconds; moving the
 * pointer over the wordmark drives the amplitude up where the hand is.
 *
 *   uEnergy   pointer activity, 0..1, decaying
 *   uText     0..1, the GL wordmark fading in over the DOM one
 */

import { glyphChunk } from "@/lib/gl/typeAtlas";

export const SIGNAL_WORDS = 3;

export const signalTypeFragment = /* glsl */ `
  precision highp float;

  uniform float uTime;
  uniform vec2 uResolution;
  uniform vec2 uMouse;
  uniform float uEnergy;
  uniform float uText;

  varying vec2 vUv;

  ${glyphChunk(SIGNAL_WORDS)}

  const vec3 PAPER = vec3(0.925, 0.910, 0.875);
  const vec3 COLD = vec3(0.30, 0.49, 1.0);
  const vec3 HOT = vec3(1.0, 0.42, 0.16);
  const vec3 SIGNAL = vec3(0.56, 0.46, 1.0);

  void main() {
    vec2 p = vec2(vUv.x, 1.0 - vUv.y) * uResolution;
    float x = vUv.x;
    float t = uTime;

    // Where the signal is strong: a packet crossing at rest, and the hand.
    float packetX = fract(t * 0.16) * 1.6 - 0.3;
    float packet = exp(-pow((x - packetX) * 7.0, 2.0)) * 0.55;
    float hand = exp(-pow((x - uMouse.x) * 4.0, 2.0)) * uEnergy;
    float env = 0.04 + packet + hand;

    float phase = x * 34.0 - t * 7.0;
    float amp = uResolution.y * 0.07 * env;
    float dy = amp * sin(phase);
    float slope = amp * cos(phase); // how fast the wave moves here

    vec2 g = glyph(p - vec2(0.0, dy)) * uText;
    float cold = glyph(p - vec2(0.0, dy + slope * 0.35)).x * uText;
    float warm = glyph(p - vec2(0.0, dy - slope * 0.35)).x * uText;

    float a = g.x;
    vec3 col = PAPER * a;
    float fc = max(cold - g.x, 0.0);
    float fw = max(warm - g.x, 0.0);
    col += COLD * fc * 0.85 + HOT * fw * 0.85;
    a = max(a, max(fc, fw) * 0.85);

    // The trace through the middle, visible where there's signal.
    float traceY = uResolution.y * 0.5 + dy * 1.6;
    float trace = 1.0 - smoothstep(0.6, 2.0, abs(p.y - traceY));
    trace *= smoothstep(0.03, 0.25, env) * (1.0 - a);
    col += SIGNAL * trace * 0.8;
    a += trace * 0.8;

    gl_FragColor = vec4(min(col / max(a, 1e-4), vec3(1.0)), clamp(a, 0.0, 1.0));
  }
`;
