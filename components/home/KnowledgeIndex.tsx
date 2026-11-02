import Link from "next/link";
import type { CSSProperties } from "react";
import { chapters } from "@/lib/content/home";
import { otherSubjects, subjects } from "@/lib/content/subjects";

/**
 * Scene 05 — the notebook as an index of chapters. Each row is a door:
 * pointing at it floods it with paper from the left, like a page turned
 * under a lamp.
 */
export default function KnowledgeIndex() {
  return (
    <section id="notebook" aria-labelledby="notebook-title" className="relative pb-[18vh] pt-[10vh]">
      <div className="gutter mb-14 grid grid-cols-1 items-end gap-8 md:mb-20 md:grid-cols-12 md:gap-6">
        <div className="label flex items-center gap-4 text-steel md:col-span-12">
          <span className="text-heat">05</span>
          <span>Knowledge</span>
          <span data-reveal="rule" className="hairline flex-1" />
        </div>
        <h2 id="notebook-title" data-reveal="mask" className="display text-[clamp(3rem,15vw,7rem)] md:col-span-8 md:text-[clamp(4.5rem,10.4vw,14rem)]">
          <span className="line"><span>The</span></span>
          <span className="line" style={{ "--i": 1 } as CSSProperties}><span className="outline-type">Notebook</span></span>
        </h2>
        <dl data-reveal="settle" className="label grid grid-cols-3 gap-4 text-steel md:col-span-4 md:pb-[1.2vw]">
          <div><dt>Chapters</dt><dd className="mt-1 font-sans text-2xl tracking-normal text-paper tabular-nums">{chapters.length}</dd></div>
          <div><dt>Subjects</dt><dd className="mt-1 font-sans text-2xl tracking-normal text-paper tabular-nums">{subjects.length}</dd></div>
          <div><dt>Access</dt><dd className="mt-1 font-sans text-2xl tracking-normal text-paper">Open</dd></div>
        </dl>
      </div>

      <ol className="border-b border-paper/10">
        {chapters.map((c, n) => (
          <li key={c.href + c.title} className="border-t border-paper/10">
            <Link
              href={c.href}
              className="group gutter relative isolate grid grid-cols-12 items-baseline gap-x-4 gap-y-1 py-4 outline-offset-[-2px] md:py-[1.3vw]"
            >
              <span
                aria-hidden="true"
                className="absolute inset-0 -z-10 origin-left scale-x-0 bg-paper transition-transform duration-700 ease-[var(--ease-field)] group-hover:scale-x-100 group-focus-visible:scale-x-100"
              />
              <span className="label col-span-2 text-steel transition-colors duration-500 group-hover:text-void group-focus-visible:text-void md:col-span-1">
                {String(n + 1).padStart(3, "0")}
              </span>
              <span className="display col-span-10 text-[clamp(1.6rem,6.4vw,3rem)] transition-[color,translate] duration-700 ease-[var(--ease-out-expo)] group-hover:translate-x-[1vw] group-hover:text-void group-focus-visible:text-void md:col-span-6 md:text-[clamp(1.8rem,3.4vw,4.4rem)]">
                {c.title}
              </span>
              <span className="col-span-10 col-start-3 font-mono text-[0.9rem] text-heat transition-colors duration-500 group-hover:text-void group-focus-visible:text-void md:col-span-3 md:col-start-auto md:text-[clamp(0.9rem,1.25vw,1.35rem)]">
                {c.expr}
              </span>
              <span className="label col-span-2 hidden justify-between text-steel transition-colors duration-500 group-hover:text-void group-focus-visible:text-void md:flex">
                {c.subject}
                <span aria-hidden="true" className="transition-transform duration-500 group-hover:translate-x-1">→</span>
              </span>
            </Link>
          </li>
        ))}
      </ol>

      <p className="gutter label mt-8 flex flex-wrap gap-x-5 gap-y-2 text-steel">
        <span>Also on the original site —</span>
        {otherSubjects.map(o => (
          <a key={o.href} href={o.href} target="_blank" rel="noopener noreferrer" className="text-paper/80 hover:text-paper">
            {o.title} ↗
          </a>
        ))}
      </p>
    </section>
  );
}
