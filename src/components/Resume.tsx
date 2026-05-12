"use client";

import {
  profile,
  experience,
  education,
  projects,
  internalProjects,
  personalProjects,
  skillGroups,
} from "@/lib/portfolio-data";
import { useT } from "./providers/LanguageProvider";

export default function Resume() {
  const t = useT();

  return (
    <article className="resume-page print-keep" aria-label="Résumé">
      <header className="border-b-2 border-slate-900 pb-4 flex items-start justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight leading-tight">
            {profile.name}
          </h1>
          <p className="mt-1 text-base font-medium text-slate-700">
            {profile.title}
          </p>
          <p className="mt-1 text-[10pt] text-slate-600">{profile.subtitle}</p>
        </div>
        <div className="text-right text-[10pt] text-slate-700 space-y-0.5 shrink-0">
          <p>
            <a href={`mailto:${profile.email}`}>{profile.email}</a>
          </p>
          <p>
            <a href={`mailto:${profile.workEmail}`}>{profile.workEmail}</a>
          </p>
          {profile.phones.map((p) => (
            <p key={p}>{p}</p>
          ))}
          <p>{profile.address}</p>
        </div>
      </header>

      <Section title={t.resume.summary}>
        <p className="text-[10.5pt] text-slate-800 leading-relaxed">
          {profile.pitch} {profile.longPitch}
        </p>
      </Section>

      <Section title={t.resume.experience}>
        <div className="space-y-3">
          {experience.map((job) => (
            <div key={job.company} className="print-keep">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-[11pt] font-semibold text-slate-900">
                  {job.role}
                  <span className="font-normal text-slate-600">
                    {" "}
                    · {job.company} · {job.location}
                  </span>
                </h3>
                <span className="text-[9pt] text-slate-600">{job.period}</span>
              </div>
              <ul className="mt-1.5 ml-4 list-disc space-y-1 text-[10pt] text-slate-800">
                {job.bullets.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      <Section title={t.resume.selectedProjects}>
        <div className="grid grid-cols-2 gap-x-5 gap-y-2.5">
          {projects.map((p) => (
            <div key={p.slug} className="print-keep">
              <h3 className="text-[10.5pt] font-semibold text-slate-900">
                {p.name}{" "}
                <span className="font-normal text-slate-600">
                  · {p.roles.map((r) => t.projects.roles[r]).join(" · ")}
                </span>
              </h3>
              <p className="text-[9.5pt] text-slate-700 leading-snug">
                {p.description}
              </p>
              <p className="mt-0.5 text-[8.5pt] text-slate-500">
                {p.stack.join(" · ")}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <Section title={t.resume.internalProjects}>
        <ul className="space-y-1.5 text-[10pt] text-slate-800">
          {internalProjects.map((p) => (
            <li key={p.slug} className="print-keep">
              <span className="font-semibold text-slate-900">{p.name}</span>{" "}
              <span className="text-slate-500">({p.period})</span> — {p.tagline}
              <span className="text-slate-500">
                {" "}
                · {p.stack.slice(0, 4).join(", ")}
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title={t.resume.personalProjects}>
        <ul className="space-y-1.5 text-[10pt] text-slate-800">
          {personalProjects.map((p) => (
            <li key={p.slug} className="print-keep">
              <span className="font-semibold text-slate-900">{p.name}</span>{" "}
              <span className="text-slate-500">
                · {t.personal.status[p.status]}
              </span>{" "}
              — {p.tagline}
              <span className="text-slate-500">
                {" "}
                · {p.stack.slice(0, 4).join(", ")}
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title={t.resume.education}>
        <div className="space-y-2">
          {education.map((e) => (
            <div
              key={e.title}
              className="flex flex-wrap items-baseline justify-between gap-2 print-keep"
            >
              <div>
                <h3 className="text-[10.5pt] font-semibold text-slate-900">
                  {e.title}
                </h3>
                <p className="text-[9.5pt] text-slate-700">{e.org}</p>
              </div>
              <span className="text-[9pt] text-slate-600">{e.period}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title={t.resume.skills}>
        <div className="grid grid-cols-2 gap-x-5 gap-y-1.5">
          {skillGroups.map((g) => (
            <div key={g.title} className="print-keep">
              <h3 className="text-[9.5pt] font-semibold uppercase tracking-wider text-slate-700">
                {g.title}
              </h3>
              <p className="text-[9.5pt] text-slate-800 leading-snug">
                {g.items.join(" · ")}
              </p>
            </div>
          ))}
        </div>
      </Section>

      <footer className="mt-6 pt-3 border-t border-slate-200 flex items-center justify-between text-[8pt] text-slate-500">
        <span>
          © {new Date().getFullYear()} {profile.name}
        </span>
        <span>{t.resume.printedFrom}</span>
      </footer>
    </article>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-4 print-keep">
      <h2 className="text-[11pt] font-bold uppercase tracking-[0.12em] text-slate-900 border-b border-slate-300 pb-1 mb-2">
        {title}
      </h2>
      {children}
    </section>
  );
}
