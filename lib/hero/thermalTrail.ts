/**
 * The hero headline as a thermal medium: a small stable-fluids solver
 * (after the ink trail on bytesplatform.com) whose dye is heat. The pointer
 * stirs it and deposits heat, and heat is buoyant. Nothing of the fluid is
 * drawn in the open — it shows only through the letters, drawn here from a
 * glyph atlas placed each frame from the live DOM: the velocity refracts
 * them, the heat burns them toward white, hollow letterforms fill where
 * it's hot. The page's visible trail is the film trail (lib/gl/filmTrail.ts).
 */

import * as THREE from "three";
import type { Pass } from "@/lib/gl/engine";
import { glyphChunk, glyphUniforms, setGlyphAtlas, setGlyphPlacements, type WordPlacement } from "@/lib/gl/typeAtlas";

const STEP = 1 / 60;
const VELOCITY_DISSIPATION = 0.94;
const HEAT_DISSIPATION = 0.98;
const CURL_STRENGTH = 9;
const BUOYANCY = 0.9;
const SPLAT_RADIUS = 0.0022;
const FORCE = 42;
const WORDS = 3;

export type TrailQuality = { sim: number; dye: number; pressureIterations: number };

export type ThermalTrail = Pass & {
  /** pointer in the canvas, 0..1 from the top-left; outside lifts the probe */
  pointer(x: number, y: number): void;
  setAtlas(fill: HTMLCanvasElement): void;
  place(words: WordPlacement[]): void;
  /** 0..1 — the GL headline fades in once it has taken over from the DOM */
  readonly text: { value: number };
};

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

// Velocity is stored in uv units per second, so it advects without texel scaling.
const advectShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uSource;
  uniform sampler2D uVelocity;
  uniform float uDt;
  uniform float uDissipation;
  void main() {
    vec2 coord = vUv - uDt * texture2D(uVelocity, vUv).xy;
    gl_FragColor = texture2D(uSource, coord) * uDissipation;
  }
`;

const splatShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uTarget;
  uniform vec2 uPoint;
  uniform vec3 uValue;
  uniform float uRadius;
  uniform float uAspect;
  void main() {
    vec2 p = vUv - uPoint;
    p.x *= uAspect;
    vec3 base = texture2D(uTarget, vUv).xyz;
    gl_FragColor = vec4(base + uValue * exp(-dot(p, p) / uRadius), 1.0);
  }
`;

const curlShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uVelocity;
  uniform vec2 uTexel;
  void main() {
    float l = texture2D(uVelocity, vUv - vec2(uTexel.x, 0.0)).y;
    float r = texture2D(uVelocity, vUv + vec2(uTexel.x, 0.0)).y;
    float b = texture2D(uVelocity, vUv - vec2(0.0, uTexel.y)).x;
    float t = texture2D(uVelocity, vUv + vec2(0.0, uTexel.y)).x;
    gl_FragColor = vec4(0.5 * (r - l - t + b), 0.0, 0.0, 1.0);
  }
`;

// Vorticity confinement keeps the eddies alive; buoyancy lifts the heat.
const forcesShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uVelocity;
  uniform sampler2D uCurl;
  uniform sampler2D uHeat;
  uniform vec2 uTexel;
  uniform float uCurlStrength;
  uniform float uBuoyancy;
  uniform float uDt;
  void main() {
    float l = abs(texture2D(uCurl, vUv - vec2(uTexel.x, 0.0)).x);
    float r = abs(texture2D(uCurl, vUv + vec2(uTexel.x, 0.0)).x);
    float b = abs(texture2D(uCurl, vUv - vec2(0.0, uTexel.y)).x);
    float t = abs(texture2D(uCurl, vUv + vec2(0.0, uTexel.y)).x);
    float c = texture2D(uCurl, vUv).x;
    vec2 force = 0.5 * vec2(t - b, r - l);
    force /= length(force) + 0.0001;
    force *= uCurlStrength * c;
    force.y *= -1.0;
    vec2 velocity = texture2D(uVelocity, vUv).xy + force * uDt;
    velocity.y += texture2D(uHeat, vUv).r * uBuoyancy * uDt;
    gl_FragColor = vec4(velocity, 0.0, 1.0);
  }
`;

const divergenceShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uVelocity;
  uniform vec2 uTexel;
  void main() {
    float l = texture2D(uVelocity, vUv - vec2(uTexel.x, 0.0)).x;
    float r = texture2D(uVelocity, vUv + vec2(uTexel.x, 0.0)).x;
    float b = texture2D(uVelocity, vUv - vec2(0.0, uTexel.y)).y;
    float t = texture2D(uVelocity, vUv + vec2(0.0, uTexel.y)).y;
    gl_FragColor = vec4(0.5 * (r - l + t - b), 0.0, 0.0, 1.0);
  }
`;

const pressureShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uPressure;
  uniform sampler2D uDivergence;
  uniform vec2 uTexel;
  void main() {
    float l = texture2D(uPressure, vUv - vec2(uTexel.x, 0.0)).x;
    float r = texture2D(uPressure, vUv + vec2(uTexel.x, 0.0)).x;
    float b = texture2D(uPressure, vUv - vec2(0.0, uTexel.y)).x;
    float t = texture2D(uPressure, vUv + vec2(0.0, uTexel.y)).x;
    float d = texture2D(uDivergence, vUv).x;
    gl_FragColor = vec4((l + r + b + t - d) * 0.25, 0.0, 0.0, 1.0);
  }
`;

const gradientShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uPressure;
  uniform sampler2D uVelocity;
  uniform vec2 uTexel;
  void main() {
    float l = texture2D(uPressure, vUv - vec2(uTexel.x, 0.0)).x;
    float r = texture2D(uPressure, vUv + vec2(uTexel.x, 0.0)).x;
    float b = texture2D(uPressure, vUv - vec2(0.0, uTexel.y)).x;
    float t = texture2D(uPressure, vUv + vec2(0.0, uTexel.y)).x;
    vec2 velocity = texture2D(uVelocity, vUv).xy - 0.5 * vec2(r - l, t - b);
    gl_FragColor = vec4(velocity, 0.0, 1.0);
  }
`;

// The visible frame: only the headline, refracted and heated by the medium.
// Output is premultiplied over the page.
const displayShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform sampler2D uVelocity;
  uniform sampler2D uHeat;
  ${glyphChunk(WORDS)}
  uniform vec2 uResolution;
  uniform float uText;

  const vec3 PAPER = vec3(0.925, 0.910, 0.875);
  const vec3 COLD = vec3(0.30, 0.49, 1.0);
  const vec3 HOT = vec3(1.0, 0.42, 0.16);

  // ember → thermal orange → white-hot
  vec3 burn(float k) {
    k = clamp(k, 0.0, 1.0);
    return k < 0.5
      ? mix(vec3(0.55, 0.10, 0.04), HOT, k * 2.0)
      : mix(HOT, vec3(1.0, 0.93, 0.80), k * 2.0 - 1.0);
  }

  void main() {
    vec2 vel = texture2D(uVelocity, vUv).xy;
    float heat = texture2D(uHeat, vUv).r;
    vec2 p = vec2(vUv.x, 1.0 - vUv.y) * uResolution;

    // Refraction: the medium's motion bends what's seen through it.
    vec2 off = vec2(vel.x, -vel.y) * uResolution.y * 0.022;
    float ol = length(off);
    if (ol > 90.0) off *= 90.0 / ol;

    vec2 g = glyph(p - off) * uText;
    float cold = glyph(p - off * 1.9).x * uText;
    float warm = glyph(p - off * 0.45).x * uText;

    float k = smoothstep(0.05, 0.85, heat);
    float a = max(g.x, g.y * k);
    vec3 col = mix(PAPER, burn(k), k) * a;

    // Dispersion at the moving edges: cold ahead, heat behind.
    float fc = max(cold - g.x, 0.0);
    float fw = max(warm - g.x, 0.0);
    col += COLD * fc * 0.85 + HOT * fw * 0.85;
    a = max(a, max(fc, fw) * 0.85);

    gl_FragColor = vec4(col, a);
  }
`;

/** null when the GPU can't render to float targets — the hero keeps its DOM type */
export function createThermalTrail(renderer: THREE.WebGLRenderer, quality: TrailQuality): ThermalTrail | null {
  const ext = renderer.extensions;
  if (!ext.has("EXT_color_buffer_float") && !ext.has("EXT_color_buffer_half_float")) return null;

  const scene = new THREE.Scene();
  const camera = new THREE.Camera();
  const geometry = new THREE.PlaneGeometry(2, 2);
  const quad = new THREE.Mesh(geometry);
  quad.frustumCulled = false;
  scene.add(quad);

  const targets: THREE.WebGLRenderTarget[] = [];
  const materials: THREE.ShaderMaterial[] = [];

  const target = (size: number) => {
    const t = new THREE.WebGLRenderTarget(size, size, {
      type: THREE.HalfFloatType,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: false,
      stencilBuffer: false,
    });
    targets.push(t);
    renderer.setRenderTarget(t);
    renderer.clear();
    renderer.setRenderTarget(null);
    return t;
  };
  const pair = (size: number) => {
    const p = { read: target(size), write: target(size), swap() { [p.read, p.write] = [p.write, p.read]; } };
    return p;
  };
  const material = (fragmentShader: string, uniforms: Record<string, THREE.IUniform>) => {
    const m = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms, depthTest: false, depthWrite: false, blending: THREE.NoBlending });
    materials.push(m);
    return m;
  };
  const tex = () => ({ value: null as THREE.Texture | null });
  const texel = { value: new THREE.Vector2(1 / quality.sim, 1 / quality.sim) };

  const velocity = pair(quality.sim);
  const heat = pair(quality.dye);
  const pressure = pair(quality.sim);
  const divergence = target(quality.sim);
  const curl = target(quality.sim);

  const advect = material(advectShader, { uSource: tex(), uVelocity: tex(), uDt: { value: STEP }, uDissipation: { value: 1 } });
  const splat = material(splatShader, {
    uTarget: tex(),
    uPoint: { value: new THREE.Vector2() },
    uValue: { value: new THREE.Vector3() },
    uRadius: { value: SPLAT_RADIUS },
    uAspect: { value: 1 },
  });
  const curlM = material(curlShader, { uVelocity: tex(), uTexel: texel });
  const forces = material(forcesShader, {
    uVelocity: tex(), uCurl: tex(), uHeat: tex(), uTexel: texel,
    uCurlStrength: { value: CURL_STRENGTH }, uBuoyancy: { value: BUOYANCY }, uDt: { value: STEP },
  });
  const divergenceM = material(divergenceShader, { uVelocity: tex(), uTexel: texel });
  const pressureM = material(pressureShader, { uPressure: tex(), uDivergence: tex(), uTexel: texel });
  const gradientM = material(gradientShader, { uPressure: tex(), uVelocity: tex(), uTexel: texel });

  const text = { value: 0 };
  const glyphs = glyphUniforms(WORDS);
  const display = material(displayShader, {
    uVelocity: tex(),
    uHeat: tex(),
    ...glyphs,
    uResolution: { value: new THREE.Vector2(1, 1) },
    uText: text,
  });


  const run = (m: THREE.ShaderMaterial, to: THREE.WebGLRenderTarget | null) => {
    quad.material = m;
    renderer.setRenderTarget(to);
    renderer.render(scene, camera);
  };

  const probe = { x: 0.5, y: 0.5, dx: 0, dy: 0, moved: false, live: false };

  function inject() {
    if (!probe.moved) return;
    splat.uniforms.uTarget.value = velocity.read.texture;
    (splat.uniforms.uPoint.value as THREE.Vector2).set(probe.x, probe.y);
    (splat.uniforms.uValue.value as THREE.Vector3).set(probe.dx * FORCE, probe.dy * FORCE, 0);
    splat.uniforms.uRadius.value = SPLAT_RADIUS;
    run(splat, velocity.write);
    velocity.swap();

    // Faster strokes carry more heat.
    const speed = Math.hypot(probe.dx, probe.dy);
    const amount = Math.min(0.9, 0.12 + speed * 16);
    splat.uniforms.uTarget.value = heat.read.texture;
    (splat.uniforms.uValue.value as THREE.Vector3).set(amount, amount, amount);
    splat.uniforms.uRadius.value = SPLAT_RADIUS * 0.6;
    run(splat, heat.write);
    heat.swap();
    probe.moved = false;
  }

  function step(dt: number) {
    advect.uniforms.uVelocity.value = velocity.read.texture;
    advect.uniforms.uSource.value = velocity.read.texture;
    advect.uniforms.uDt.value = dt;
    advect.uniforms.uDissipation.value = VELOCITY_DISSIPATION;
    run(advect, velocity.write);
    velocity.swap();

    inject();

    curlM.uniforms.uVelocity.value = velocity.read.texture;
    run(curlM, curl);

    forces.uniforms.uVelocity.value = velocity.read.texture;
    forces.uniforms.uCurl.value = curl.texture;
    forces.uniforms.uHeat.value = heat.read.texture;
    forces.uniforms.uDt.value = dt;
    run(forces, velocity.write);
    velocity.swap();

    divergenceM.uniforms.uVelocity.value = velocity.read.texture;
    run(divergenceM, divergence);

    pressureM.uniforms.uDivergence.value = divergence.texture;
    for (let i = 0; i < quality.pressureIterations; i++) {
      pressureM.uniforms.uPressure.value = pressure.read.texture;
      run(pressureM, pressure.write);
      pressure.swap();
    }

    gradientM.uniforms.uPressure.value = pressure.read.texture;
    gradientM.uniforms.uVelocity.value = velocity.read.texture;
    run(gradientM, velocity.write);
    velocity.swap();

    advect.uniforms.uVelocity.value = velocity.read.texture;
    advect.uniforms.uSource.value = heat.read.texture;
    advect.uniforms.uDissipation.value = HEAT_DISSIPATION;
    run(advect, heat.write);
    heat.swap();
  }

  let accumulator = 0;
  const size = new THREE.Vector2();

  return {
    text,

    pointer(x, y) {
      if (x < 0 || x > 1 || y < 0 || y > 1) {
        probe.live = false;
        return;
      }
      const sx = x;
      const sy = 1 - y;
      if (!probe.live) {
        probe.x = sx;
        probe.y = sy;
        probe.live = true;
        return;
      }
      probe.dx += sx - probe.x;
      probe.dy += sy - probe.y;
      probe.x = sx;
      probe.y = sy;
      probe.moved = true;
    },

    setAtlas(fillCanvas) {
      setGlyphAtlas(glyphs, fillCanvas);
    },

    place(words) {
      setGlyphPlacements(glyphs, words);
    },

    render(r, _shared, dt) {
      r.getDrawingBufferSize(size);
      (display.uniforms.uResolution.value as THREE.Vector2).copy(size);
      splat.uniforms.uAspect.value = size.x / Math.max(size.y, 1);

      // Fixed steps keep the trail's decay the same at any refresh rate.
      accumulator += Math.min(Math.max(dt, 0), STEP * 3);
      while (accumulator >= STEP) {
        step(STEP);
        probe.dx = probe.dy = 0;
        accumulator -= STEP;
      }

      display.uniforms.uVelocity.value = velocity.read.texture;
      display.uniforms.uHeat.value = heat.read.texture;
      run(display, null);
    },

    dispose() {
      targets.forEach(t => t.dispose());
      materials.forEach(m => m.dispose());
      glyphs.uFill.value?.dispose();
      geometry.dispose();
    },
  };
}
