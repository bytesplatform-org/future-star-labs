"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { isCoarsePointer, prefersReducedMotion } from "@/lib/animation/prefs";

gsap.registerPlugin(ScrollTrigger);

/** The name, one line per word. dir: which way the line travels on scroll. */
const LINES = [
  { text: "Future", dir: 1, className: "" },
  { text: "Star", dir: -1, className: "text-right" },
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
 * The pointer is a thermal probe. Where it rests, a heated copy of the
 * type shows through a soft mask (the hollow STAR fills with heat), the
 * lines lean gently away, and the readout gives the probe's temperature.
 */
export default function Hero() {
  const rootRef = useRef<HTMLElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const readoutRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const wrap = wrapRef.current;
    if (!root || !wrap) return;
    const reduced = prefersReducedMotion();
    const coarse = isCoarsePointer();

    // The overlay's mask is placed in section coordinates; it needs the
    // wrapper's offset to line up.
    const measure = () => {
      root.style.setProperty("--wx", `${wrap.offsetLeft}px`);
      root.style.setProperty("--wy", `${wrap.offsetTop}px`);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(root);

    const probe = { x: root.clientWidth * 0.66, y: root.clientHeight * 0.5 };
    let lastTemp = -1;
    const paint = () => {
      root.style.setProperty("--mx", `${probe.x.toFixed(1)}px`);
      root.style.setProperty("--my", `${probe.y.toFixed(1)}px`);
      const k = Math.min(1, Math.max(0, probe.x / root.clientWidth));
      const temp = Math.round(PROBE_MIN + (PROBE_MAX - PROBE_MIN) * k);
      if (temp !== lastTemp && readoutRef.current) {
        readoutRef.current.textContent = `${temp} °C`;
        lastTemp = temp;
      }
    };
    paint();

    if (reduced) return () => ro.disconnect();

    const ctx = gsap.context(() => {
      const lines = gsap.utils.toArray<HTMLElement>("[data-hero-line]");
      const words = gsap.utils.toArray<HTMLElement>("[data-hero-line] > span");
      const lineOf = (el: HTMLElement) => el.closest<HTMLElement>("[data-hero-line]")!;
      const dir = (el: HTMLElement) => Number(lineOf(el).dataset.dir);
      const index = (el: HTMLElement) => Number(lineOf(el).dataset.index);

      // Arrival: each word wipes in from its own side, base and heat copy together.
      gsap.fromTo(
        words,
        {
          x: (_i: number, el: HTMLElement) => `${-dir(el) * 8}vw`,
          clipPath: (_i: number, el: HTMLElement) => (dir(el) > 0 ? "inset(-10% 100% -10% 0%)" : "inset(-10% 0% -10% 100%)"),
        },
        {
          x: 0,
          clipPath: "inset(-10% 0% -10% 0%)",
          duration: 1.6,
          ease: "expo.out",
          delay: (_i: number, el: HTMLElement) => 0.15 + index(el) * 0.13,
        },
      );
      gsap.fromTo("[data-hero-fade]", { autoAlpha: 0, y: 12 }, { autoAlpha: 1, y: 0, duration: 1.2, ease: "power3.out", delay: 0.9, stagger: 0.08 });

      // Scroll: the lines pull apart, alternately.
      lines.forEach(line => {
        gsap.to(line, {
          xPercent: Number(line.dataset.dir) * 11,
          ease: "none",
          scrollTrigger: { trigger: root, start: "top top", end: "bottom top", scrub: 0.9 },
        });
      });
      gsap.to("[data-hero-ruler]", {
        xPercent: -18,
        ease: "none",
        scrollTrigger: { trigger: root, start: "top top", end: "bottom top", scrub: 0.9 },
      });

      // The probe eases after the hand; the lines lean away from it, alternately.
      const followX = gsap.quickTo(probe, "x", { duration: 0.7, ease: "power3.out", onUpdate: paint });
      const followY = gsap.quickTo(probe, "y", { duration: 0.7, ease: "power3.out", onUpdate: paint });
      const lean = lines.map(line => ({
        to: gsap.quickTo(line, "x", { duration: 1.4, ease: "power3.out" }),
        dir: Number(line.dataset.dir),
      }));

      if (!coarse) {
        const onMove = (e: PointerEvent) => {
          const r = root.getBoundingClientRect();
          followX(e.clientX - r.left);
          followY(e.clientY - r.top);
          const nx = (e.clientX - r.left) / r.width - 0.5;
          lean.forEach(l => l.to(nx * 36 * l.dir));
        };
        root.addEventListener("pointermove", onMove);
        return () => root.removeEventListener("pointermove", onMove);
      }

      // Touch: nothing to follow, so the probe drifts over the type by itself.
      const drift = (time: number) => {
        followX(root.clientWidth * (0.5 + 0.36 * Math.sin(time * 0.35)));
        followY(root.clientHeight * (0.5 + 0.16 * Math.sin(time * 0.52 + 1.3)));
      };
      gsap.ticker.add(drift);
      return () => gsap.ticker.remove(drift);
    }, root);

    return () => {
      ctx.revert();
      ro.disconnect();
    };
  }, []);

  return (
    <section
      ref={rootRef}
      id="top"
      aria-labelledby="hero-title"
      className="gutter relative flex min-h-svh flex-col overflow-hidden pb-6 pt-24 md:pb-8 md:pt-28"
    >
      {/* Lab paper, and the warmth the probe leaves on it. */}
      <div aria-hidden="true" className="hero-grid pointer-events-none absolute inset-0" />
      <div aria-hidden="true" className="hero-glow pointer-events-none absolute inset-0" />

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

      <div ref={wrapRef} className="relative mt-auto">
        <h1 id="hero-title" className="hero-type display">
          {LINES.map((l, i) => (
            <span key={l.text} data-hero-line="" data-dir={l.dir} data-index={i} className={`block ${l.className}`}>
              <span className={`inline-block ${l.text === "Star" ? "outline-type" : ""}`}>{l.text}</span>{" "}
            </span>
          ))}
        </h1>

        {/* The heated copy: the same lines, filled, shown only around the probe. */}
        <div aria-hidden="true" className="hero-type hero-heat display pointer-events-none absolute inset-0">
          {LINES.map((l, i) => (
            <span key={l.text} data-hero-line="" data-dir={l.dir} data-index={i} className={`block ${l.className}`}>
              <span className="inline-block">{l.text}</span>
            </span>
          ))}
        </div>

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
