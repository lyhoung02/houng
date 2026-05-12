"use client";

import Image from "next/image";
import { experience, education } from "@/lib/portfolio-data";
import { SectionHeader } from "./About";
import { useT } from "./providers/LanguageProvider";

export default function Experience() {
  const t = useT();

  return (
    <section id="experience" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeader
          eyebrow={t.experience.eyebrow}
          title={t.experience.title}
        />

        <div className="mt-12 grid lg:grid-cols-[1.2fr_1fr] gap-8">
          <div>
            <h3 className="text-sm uppercase tracking-[0.15em] text-white/50 mb-5">
              {t.experience.work}
            </h3>
            <div className="space-y-4">
              {experience.map((job) => (
                <div
                  key={job.company}
                  className="glass card-hover rounded-2xl p-5 sm:p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Image
                        src="/assets/projects/epower.png"
                        alt="E-Power"
                        width={64}
                        height={16}
                        className="opacity-90"
                      />
                      <div>
                        <h4 className="font-semibold text-white">
                          {job.role}
                        </h4>
                        <p className="text-sm text-white/60">
                          {job.company} · {job.location}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-white/50 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1">
                      {job.period}
                    </span>
                  </div>
                  <ul className="mt-4 space-y-2.5">
                    {job.bullets.map((b, i) => (
                      <li
                        key={i}
                        className="flex gap-3 text-sm text-white/70 leading-relaxed"
                      >
                        <span className="mt-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-indigo-400 to-cyan-300" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm uppercase tracking-[0.15em] text-white/50 mb-5">
              {t.experience.education}
            </h3>
            <ol className="relative space-y-4 pl-5 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-px before:bg-gradient-to-b before:from-indigo-400/60 before:via-cyan-400/40 before:to-amber-400/30">
              {education.map((e) => (
                <li key={e.title} className="relative">
                  <span className="absolute -left-[18px] top-2 inline-block h-3 w-3 rounded-full bg-gradient-to-br from-indigo-400 to-cyan-300 ring-4 ring-slate-950" />
                  <div className="glass card-hover rounded-2xl p-4 sm:p-5">
                    <div className="flex items-start gap-3">
                      <div className="relative h-12 w-12 sm:h-14 sm:w-14 shrink-0 rounded-xl bg-white/[0.04] border border-white/10 overflow-hidden flex items-center justify-center">
                        <Image
                          src={e.logo}
                          alt={`${e.org} logo`}
                          fill
                          sizes="56px"
                          className="object-contain p-1.5"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <h4 className="text-sm sm:text-base font-semibold text-white">
                            {e.title}
                          </h4>
                          <span className="text-[11px] text-white/55 shrink-0">
                            {e.period}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-white/60">{e.org}</p>
                        <p className="mt-2 text-sm text-white/65 leading-relaxed">
                          {e.detail}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
