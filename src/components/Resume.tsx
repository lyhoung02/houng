"use client";

import Image from "next/image";
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
      <div className="resume-grid">
        {/* --------------------------- SIDEBAR --------------------------- */}
        <aside className="resume-sidebar">
          <div className="flex flex-col items-center text-center">
            <div className="resume-avatar">
              <Image
                src="/profile-nobg.png"
                alt={`${profile.name} portrait`}
                fill
                sizes="120px"
                className="object-cover object-top"
              />
            </div>
            <h1 className="mt-3 text-[16pt] font-bold tracking-tight leading-tight">
              {profile.name}
            </h1>
            <p className="mt-0.5 text-[10pt] font-medium opacity-90">
              {profile.title}
            </p>
          </div>

          <SidebarSection label={t.resume.contact}>
            <ul className="space-y-2 text-[9pt] leading-snug">
              <li className="flex items-start gap-2">
                <Icon name="mail" />
                <a href={`mailto:${profile.email}`} className="break-all">
                  {profile.email}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Icon name="mail" />
                <a href={`mailto:${profile.workEmail}`} className="break-all">
                  {profile.workEmail}
                </a>
              </li>
              {profile.phones.map((p) => (
                <li key={p} className="flex items-start gap-2">
                  <Icon name="phone" />
                  <span>{p}</span>
                </li>
              ))}
              <li className="flex items-start gap-2">
                <Icon name="pin" />
                <span>{profile.address}</span>
              </li>
              <li className="flex items-start gap-2">
                <Icon name="globe" />
                <a href="https://houng.pages.dev">houng.pages.dev</a>
              </li>
            </ul>
          </SidebarSection>

          <SidebarSection label={t.resume.skills}>
            <div className="space-y-3">
              {skillGroups.map((g) => (
                <div key={g.title} className="print-keep">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span className="h-px w-3 bg-cyan-300" />
                    <h4 className="text-[8pt] font-bold uppercase tracking-[0.14em] text-cyan-200">
                      {g.title}
                    </h4>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {g.items.map((it) => (
                      <span
                        key={it}
                        className="resume-chip"
                      >
                        {it}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </SidebarSection>

          <SidebarSection label={t.resume.education}>
            <ol className="resume-edu">
              {education.map((e) => (
                <li key={e.title} className="print-keep">
                  <span className="resume-edu-dot" aria-hidden />
                  <p className="text-[9.5pt] font-semibold leading-snug">
                    {e.title}
                  </p>
                  <p className="text-[8.75pt] opacity-90 leading-snug">
                    {e.org}
                  </p>
                  <span className="resume-edu-period">{e.period}</span>
                </li>
              ))}
            </ol>
          </SidebarSection>
        </aside>

        {/* ----------------------------- MAIN ----------------------------- */}
        <main className="resume-main">
          <Section title={t.resume.summary}>
            <p className="resume-body">
              {profile.pitch} {profile.longPitch}
            </p>
          </Section>

          <Section title={t.resume.experience}>
            <div className="space-y-3.5">
              {experience.map((job) => (
                <div key={job.company} className="print-keep">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-[11pt] font-semibold text-slate-900">
                      {job.role}
                    </h3>
                    <span className="resume-date">{job.period}</span>
                  </div>
                  <p className="text-[9.5pt] font-medium text-slate-600">
                    {job.company} · {job.location}
                  </p>
                  <ul className="mt-1.5 ml-4 list-disc space-y-1 resume-body">
                    {job.bullets.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Section>

          <Section title={t.resume.selectedProjects}>
            <div className="space-y-2.5">
              {projects.map((p) => (
                <div key={p.slug} className="print-keep">
                  <div className="flex items-baseline justify-between gap-3">
                    <h3 className="text-[10.5pt] font-semibold text-slate-900">
                      {p.name}
                      <span className="ml-1.5 font-normal text-slate-500 text-[9pt]">
                        — {p.roles.map((r) => t.projects.roles[r]).join(" · ")}
                      </span>
                    </h3>
                  </div>
                  <p className="resume-body">{p.description}</p>
                  <p className="text-[8.5pt] text-slate-500 mt-0.5">
                    {p.stack.join(" · ")}
                  </p>
                </div>
              ))}
            </div>
          </Section>

          <Section title={t.resume.internalProjects}>
            <ul className="space-y-1.5">
              {internalProjects.map((p) => (
                <li key={p.slug} className="print-keep resume-body">
                  <span className="font-semibold text-slate-900">
                    {p.name}
                  </span>
                  <span className="resume-date ml-1.5">{p.period}</span>
                  <span className="ml-1">— {p.tagline}</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section title={t.resume.personalProjects}>
            <ul className="space-y-1.5">
              {personalProjects.map((p) => (
                <li key={p.slug} className="print-keep resume-body">
                  <span className="font-semibold text-slate-900">
                    {p.name}
                  </span>
                  <span className="ml-1.5 text-[8.5pt] uppercase tracking-wider text-slate-500">
                    {t.personal.status[p.status]}
                  </span>
                  <span className="ml-1">— {p.tagline}</span>
                  <span className="block text-[8.5pt] text-slate-500">
                    {p.stack.slice(0, 5).join(" · ")}
                  </span>
                </li>
              ))}
            </ul>
          </Section>
        </main>
      </div>

      <footer className="resume-footer">
        <span>
          © {new Date().getFullYear()} {profile.name}
        </span>
        <span>{t.resume.printedFrom}</span>
      </footer>
    </article>
  );
}

function SidebarSection({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-5 print-keep">
      <h3 className="text-[9pt] font-bold uppercase tracking-[0.18em] mb-2 pb-1 border-b border-white/15">
        {label}
      </h3>
      {children}
    </section>
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
    <section className="mt-4 first:mt-0 print-keep">
      <h2 className="resume-section-title">{title}</h2>
      {children}
    </section>
  );
}

function Icon({ name }: { name: "mail" | "phone" | "pin" | "globe" }) {
  const paths: Record<string, React.ReactNode> = {
    mail: (
      <>
        <rect
          x="2"
          y="4"
          width="20"
          height="16"
          rx="2"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <path d="M3 6l9 7 9-7" stroke="currentColor" strokeWidth="1.8" />
      </>
    ),
    phone: (
      <path
        d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .3 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.5c.9.4 1.8.6 2.8.7A2 2 0 0 1 22 16.9z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    ),
    pin: (
      <>
        <path
          d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"
          stroke="currentColor"
          strokeWidth="1.8"
        />
        <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="1.8" />
      </>
    ),
    globe: (
      <>
        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.8" />
        <path
          d="M2 12h20M12 2a15 15 0 0 1 0 20M12 2a15 15 0 0 0 0 20"
          stroke="currentColor"
          strokeWidth="1.8"
        />
      </>
    ),
  };
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 24 24"
      fill="none"
      className="mt-0.5 shrink-0 opacity-80"
      aria-hidden
    >
      {paths[name]}
    </svg>
  );
}
