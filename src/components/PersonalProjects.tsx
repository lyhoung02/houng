import Image from "next/image";
import { personalProjects } from "@/lib/portfolio-data";
import { SectionHeader } from "./About";

const statusTone: Record<string, string> = {
  Research: "border-violet-400/30 text-violet-200 bg-violet-400/10",
  Active: "border-emerald-400/30 text-emerald-200 bg-emerald-400/10",
  Shipped: "border-cyan-400/30 text-cyan-200 bg-cyan-400/10",
};

export default function PersonalProjects() {
  return (
    <section id="personal" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeader
          eyebrow="Personal · Research"
          title="Side projects I build to keep sharp."
          description="Self-initiated builds and research projects — exploring product ideas, stacks, and patterns outside of day-job work."
        />

        <div className="mt-12 grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {personalProjects.map((p) => (
            <article
              key={p.slug}
              className="group glass card-hover relative overflow-hidden rounded-2xl p-6 flex flex-col"
            >
              <div
                aria-hidden
                className={`pointer-events-none absolute -inset-px -z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${p.accent} blur-2xl`}
              />

              <div className="flex items-start justify-between gap-3">
                <div className="relative h-14 w-14 shrink-0 rounded-xl bg-white/[0.04] border border-white/10 overflow-hidden flex items-center justify-center">
                  <Image
                    src={p.logo}
                    alt={`${p.name} logo`}
                    fill
                    sizes="56px"
                    className="object-contain p-1.5"
                  />
                </div>
                <span
                  className={`text-[10px] tracking-wider uppercase rounded-full px-2 py-1 border ${statusTone[p.status]}`}
                >
                  {p.status}
                </span>
              </div>

              <h3 className="mt-4 text-lg font-semibold text-white">
                {p.name}
              </h3>
              <p className="mt-1 text-sm text-white/60">{p.tagline}</p>
              <p className="mt-3 text-sm text-white/70 leading-relaxed">
                {p.description}
              </p>

              <ul className="mt-4 space-y-1.5">
                {p.highlights.map((h, i) => (
                  <li
                    key={i}
                    className="flex gap-2 text-sm text-white/65"
                  >
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
      </div>
    </section>
  );
}
