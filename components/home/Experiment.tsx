"use client";

import { useCallback, useEffect, useId, useRef, useState, type CSSProperties } from "react";
import ShaderCanvas from "@/components/gl/ShaderCanvas";
import type { Stage } from "@/lib/gl/engine";
import { seebeckFragment } from "@/lib/shaders/seebeckJunction";
import { prefersReducedMotion } from "@/lib/animation/prefs";
import { T_MAX, junctionUniforms, runDrift, setJunctions } from "@/lib/gl/junctionState";
/** Type K, near room temperature: ≈ 41 µV/°C */
const SEEBECK_UV = 41;

const QUALITY = {
  desktop: { dprCap: 1.5, scale: 0.9 },
  touch: { dprCap: 1.5, scale: 0.6 },
};

/**
 * Scene 06 — a Seebeck junction you can drive. Two junction temperatures,
 * one conductor: the carriers' agitation follows the local temperature,
 * their net drift follows the difference, and the voltmeter reads α·ΔT.
 */
export default function Experiment() {
  const [cold, setCold] = useState(20);
  const [hot, setHot] = useState(320);
  const stageRef = useRef<Stage | null>(null);

  useEffect(() => {
    const still = prefersReducedMotion();
    setJunctions(cold, hot, still);
    if (still) stageRef.current?.renderOnce();
  }, [cold, hot]);

  const onStage = useCallback((stage: Stage) => {
    stageRef.current = stage;
    const stop = prefersReducedMotion() ? undefined : runDrift();
    return () => {
      stop?.();
      stageRef.current = null;
    };
  }, []);

  const dT = hot - cold;
  const mV = (dT * SEEBECK_UV) / 1000;

  return (
    <section id="experiment" aria-labelledby="experiment-title" className="relative py-[16vh]">
      <div className="gutter mb-10 grid grid-cols-1 items-end gap-8 md:mb-14 md:grid-cols-12 md:gap-6">
        <div className="label flex items-center gap-4 text-steel md:col-span-12">
          <span className="text-heat">06</span>
          <span>Experiment — the Seebeck junction</span>
          <span data-reveal="rule" className="hairline flex-1" />
        </div>
        <h2 id="experiment-title" data-reveal="mask" className="display-wide text-[clamp(2.2rem,5.6vw,7rem)] md:col-span-8">
          <span className="line"><span>Hold one end cold.</span></span>
          <span className="line" style={{ "--i": 1 } as CSSProperties}><span className="text-heat">Heat the other.</span></span>
        </h2>
        <p data-reveal="settle" className="max-w-[36ch] text-paper/70 md:col-span-4">
          Carriers agitate with temperature, but only a <em className="not-italic text-paper">difference</em> makes them
          drift — and a drift of charge is a voltage you can read.
        </p>
      </div>

      <div className="gutter">
        <div className="relative overflow-hidden border border-paper/10 bg-graphite-950">
          <ShaderCanvas
            fragmentShader={seebeckFragment}
            uniforms={junctionUniforms}
            quality={QUALITY}
            onStage={onStage}
            className="block h-[clamp(260px,42svh,680px)] w-full md:h-[clamp(300px,58vh,680px)]"
          />

          {/* Instrument overlay */}
          <div className="label pointer-events-none absolute inset-x-4 top-4 flex justify-between md:inset-x-6 md:top-6">
            <span className="text-cold">Cold<span className="hidden md:inline"> junction</span> · {cold} °C</span>
            <span className="text-heat">Hot<span className="hidden md:inline"> junction</span> · {hot} °C</span>
          </div>
        </div>

        {/* The instrument: readings, then the two dials that set them. */}
        <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-4 border-b border-paper/10 py-6 md:grid-cols-12 md:gap-6">
          <Readout label="ΔT" value={`${dT > 0 ? "+" : ""}${dT}`} unit="°C" className="md:col-span-4" />
          <Readout label="Output" value={mV.toFixed(2)} unit="mV" accent className="md:col-span-4" />
          <Plot dT={dT} className="md:col-span-2 md:col-start-11" />
        </div>
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-10">
          <Control label="Cold junction" tone="var(--color-cold)" value={cold} onChange={setCold} />
          <Control label="Hot junction" tone="var(--color-heat)" value={hot} onChange={setHot} />
        </div>
        <p className="label mt-6 max-w-[80ch] text-steel-dim normal-case tracking-[0.04em]">
          Type K thermocouple, Seebeck coefficient ≈ 41 µV/°C. Linear approximation — a real junction’s response curves
          gently with temperature.
        </p>
      </div>
    </section>
  );
}

function Readout({ label, value, unit, accent, className }: {
  label: string;
  value: string;
  unit: string;
  accent?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex flex-col gap-1 ${className ?? ""}`}>
      <span className="label text-steel">{label}</span>
      <span className={`display tabular-nums text-[clamp(2.4rem,7vw,7.5rem)] ${accent ? "text-paper" : "text-paper/80"}`}>
        {value}
        <span className="label ml-2 align-top text-steel">{unit}</span>
      </span>
    </div>
  );
}

function Control({
  label,
  tone,
  value,
  onChange,
  className,
}: {
  label: string;
  tone: string;
  value: number;
  onChange: (v: number) => void;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={className} style={{ "--tone": tone, "--fill": `${(value / T_MAX) * 100}%` } as CSSProperties}>
      <div className="label mb-3 flex justify-between text-steel">
        <label htmlFor={id}>{label}</label>
        <output htmlFor={id} className="tabular-nums text-paper">{value} °C</output>
      </div>
      <input
        id={id}
        type="range"
        min={0}
        max={T_MAX}
        step={1}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="junction-range w-full"
      />
      <div className="label mt-2 flex justify-between text-steel-dim">
        <span>0</span>
        <span>{T_MAX} °C</span>
      </div>
    </div>
  );
}

/** V against ΔT across the whole range, with the current reading marked. */
function Plot({ dT, className }: { dT: number; className?: string }) {
  const x = 50 + (dT / T_MAX) * 50;
  const y = 50 - (dT / T_MAX) * 44;
  return (
    <figure className={`flex flex-col gap-2 ${className ?? ""}`}>
      <svg viewBox="0 0 100 100" className="aspect-square w-[72px] border border-paper/10 md:w-full md:max-w-[140px]" aria-hidden="true">
        <path d="M0 50 H100 M50 0 V100" stroke="#ece8df" strokeOpacity="0.12" strokeWidth="0.6" />
        <path d="M0 94 L100 6" stroke="#8d939c" strokeOpacity="0.6" strokeWidth="0.8" />
        <circle cx={x} cy={y} r="2.6" fill="#ff6a2a" />
        <path d={`M${x} 50 V${y}`} stroke="#ff6a2a" strokeOpacity="0.6" strokeWidth="0.6" strokeDasharray="1.5 1.5" />
      </svg>
      <figcaption className="label text-steel-dim">V ∝ ΔT</figcaption>
    </figure>
  );
}
