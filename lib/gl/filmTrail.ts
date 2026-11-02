/**
 * The pointer's trail across the home page: a thin liquid film, after the
 * pearl trail on bytesplatform.com. A small fluid solver carries the film's
 * thickness; its folds are lit as a surface, so what shows is mostly clear
 * with soft crests and a warm glint. It's small, it fades fast, and the
 * solver sleeps once the hand has been still for a moment.
 */

import * as THREE from "three";
import type { Pass } from "./engine";

const SIM = 192;
const FILM = 768;
const STEP = 1 / 60;
/** seconds of stillness before the film has fully drained and the solver sleeps */
const SETTLE = 1.8;

export type FilmTrail = Pass & {
  /** pointer in canvas CSS px; active false lifts it */
  pointer(x: number, y: number, active: boolean): void;
};

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const neighbours = /* glsl */ `
  varying vec2 vUv;
  uniform sampler2D uSource;
  const vec2 e = vec2(1.0 / ${SIM}.0, 0.0);
  vec4 L() { return texture2D(uSource, vUv - e.xy); }
  vec4 R() { return texture2D(uSource, vUv + e.xy); }
  vec4 B() { return texture2D(uSource, vUv - e.yx); }
  vec4 T() { return texture2D(uSource, vUv + e.yx); }
`;

/** null when the GPU can't render to float targets — no trail, nothing else lost */
export function createFilmTrail(renderer: THREE.WebGLRenderer): FilmTrail | null {
  if (!renderer.extensions.has("EXT_color_buffer_float")) return null;

  const geometry = new THREE.PlaneGeometry(2, 2);
  const scene = new THREE.Scene();
  const camera = new THREE.Camera();
  const materials: THREE.ShaderMaterial[] = [];
  const targets: THREE.WebGLRenderTarget[] = [];
  const material = (fragmentShader: string, uniforms: Record<string, THREE.IUniform>) => {
    const m = new THREE.ShaderMaterial({ vertexShader, fragmentShader, uniforms, depthTest: false, depthWrite: false, blending: THREE.NoBlending });
    materials.push(m);
    return m;
  };
  const quad = new THREE.Mesh(geometry);
  quad.frustumCulled = false;
  scene.add(quad);

  const target = (size: number) => {
    const t = new THREE.WebGLRenderTarget(size, size, { type: THREE.HalfFloatType, depthBuffer: false, stencilBuffer: false });
    targets.push(t);
    return t;
  };
  const pair = (size: number) => {
    const p = { read: target(size), write: target(size), swap() { [p.read, p.write] = [p.write, p.read]; } };
    return p;
  };
  const velocity = pair(SIM);
  const film = pair(FILM);
  const pressure = pair(SIM);
  const divergence = target(SIM);
  const tex = () => ({ value: null as THREE.Texture | null });

  const advect = material(/* glsl */ `
    varying vec2 vUv;
    uniform sampler2D uSource, uVelocity;
    uniform float uDecay, uDt;
    void main() {
      vec2 v = texture2D(uVelocity, vUv).xy;
      gl_FragColor = texture2D(uSource, clamp(vUv - v * uDt, 0.001, 0.999)) * uDecay;
    }
  `, { uSource: tex(), uVelocity: tex(), uDecay: { value: 1 }, uDt: { value: 1.45 / 60 } });

  // Velocity takes the stroke's direction; the film takes thickness.
  const splat = material(/* glsl */ `
    varying vec2 vUv;
    uniform sampler2D uSource;
    uniform vec2 uPoint, uDelta;
    uniform float uAspect, uFilm, uAmount;
    void main() {
      vec2 p = vUv - uPoint;
      p.x *= uAspect;
      float g = exp(-dot(p, p) / 0.00065);
      vec4 base = texture2D(uSource, vUv);
      if (uFilm > 0.5) base.r = min(base.r + g * uAmount, 1.2);
      else base.xy += uDelta * g * 30.0;
      gl_FragColor = base;
    }
  `, {
    uSource: tex(),
    uPoint: { value: new THREE.Vector2() },
    uDelta: { value: new THREE.Vector2() },
    uAspect: { value: 1 },
    uFilm: { value: 0 },
    uAmount: { value: 0 },
  });

  const div = material(neighbours + /* glsl */ `
    void main() { gl_FragColor = vec4((R().x - L().x + T().y - B().y) * 0.5, 0.0, 0.0, 1.0); }
  `, { uSource: tex() });
  const solve = material(neighbours + /* glsl */ `
    uniform sampler2D uDiv;
    void main() { gl_FragColor = vec4((L().x + R().x + B().x + T().x - texture2D(uDiv, vUv).x) * 0.25, 0.0, 0.0, 1.0); }
  `, { uSource: tex(), uDiv: tex() });
  const project = material(neighbours + /* glsl */ `
    uniform sampler2D uVelocity;
    void main() {
      vec2 v = texture2D(uVelocity, vUv).xy - 0.5 * vec2(R().x - L().x, T().x - B().x);
      gl_FragColor = vec4(v, 0.0, 1.0);
    }
  `, { uSource: tex(), uVelocity: tex() });

  // The film as a lit surface over a dark page: steel to paper across its
  // folds, a warm glint on the crests, clear wherever it's flat.
  const display = material(/* glsl */ `
    varying vec2 vUv;
    uniform sampler2D uFilm;
    float heightAt(vec2 p) { return texture2D(uFilm, p).r; }
    void main() {
      float h = heightAt(vUv);
      float wet = smoothstep(0.025, 0.10, h);
      if (wet < 0.001) { gl_FragColor = vec4(0.0); return; }
      vec2 e = vec2(1.0 / ${FILM}.0, 0.0);
      vec2 slope = vec2(heightAt(vUv + e.xy) - heightAt(vUv - e.xy), heightAt(vUv + e.yx) - heightAt(vUv - e.yx));
      vec3 n = normalize(vec3(-slope * 60.0, 1.0));
      float bend = 1.0 - n.z;
      float light = dot(n, normalize(vec3(-0.4, 0.6, 1.0)));
      float spec = pow(max(light, 0.0), 14.0);
      float band = n.x * 0.7 + n.y * 0.5;
      vec3 tint = mix(vec3(0.55, 0.60, 0.68), vec3(0.93, 0.91, 0.87), smoothstep(-0.3, 0.65, band));
      float crest = pow(max(0.0, 1.0 - abs(light - 0.78) * 8.0), 3.0);
      tint = mix(tint, vec3(1.0, 0.66, 0.44), clamp(crest * 0.45 + spec * 0.2, 0.0, 0.5));
      float a = clamp(0.015 + bend * 0.28 + crest * 0.36 + spec * 0.10, 0.0, 0.46) * wet;
      gl_FragColor = vec4(tint, a);
    }
  `, { uFilm: tex() });
  display.transparent = true;
  display.blending = THREE.NormalBlending;

  const run = (m: THREE.ShaderMaterial, t: THREE.WebGLRenderTarget | null) => {
    quad.material = m;
    renderer.setRenderTarget(t);
    renderer.render(scene, camera);
  };
  const clearAll = () => {
    for (const t of targets) {
      renderer.setRenderTarget(t);
      renderer.clear();
    }
  };

  const probe = { x: 0, y: 0, active: false };
  let initialized = false;
  let lastX = -1;
  let lastY = -1;
  let accumulator = 0;
  let idle = SETTLE + 1;

  return {
    pointer(x, y, active) {
      probe.x = x;
      probe.y = y;
      probe.active = active;
    },

    render(r, _shared, dt) {
      const width = r.domElement.clientWidth;
      const height = r.domElement.clientHeight;
      if (!width || !height) return;
      if (!initialized) {
        clearAll();
        initialized = true;
      }

      if (!probe.active) {
        // A lifted pointer drains what's left at once, rather than leaving a stain.
        if (idle < SETTLE) clearAll();
        idle = SETTLE + 1;
        lastX = lastY = -1;
      } else {
        const x = probe.x / width;
        const y = 1 - probe.y / height;
        if (lastX >= 0) {
          const dx = x - lastX;
          const dy = y - lastY;
          const distance = Math.hypot(dx * width, dy * height);
          if (distance > 0.5) {
            idle = 0;
            const steps = Math.min(12, Math.max(1, Math.ceil(distance / 18)));
            splat.uniforms.uAspect.value = width / height;
            // Divide the dose across interpolated splats, so fast motion can't flood the film.
            splat.uniforms.uAmount.value = Math.min(0.26, distance * 0.017) / steps;
            (splat.uniforms.uDelta.value as THREE.Vector2).set(
              THREE.MathUtils.clamp(dx, -0.08, 0.08) / steps,
              THREE.MathUtils.clamp(dy, -0.08, 0.08) / steps,
            );
            for (let i = 1; i <= steps; i++) {
              (splat.uniforms.uPoint.value as THREE.Vector2).set(lastX + (dx * i) / steps, lastY + (dy * i) / steps);
              splat.uniforms.uSource.value = velocity.read.texture;
              splat.uniforms.uFilm.value = 0;
              run(splat, velocity.write);
              velocity.swap();
              splat.uniforms.uSource.value = film.read.texture;
              splat.uniforms.uFilm.value = 1;
              run(splat, film.write);
              film.swap();
            }
          }
        }
        lastX = x;
        lastY = y;
        idle += dt;
        if (idle < SETTLE) {
          accumulator += Math.min(dt, 0.05);
          while (accumulator >= STEP) {
            advect.uniforms.uSource.value = velocity.read.texture;
            advect.uniforms.uVelocity.value = velocity.read.texture;
            advect.uniforms.uDecay.value = 0.95;
            run(advect, velocity.write);
            velocity.swap();
            div.uniforms.uSource.value = velocity.read.texture;
            run(div, divergence);
            solve.uniforms.uDiv.value = divergence.texture;
            for (let i = 0; i < 12; i++) {
              solve.uniforms.uSource.value = pressure.read.texture;
              run(solve, pressure.write);
              pressure.swap();
            }
            project.uniforms.uSource.value = pressure.read.texture;
            project.uniforms.uVelocity.value = velocity.read.texture;
            run(project, velocity.write);
            velocity.swap();
            advect.uniforms.uSource.value = film.read.texture;
            advect.uniforms.uVelocity.value = velocity.read.texture;
            advect.uniforms.uDecay.value = 0.9;
            run(advect, film.write);
            film.swap();
            accumulator -= STEP;
          }
        }
      }

      renderer.setRenderTarget(null);
      if (idle < SETTLE) {
        display.uniforms.uFilm.value = film.read.texture;
        quad.material = display;
        renderer.render(scene, camera);
      }
    },

    dispose() {
      targets.forEach(t => t.dispose());
      materials.forEach(m => m.dispose());
      geometry.dispose();
    },
  };
}
