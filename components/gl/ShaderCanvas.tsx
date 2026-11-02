"use client";

import { useEffect, useRef } from "react";
import type * as THREE from "three";
import type { Stage, StageOptions } from "@/lib/gl/engine";
import { isCoarsePointer, prefersReducedMotion } from "@/lib/animation/prefs";

type Props = {
  fragmentShader: string;
  vertexShader?: string;
  /** extra uniforms; read once at mount — mutate `.value` to animate them */
  uniforms?: Record<string, THREE.IUniform>;
  /** stage settings for fine and coarse (touch) pointers respectively */
  quality?: { desktop?: StageOptions; touch?: StageOptions };
  /** the live stage, once WebGL is up; its return value runs on unmount */
  onStage?: (stage: Stage) => void | (() => void);
  className?: string;
};

/**
 * A canvas running one fullscreen shader pass on its own stage. three.js is
 * loaded after mount, so it stays out of the server bundle and the first paint.
 * Reduced motion draws a single still frame. Without WebGL the canvas stays
 * empty and whatever sits behind it (its CSS background) shows instead.
 */
export default function ShaderCanvas({ fragmentShader, vertexShader, uniforms, quality, onStage, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    let teardown: (() => void) | undefined;

    import("@/lib/gl/engine").then(({ createStage, createShaderPass }) => {
      if (cancelled) return;
      const tier = isCoarsePointer() ? quality?.touch : quality?.desktop;
      const stage = createStage(canvas, { ...tier, animate: !prefersReducedMotion() });
      if (!stage) return;
      stage.add(createShaderPass({ fragmentShader, vertexShader, uniforms }));
      const release = onStage?.(stage);
      teardown = () => {
        release?.();
        stage.dispose();
      };
    });

    return () => {
      cancelled = true;
      teardown?.();
    };
    // Shaders, uniforms and quality are fixed per mount, like a material.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
