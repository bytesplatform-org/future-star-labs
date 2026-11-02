/**
 * The GLSL engine: one WebGLRenderer per canvas, a list of passes, and
 * GSAP's ticker as the frame loop — so shaders, tweens and Lenis all step on
 * the same frame. It knows nothing about React; components own a stage and
 * hand it passes.
 *
 * Every pass gets the shared uniforms below for free:
 *   uTime        seconds since the stage started
 *   uResolution  drawing buffer size in device px
 *   uMouse       pointer in 0..1, origin bottom-left (eased)
 *   uScroll      page scroll progress 0..1
 */

import * as THREE from "three";
import gsap from "gsap";

export type SharedUniforms = {
  uTime: THREE.IUniform<number>;
  uResolution: THREE.IUniform<THREE.Vector2>;
  uMouse: THREE.IUniform<THREE.Vector2>;
  uScroll: THREE.IUniform<number>;
};

export type Pass = {
  /** draw into the stage's renderer; called once per frame */
  render(renderer: THREE.WebGLRenderer, shared: SharedUniforms, dt: number): void;
  dispose(): void;
};

export type Stage = {
  renderer: THREE.WebGLRenderer;
  shared: SharedUniforms;
  add(pass: Pass): () => void;
  /** draw one frame now — for paused or reduced-motion stages */
  renderOnce(): void;
  dispose(): void;
};

export type StageOptions = {
  /** upper bound on devicePixelRatio; fill-rate is the usual GPU cost */
  dprCap?: number;
  /** false: draw on demand only (renderOnce) */
  animate?: boolean;
  alpha?: boolean;
};

export function createStage(canvas: HTMLCanvasElement, opts: StageOptions = {}): Stage | null {
  const { dprCap = 2, animate = true, alpha = true } = opts;

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha,
      antialias: false,
      powerPreference: "high-performance",
    });
  } catch {
    // No WebGL: callers fall back to whatever sits behind the canvas.
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, dprCap));
  renderer.setClearColor(0x000000, 0);
  // The stage clears once per frame; passes then layer on top of each other.
  renderer.autoClear = false;

  const shared: SharedUniforms = {
    uTime: { value: 0 },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uScroll: { value: 0 },
  };
  const passes = new Set<Pass>();
  const mouseTarget = new THREE.Vector2(0.5, 0.5);

  const resize = () => {
    const w = Math.max(1, canvas.clientWidth);
    const h = Math.max(1, canvas.clientHeight);
    renderer.setSize(w, h, false);
    renderer.getDrawingBufferSize(shared.uResolution.value);
    if (!animate) draw(0);
  };
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);

  const onPointer = (e: PointerEvent) => {
    const r = canvas.getBoundingClientRect();
    mouseTarget.set((e.clientX - r.left) / r.width, 1 - (e.clientY - r.top) / r.height);
  };
  window.addEventListener("pointermove", onPointer, { passive: true });

  const readScroll = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    shared.uScroll.value = max > 0 ? window.scrollY / max : 0;
  };

  const draw = (dt: number) => {
    readScroll();
    renderer.clear();
    passes.forEach(p => p.render(renderer, shared, dt));
  };

  // Skip frames while the canvas is off screen.
  let visible = true;
  const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
  io.observe(canvas);

  const start = performance.now();
  const tick = (_time: number, deltaMs: number) => {
    if (!visible) return;
    const dt = Math.min(deltaMs / 1000, 0.1);
    shared.uTime.value = (performance.now() - start) / 1000;
    // Frame-rate independent ease toward the pointer.
    shared.uMouse.value.lerp(mouseTarget, 1 - Math.pow(0.001, dt));
    draw(dt);
  };
  if (animate) gsap.ticker.add(tick);
  resize();

  return {
    renderer,
    shared,
    add(pass) {
      passes.add(pass);
      if (!animate) draw(0);
      return () => {
        passes.delete(pass);
        pass.dispose();
      };
    },
    renderOnce: () => draw(0),
    dispose() {
      gsap.ticker.remove(tick);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener("pointermove", onPointer);
      passes.forEach(p => p.dispose());
      passes.clear();
      renderer.dispose();
    },
  };
}

export type ShaderPassOptions = {
  fragmentShader: string;
  /** defaults to a clip-space fullscreen quad passing vUv */
  vertexShader?: string;
  uniforms?: Record<string, THREE.IUniform>;
  transparent?: boolean;
};

export const fullscreenVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

/**
 * A fullscreen ShaderMaterial pass. The shared uniforms are linked by
 * reference, so the fragment shader can simply declare the ones it uses.
 */
export function createShaderPass(opts: ShaderPassOptions) {
  const uniforms: Record<string, THREE.IUniform> = { ...opts.uniforms };
  const material = new THREE.ShaderMaterial({
    uniforms,
    vertexShader: opts.vertexShader ?? fullscreenVertex,
    fragmentShader: opts.fragmentShader,
    transparent: opts.transparent ?? true,
    depthTest: false,
    depthWrite: false,
  });
  const geometry = new THREE.PlaneGeometry(2, 2);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false; // the vertex shader writes clip space directly
  const scene = new THREE.Scene();
  scene.add(mesh);
  const camera = new THREE.Camera();
  let linked = false;

  const pass: Pass & { uniforms: typeof uniforms; material: THREE.ShaderMaterial } = {
    uniforms,
    material,
    render(renderer, shared) {
      if (!linked) {
        Object.assign(uniforms, shared);
        linked = true;
      }
      renderer.render(scene, camera);
    },
    dispose() {
      geometry.dispose();
      material.dispose();
    },
  };
  return pass;
}
