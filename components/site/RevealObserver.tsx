"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Marks [data-reveal] elements data-shown as they enter the viewport; CSS
 * (globals.css) does the rest. One observer for the whole page keeps
 * every section that only reveals itself a server component.
 */
export default function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.add("motion-ready");
    if (!root.classList.contains("motion")) return;

    const io = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-shown", "");
          io.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    document.querySelectorAll("[data-reveal]:not([data-shown])").forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [pathname]);

  return null;
}
