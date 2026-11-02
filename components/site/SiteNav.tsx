"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { lockScroll } from "@/lib/animation/scroll";
import { nav, site } from "@/lib/content/site";
import { otherSubjects, subjects } from "@/lib/content/subjects";

/** A thermocouple: two dissimilar conductors meeting at one junction. */
function Mark() {
  return (
    <svg viewBox="0 0 20 20" className="size-[18px]" aria-hidden="true">
      <path d="M3 2 L10 15" stroke="currentColor" strokeWidth="1.4" fill="none" />
      <path d="M17 2 L10 15" stroke="var(--color-heat)" strokeWidth="1.4" fill="none" />
      <circle cx="10" cy="15.5" r="2.4" fill="currentColor" />
    </svg>
  );
}

const external = (href: string) => href.startsWith("http");

/**
 * A link that knows where it goes: same-page anchors stay plain so Lenis
 * can route them, routes go through Link, the original site is marked ↗.
 */
function NavHref({ href, home, className, children, onClick, current }: {
  href: string;
  home: boolean;
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  current?: boolean;
}) {
  if (external(href)) {
    return (
      <a href={href} className={className} onClick={onClick}>
        {children}
        <span aria-hidden="true" className="ml-1 text-[0.7em] text-steel">↗</span>
      </a>
    );
  }
  if (home && href.startsWith("/#")) {
    return <a href={href.slice(1)} className={className} onClick={onClick}>{children}</a>;
  }
  return (
    <Link href={href} className={className} onClick={onClick} aria-current={current ? "page" : undefined}>
      {children}
    </Link>
  );
}

export default function SiteNav() {
  const pathname = usePathname();
  const home = pathname === "/";
  const [menuOpen, setMenuOpen] = useState(false);
  const [subjectsOpen, setSubjectsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [tucked, setTucked] = useState(false);

  const toggleRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const subjectsRef = useRef<HTMLLIElement>(null);
  const releaseRef = useRef<(() => void) | null>(null);
  const closeTimer = useRef<number | undefined>(undefined);

  // Solid once the page moves; tucked away while reading down, back on the way up.
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      if (Math.abs(y - last) > 6) {
        setTucked(y > last && y > 480);
        last = y;
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Mobile menu: lock the page, focus the first link, Escape closes.
  useEffect(() => {
    if (!menuOpen) return;
    const toggle = toggleRef.current;
    releaseRef.current = lockScroll({ allowWithin: menuRef.current ?? undefined });
    menuRef.current?.querySelector<HTMLElement>("a")?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setMenuOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      releaseRef.current?.();
      releaseRef.current = null;
      toggle?.focus();
    };
  }, [menuOpen]);

  // Subjects panel: Escape or a click elsewhere closes it.
  useEffect(() => {
    if (!subjectsOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setSubjectsOpen(false);
      subjectsRef.current?.querySelector<HTMLElement>("button")?.focus();
    };
    const onDown = (e: PointerEvent) => {
      if (!subjectsRef.current?.contains(e.target as Node)) setSubjectsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [subjectsOpen]);

  const openSubjects = () => {
    window.clearTimeout(closeTimer.current);
    setSubjectsOpen(true);
  };
  const closeSubjectsSoon = () => {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setSubjectsOpen(false), 160);
  };

  // Release the lock before the anchor scroll runs in the same click —
  // Lenis ignores scrollTo while stopped.
  const closeMenuForLink = () => {
    releaseRef.current?.();
    releaseRef.current = null;
    setMenuOpen(false);
  };

  const solid = scrolled || subjectsOpen;
  const hidden = tucked && !subjectsOpen && !menuOpen;

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[transform,background-color,border-color] duration-500 ease-[var(--ease-field)] ${
          hidden ? "-translate-y-full" : "translate-y-0"
        } ${solid ? "border-b border-paper/10 bg-graphite-950/85 backdrop-blur-md" : "border-b border-transparent"}`}
      >
        <div className="gutter flex h-[72px] items-center justify-between gap-8">
          <Link href="/" className="flex shrink-0 items-center gap-3 text-paper" aria-label="Future Star Labs — home">
            <Mark />
            <span className="text-[1.05rem] uppercase tracking-[0.06em]">Future Star Labs</span>
          </Link>

          <nav aria-label="Primary" className="hidden xl:block">
            <ul className="flex items-center gap-1">
              {nav.map(item =>
                item.href === null ? (
                  <li
                    key={item.label}
                    ref={subjectsRef}
                    onMouseEnter={openSubjects}
                    onMouseLeave={closeSubjectsSoon}
                    onBlur={e => {
                      if (!e.currentTarget.contains(e.relatedTarget as Node)) setSubjectsOpen(false);
                    }}
                  >
                    <button
                      type="button"
                      aria-expanded={subjectsOpen}
                      aria-controls="subjects-panel"
                      onClick={() => setSubjectsOpen(o => !o)}
                      className={`flex items-center gap-1.5 px-3 py-2 text-[0.92rem] transition-colors hover:text-paper ${
                        subjectsOpen || pathname.startsWith("/subjects") ? "text-paper" : "text-paper/70"
                      }`}
                    >
                      Subjects
                      <svg viewBox="0 0 10 6" aria-hidden="true" className={`w-2.5 transition-transform duration-300 ${subjectsOpen ? "rotate-180" : ""}`}>
                        <path d="M1 1 L5 5 L9 1" stroke="currentColor" fill="none" strokeWidth="1.3" />
                      </svg>
                    </button>

                    {/* The subjects panel spans the bar: notebook chapters here, the rest on the original site. */}
                    <div
                      id="subjects-panel"
                      hidden={!subjectsOpen}
                      className="absolute inset-x-0 top-full border-b border-paper/10 bg-graphite-950"
                    >
                      <div className="gutter grid grid-cols-12 gap-6 py-10">
                        <div className="col-span-3 flex flex-col gap-3">
                          <p className="label text-heat">Subjects</p>
                          <p className="max-w-[26ch] text-[0.95rem] leading-snug text-paper/70">
                            Fourteen subjects. The ones with study notes open here as chapters.
                          </p>
                        </div>
                        <ul className="col-span-6 grid grid-cols-2 gap-x-8">
                          {subjects.map((s, n) => (
                            <li key={s.slug} className="border-t border-paper/10">
                              <Link
                                href={`/subjects/${s.slug}`}
                                onClick={() => setSubjectsOpen(false)}
                                className="group flex items-baseline gap-4 py-3 text-paper/85 transition-colors hover:text-paper"
                              >
                                <span className="label text-steel-dim transition-colors group-hover:text-heat">
                                  {String(n + 1).padStart(2, "0")}
                                </span>
                                <span className="transition-transform duration-500 ease-[var(--ease-out-expo)] group-hover:translate-x-1">
                                  {s.title}
                                </span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                        <div className="col-span-3 flex flex-col gap-3">
                          <p className="label text-steel">On futurestarlabs.com</p>
                          <ul className="flex flex-col">
                            {otherSubjects.map(o => (
                              <li key={o.href}>
                                <a href={o.href} className="block py-1.5 text-[0.92rem] text-paper/65 transition-colors hover:text-paper">
                                  {o.title} <span aria-hidden="true" className="text-[0.7em] text-steel">↗</span>
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </li>
                ) : (
                  <li key={item.label}>
                    <NavHref
                      href={item.href}
                      home={home}
                      current={item.href === pathname}
                      className={`block px-3 py-2 text-[0.92rem] transition-colors hover:text-paper ${
                        item.href === pathname ? "text-paper" : "text-paper/70"
                      }`}
                    >
                      {item.label}
                    </NavHref>
                  </li>
                ),
              )}
            </ul>
          </nav>

          <div className="flex items-center gap-4">
            <a
              href={site.livestreams}
              className="hidden items-center gap-2.5 border border-paper/20 px-4 py-2 text-[0.85rem] text-paper transition-colors hover:border-heat hover:text-heat 2xl:flex"
            >
              <span aria-hidden="true" className="size-1.5 animate-pulse rounded-full bg-heat" />
              Livestreams
            </a>
            <button
              ref={toggleRef}
              type="button"
              className="flex items-center gap-3 text-[0.9rem] text-paper xl:hidden"
              aria-expanded={menuOpen}
              aria-controls="site-menu"
              onClick={() => setMenuOpen(o => !o)}
            >
              {menuOpen ? "Close" : "Menu"}
              <span aria-hidden="true" className="relative block h-2.5 w-6">
                <span className={`absolute inset-x-0 top-0 h-px bg-current transition-transform duration-500 ${menuOpen ? "translate-y-[5px] rotate-45" : ""}`} />
                <span className={`absolute inset-x-0 bottom-0 h-px bg-current transition-transform duration-500 ${menuOpen ? "-translate-y-[4px] -rotate-45" : ""}`} />
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Below xl: the menu is its own full screen. */}
      <div
        ref={menuRef}
        id="site-menu"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        hidden={!menuOpen}
        className="gutter fixed inset-0 z-40 overflow-y-auto bg-graphite-950 pb-10 pt-24 xl:hidden"
        data-lenis-prevent
      >
        <ul className="flex flex-col">
          {nav.map(item =>
            item.href === null ? (
              <li key={item.label} className="border-t border-paper/10">
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-center justify-between py-3 text-[clamp(1.9rem,8vw,3.5rem)] uppercase tracking-[-0.02em] [&::-webkit-details-marker]:hidden">
                    Subjects
                    <span aria-hidden="true" className="text-[0.5em] text-heat transition-transform duration-300 group-open:rotate-45">+</span>
                  </summary>
                  <ul className="grid grid-cols-1 gap-x-6 pb-5 sm:grid-cols-2">
                    {subjects.map(s => (
                      <li key={s.slug}>
                        <Link href={`/subjects/${s.slug}`} onClick={closeMenuForLink} className="block py-1.5 text-paper/80">
                          {s.title}
                        </Link>
                      </li>
                    ))}
                    {otherSubjects.map(o => (
                      <li key={o.href}>
                        <a href={o.href} className="block py-1.5 text-paper/55">
                          {o.title} <span aria-hidden="true" className="text-[0.7em]">↗</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </details>
              </li>
            ) : (
              <li key={item.label} className="border-t border-paper/10">
                <NavHref
                  href={item.href}
                  home={home}
                  onClick={closeMenuForLink}
                  className="block py-3 text-[clamp(1.9rem,8vw,3.5rem)] uppercase tracking-[-0.02em]"
                >
                  {item.label}
                </NavHref>
              </li>
            ),
          )}
        </ul>
        <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 border-t border-paper/10 pt-6">
          <a href={site.livestreams} className="label flex items-center gap-2 text-heat">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-heat" /> Livestreams
          </a>
          {site.social.map(s => (
            <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer" className="label text-paper">
              {s.label} ↗
            </a>
          ))}
        </div>
      </div>
    </>
  );
}
