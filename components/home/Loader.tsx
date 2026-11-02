"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import gsap from "gsap";
import { lockScroll } from "@/lib/animation/scroll";
import { fontsReady, prefersReducedMotion } from "@/lib/animation/prefs";
import { bootProgress, bootTask, finishBoot, isBooted } from "@/lib/boot";

/** never shorter than this, so it reads as a moment rather than a flash */
const MIN_SECONDS = 1.1;
/** never longer than this, whatever is still pending */
const MAX_SECONDS = 9;
/** how long to wait for late registrations before trusting "all settled" */
const GRACE_SECONDS = 0.35;

const STATUS = ["Setting type", "Compiling shaders", "Warming the field", "Calibrating"];

/** One half's content: the full screen, which the half's clip shows the top or bottom of. */
function Screen() {
  return (
    <div className="gutter absolute inset-0 flex flex-col justify-between bg-graphite-950 py-6">
      <div className="label flex justify-between text-steel">
        <span>Future Star Labs</span>
        <span className="hidden md:inline">Matter → Energy → Signal → Discovery</span>
      </div>

      {/* LOADING, centred exactly, so the split runs through the middle of the
          letters: outlined, filling with heat as the work completes, a scan
          passing over it all the while. */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <p className="display loader-word outline-type text-paper/60">Loading</p>
        <p aria-hidden="true" className="display loader-word loader-fill absolute inset-0 text-heat">
          Loading
        </p>
        <span aria-hidden="true" className="loader-scan" />
      </div>

      <div className="label flex items-end justify-between text-steel">
        <span data-loader-status="">{STATUS[0]}</span>
        <span className="tabular-nums text-paper">
          <span data-loader-percent="">000</span> %
        </span>
      </div>
    </div>
  );
}

/** Whether this page load still needs the loader: not once booted (client navigation back home). */
const subscribe = () => () => {};
const needsLoader = () => !isBooted();
const serverNeedsLoader = () => true;

/**
 * The home page's loader. It holds the page while the GL pieces get ready
 * (lib/boot.ts), shows real progress with a creep that never stalls, then
 * splits along its middle — the top half sliding left, the bottom half
 * right, each carrying its half of the letters — and the page's entrances
 * begin as it parts. No loader under reduced motion or without JS: the
 * page is simply there (globals.css hides it unless html.motion).
 */
export default function Loader() {
  const rootRef = useRef<HTMLDivElement>(null);
  const show = useSyncExternalStore(subscribe, needsLoader, serverNeedsLoader);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || !show) return;
    if (prefersReducedMotion() || !document.documentElement.classList.contains("motion")) {
      root.hidden = true;
      finishBoot();
      return;
    }

    // Start from the top, held still, whatever the browser restored.
    history.scrollRestoration = "manual";
    window.scrollTo(0, 0);
    const release = lockScroll();
    bootTask(fontsReady(4000));
    bootTask(new Promise(r => (document.readyState === "complete" ? r(null) : window.addEventListener("load", () => r(null), { once: true }))));

    const percents = root.querySelectorAll<HTMLElement>("[data-loader-percent]");
    const statuses = root.querySelectorAll<HTMLElement>("[data-loader-status]");
    const start = performance.now();
    let shown = 0;
    let lastCount = -1;
    let countSince = start;
    let leaving = false;

    const write = (p: number) => {
      root.style.setProperty("--progress", p.toFixed(4));
      const text = String(Math.round(p * 100)).padStart(3, "0");
      percents.forEach(el => { el.textContent = text; });
      const status = STATUS[Math.min(STATUS.length - 1, Math.floor(p * STATUS.length))];
      statuses.forEach(el => { if (el.textContent !== status) el.textContent = status; });
    };

    const leave = () => {
      leaving = true;
      gsap.ticker.remove(tick);
      const tl = gsap.timeline({
        onComplete: () => {
          root.hidden = true;
          release();
        },
      });
      const progress = { p: shown };
      tl.to(progress, { p: 1, duration: 0.35, ease: "power2.out", onUpdate: () => write(progress.p) })
        .to("[data-loader-half='top']", { xPercent: -100, duration: 1.35, ease: "expo.inOut" }, "+=0.15")
        .to("[data-loader-half='bottom']", { xPercent: 100, duration: 1.35, ease: "expo.inOut" }, "<")
        // The page's entrances start as the halves part.
        .call(finishBoot, [], "<0.4");
    };

    function tick() {
      if (leaving) return;
      const now = performance.now();
      const t = (now - start) / 1000;
      const { settled, total } = bootProgress();
      if (total !== lastCount) {
        lastCount = total;
        countSince = now;
      }
      // Real progress, under a creep that keeps moving toward 90% meanwhile.
      const real = total ? settled / total : 0;
      const creep = 0.9 * (1 - Math.exp(-t / 2.2));
      const target = Math.min(0.97, Math.max(real * 0.97, creep));
      shown += (target - shown) * 0.08;
      write(shown);

      const allIn = total > 0 && settled === total && (now - countSince) / 1000 > GRACE_SECONDS;
      if ((allIn && t > MIN_SECONDS) || t > MAX_SECONDS) leave();
    }
    gsap.ticker.add(tick);

    return () => {
      gsap.ticker.remove(tick);
      release();
    };
  }, [show]);

  if (!show) return null;
  return (
    <div ref={rootRef} role="status" aria-live="polite" aria-label="Loading Future Star Labs" className="loader fixed inset-0 z-[80]">
      <div data-loader-half="top" className="loader-half loader-top absolute inset-0">
        <Screen />
      </div>
      <div data-loader-half="bottom" className="loader-half loader-bottom absolute inset-0">
        <Screen />
      </div>
    </div>
  );
}
