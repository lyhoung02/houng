"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useT } from "./providers/LanguageProvider";
import PreferencesMenu from "./PreferencesMenu";

export default function Nav() {
  const t = useT();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  const links = [
    { href: "/#about", label: t.nav.about },
    { href: "/#experience", label: t.nav.experience },
    { href: "/#projects", label: t.nav.projects },
    { href: "/#internal", label: t.nav.internal },
    { href: "/#personal", label: t.nav.personal },
    { href: "/#skills", label: t.nav.skills },
    { href: "/#archive", label: t.nav.archive },
    { href: "/resume", label: t.nav.resume },
    { href: "/#contact", label: t.nav.contact },
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-all ${
        scrolled
          ? "glass border-b border-white/5"
          : "bg-transparent border-b border-transparent"
      }`}
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8 h-16 flex items-center justify-between gap-4">
        <a
          href="/#top"
          className="flex items-center gap-2 font-semibold tracking-tight group"
        >
          <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-full overflow-hidden ring-1 ring-white/15 shadow-lg shadow-indigo-500/30 transition group-hover:ring-white/30 group-hover:scale-[1.04]">
            <Image
              src="/icon.png"
              alt="Pov Lyhoung"
              fill
              sizes="36px"
              className="object-cover"
            />
          </span>
          <span className="text-white/90 hidden sm:inline">
            Pov<span className="text-white/40"> · </span>Lyhoung
          </span>
        </a>

        <nav className="hidden lg:flex items-center gap-1 text-sm">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="nav-link"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <PreferencesMenu />
          <a
            href="#contact"
            className="hidden md:inline-flex rounded-full bg-white text-slate-950 px-4 py-1.5 text-sm font-medium hover:bg-white/90 transition"
          >
            {t.nav.hire}
          </a>
          <button
            type="button"
            aria-label={t.nav.menu}
            onClick={() => setOpen((v) => !v)}
            className="lg:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 text-white/80"
          >
            <span className="sr-only">{t.nav.menu}</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d={open ? "M6 6l12 12M6 18L18 6" : "M4 7h16M4 12h16M4 17h16"}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-white/5 glass">
          <div className="mx-auto max-w-6xl px-5 py-3 flex flex-col gap-2 text-sm">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="nav-link nav-link-mobile"
              >
                {l.label}
              </a>
            ))}
            <a
              href="#contact"
              onClick={() => setOpen(false)}
              className="mt-1 rounded-full bg-white text-slate-950 px-4 py-2 text-sm font-medium text-center"
            >
              {t.nav.hire}
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
