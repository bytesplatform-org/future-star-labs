"use client";

import { useCallback, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ShaderCanvas from "@/components/gl/ShaderCanvas";
import type { Stage } from "@/lib/gl/engine";
import { interferenceFragment } from "@/lib/shaders/interference";
import { prefersReducedMotion } from "@/lib/animation/prefs";

gsap.registerPlugin(ScrollTrigger);

/** one plate per page; the shader reads these by reference (sources in plate uv) */
const uniforms = {
  uWave: { value: 0 },
  uA: { value: [0.22, 0.5] },
  uB: { value: [0.74, 0.42] },
};

/** where each source rests at time t (s), drifting gently; aspect keeps the drift round */
const home = (which: 0 | 1, t: number, aspect: number): [number, number] =>
  which === 0
    ? [0.22, 0.5 + 0.06 * Math.sin(t * 0.3)]
    : [0.74 + (0.05 * Math.sin(t * 0.21)) / aspect, 0.42 + 0.06 * Math.cos(t * 0.27)];

/** time constants (s): a carried source catches the hand fast; a released one settles home */
const CARRY = 0.09;
const SETTLE = 0.35;

const QUALITY = { desktop: { dprCap: 1.5, scale: 0.75 }, touch: { dprCap: 1.5, scale: 0.6 } };

/** λ shown on the plate's readout, in arbitrary tank units (k as in the shader) */
const lambda = (wave: number) => (2 * Math.PI) / (30 + 26 * wave);

/**
 * Fig. 02 — a ripple tank of two coherent sources, set as a figure plate.
 * Pointing into the plate picks up whichever source is nearer and carries
 * it — easing quickly after the hand, never jumping — and lets it settle
 * home on leaving. Scrolling through the section shortens the wavelength,
 * and the fringes close up.
 */
export default function InterferencePlate({ className }: { className?: string }) {
  const readoutRef = useRef<HTMLSpanElement>(null);
  const figureRef = useRef<HTMLElement>(null);

  const onStage = useCallback((stage: Stage) => {
    const figure = figureRef.current;
    if (!figure) return;
    const canvas = stage.renderer.domElement;
    const write = () => {
      if (readoutRef.current) readoutRef.current.textContent = lambda(uniforms.uWave.value).toFixed(3);
    };
    write();
    if (prefersReducedMotion()) return;

    // The hand, in plate uv (y up, as the shader has it), and which source it holds.
    const hand = { x: 0, y: 0, over: false };
    let held: 0 | 1 | null = null;
    const toPlate = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      hand.x = (e.clientX - r.left) / r.width;
      hand.y = 1 - (e.clientY - r.top) / r.height;
    };
    const onEnter = (e: PointerEvent) => {
      toPlate(e);
      hand.over = true;
      // The nearer source answers, measured as the eye sees it (aspect-correct).
      const aspect = canvas.clientWidth / Math.max(canvas.clientHeight, 1);
      const d = (s: number[]) => Math.hypot((s[0] - hand.x) * aspect, s[1] - hand.y);
      held = d(uniforms.uA.value) <= d(uniforms.uB.value) ? 0 : 1;
    };
    const onMove = (e: PointerEvent) => toPlate(e);
    const onLeave = () => {
      hand.over = false;
      held = null;
    };
    canvas.addEventListener("pointerenter", onEnter);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerleave", onLeave);

    // Each frame, every source eases toward its target: the hand if held, home if not.
    const ease = (time: number, deltaMs: number) => {
      const dt = Math.min(deltaMs, 100) / 1000;
      const aspect = canvas.clientWidth / Math.max(canvas.clientHeight, 1);
      ([uniforms.uA.value, uniforms.uB.value] as number[][]).forEach((pos, i) => {
        const carried = hand.over && held === i;
        const [tx, ty] = carried ? [hand.x, hand.y] : home(i as 0 | 1, time, aspect);
        const k = 1 - Math.exp(-dt / (carried ? CARRY : SETTLE));
        pos[0] += (tx - pos[0]) * k;
        pos[1] += (ty - pos[1]) * k;
      });
    };
    gsap.ticker.add(ease);

    const trigger = ScrollTrigger.create({
      trigger: figure,
      start: "top bottom",
      end: "bottom top",
      onUpdate: self => {
        uniforms.uWave.value = self.progress;
        write();
      },
    });
    return () => {
      trigger.kill();
      gsap.ticker.remove(ease);
      canvas.removeEventListener("pointerenter", onEnter);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerleave", onLeave);
    };
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
