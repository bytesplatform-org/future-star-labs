"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ShaderCanvas from "@/components/gl/ShaderCanvas";
import type { Stage } from "@/lib/gl/engine";
import { fields } from "@/lib/content/home";
import { isCoarsePointer, prefersReducedMotion } from "@/lib/animation/prefs";
import type { FieldKey } from "@/lib/content/subjects";
import { PHENOMENA, phenomenaFragment } from "@/lib/shaders/phenomena";

gsap.registerPlugin(ScrollTrigger);

/**
 * The phenomena shader's state, one slot per row (lib/shaders/phenomena.ts):
 * its band (top, bottom as fractions of the list's height, then the entry
 * origin — x across the list, y within the band), how present it is, and
 * how far it has grown out from that origin. One list per page; the shader
 * reads these by reference.
 */
const phenomena = {
  uBands: { value: new Array<number>(PHENOMENA * 4).fill(0) },
  uShow: { value: new Array<number>(PHENOMENA).fill(0) },
  uGrow: { value: new Array<number>(PHENOMENA).fill(0) },
};
const ROW: Record<FieldKey, number> = { thermal: 0, em: 1, electric: 2, materials: 3, signal: 4 };
const QUALITY = { desktop: { dprCap: 1.5, scale: 0.8 }, touch: { dprCap: 1.5, scale: 0.6 } };

/** Measures every row's band from the layout (origins are kept). */
function measureBands(list: HTMLElement) {
  const h = list.offsetHeight || 1;
  list.querySelectorAll<HTMLElement>("[data-key]").forEach(row => {
    const i = ROW[row.dataset.key as FieldKey];
    phenomena.uBands.value[i * 4] = row.offsetTop / h;
    phenomena.uBands.value[i * 4 + 1] = (row.offsetTop + row.offsetHeight) / h;
  });
}

/**
 * Each row's presence and growth, eased here and copied into the shader's
 * arrays every frame (see the stage hook in Fields). One object per row, so
 * a row's tweens only ever contend with that row's own.
 */
const rows = Array.from({ length: PHENOMENA }, () => ({ show: 0, grow: 0 }));

function syncPhenomena() {
  rows.forEach((r, i) => {
    phenomena.uShow.value[i] = r.show;
    phenomena.uGrow.value[i] = r.grow;
  });
}

/**
 * Copies the rows' state into the shader every frame. A still stage
 * (reduced motion) doesn't draw on its own, so it's asked to on a change.
 */
function onPhenomenaStage(stage: Stage) {
  const still = prefersReducedMotion();
  let last = "";
  const tick = () => {
    syncPhenomena();
    if (!still) return;
    const now = rows.map(r => r.show).join();
    if (now !== last) {
      last = now;
      stage.renderOnce();
    }
  };
  gsap.ticker.add(tick);
  return () => gsap.ticker.remove(tick);
}

/**
 * Fades the active row's phenomenon in where it is — grown out from where
 * the pointer entered (or the row's middle) — and every other row's out
 * where it is. Nothing travels between rows.
 */
function showPhenomenon(list: HTMLElement, key: FieldKey | null, entry?: { x: number; y: number }) {
  const still = prefersReducedMotion();
  measureBands(list);
  rows.forEach((r, i) => {
    const on = key !== null && ROW[key] === i;
    gsap.killTweensOf(r);
    if (still) {
      r.show = on ? 1 : 0;
      if (on) r.grow = 1;
      return;
    }
    if (!on) {
      gsap.to(r, { show: 0, duration: 0.6, ease: "sine.inOut" });
      return;
    }
    // Arriving afresh: set the origin and grow out from it.
    if (r.show < 0.05) {
      const row = list.querySelector<HTMLElement>(`[data-key="${key}"]`)!;
      const lr = list.getBoundingClientRect();
      const rr = row.getBoundingClientRect();
      phenomena.uBands.value[i * 4 + 2] = entry ? (entry.x - lr.left) / lr.width : 0.5;
      phenomena.uBands.value[i * 4 + 3] = entry ? (entry.y - rr.top) / rr.height : 0.5;
      r.grow = 0;
    }
    gsap.to(r, { show: 1, duration: 0.45, ease: "sine.out" });
    gsap.to(r, { grow: 1, duration: 1.1, ease: "power2.out" });
  });
  syncPhenomena();
}

/** what each field means in colour — the same vocabulary as the shader */
const TONE: Record<FieldKey, string> = {
  thermal: "var(--color-heat)",
  em: "var(--color-cold)",
  electric: "var(--color-signal)",
  materials: "var(--color-paper)",
  signal: "var(--color-steel)",
};

/**
 * Scene 03. Each field of exploration is a full-width row; pointing at one
 * (or, on touch, scrolling it to the middle) fades its phenomenon in, in
 * place, growing out from where the pointer came in
 * (lib/shaders/phenomena.ts): rising isotherms for heat, dipole field
 * lines, running equipotentials, a lattice under diffraction, traces on a
 * graticule — each one answering the pointer.
 */
export default function Fields() {
  const listRef = useRef<HTMLOListElement>(null);
  const [active, setActive] = useState<FieldKey | null>(null);

  const current = useRef<FieldKey | null>(null);

  const activate = useCallback((key: FieldKey | null, entry?: { x: number; y: number }) => {
    current.current = key;
    setActive(key);
    if (listRef.current) showPhenomenon(listRef.current, key, entry);
  }, []);

  // Bands follow the layout as it reflows.
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const ro = new ResizeObserver(() => measureBands(list));
    ro.observe(list);
    return () => ro.disconnect();
  }, []);

  // Touch has no hover: the row at the middle of the screen is the active one.
  useEffect(() => {
    const list = listRef.current;
    if (!list || !isCoarsePointer()) return;
    const triggers = Array.from(list.querySelectorAll<HTMLElement>("[data-key]")).map(row =>
      ScrollTrigger.create({
        trigger: row,
        start: "top 55%",
        end: "bottom 55%",
        onToggle: self => {
          const key = row.dataset.key as FieldKey;
          if (self.isActive) activate(key);
          // Only the row that set the override may clear it.
          else if (current.current === key) activate(null);
        },
      }),
    );
    return () => triggers.forEach(t => t.kill());
  }, [activate]);

  return (
    <section id="fields" aria-labelledby="fields-title" className="relative py-[16vh]">
      <div className="gutter mb-12 grid grid-cols-1 gap-6 md:mb-20 md:grid-cols-12">
        <div className="label flex items-center gap-4 text-steel md:col-span-12">
          <span className="text-heat">03</span>
          <span>Fields of exploration</span>
          <span data-reveal="rule" className="hairline flex-1" />
        </div>
        <h2 id="fields-title" data-reveal="mask" className="display-wide text-[clamp(2rem,4.2vw,5rem)] md:col-span-7">
          <span className="line"><span>Five fields.</span></span>
          <span className="line" style={{ "--i": 1 } as CSSProperties}><span className="text-steel">One set of laws.</span></span>
        </h2>
        <p data-reveal="settle" className="max-w-[38ch] self-end text-paper/70 md:col-span-4 md:col-start-9">
          Each field opens onto chapters of the notebook — the same laws, met from a different side.
        </p>
      </div>

      <div className="relative">
        <ShaderCanvas
          fragmentShader={phenomenaFragment}
          uniforms={phenomena}
          quality={QUALITY}
          onStage={onPhenomenaStage}
          className="pointer-events-none absolute inset-0 h-full w-full"
        />
        <ol
          ref={listRef}
          onMouseLeave={() => activate(null)}
          className="group/list relative border-b border-paper/10"
          data-active={active ?? undefined}
        >
          {fields.map((f, n) => {
            const on = active === f.key;
            return (
              <li
                key={f.key}
                data-key={f.key}
                onMouseEnter={e => activate(f.key, { x: e.clientX, y: e.clientY })}
                onFocus={() => activate(f.key)}
                style={{ "--tone": TONE[f.key] } as CSSProperties}
                className={`gutter relative grid grid-cols-12 items-end gap-x-4 gap-y-3 border-t border-paper/10 py-[4.5vh] transition-opacity duration-700 md:py-[3.2vw] ${
                  active && !on ? "opacity-30" : "opacity-100"
                }`}
              >
                <div className="label col-span-12 flex gap-5 text-steel md:col-span-2 md:row-span-2 md:flex-col md:gap-2 md:self-start md:pt-[1vw]">
                  <span style={{ color: on ? "var(--tone)" : undefined }} className="transition-colors duration-500">
                    {String(n + 1).padStart(2, "0")}
                  </span>
                  <span className="font-mono normal-case tracking-normal text-paper/60">{f.phenomenon}</span>
                </div>

                <h3
                  className="display col-span-12 text-[clamp(1.9rem,8.2vw,6rem)] transition-[color,translate] duration-700 ease-[var(--ease-out-expo)] md:col-span-10 md:text-[clamp(3rem,6.6vw,9rem)]"
                  style={{ color: on ? "var(--tone)" : undefined, translate: on ? "1.2vw 0" : "0 0" }}
                >
                  {f.title}
                </h3>

                <div className="col-span-12 flex flex-col gap-3 md:col-span-10 md:col-start-3 md:flex-row md:items-baseline md:justify-between md:gap-10">
                  <p className="max-w-[46ch] text-[0.95rem] leading-snug text-paper/75">{f.text}</p>
                  <ul className="flex flex-wrap gap-x-6 gap-y-1">
                    {f.subjects.map(s => (
                      <li key={s.href}>
                        <Link href={s.href} className="label text-paper underline-offset-4 hover:underline">
                          {s.title} →
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* The row's reading line, charged in the field's colour. */}
                <span
                  aria-hidden="true"
                  className="absolute bottom-0 left-0 h-px w-full origin-left transition-transform duration-1000 ease-[var(--ease-field)]"
                  style={{ background: "var(--tone)", transform: on ? "scaleX(1)" : "scaleX(0)" }}
                />
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
