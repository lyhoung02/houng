"use client";

import Image from "next/image";
import { profile } from "@/lib/portfolio-data";
import { useT } from "./providers/LanguageProvider";

export default function Hero() {
  const t = useT();
  const stats = [
    { label: t.hero.stats.projects, value: "4+" },
    { label: t.hero.stats.years, value: "3+" },
    { label: t.hero.stats.roles, value: t.hero.stats.rolesValue },
    { label: t.hero.stats.openTo, value: t.hero.stats.openToValue },
  ];

  return (
    <section
      id="top"
      className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-28"
    >
      <div className="absolute inset-0 -z-10 bg-grid opacity-50" />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[480px] w-[680px] rounded-full bg-indigo-500/15 blur-3xl -z-10"
      />

      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid lg:grid-cols-[1.25fr_1fr] gap-12 lg:gap-16 items-center">
          <div>
            <div className="reveal inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/70 mb-6">
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 text-emerald-400 pulse-dot" />
              <span>{t.hero.availability}</span>
            </div>

            <h1 className="reveal reveal-delay-1 text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.05]">
              <span className="block text-white/70 text-xl sm:text-2xl font-medium mb-1">
                {t.hero.greeting}
              </span>
              <span className="gradient-text">{profile.name}</span>
              <span className="block mt-3 text-white/85 text-2xl sm:text-3xl lg:text-4xl font-medium leading-tight">
                {t.hero.tagline}
              </span>
            </h1>

            <p className="reveal reveal-delay-2 mt-6 text-base sm:text-lg text-white/65 max-w-2xl leading-relaxed">
              {profile.pitch}
            </p>

            <div className="reveal reveal-delay-3 mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#projects"
                className="group inline-flex items-center gap-2 rounded-full bg-white text-slate-950 px-5 py-2.5 text-sm font-medium hover:bg-white/90 transition"
              >
                {t.hero.seeWork}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="transition group-hover:translate-x-0.5"
                >
                  <path
                    d="M5 12h14M13 5l7 7-7 7"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </a>
              <a
                href="#contact"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-white/90 hover:bg-white/10 transition"
              >
                {t.hero.getInTouch}
              </a>
              <a
                href={`mailto:${profile.email}`}
                className="text-sm text-white/55 hover:text-white transition underline-offset-4 hover:underline"
              >
                {profile.email}
              </a>
            </div>

            <dl className="reveal reveal-delay-4 mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="glass card-hover rounded-2xl p-3 sm:p-4"
                >
                  <dt className="text-[10px] uppercase tracking-[0.15em] text-white/50">
                    {s.label}
                  </dt>
                  <dd className="mt-1.5 text-sm sm:text-base font-semibold text-white">
                    {s.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="reveal reveal-delay-2 relative mx-auto lg:mx-0 w-full max-w-[360px]">
            <div className="relative aspect-square float">
              <div className="absolute inset-0 rounded-3xl glass overflow-hidden">
                <div
                  aria-hidden
                  className="absolute inset-0 bg-gradient-to-br from-indigo-500/18 via-cyan-400/10 to-amber-400/14"
                />
                <div
                  aria-hidden
                  className="absolute -bottom-12 left-1/2 -translate-x-1/2 h-44 w-44 rounded-full bg-indigo-500/30 blur-3xl"
                />
                <Image
                  src="/profile-nobg.png"
                  alt={`${profile.name} portrait`}
                  fill
                  priority
                  sizes="(max-width: 1024px) 320px, 360px"
                  className="relative z-10 object-contain object-bottom drop-shadow-[0_20px_40px_rgba(0,0,0,0.45)]"
                />

                <div className="absolute bottom-3 left-3 right-3 z-20 inline-flex items-center justify-center gap-2 rounded-full glass border border-white/12 px-3 py-1.5 text-[11px] text-white/75">
                  <Image
                    src="/assets/projects/epower.png"
                    alt="E-Power"
                    width={56}
                    height={14}
                    className="opacity-90"
                  />
                  <span>{t.hero.buildingAt}</span>
                </div>
              </div>

              <FloatingBadge
                className="absolute -left-3 top-6 sm:-left-6"
                label="Flutter"
              />
              <FloatingBadge
                className="absolute -right-2 top-20 sm:-right-4"
                label="Next.js"
              />
              <FloatingBadge
                className="absolute -left-1 bottom-16 sm:-left-3"
                label="Node.js"
              />
              <FloatingBadge
                className="absolute -right-3 bottom-32 sm:-right-6"
                label="PostgreSQL"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function FloatingBadge({
  className,
  label,
}: {
  className?: string;
  label: string;
}) {
  return (
    <div
      className={`glass rounded-full px-3 py-1.5 text-[11px] font-medium text-white/85 border border-white/12 shadow-lg shadow-slate-950/30 ${className}`}
    >
      {label}
    </div>
  );
}
