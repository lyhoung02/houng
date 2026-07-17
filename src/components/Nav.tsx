"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useT } from "./providers/LanguageProvider";
import { useDashboardUnlocked } from "@/lib/dashboardGate";
import PreferencesMenu from "./PreferencesMenu";

export default function Nav() {
  const t = useT();
  const pathname = usePathname();
  const currentPath =
    pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const dashboardUnlocked = useDashboardUnlocked();

  const links = [
    ...(dashboardUnlocked
      ? [{ href: "/dashboard", label: t.nav.dashboard }]
      : []),
    { href: "/", label: t.nav.about },
    { href: "/experience", label: t.nav.experience },
    { href: "/projects", label: t.nav.projects },
    { href: "/internal", label: t.nav.internal },
    { href: "/personal", label: t.nav.personal },
    { href: "/skills", label: t.nav.skills },
    { href: "/archive", label: t.nav.archive },
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
        <Link
          href="/"
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
        </Link>

        <nav className="hidden lg:flex items-center gap-1 text-sm">
          {links.map((l) => {
            const active = currentPath === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={`nav-link ${active ? "nav-link-active" : ""}`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/nokor"
            aria-label={t.nokor.title}
            title={t.nokor.title}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/75 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <circle cx="9" cy="8" r="3.2" stroke="currentColor" strokeWidth="2" />
              <path
                d="M3.5 19c.6-3 2.9-4.5 5.5-4.5s4.9 1.5 5.5 4.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M15.5 5.4a3.2 3.2 0 1 1 1.6 6.1M17.5 14.6c1.9.5 3.3 1.9 3.7 4.4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </Link>
          <PreferencesMenu />
          <Link
            href="/contact"
            className="hidden md:inline-flex rounded-full bg-white text-slate-950 px-4 py-1.5 text-sm font-medium hover:bg-white/90 transition"
          >
            {t.nav.hire}
          </Link>
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
            {links.map((l) => {
              const active = currentPath === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  aria-current={active ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className={`nav-link nav-link-mobile ${
                    active ? "nav-link-active" : ""
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
            <Link
              href="/contact"
              onClick={() => setOpen(false)}
              className="mt-1 rounded-full bg-white text-slate-950 px-4 py-2 text-sm font-medium text-center"
            >
              {t.nav.hire}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
