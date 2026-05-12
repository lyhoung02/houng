"use client";

import { profile } from "@/lib/portfolio-data";
import { useT } from "./providers/LanguageProvider";

const icons: Record<string, React.ReactNode> = {
  backend: (
    <path
      d="M3 5h18v6H3zM3 13h18v6H3zM7 8h.01M7 16h.01"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  ),
  frontend: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M3 9h18M7 6.5h.01M10 6.5h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  mobile: (
    <>
      <rect x="7" y="3" width="10" height="18" rx="2" stroke="currentColor" strokeWidth="2" />
      <path d="M11 18h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  devops: (
    <path
      d="M7 18h10a4 4 0 0 0 .5-7.97A6 6 0 0 0 5.5 11 4 4 0 0 0 7 18z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  ),
  ai: (
    <path
      d="M12 3v4M12 17v4M5 12H1M23 12h-4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
  ),
  leadership: (
    <>
      <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="2" />
      <circle cx="17" cy="10" r="2.5" stroke="currentColor" strokeWidth="2" />
      <path
        d="M3 19c0-3 2.5-5 6-5s6 2 6 5M14 19c0-2 2-3.5 4-3.5s3.5 1.5 3.5 3.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </>
  ),
};

export default function About() {
  const t = useT();
  const services = [
    { key: "backend", ...t.about.services.backend },
    { key: "frontend", ...t.about.services.frontend },
    { key: "mobile", ...t.about.services.mobile },
    { key: "devops", ...t.about.services.devops },
    { key: "ai", ...t.about.services.ai },
    { key: "leadership", ...t.about.services.leadership },
  ];

  return (
    <section id="about" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeader
          eyebrow={t.about.eyebrow}
          title={t.about.title}
          description={profile.longPitch}
        />

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((s) => (
            <div key={s.key} className="glass card-hover rounded-2xl p-5 sm:p-6">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500/30 to-cyan-400/20 text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  {icons[s.key]}
                </svg>
              </div>
              <h3 className="mt-4 text-base font-semibold text-white">
                {s.title}
              </h3>
              <p className="mt-2 text-sm text-white/65 leading-relaxed">
                {s.desc}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-6 grid lg:grid-cols-[1.15fr_1fr] gap-4">
          <div className="glass card-hover rounded-2xl p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400/30 to-cyan-400/20 text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="9" cy="8" r="3" stroke="currentColor" strokeWidth="2" />
                  <circle cx="17" cy="10" r="2.5" stroke="currentColor" strokeWidth="2" />
                  <path
                    d="M3 19c0-3 2.5-5 6-5s6 2 6 5M14 19c0-2 2-3.5 4-3.5s3.5 1.5 3.5 3.5"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-white">
                {t.about.workStyle.title}
              </h3>
            </div>
            <p className="mt-3 text-sm text-white/70 leading-relaxed">
              {t.about.workStyle.intro}
            </p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {t.about.workStyle.traits.map((trait) => (
                <span
                  key={trait}
                  className="text-xs rounded-full px-2.5 py-1 bg-gradient-to-br from-emerald-400/15 to-cyan-400/10 border border-emerald-300/25 text-emerald-100"
                >
                  {trait}
                </span>
              ))}
            </div>
          </div>

          <div className="glass card-hover rounded-2xl p-5 sm:p-6">
            <div className="flex items-center gap-3">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/30 to-amber-300/20 text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 3v4M12 17v4M5 12H1M23 12h-4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-white">
                {t.about.aiMindset.title}
              </h3>
            </div>
            <p className="mt-3 text-sm text-white/70 leading-relaxed">
              {t.about.aiMindset.description}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="max-w-3xl">
      <div className="inline-flex items-center gap-2 text-[11px] tracking-[0.18em] uppercase text-white/50 mb-3">
        <span className="h-px w-8 bg-white/30" />
        {eyebrow}
      </div>
      <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-white/65 text-base sm:text-lg leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}
