"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "@/lib/animation/prefs";

gsap.registerPlugin(ScrollTrigger);

type Props = {
  text: string;
  /** words to charge with heat once lit */
  charged?: string[];
  className?: string;
  as?: "h2" | "p";
};

/**
 * A statement that is energised word by word as it crosses the viewport:
 * each word comes up from a dim steel to full paper, scrubbed to scroll, so
 * the reading pace is the reader's.
 */
export default function KineticStatement({ text, charged = [], className, as: Tag = "h2" }: Props) {
  const ref = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      const words = el.querySelectorAll<HTMLElement>("[data-word]");
      gsap.fromTo(
        words,
        { opacity: 0.16 },
        {
          opacity: 1,
          ease: "none",
          stagger: 0.12,
          scrollTrigger: { trigger: el, start: "top 78%", end: "bottom 42%", scrub: 0.6 },
        },
      );
      gsap.fromTo(
        el.querySelectorAll("[data-charged]"),
        // Literal colours: GSAP interpolates values, not var() references.
        { color: "#ece8df" },
        {
          color: "#ff6a2a",
          ease: "none",
          scrollTrigger: { trigger: el, start: "center 55%", end: "bottom 42%", scrub: 0.6 },
        },
      );
    }, el);
    return () => ctx.revert();
  }, []);

  const words = text.split(" ");
  return (
    <Tag ref={ref} className={className}>
      {words.map((w, n) => (
        <span key={n}>
          <span data-word="" data-charged={charged.includes(w.replace(/[.,]/g, "")) ? "" : undefined}>
            {w}
          </span>
          {n < words.length - 1 ? " " : null}
        </span>
      ))}
    </Tag>
  );
}
