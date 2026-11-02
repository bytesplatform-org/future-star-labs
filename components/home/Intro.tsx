import type { CSSProperties } from "react";
import KineticStatement from "./KineticStatement";
import { site } from "@/lib/content/site";

const PARAGRAPHS = [
  { label: "Practice", text: site.about.practice },
  { label: "Method", text: site.about.method },
  { label: "Notebook", text: site.about.notebook },
];

const STAGES = [
  { name: "Matter", note: "structure, lattice, film" },
  { name: "Energy", note: "heat, field, potential" },
  { name: "Signal", note: "current, measurement" },
  { name: "Discovery", note: "understanding" },
];

/** Scene 02 — the field takes on energy as the positioning arrives. */
export default function Intro() {
  return (
    <section id="about" className="gutter relative py-[22vh]">
      <div className="label mb-10 flex items-center gap-4 text-steel md:mb-16">
        <span className="text-heat">02</span>
        <span>What happens here</span>
        <span data-reveal="rule" className="hairline flex-1" />
      </div>

      <KineticStatement
        text="Understanding the forces that shape technology."
        charged={["forces"]}
        className="display-wide max-w-[14ch] text-[9.8vw] md:text-[clamp(2.6rem,7vw,9rem)]"
      />

      <div className="mt-[14vh] grid grid-cols-1 gap-16 md:grid-cols-12 md:gap-6">
        {/* The arc the whole site follows, drawn as an instrument scale. */}
        <ol className="relative flex flex-col gap-7 md:col-span-4 md:col-start-1">
          <span aria-hidden="true" className="absolute bottom-2 left-[3px] top-2 w-px bg-gradient-to-b from-cold via-steel to-heat opacity-60" />
          {STAGES.map((s, n) => (
            <li
              key={s.name}
              data-reveal="settle"
              style={{ "--delay": `${n * 160}ms` } as CSSProperties}
              className="relative flex items-baseline gap-5 pl-6"
            >
              <span aria-hidden="true" className="absolute left-0 top-[0.55em] size-[7px] rounded-full border border-paper/60 bg-graphite-950" />
              <span className="display text-[clamp(1.6rem,2.4vw,2.6rem)]">{s.name}</span>
              <span className="label text-steel">{s.note}</span>
            </li>
          ))}
        </ol>

        <div className="flex flex-col gap-10 md:col-span-5 md:col-start-8">
          {PARAGRAPHS.map((p, n) => (
            <div key={p.label} data-reveal="settle" style={{ "--delay": `${n * 180}ms` } as CSSProperties}>
              <p className="label mb-3 text-steel">
                <span className="text-paper">0{n + 1}</span> — {p.label}
              </p>
              <p className="text-[clamp(1.05rem,1.35vw,1.4rem)] leading-[1.45] text-paper/85">{p.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
