"use client";

import { useCallback, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ShaderCanvas from "@/components/gl/ShaderCanvas";
import { interferenceFragment } from "@/lib/shaders/interference";
import { prefersReducedMotion } from "@/lib/animation/prefs";

gsap.registerPlugin(ScrollTrigger);

/** one plate per page; the shader reads these by reference */
const uniforms = { uWave: { value: 0 } };

const QUALITY = { desktop: { dprCap: 1.5, scale: 0.75 }, touch: { dprCap: 1.5, scale: 0.6 } };

/** λ shown on the plate's readout, in arbitrary tank units */
const lambda = (wave: number) => (2 * Math.PI) / (42 + 36 * wave);

/**
 * Fig. 02 — a ripple tank of two coherent sources, set as a figure plate.
 * The pointer carries the second source; scrolling through the section
 * shortens the wavelength, and the fringes close up.
 */
export default function InterferencePlate({ className }: { className?: string }) {
  const readoutRef = useRef<HTMLSpanElement>(null);
  const figureRef = useRef<HTMLElement>(null);

  const onStage = useCallback(() => {
    const figure = figureRef.current;
    if (!figure) return;
    const write = () => {
      if (readoutRef.current) readoutRef.current.textContent = lambda(uniforms.uWave.value).toFixed(3);
    };
    write();
    if (prefersReducedMotion()) return;
    const trigger = ScrollTrigger.create({
      trigger: figure,
      start: "top bottom",
      end: "bottom top",
      onUpdate: self => {
        uniforms.uWave.value = self.progress;
        write();
      },
    });
    return () => trigger.kill();
  }, []);

  return (
    <figure ref={figureRef} className={className}>
      <div className="relative aspect-[4/3] overflow-hidden border border-paper/10 bg-graphite-950">
        <ShaderCanvas
          fragmentShader={interferenceFragment}
          uniforms={uniforms}
          quality={QUALITY}
          onStage={onStage}
          className="pointer-events-auto block h-full w-full cursor-crosshair"
        />
        <span aria-hidden="true" className="label pointer-events-none absolute left-3 top-3 text-steel">
          λ <span ref={readoutRef} className="tabular-nums text-paper">—</span>
        </span>
      </div>
      <figcaption className="label mt-3 flex justify-between gap-4 text-steel">
        <span>
          <span className="text-heat">Fig. 02</span> — Two coherent sources
        </span>
        <span className="hidden text-steel-dim md:inline">Move to carry one</span>
      </figcaption>
    </figure>
  );
}
