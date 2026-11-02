"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { fontsReady, prefersReducedMotion } from "@/lib/animation/prefs";

/** after the wordmark's sweep has revealed it */
const TAKEOVER_DELAY = 1.8;

/**
 * The footer wordmark, drawn in GL as a signal (lib/shaders/signalType.ts)
 * once its reveal has played. Lives inside the wordmark's wrapper; the DOM
 * words (data-atlas-word) stay laid out underneath and visible without
 * WebGL or under reduced motion.
 */
export default function SignalWordmark() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const root = canvas?.parentElement;
    if (!canvas || !root || prefersReducedMotion()) return;
    let cancelled = false;
    let teardown: (() => void) | undefined;

    Promise.all([import("@/lib/gl/engine"), import("@/lib/gl/typeAtlas"), import("@/lib/shaders/signalType")]).then(
      ([{ createStage, createShaderPass }, atlasKit, { signalTypeFragment, SIGNAL_WORDS }]) => {
        if (cancelled) return;
        const stage = createStage(canvas, { dprCap: 2 });
        if (!stage) return;

        const glyphs = atlasKit.glyphUniforms(SIGNAL_WORDS);
        const energy = { value: 0 };
        const text = { value: 0 };
        stage.add(createShaderPass({ fragmentShader: signalTypeFragment, uniforms: { ...glyphs, uEnergy: energy, uText: text } }));

        const words = atlasKit.atlasWords(root);
        const pr = () => stage.renderer.getPixelRatio();
        let atlas: ReturnType<typeof atlasKit.buildAtlas> | null = null;

        const follow = () => {
          if (atlas) atlasKit.setGlyphPlacements(glyphs, atlasKit.placeWords(words, atlas, canvas.getBoundingClientRect(), pr()));
          energy.value *= 0.965;
        };
        gsap.ticker.add(follow);

        const rasterise = () => {
          atlas = atlasKit.buildAtlas(words, pr());
          atlasKit.setGlyphAtlas(glyphs, atlas.fill);
          follow();
        };
        let resizeTimer: number | undefined;
        const ro = new ResizeObserver(() => {
          if (!atlas) return;
          window.clearTimeout(resizeTimer);
          resizeTimer = window.setTimeout(rasterise, 120);
        });
        ro.observe(root);

        // Take over once the wordmark has been revealed (or at once, if it already is).
        let takeover: gsap.core.Tween | undefined;
        const start = () => {
          takeover = gsap.delayedCall(TAKEOVER_DELAY, () => {
            void fontsReady(3000).then(() => {
              if (cancelled) return;
              rasterise();
              root.setAttribute("data-gl-type", "");
              gsap.to(text, { value: 1, duration: 0.5, ease: "sine.inOut" });
            });
          });
        };
        const revealed = () => {
          const el = root.querySelector("[data-reveal]");
          return !el || el.hasAttribute("data-shown") || !document.documentElement.classList.contains("motion");
        };
        let mo: MutationObserver | undefined;
        if (revealed()) start();
        else {
          mo = new MutationObserver(() => {
            if (!revealed()) return;
            mo?.disconnect();
            start();
          });
          mo.observe(root, { attributes: true, subtree: true, attributeFilter: ["data-shown"] });
        }

        // Moving over the wordmark feeds the signal.
        let last: { x: number; y: number } | null = null;
        const onMove = (e: PointerEvent) => {
          const r = canvas.getBoundingClientRect();
          const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom;
          if (inside && last) energy.value = Math.min(1, energy.value + Math.hypot(e.clientX - last.x, e.clientY - last.y) * 0.006);
          last = { x: e.clientX, y: e.clientY };
        };
        window.addEventListener("pointermove", onMove, { passive: true });

        teardown = () => {
          takeover?.kill();
          mo?.disconnect();
          gsap.ticker.remove(follow);
          window.removeEventListener("pointermove", onMove);
          window.clearTimeout(resizeTimer);
          ro.disconnect();
          root.removeAttribute("data-gl-type");
          glyphs.uFill.value?.dispose();
          stage.dispose();
        };
      },
    );

    return () => {
      cancelled = true;
      teardown?.();
    };
  }, []);

  // Taller than the type, so the wave has room to swing.
  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-[-45%] h-[190%] w-full" />;
}
