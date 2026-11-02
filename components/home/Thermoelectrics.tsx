import Link from "next/link";
import type { CSSProperties } from "react";
import ScrollScene from "./ScrollScene";
import CoupleHeat from "./CoupleHeat";
import Expr from "@/components/site/Expr";

const STEPS = [
  {
    title: "Hot side",
    text: "Heat is applied to one face of the couple: a p-type and an n-type semiconductor leg, joined at the top by a metal contact.",
  },
  {
    title: "Temperature difference",
    text: "The opposite face is held cold. The temperature difference across each leg, ΔT, drives everything that follows.",
  },
  {
    title: "Charge movement",
    text: "Carriers diffuse from hot to cold — holes down the p-type leg, electrons down the n-type. Opposite charges moving the same way: their voltages add.",
  },
  {
    title: "Electrical output",
    text: "Close the circuit through a load and current flows. Drive current the other way instead, and the same couple pumps heat — the Peltier effect.",
  },
];

/** carriers: x within the leg, delay and duration, so the stream never syncs */
const HOLES = [[132, 0, 3.4], [158, 1.1, 3.0], [181, 2.2, 3.6], [145, 1.7, 3.2], [170, 0.5, 3.8], [138, 2.8, 3.1]];
const ELECTRONS = [[300, 0.4, 3.1], [326, 1.5, 3.5], [349, 2.5, 3.0], [313, 2.0, 3.7], [338, 0.9, 3.3], [305, 2.9, 3.4]];

function Couple() {
  return (
    <svg viewBox="0 -40 480 600" className="relative block h-full w-auto md:h-auto md:w-full" role="img" aria-labelledby="couple-title">
      <title id="couple-title">
        A thermoelectric couple: heat enters the hot plate, flows down p-type and n-type legs to the cold plates, and drives a current through a load.
      </title>
      <defs>
        <linearGradient id="te-hot" x1="0" x2="1">
          <stop offset="0" stopColor="#ff6a2a" stopOpacity="0.55" />
          <stop offset="0.5" stopColor="#ff8a4a" />
          <stop offset="1" stopColor="#ff6a2a" stopOpacity="0.55" />
        </linearGradient>
        <linearGradient id="te-leg" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#ff6a2a" stopOpacity="0.55" />
          <stop offset="0.5" stopColor="#8d939c" stopOpacity="0.18" />
          <stop offset="1" stopColor="#4c7dff" stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id="te-cold" x1="0" x2="1">
          <stop offset="0" stopColor="#4c7dff" stopOpacity="0.6" />
          <stop offset="1" stopColor="#4c7dff" />
        </linearGradient>
      </defs>

      {/* 01 — heat in, hot plate */}
      <g className="te-part" data-at="1" data-reached="">
        {[236, 276, 316, 356].map(x => (
          <g key={x}>
            <path className="te-heat-in" d={`M${x} -34 c -7 9, 7 18, 0 27 s 7 18, 0 27`} stroke="#ff6a2a" strokeWidth="1.3" fill="none" />
            <path d={`M${x - 4} 18 L${x} 26 L${x + 4} 18`} stroke="#ff6a2a" strokeWidth="1.3" fill="none" />
          </g>
        ))}
        <rect x="80" y="40" width="320" height="30" fill="url(#te-hot)" />
        <text x="80" y="26" className="fill-heat font-mono text-[11px] tracking-[0.14em]">
          HOT SIDE · T<tspan baselineShift="sub" fontSize="8">h</tspan>
        </text>
      </g>

      {/* 02 — the gradient through the legs, and ΔT */}
      <g className="te-part" data-at="2" data-reached="">
        <rect className="te-leg-fill" x="120" y="70" width="80" height="300" fill="url(#te-leg)" />
        <rect className="te-leg-fill" x="290" y="70" width="80" height="300" fill="url(#te-leg)" />
        <path d="M428 74 V 366 M422 80 L428 72 L434 80 M422 360 L428 368 L434 360" stroke="#ece8df" strokeWidth="1" fill="none" />
        <text x="440" y="225" className="fill-paper font-mono text-[13px]">ΔT</text>
      </g>

      {/* the legs themselves, always drawn */}
      <rect x="120" y="70" width="80" height="300" fill="none" stroke="#ece8df" strokeOpacity="0.35" />
      <rect x="290" y="70" width="80" height="300" fill="none" stroke="#ece8df" strokeOpacity="0.35" />
      <text x="160" y="226" textAnchor="middle" className="fill-paper/70 font-mono text-[22px]">p</text>
      <text x="330" y="226" textAnchor="middle" className="fill-paper/70 font-mono text-[22px]">n</text>

      {/* 03 — carriers: holes (rings) and electrons (dots), hot → cold */}
      <g className="te-part" data-at="3" data-reached="">
        {HOLES.map(([x, delay, d], n) => (
          <circle key={`h${n}`} className="te-carrier" cx={x} cy="84" r="4.5" fill="none" stroke="#ff8a4a" strokeWidth="1.4"
            style={{ "--delay": `${delay}s`, "--d": `${d}s` } as CSSProperties} />
        ))}
        {ELECTRONS.map(([x, delay, d], n) => (
          <circle key={`e${n}`} className="te-carrier" cx={x} cy="84" r="3.2" fill="#7fa2ff"
            style={{ "--delay": `${delay}s`, "--d": `${d}s` } as CSSProperties} />
        ))}
      </g>

      {/* cold plates, always drawn */}
      <rect x="96" y="370" width="128" height="26" fill="url(#te-cold)" opacity="0.85" />
      <rect x="266" y="370" width="128" height="26" fill="url(#te-cold)" opacity="0.85" />
      <text x="96" y="420" className="fill-cold font-mono text-[11px] tracking-[0.14em]">COLD SIDE · T<tspan baselineShift="sub" fontSize="8">c</tspan></text>

      {/* 04 — the external circuit and its load */}
      <g className="te-part" data-at="4" data-reached="">
        <path d="M160 396 V 488 H 212 M268 488 H 330 V 396" stroke="#ece8df" strokeOpacity="0.5" strokeWidth="1.2" fill="none" />
        <path className="te-current" d="M160 396 V 488 H 212 M268 488 H 330 V 396" stroke="#ff8a4a" strokeWidth="2" fill="none" />
        <path className="te-load" d="M212 488 l6 -10 l8 20 l8 -20 l8 20 l8 -20 l8 20 l10 -10" stroke="#ff6a2a" strokeWidth="1.6" fill="none" />
        <text x="240" y="526" textAnchor="middle" className="fill-paper font-mono text-[13px]">V = α · ΔT</text>
        <text x="240" y="466" textAnchor="middle" className="fill-steel font-mono text-[10px] tracking-[0.14em]">LOAD</text>
      </g>
    </svg>
  );
}

/** Scene 04 — the feature: how a temperature difference becomes a current. */
export default function Thermoelectrics() {
  return (
    <>
      <ScrollScene id="thermoelectrics" steps={STEPS.length} className="[--scene-length:420vh]">
        <div className="scene-sticky gutter grid min-h-svh grid-cols-1 content-center gap-5 pb-6 pt-20 md:grid-cols-12 md:gap-6 md:py-0">
          <div className="flex flex-col justify-center gap-5 md:col-span-6 md:gap-8">
            <div className="label flex items-center gap-4 text-steel">
              <span className="text-heat">04</span>
              <span>Feature — Thermoelectrics</span>
            </div>
            <h2 className="display text-[11vw] md:text-[clamp(3rem,5.6vw,8rem)]">
              Heat
              <br />
              <span className="text-heat">becomes</span>
              <br />
              electricity.
            </h2>

            <ol className="flex flex-col gap-3 border-l border-paper/15 pl-5">
              {STEPS.map((step, n) => (
                <li key={step.title} className="te-step" data-at={n + 1} data-reached="">
                  <p className="label flex gap-4">
                    <span className="text-heat">{String(n + 1).padStart(2, "0")}</span>
                    <span>{step.title}</span>
                  </p>
                  <div className="te-step-body">
                    <p className="max-w-[44ch] pt-2 text-[0.95rem] leading-snug text-paper/80">{step.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="relative flex items-center justify-center md:col-span-6">
            {/* Quiet ground under the diagram, so the turbulent field doesn't read through it. */}
            <span aria-hidden="true" className="absolute inset-[-10%] bg-[radial-gradient(closest-side,rgb(12_13_16/0.85),rgb(12_13_16/0.5)_60%,transparent)]" />
            {/* The couple: GL heat beneath, the SVG's drawing on top, sharing one box. */}
            <div className="relative h-[38svh] w-fit md:h-auto md:w-full md:max-w-[520px]">
              <CoupleHeat />
              <Couple />
            </div>
            {/* Scene progress, as a reading on a scale. */}
            <span aria-hidden="true" className="absolute -right-1 top-1/2 hidden h-[50vh] w-px -translate-y-1/2 bg-paper/10 md:block">
              <span className="absolute inset-x-0 top-0 block h-full origin-top bg-heat" style={{ transform: "scaleY(var(--p, 1))" }} />
            </span>
          </div>
        </div>
      </ScrollScene>

      {/* What the original notes say about it. */}
      <div className="gutter grid grid-cols-1 gap-10 pb-[8vh] pt-[6vh] md:grid-cols-12 md:gap-6">
        <div data-reveal="rule" className="hairline md:col-span-12" />
        <dl className="contents">
          <div data-reveal="settle" className="md:col-span-4">
            <dt className="label mb-3 text-steel">Thermal engineering</dt>
            <dd className="text-[1.05rem] leading-snug text-paper/85">
              The study of how heat moves, and how it transfers into other forms of energy.
            </dd>
          </div>
          <div data-reveal="settle" style={{ "--delay": "150ms" } as CSSProperties} className="md:col-span-4">
            <dt className="label mb-3 text-steel">Two methods</dt>
            <dd className="text-[1.05rem] leading-snug text-paper/85">
              Power generation from a temperature difference, and cooling from a current — small, solid-state, no moving parts.
            </dd>
          </div>
          <div data-reveal="settle" style={{ "--delay": "300ms" } as CSSProperties} className="md:col-span-4">
            <dt className="label mb-3 text-steel">Thermocouples</dt>
            <dd className="flex flex-col gap-4">
              <Expr className="font-mono text-[clamp(1.4rem,2.2vw,2.2rem)] text-heat">V = α (T_h − T_c)</Expr>
              <Link href="/subjects/thermoelectrics" className="label text-paper underline-offset-4 hover:underline">
                Read the chapter →
              </Link>
            </dd>
          </div>
        </dl>
      </div>
    </>
  );
}
