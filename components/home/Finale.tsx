import type { CSSProperties } from "react";

/** Scene 08 — energy withdrawn; the field returns to rest. */
export default function Finale() {
  return (
    <section aria-labelledby="finale-title" className="gutter relative pb-[6vh] pt-[24vh]">
      <div className="label mb-10 flex items-center gap-4 text-steel">
        <span className="text-heat">08</span>
        <span>Return to rest</span>
        <span data-reveal="rule" className="hairline flex-1" />
      </div>
      <h2 id="finale-title" data-reveal="mask" className="display-wide max-w-[18ch] text-[clamp(2.2rem,5.4vw,6.5rem)]">
        <span className="line"><span>The field settles.</span></span>
        <span className="line" style={{ "--i": 1 } as CSSProperties}><span className="text-steel">The notebook stays open.</span></span>
      </h2>
    </section>
  );
}
