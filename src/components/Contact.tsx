import { profile } from "@/lib/portfolio-data";
import { SectionHeader } from "./About";

export default function Contact() {
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
                eyebrow="Let's Work"
                title="Hire an engineer who already ships."
                description="I'm open to full-time roles, mobile/web outsourcing, and short-term builds. If you need someone who can move fast across backend, frontend, and mobile — let's talk."
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
                  Email me
                </a>
                <a
                  href="https://github.com/"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/10 transition"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.3.8-.6v-2c-3.2.7-3.9-1.5-3.9-1.5-.5-1.3-1.3-1.6-1.3-1.6-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.7 2.7 1.2 3.4.9.1-.7.4-1.2.7-1.5-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.2-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2 1-.3 2-.4 3-.4s2 .1 3 .4c2.3-1.5 3.3-1.2 3.3-1.2.7 1.6.2 2.8.1 3.1.8.9 1.2 1.9 1.2 3.2 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5z" />
                  </svg>
                  GitHub
                </a>
                <a
                  href="https://gitlab.com/"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-white hover:bg-white/10 transition"
                >
                  GitLab
                </a>
              </div>
            </div>

            <div className="glass rounded-2xl p-6">
              <h3 className="text-sm uppercase tracking-[0.15em] text-white/50">
                Quick Facts
              </h3>
              <div className="mt-4 space-y-3 text-sm">
                <Row k="Name" v={profile.name} />
                <Row k="Age" v={`${profile.age}`} />
                <Row k="Location" v={profile.location} />
                <Row k="Role" v={profile.title} />
                <Row
                  k="Status"
                  v={
                    <span className="inline-flex items-center gap-2 text-emerald-300">
                      <span className="h-2 w-2 rounded-full bg-emerald-400" />
                      Open to opportunities
                    </span>
                  }
                />
                <Row k="Email" v={profile.email} mono />
                <Row
                  k="Work email"
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
      <span className="text-white/55">{k}</span>
      <span
        className={`text-white text-right ${mono ? "font-mono text-xs sm:text-sm" : ""}`}
      >
        {v}
      </span>
    </div>
  );
}
