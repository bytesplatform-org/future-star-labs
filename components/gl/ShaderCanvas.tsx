"use client";

import { useEffect, useRef } from "react";
import type * as THREE from "three";
import { prefersReducedMotion } from "@/lib/animation/prefs";

type Props = {
  fragmentShader: string;
  vertexShader?: string;
  /** extra uniforms; read once at mount — mutate `.value` to animate them */
  uniforms?: Record<string, THREE.IUniform>;
  className?: string;
};

/**
 * A canvas running one fullscreen shader pass on its own stage. three.js is
 * loaded after mount, so it stays out of the server bundle and the first paint.
 * Reduced motion draws a single still frame.
 */
export default function ShaderCanvas({ fragmentShader, vertexShader, uniforms, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let cancelled = false;
    let teardown: (() => void) | undefined;

    import("@/lib/gl/engine").then(({ createStage, createShaderPass }) => {
      if (cancelled) return;
      const stage = createStage(canvas, { animate: !prefersReducedMotion() });
      if (!stage) return;
      stage.add(createShaderPass({ fragmentShader, vertexShader, uniforms }));
      teardown = () => stage.dispose();
    });

    return () => {
      cancelled = true;
      teardown?.();
    };
    // Shaders and uniforms are fixed per mount, like a material.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
