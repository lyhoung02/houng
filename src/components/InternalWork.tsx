import { internalProjects } from "@/lib/portfolio-data";
import { SectionHeader } from "./About";

const difficultyTone: Record<string, string> = {
  Challenging:
    "border-amber-400/30 text-amber-200 bg-amber-400/10",
  Hard: "border-rose-400/30 text-rose-200 bg-rose-400/10",
  Foundational:
    "border-indigo-400/30 text-indigo-200 bg-indigo-400/10",
};

export default function InternalWork() {
  return (
    <section id="internal" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeader
          eyebrow="Internal · E-Power CCL"
          title="The hard, challenging builds behind the scenes."
          description="Internal systems, integrations, and SDK work — the kind of code customers never see, but the business runs on."
        />

        <ol className="mt-12 relative space-y-5 pl-6 sm:pl-8 before:absolute before:left-2 sm:before:left-3 before:top-3 before:bottom-3 before:w-px before:bg-gradient-to-b before:from-indigo-400/60 before:via-cyan-400/40 before:to-amber-400/40">
          {internalProjects.map((p) => (
            <li key={p.slug} className="relative">
              <span
                aria-hidden
                className={`absolute -left-[14px] sm:-left-[10px] top-5 inline-block h-3.5 w-3.5 rounded-full bg-gradient-to-br ${p.accent} ring-4 ring-slate-950 shadow-lg`}
              />
              <article className="group glass card-hover relative overflow-hidden rounded-2xl p-5 sm:p-6">
                <div
                  aria-hidden
                  className={`pointer-events-none absolute -inset-px -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${p.accent} blur-2xl`}
                />

                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.15em] text-white/50">
                      <span>{p.period}</span>
                      <span className="h-1 w-1 rounded-full bg-white/30" />
                      <span
                        className={`rounded-full px-2 py-0.5 border ${difficultyTone[p.difficulty]}`}
                      >
                        {p.difficulty}
                      </span>
                    </div>
                    <h3 className="mt-2 text-lg font-semibold text-white">
                      {p.name}
                    </h3>
                    <p className="text-sm text-white/60">{p.tagline}</p>
                  </div>
                </div>

                <p className="mt-3 text-sm text-white/70 leading-relaxed">
                  {p.description}
                </p>

                <div className="mt-4 flex flex-wrap gap-1.5">
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
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
