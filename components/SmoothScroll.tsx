"use client";

import { useEffect } from "react";
import { mountScroll } from "@/lib/animation/scroll";
import { prefersReducedMotion } from "@/lib/animation/prefs";

/** Mounts Lenis site-wide (off under reduced motion). Renders nothing. */
export default function SmoothScroll() {
  useEffect(() => mountScroll({ smooth: !prefersReducedMotion() }), []);
  return null;
}
