"use client";

import Image from "next/image";
import { profile } from "@/lib/portfolio-data";
import { useT } from "./providers/LanguageProvider";
import { NeuralCanvas } from "./NeuralCanvas";

const heroSkillCloud = [
  "Dart 3",
  "TypeScript",
  "React",
  "Tailwind CSS",
  "Laravel",
  "MySQL",
  "Redis",
  "Supabase",
  "AWS",
  "Render",
  "Kubernetes",
  "Figma",
  "ChatGPT",
  "Codex",
  "Gemini",
];

export default function Hero() {
  const t = useT();
  const stats = [
    { label: t.hero.stats.projects, value: "6+" },
    { label: t.hero.stats.years, value: "4+" },
    { label: t.hero.stats.roles, value: t.hero.stats.rolesValue },
    { label: t.hero.stats.openTo, value: t.hero.stats.openToValue },
  ];

  return (
    <section
      id="top"
      className="relative isolate overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-28"
    >
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-35 dark:opacity-70">
        <NeuralCanvas />
      </div>
      <div className="absolute inset-0 -z-10 bg-grid opacity-100" />
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
              <div
                aria-hidden
                className="absolute inset-0 rounded-full bg-gradient-to-br from-indigo-500/35 via-violet-500/25 to-cyan-400/30 blur-3xl"
              />
              <div
                aria-hidden
                className="absolute inset-6 sm:inset-8 rounded-[36%] bg-gradient-to-br from-indigo-400/25 via-violet-400/15 to-cyan-300/20 border border-white/15 shadow-[0_25px_60px_-20px_rgba(99,102,241,0.4)]"
              />
              <Image
                src="/profile-nobg.png"
                alt={`${profile.name} portrait`}
                fill
                priority
                sizes="(max-width: 1024px) 320px, 360px"
                className="relative z-10 object-contain object-bottom drop-shadow-[0_25px_45px_rgba(0,0,0,0.45)]"
              />

              <FloatingBadge
                className="absolute -left-3 top-6 sm:-left-6"
                label="Flutter"
              />
              <FloatingBadge
                className="absolute left-16 top-2 sm:left-20"
                label=".NET"
              />
              <FloatingBadge
                className="absolute -right-2 top-16 sm:-right-4"
                label="Next.js"
              />
              <FloatingBadge
                className="absolute right-8 top-32 sm:right-4"
                label="C#"
              />
              <FloatingBadge
                className="absolute -left-1 bottom-20 sm:-left-3"
                label="Node.js"
              />
              <FloatingBadge
                className="absolute -left-2 bottom-36 sm:-left-8"
                label="REST API"
              />
              <FloatingBadge
                className="absolute -right-3 bottom-36 sm:-right-6"
                label="PostgreSQL"
              />
              <FloatingBadge
                className="absolute left-8 bottom-7 sm:left-12"
                label="SQL Server"
              />
              <FloatingBadge
                className="absolute right-4 bottom-20 sm:-right-8"
                label="Docker"
              />
              <FloatingBadge
                className="absolute right-12 bottom-4 sm:right-8"
                label="Firebase"
              />
              <FloatingBadge
                className="absolute left-2 top-32 sm:-left-7"
                label="GitLab"
              />
              <FloatingBadge
                className="absolute right-20 top-4 sm:right-16"
                label="Sentry"
              />
            </div>

            <div className="mt-5 flex items-center justify-center">
              <div className="glass inline-flex items-center gap-2 rounded-full border border-white/12 px-3 py-1.5 text-[11px] text-white/75">
                <Image
                  src="/assets/projects/epower.png"
                  alt="E-Power"
                  width={64}
                  height={16}
                  className="opacity-90"
                />
                <span>{t.hero.buildingAt}</span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {heroSkillCloud.map((skill) => (
                <FloatingBadge key={skill} label={skill} />
              ))}
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
