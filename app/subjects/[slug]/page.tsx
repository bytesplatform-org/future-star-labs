import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import SiteFooter from "@/components/site/SiteFooter";
import Expr from "@/components/site/Expr";
import { fields } from "@/lib/content/home";
import { getSubject, subjects } from "@/lib/content/subjects";

const longestWord = (title: string) => Math.max(...title.split(" ").map(w => w.length));

export function generateStaticParams() {
  return subjects.map(s => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: PageProps<"/subjects/[slug]">): Promise<Metadata> {
  const subject = getSubject((await params).slug);
  if (!subject) return {};
  return {
    title: subject.title,
    description: subject.lede,
    alternates: { canonical: `/subjects/${subject.slug}` },
    openGraph: { title: `${subject.title} — Future Star Labs`, description: subject.lede },
  };
}

/** A chapter of the notebook: one subject, set like a scientific paper. */
export default async function SubjectPage({ params }: PageProps<"/subjects/[slug]">) {
  const subject = getSubject((await params).slug);
  if (!subject) notFound();

  const index = subjects.indexOf(subject);
  const next = subjects[(index + 1) % subjects.length];
  const field = fields.find(f => f.key === subject.field);

  return (
    <>
      <header id="top" className="gutter relative flex min-h-[86svh] flex-col justify-end pb-[8vh] pt-32">
        <div className="label mb-8 flex items-center gap-4 text-steel">
          <Link href="/#notebook" className="text-paper hover:text-heat">← Notebook</Link>
          <span aria-hidden="true">/</span>
          <span>
            Subject <span className="text-heat">{String(index + 1).padStart(2, "0")}</span>
            {field ? ` — ${field.title}` : null}
          </span>
        </div>
        <h1
          data-reveal="mask"
          className="display"
          // Sized to its longest word: Aldrich capitals run ≈0.66em, so it fills ~86% of the width at most.
          style={{ fontSize: `min(${(86 / (longestWord(subject.title) * 0.66)).toFixed(2)}vw, 13rem)` }}
        >
          {subject.title.split(" ").map((w, n) => (
            <span key={n} className="line" style={{ "--i": n } as CSSProperties}>
              <span className={n % 2 ? "outline-type" : undefined}>{w}</span>
            </span>
          ))}
        </h1>
        <p data-reveal="settle" style={{ "--delay": "500ms" } as CSSProperties} className="mt-10 max-w-[46ch] text-[clamp(1.1rem,1.6vw,1.6rem)] leading-snug text-paper/85">
          {subject.lede}
        </p>
      </header>

      <div className="gutter grid grid-cols-1 gap-12 pb-[16vh] md:grid-cols-12 md:gap-6">
        <nav aria-label="Chapters" className="md:col-span-3">
          <ol className="label flex flex-col gap-3 text-steel md:sticky md:top-28">
            {subject.chapters.map((c, n) => (
              <li key={c.id}>
                <a href={`#${c.id}`} className="flex gap-3 hover:text-paper">
                  <span className="text-heat">§{n + 1}</span>
                  {c.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="flex flex-col md:col-span-8 md:col-start-5">
          {subject.chapters.map((c, n) => (
            <section key={c.id} id={c.id} aria-labelledby={`${c.id}-title`} className="scroll-mt-28 border-t border-paper/10 py-[7vh] first:border-t-0 first:pt-0">
              <p className="label mb-4 text-heat">§{n + 1}</p>
              <h2 id={`${c.id}-title`} className="display mb-8 text-[clamp(2.2rem,5vw,5.5rem)]">{c.title}</h2>
              <div className="flex max-w-[62ch] flex-col gap-5 text-[clamp(1.02rem,1.2vw,1.2rem)] leading-[1.55] text-paper/85">
                {c.body.map((p, i) => <p key={i}>{p}</p>)}
              </div>
              {c.equations && (
                <dl className="mt-10 flex flex-col gap-6">
                  {c.equations.map(e => (
                    <div key={e.expr} data-reveal="sweep" className="flex flex-col gap-2 border-l border-heat/60 pl-5">
                      <dt className="font-mono text-[clamp(1.5rem,3vw,3rem)] leading-tight text-paper"><Expr>{e.expr}</Expr></dt>
                      <dd className="label text-steel">{e.label}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {c.points && (
                <ul className="mt-10 border-b border-paper/10">
                  {c.points.map(p => (
                    <li key={p} className="border-t border-paper/10 py-3 text-paper/85">{p}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          <div className="mt-[8vh] flex flex-col gap-10">
            <a href={subject.source} target="_blank" rel="noopener noreferrer" className="label text-steel hover:text-paper">
              Original notes on futurestarlabs.com ↗
            </a>
            <Link href={`/subjects/${next.slug}`} className="group flex flex-col gap-3 border-t border-paper/10 pt-8">
              <span className="label text-steel">Next subject</span>
              <span className="display text-[clamp(2.4rem,6vw,7rem)] transition-colors duration-500 group-hover:text-heat">
                {next.title} →
              </span>
            </Link>
          </div>
        </div>
      </div>

      <SiteFooter />
    </>
  );
}
