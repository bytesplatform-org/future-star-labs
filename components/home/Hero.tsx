"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { isCoarsePointer, prefersReducedMotion } from "@/lib/animation/prefs";

gsap.registerPlugin(ScrollTrigger);

/** The name, one line per word. dir: which way the line travels on scroll. */
const LINES = [
  { text: "Future", dir: 1, className: "" },
  { text: "Star", dir: -1, className: "text-right", hollow: true },
  { text: "Labs", dir: 1, className: "pl-[9vw]" },
];

const SEQUENCE = ["Matter", "Energy", "Signal", "Discovery"];

/** probe temperature across the hero's width, °C */
const PROBE_MIN = 20;
const PROBE_MAX = 480;

/**
 * Scene 01. The name is the architecture: three lines set flush left,
 * flush right, indented — and they pull apart along x as the page scrolls,
 * each the opposite way to its neighbour.
 *
 * The lines also lean gently away from the pointer, alternately, and the
 * probe readout gives a temperature for where it is.
 */
export default function Hero() {
  const rootRef = useRef<HTMLElement>(null);
  const readoutRef = useRef<HTMLSpanElement>(null);

  // Arrival, scroll drift and lean.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion()) return;

    const ctx = gsap.context(() => {
      const lines = gsap.utils.toArray<HTMLElement>("h1 [data-hero-line]");
      const words = gsap.utils.toArray<HTMLElement>("h1 [data-hero-word]");
      const lineOf = (el: HTMLElement) => el.closest<HTMLElement>("[data-hero-line]")!;
      const dir = (el: HTMLElement) => Number(lineOf(el).dataset.dir);

      // Arrival: each word wipes in from its own side.
      gsap.fromTo(
        words,
        {
          x: (_i: number, el: HTMLElement) => `${-dir(el) * 8}vw`,
          clipPath: (_i: number, el: HTMLElement) => (dir(el) > 0 ? "inset(-10% 100% -10% 0%)" : "inset(-10% 0% -10% 100%)"),
        },
        { x: 0, clipPath: "inset(-10% 0% -10% 0%)", duration: 1.6, ease: "expo.out", delay: (i: number) => 0.15 + i * 0.13 },
      );
      gsap.fromTo("[data-hero-fade]", { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 1.2, ease: "power3.out", delay: 0.9, stagger: 0.08 });

      // Scroll: the lines pull apart, alternately.
      const scrub = { trigger: root, start: "top top", end: "bottom top", scrub: 0.9 };
      lines.forEach(line => gsap.to(line, { xPercent: Number(line.dataset.dir) * 11, ease: "none", scrollTrigger: scrub }));
      gsap.to("[data-hero-ruler]", { xPercent: -18, ease: "none", scrollTrigger: scrub });

      // Pointer: the lines lean away from it, alternately.
      if (isCoarsePointer()) return;
      const lean = lines.map(line => ({
        to: gsap.quickTo(line, "x", { duration: 1.4, ease: "power3.out" }),
        dir: Number(line.dataset.dir),
      }));
      const onMove = (e: PointerEvent) => {
        const r = root.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;
        lean.forEach(l => l.to(nx * 36 * l.dir));
        if (readoutRef.current) {
          const k = Math.min(1, Math.max(0, nx + 0.5));
          readoutRef.current.textContent = `${Math.round(PROBE_MIN + (PROBE_MAX - PROBE_MIN) * k)} °C`;
        }
      };
      root.addEventListener("pointermove", onMove);
      return () => root.removeEventListener("pointermove", onMove);
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={rootRef}
      id="top"
      aria-labelledby="hero-title"
      className="gutter relative flex min-h-svh flex-col overflow-hidden pb-6 pt-24 md:pb-8 md:pt-28"
    >
      {/* Lab paper. */}
      <div aria-hidden="true" className="hero-grid pointer-events-none absolute inset-0" />

      <div className="label relative flex justify-between text-steel" data-hero-fade>
        <p>Physics · Materials · Energy</p>
        <ol className="hidden gap-3 md:flex">
          {SEQUENCE.map((s, n) => (
            <li key={s} className="flex gap-3">
              {n > 0 && <span aria-hidden="true" className="text-steel-dim">→</span>}
              <span className={n === 0 ? "text-paper" : undefined}>{s}</span>
            </li>
          ))}
        </ol>
      </div>

      <div className="relative mt-auto">
        <h1 id="hero-title" className="hero-type display">
          {LINES.map(l => (
            <span key={l.text} data-hero-line="" data-dir={l.dir} className={`block ${l.className}`}>
              <span data-hero-word="" className={`inline-block ${l.hollow ? "outline-type" : ""}`}>
                {l.text}
              </span>{" "}
            </span>
          ))}
        </h1>

        <p
          data-hero-fade
          className="relative mt-8 max-w-[34ch] text-[clamp(1rem,1.15vw,1.2rem)] leading-snug text-paper/80 md:absolute md:left-0 md:top-[37%] md:mt-0 md:max-w-[30ch]"
        >
          A working laboratory for first-principles physics, materials and energy — from the junction of a
          thermocouple to the floor of a vacuum chamber.
        </p>
      </div>

      <div className="relative mt-8 md:mt-10" data-hero-fade>
        {/* A measuring scale along the foot of the hero, sliding with scroll. */}
        <div aria-hidden="true" className="relative h-3 overflow-hidden">
          <div data-hero-ruler="" className="hero-ruler absolute inset-y-0 left-0 w-[140%]" />
        </div>
        <div className="label flex items-center justify-between gap-6 pt-4 text-steel">
          <p className="flex gap-3 md:gap-4">
            <span>Experiment</span>
            <span aria-hidden="true">/</span>
            <span>Understand</span>
            <span aria-hidden="true">/</span>
            <span>Build</span>
          </p>
          <p className="hidden items-center gap-3 md:flex" aria-hidden="true">
            Probe <span ref={readoutRef} className="min-w-[6ch] tabular-nums text-heat">— °C</span>
          </p>
          <a href="#about" className="hidden items-center gap-3 text-paper sm:flex">
            Scroll
            <span aria-hidden="true" className="inline-block h-6 w-px origin-top animate-[drip_2.4s_var(--ease-field)_infinite] bg-heat" />
          </a>
        </div>
      </div>
    </section>
  );
}
