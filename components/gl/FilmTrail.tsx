"use client";

import { useEffect, useRef } from "react";
import { isCoarsePointer, prefersReducedMotion } from "@/lib/animation/prefs";

/**
 * The pointer's film trail (lib/gl/filmTrail.ts) over the whole page, on a
 * fixed, click-through canvas. Fine pointers only, and not under reduced
 * motion — touch has no hover to trail.
 */
export default function FilmTrail() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || prefersReducedMotion() || isCoarsePointer()) return;
    let cancelled = false;
    let teardown: (() => void) | undefined;

    Promise.all([import("@/lib/gl/engine"), import("@/lib/gl/filmTrail")]).then(([{ createStage }, { createFilmTrail }]) => {
      if (cancelled) return;
      const stage = createStage(canvas, { dprCap: 1.5 });
      if (!stage) return;
      const trail = createFilmTrail(stage.renderer);
      if (!trail) {
        stage.dispose();
        return;
      }
      stage.add(trail);

      const onMove = (e: PointerEvent) => trail.pointer(e.clientX, e.clientY, true);
      const onLeave = () => trail.pointer(0, 0, false);
      window.addEventListener("pointermove", onMove, { passive: true });
      document.documentElement.addEventListener("pointerleave", onLeave);
      teardown = () => {
        window.removeEventListener("pointermove", onMove);
        document.documentElement.removeEventListener("pointerleave", onLeave);
        stage.dispose();
      };
    });

    return () => {
      cancelled = true;
      teardown?.();
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none fixed inset-0 z-30 h-full w-full" />;
}
