"use client";

import Image from "next/image";
import { projects } from "@/lib/portfolio-data";
import { SectionHeader } from "./About";
import { useT } from "./providers/LanguageProvider";

export default function Projects() {
  const t = useT();
  return (
    <section id="projects" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeader
          eyebrow={t.projects.eyebrow}
          title={t.projects.title}
          description={t.projects.description}
        />

        <div className="mt-12 grid md:grid-cols-2 gap-5">
          {projects.map((p) => (
            <article
              key={p.slug}
              className="group glass card-hover relative overflow-hidden rounded-2xl p-6"
            >
              <div
                aria-hidden
                className={`pointer-events-none absolute -inset-px -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${p.accent} blur-2xl`}
              />

              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="relative h-14 w-14 sm:h-16 sm:w-16 shrink-0 rounded-xl bg-white/[0.04] border border-white/10 overflow-hidden flex items-center justify-center">
                    <Image
                      src={p.logo}
                      alt={`${p.name} logo`}
                      fill
                      sizes="64px"
                      className="object-contain p-1.5"
                    />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">
                      {p.name}
                    </h3>
                    <p className="text-sm text-white/60">{p.tagline}</p>
                  </div>
                </div>
                <div className="flex flex-wrap justify-end gap-1.5">
                  {p.roles.map((r) => (
                    <span
                      key={r}
                      className={`text-[10px] tracking-wider uppercase rounded-full px-2 py-1 border ${
                        r === "Backend"
                          ? "border-indigo-400/30 text-indigo-200 bg-indigo-400/10"
                          : r === "Frontend"
                            ? "border-cyan-400/30 text-cyan-200 bg-cyan-400/10"
                            : "border-amber-400/30 text-amber-200 bg-amber-400/10"
                      }`}
                    >
                      {t.projects.roles[r]}
                    </span>
                  ))}
                </div>
              </div>

              <p className="mt-4 text-sm text-white/70 leading-relaxed">
                {p.description}
              </p>

              <ul className="mt-4 space-y-1.5">
                {p.highlights.map((h, i) => (
                  <li key={i} className="flex gap-2 text-sm text-white/65">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      className="mt-1 shrink-0 text-emerald-300"
                    >
                      <path
                        d="M5 12.5l4 4 10-10"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {h}
                  </li>
                ))}
              </ul>

              <div className="mt-5 flex flex-wrap gap-1.5">
                {p.stack.map((s) => (
                  <span
                    key={s}
                    className="text-[11px] rounded-md px-2 py-1 bg-white/[0.04] border border-white/10 text-white/70"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>

        <div className="mt-8 glass rounded-2xl p-5 sm:p-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-white/80">{t.projects.cta}</p>
            <p className="text-xs text-white/50 mt-1">{t.projects.ctaSub}</p>
          </div>
          <a
            href="#contact"
            className="rounded-full bg-white text-slate-950 px-5 py-2 text-sm font-medium hover:bg-white/90 transition"
          >
            {t.projects.ctaButton}
          </a>
        </div>
      </div>
    </section>
  );
}
