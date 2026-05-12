import Image from "next/image";
import { profile } from "@/lib/portfolio-data";

export default function Hero() {
  return (
    <section
      id="top"
      className="relative overflow-hidden pt-16 pb-24 sm:pt-24 sm:pb-32"
    >
      <div className="absolute inset-0 -z-10 bg-grid opacity-60" />
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-[480px] w-[480px] rounded-full bg-indigo-500/25 blur-3xl -z-10" />

      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="grid lg:grid-cols-[1.3fr_1fr] gap-10 lg:gap-16 items-center">
          <div>
            <div className="reveal inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/70 mb-6">
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400 text-emerald-400 pulse-dot" />
              <span>Available for hire · Remote / Phnom Penh</span>
            </div>

            <h1 className="reveal reveal-delay-1 text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.05]">
              Hi, I&apos;m{" "}
              <span className="gradient-text">{profile.name}</span>
              <br />
              <span className="text-white/80">
                a junior engineer who actually ships.
              </span>
            </h1>

            <p className="reveal reveal-delay-2 mt-6 text-base sm:text-lg text-white/70 max-w-2xl leading-relaxed">
              {profile.pitch}
            </p>

            <div className="reveal reveal-delay-3 mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#projects"
                className="group inline-flex items-center gap-2 rounded-full bg-white text-slate-950 px-5 py-2.5 text-sm font-medium hover:bg-white/90 transition"
              >
                See my work
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
                Get in touch
              </a>
              <a
                href={`mailto:${profile.email}`}
                className="text-sm text-white/60 hover:text-white transition underline-offset-4 hover:underline"
              >
                {profile.email}
              </a>
            </div>

            <dl className="reveal reveal-delay-4 mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl">
              {profile.stats.map((s) => (
                <div
                  key={s.label}
                  className="glass rounded-xl p-3 sm:p-4"
                >
                  <dt className="text-[11px] uppercase tracking-wider text-white/50">
                    {s.label}
                  </dt>
                  <dd className="mt-1 text-sm sm:text-base font-medium text-white">
                    {s.value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="reveal reveal-delay-2 relative mx-auto lg:mx-0">
            <div className="relative h-72 w-72 sm:h-80 sm:w-80 lg:h-[360px] lg:w-[360px] float">
              <div className="absolute inset-0 rounded-3xl glow-ring bg-gradient-to-br from-indigo-500/20 via-cyan-400/15 to-amber-400/20" />
              <div className="absolute inset-3 rounded-2xl glass overflow-hidden flex items-center justify-center">
                <div className="relative h-full w-full flex items-center justify-center">
                  <div className="relative h-40 w-40 sm:h-48 sm:w-48 rounded-full bg-gradient-to-br from-indigo-500/30 to-cyan-400/30 flex items-center justify-center text-6xl sm:text-7xl font-bold gradient-text">
                    {profile.initials}
                  </div>
                </div>
              </div>

              <FloatingBadge
                className="absolute -left-6 top-10"
                label="Flutter"
                tone="cyan"
              />
              <FloatingBadge
                className="absolute -right-4 top-24"
                label="Next.js"
                tone="indigo"
              />
              <FloatingBadge
                className="absolute -left-2 bottom-8"
                label="Node.js"
                tone="emerald"
              />
              <FloatingBadge
                className="absolute -right-8 bottom-24"
                label="PostgreSQL"
                tone="amber"
              />
            </div>

            <div className="mt-6 flex items-center justify-center gap-2 text-xs text-white/50">
              <Image
                src="/assets/projects/epower.png"
                alt="E-Power"
                width={84}
                height={20}
                className="opacity-80"
              />
              <span>· currently building @ E-Power CCL</span>
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
  tone,
}: {
  className?: string;
  label: string;
  tone: "indigo" | "cyan" | "emerald" | "amber";
}) {
  const tones: Record<string, string> = {
    indigo: "from-indigo-500/30 to-indigo-500/10 text-indigo-200",
    cyan: "from-cyan-400/30 to-cyan-400/10 text-cyan-200",
    emerald: "from-emerald-400/30 to-emerald-400/10 text-emerald-200",
    amber: "from-amber-400/30 to-amber-400/10 text-amber-200",
  };
  return (
    <div
      className={`glass rounded-full px-3 py-1.5 text-xs font-medium bg-gradient-to-br ${tones[tone]} shadow-lg ${className}`}
    >
      {label}
    </div>
  );
}
