/**
 * The Seebeck experiment's medium: junction temperatures and the carriers'
 * drift, as uniforms for lib/shaders/seebeckJunction.ts. Like the field,
 * it eases toward its targets — junctions take time to heat and cool.
 */

import gsap from "gsap";

/** temperature range of the controls, °C */
export const T_MAX = 500;

export const junctionUniforms = {
  uCold: { value: 20 / T_MAX },
  uHot: { value: 320 / T_MAX },
  uDrift: { value: 300 / T_MAX },
  /** ∫ uDrift dt, so the stream keeps its place as ΔT changes */
  uPhase: { value: 0 },
};

/** set the junction temperatures (°C); `immediate` for still stages */
export function setJunctions(cold: number, hot: number, immediate: boolean) {
  const u = junctionUniforms;
  const target = { cold: cold / T_MAX, hot: hot / T_MAX, drift: (hot - cold) / T_MAX };
  if (immediate) {
    u.uCold.value = target.cold;
    u.uHot.value = target.hot;
    u.uDrift.value = target.drift;
    return;
  }
  gsap.to(u.uCold, { value: target.cold, duration: 1.2, ease: "power2.out", overwrite: true });
  gsap.to(u.uHot, { value: target.hot, duration: 1.2, ease: "power2.out", overwrite: true });
  gsap.to(u.uDrift, { value: target.drift, duration: 1.6, ease: "power2.out", overwrite: true });
}

/** Integrates the drift every frame. Returns the stop. */
export function runDrift() {
  const tick = (_t: number, deltaMs: number) => {
    junctionUniforms.uPhase.value += junctionUniforms.uDrift.value * Math.min(deltaMs, 100) / 1000;
  };
  gsap.ticker.add(tick);
  return () => gsap.ticker.remove(tick);
}
