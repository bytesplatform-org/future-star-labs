import ScrollScene from "./ScrollScene";

const METHOD = [
  { word: "Observe.", note: "Measure before assuming." },
  { word: "Question.", note: "Ask what the measurement cannot yet explain." },
  { word: "Experiment.", note: "Change one variable. Hold the rest." },
  { word: "Understand.", note: "Reduce it to first principles." },
];

/**
 * Scene 07 — the method, one word at a time. The stack rises through the
 * frame with scroll; the word in the reading line is solid, words already
 * read stay lit in steel, words to come are only outlines.
 */
export default function Philosophy() {
  return (
    <ScrollScene id="method" steps={METHOD.length} className="[--scene-length:380vh]">
      <div className="scene-sticky flex min-h-svh flex-col justify-center overflow-hidden py-24">
        {/* Pinned above the rising stack, on its own ground. */}
        <div className="gutter label absolute inset-x-0 top-0 z-10 flex items-center gap-4 bg-gradient-to-b from-graphite-950 from-60% to-transparent pb-10 pt-24 text-steel">
          <span className="text-heat">07</span>
          <span>Method</span>
        </div>
        <h2 className="sr-only">Observe, question, experiment, understand.</h2>
        <ol
          aria-hidden="true"
          className={`gutter flex flex-col gap-[1.5vw] method-stack`}
        >
          {METHOD.map((m, n) => (
            <li
              key={m.word}
              data-at={n + 1}
              data-reached=""
              className="flex flex-col items-start gap-3 md:flex-row md:items-end md:justify-between md:gap-8"
            >
              <span className={`display text-[12vw] md:text-[clamp(4rem,10.6vw,15rem)] method-word`}>
                {m.word}
              </span>
              <span className={`label max-w-[24ch] pb-[1vw] text-steel md:text-right method-note`}>
                <span className="mr-3 text-heat">{String(n + 1).padStart(2, "0")}</span>
                {m.note}
              </span>
            </li>
          ))}
        </ol>
        {/* Readable copy of the notes for assistive tech. */}
        <ul className="sr-only">
          {METHOD.map(m => <li key={m.word}>{m.word} {m.note}</li>)}
        </ul>
      </div>
    </ScrollScene>
  );
}
