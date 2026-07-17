"use client";

import { usePortfolioContent } from "@/lib/supabase/usePortfolioContent";
import { SectionHeader } from "./About";
import { useT } from "./providers/LanguageProvider";

export default function Contact() {
  const t = useT();
  const { profile } = usePortfolioContent();
  const phoneHref = (n: string) => `tel:${n.replace(/[^+\d]/g, "")}`;

  return (
    <section id="contact" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="glass relative overflow-hidden rounded-3xl p-8 sm:p-12">
          <div
            aria-hidden
            className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-indigo-500/30 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-32 -left-20 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl"
          />

          <div className="grid lg:grid-cols-[1.2fr_1fr] gap-10 items-center">
            <div>
              <SectionHeader
                eyebrow={t.contact.eyebrow}
                title={t.contact.title}
                description={t.contact.description}
              />

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a
                  href={`mailto:${profile.email}`}
                  className="inline-flex items-center gap-2 rounded-full bg-white text-slate-950 px-5 py-2.5 text-sm font-medium hover:bg-white/90 transition"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M4 6h16v12H4zM4 6l8 7 8-7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinejoin="round"
                    />
                  </svg>
                  {t.contact.emailMe}
                </a>
                {profile.phones.map((p) => (
                  <a
                    key={p}
                    href={phoneHref(p)}
                    className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/10 transition"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path
                        d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.37 1.9.72 2.8a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.35 1.84.59 2.8.72A2 2 0 0 1 22 16.92z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {p}
                  </a>
                ))}
              </div>
            </div>

            <div className="glass rounded-2xl p-6">
              <h3 className="text-sm uppercase tracking-[0.15em] text-white/50">
                {t.contact.quickFacts}
              </h3>
              <div className="mt-4 space-y-3 text-sm">
                <Row k={t.contact.facts.name} v={profile.name} />
                <Row k={t.contact.facts.age} v={`${profile.age}`} />
                <Row k={t.contact.facts.location} v={profile.location} />
                <Row k={t.contact.facts.role} v={profile.title} />
                <Row
                  k={t.contact.facts.status}
                  v={
                    <span className="inline-flex items-center gap-2 text-emerald-300">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      {t.contact.facts.statusOpen}
                    </span>
                  }
                />
                <Row k={t.contact.facts.email} v={profile.email} mono />
                <Row
                  k={t.contact.facts.workEmail}
                  v={
                    <a
                      href={`mailto:${profile.workEmail}`}
                      className="hover:text-white transition"
                    >
                      {profile.workEmail}
                    </a>
                  }
                  mono
                />
                <Row
                  k={t.contact.facts.phone}
                  v={
                    <div className="flex flex-col items-end gap-0.5">
                      {profile.phones.map((p) => (
                        <a
                          key={p}
                          href={phoneHref(p)}
                          className="hover:text-white transition"
                        >
                          {p}
                        </a>
                      ))}
                    </div>
                  }
                  mono
                />
                <Row k={t.contact.facts.address} v={profile.address} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Row({
  k,
  v,
  mono,
}: {
  k: string;
  v: React.ReactNode;
  mono?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/5 pb-3 last:border-b-0 last:pb-0">
      <span className="text-white/55 shrink-0">{k}</span>
      {/* min-w-0 + break-words: long emails must wrap on narrow screens
          instead of pushing the card into horizontal scroll. */}
      <span
        className={`text-white text-right min-w-0 break-words ${mono ? "font-mono text-xs sm:text-sm" : ""}`}
      >
        {v}
      </span>
    </div>
  );
}
