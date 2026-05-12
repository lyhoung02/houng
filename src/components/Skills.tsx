import { skillGroups } from "@/lib/portfolio-data";
import { SectionHeader } from "./About";

export default function Skills() {
  return (
    <section id="skills" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeader
          eyebrow="Skills & Toolbox"
          title="A practical full-stack + mobile toolkit."
          description="The stack I use every day to design, build, ship, and keep things running."
        />

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {skillGroups.map((g) => (
            <div
              key={g.title}
              className="glass card-hover rounded-2xl p-5 sm:p-6"
            >
              <h3 className="text-sm uppercase tracking-[0.15em] text-white/55">
                {g.title}
              </h3>
              <div className="mt-4 flex flex-wrap gap-2">
                {g.items.map((it) => (
                  <span
                    key={it}
                    className="text-xs sm:text-[13px] rounded-full px-3 py-1.5 bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/10 text-white/85 hover:border-white/25 transition"
                  >
                    {it}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
