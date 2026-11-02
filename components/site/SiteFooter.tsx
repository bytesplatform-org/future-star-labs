import Link from "next/link";
import { site } from "@/lib/content/site";
import { subjects } from "@/lib/content/subjects";

const EXPLORE = [
  { id: "fields", label: "Fields of exploration" },
  { id: "thermoelectrics", label: "Thermoelectrics" },
  { id: "notebook", label: "The notebook" },
  { id: "experiment", label: "Experiment" },
];

function Column({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-4">
      <h3 className="label text-steel">{title}</h3>
      <ul className="flex flex-col gap-2 text-[0.95rem] text-paper/85">{children}</ul>
    </div>
  );
}

/** The calm end of every page: where to go next, and the name, once more, at full width. */
export default function SiteFooter({ home = false }: { home?: boolean }) {
  return (
    <footer className="gutter relative pb-6 pt-[12vh]">
      <div className="grid grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-12">
        <div className="md:col-span-3">
          <Column title="Explore">
            {EXPLORE.map(l => (
              <li key={l.id}>
                {/* On the home page, same-page anchors stay plain so Lenis can route them. */}
                {home ? (
                  <a href={`#${l.id}`} className="hover:text-heat">{l.label}</a>
                ) : (
                  <Link href={`/#${l.id}`} className="hover:text-heat">{l.label}</Link>
                )}
              </li>
            ))}
          </Column>
        </div>
        <div className="md:col-span-3">
          <Column title="Subjects">
            {subjects.map(s => (
              <li key={s.slug}><Link href={`/subjects/${s.slug}`} className="hover:text-heat">{s.title}</Link></li>
            ))}
          </Column>
        </div>
        <div className="md:col-span-3">
          <Column title="Projects">
            {site.projects.map(p => (
              <li key={p.title} className="flex flex-col gap-1">
                <a href={p.href} target="_blank" rel="noopener noreferrer" className="hover:text-heat">{p.title} ↗</a>
                <span className="max-w-[30ch] text-[0.8rem] leading-snug text-steel">{p.summary}</span>
              </li>
            ))}
          </Column>
        </div>
        <div className="md:col-span-3">
          <Column title="Elsewhere">
            {site.social.map(s => (
              <li key={s.label}><a href={s.href} target="_blank" rel="noopener noreferrer" className="hover:text-heat">{s.label} ↗</a></li>
            ))}
            <li><a href={site.livestreams} target="_blank" rel="noopener noreferrer" className="hover:text-heat">Livestreams ↗</a></li>
          </Column>
        </div>
      </div>

      <p
        aria-hidden="true"
        data-reveal="sweep"
        className="display mt-[14vh] whitespace-nowrap text-center text-[8.6vw] leading-[0.86] text-paper"
      >
        Future <span className="outline-type">Star</span> Labs
      </p>

      <div className="hairline mt-6" />
      <div className="label flex flex-col gap-3 pt-4 text-steel md:flex-row md:justify-between">
        <span>© Future Star Labs</span>
        <span className="hidden md:inline">Matter → Energy → Signal → Discovery</span>
        <a href="#top" className="text-paper">Back to the surface ↑</a>
      </div>
    </footer>
  );
}
