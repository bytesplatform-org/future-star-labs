"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "@/lib/animation/prefs";

gsap.registerPlugin(ScrollTrigger);

type Props = {
  id?: string;
  /** number of steps the scroll range is divided into */
  steps: number;
  className?: string;
  children: React.ReactNode;
};

/**
 * A tall section whose sticky contents play out over its scroll range.
 * Writes progress to --p (0..1) and marks each [data-at="n"] descendant
 * data-reached (n ≤ step) and data-current (n = step). CSS does the rest.
 *
 * The server markup ships with every step reached. Without html.motion
 * (reduced motion, or no JS) globals.css collapses the scroll range and
 * the scene simply reads complete.
 */
export default function ScrollScene({ id, steps, className, children }: Props) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion() || !document.documentElement.classList.contains("motion")) return;
    const marks = Array.from(el.querySelectorAll<HTMLElement | SVGElement>("[data-at]"));

    let step = -1;
    const update = (progress: number) => {
      el.style.setProperty("--p", progress.toFixed(4));
      const next = Math.min(steps, Math.floor(progress * steps) + 1);
      if (next === step) return;
      step = next;
      el.dataset.step = String(step);
      for (const m of marks) {
        const at = Number(m.dataset.at);
        m.toggleAttribute("data-reached", at <= step);
        m.toggleAttribute("data-current", at === step);
      }
    };

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: "top top",
      end: "bottom bottom",
      onUpdate: self => update(self.progress),
      onRefresh: self => update(self.progress),
    });
    update(trigger.progress);

    return () => trigger.kill();
  }, [steps]);

  return (
    <section ref={ref} id={id} data-step={steps} className={`scroll-scene relative ${className ?? ""}`}>
      {children}
    </section>
  );
}
