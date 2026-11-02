"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion } from "@/lib/animation/prefs";

gsap.registerPlugin(ScrollTrigger);

/** Fades and lifts each [data-reveal] child in as it scrolls into view. */
export default function Reveal({ children, className }: { children: React.ReactNode; className?: string }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!root.current || prefersReducedMotion()) return;
    const ctx = gsap.context(() => {
      ScrollTrigger.batch("[data-reveal]", {
        start: "top 85%",
        onEnter: batch =>
          gsap.fromTo(batch, { y: 48, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 1.1, ease: "power3.out", stagger: 0.08 }),
      });
      gsap.set("[data-reveal]", { autoAlpha: 0 });
    }, root);
    return () => ctx.revert();
  }, []);

  return <div ref={root} className={className}>{children}</div>;
}
