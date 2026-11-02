"use client";

import { useCallback, useRef } from "react";
import gsap from "gsap";
import ShaderCanvas from "@/components/gl/ShaderCanvas";
import { coupleHeatFragment } from "@/lib/shaders/coupleHeat";

/** one couple per page; the shader reads this by reference */
const uniforms = { uStep: { value: 4 } };

const QUALITY = { desktop: { dprCap: 1.5, scale: 0.8 }, touch: { dprCap: 1.5, scale: 0.6 } };

/**
 * The heat under the thermoelectric couple diagram (lib/shaders/coupleHeat.ts).
 * Follows the scroll scene's step — ScrollScene writes it to data-step —
 * easing toward it, so each stage of the couple warms up rather than cuts in.
 */
export default function CoupleHeat() {
  const ref = useRef<HTMLDivElement>(null);

  const onStage = useCallback(() => {
    const scene = ref.current?.closest<HTMLElement>("[data-step]");
    if (!scene) return;
    const follow = () => {
      const target = Number(scene.dataset.step) || 4;
      uniforms.uStep.value += (target - uniforms.uStep.value) * 0.06;
    };
    gsap.ticker.add(follow);
    return () => gsap.ticker.remove(follow);
  }, []);

  return (
    <div ref={ref} aria-hidden="true" className="pointer-events-none absolute inset-0">
      <ShaderCanvas fragmentShader={coupleHeatFragment} uniforms={uniforms} quality={QUALITY} onStage={onStage} className="h-full w-full" />
    </div>
  );
}
