"use client";

import Image from "next/image";
import { archive } from "@/lib/portfolio-data";
import { SectionHeader } from "./About";
import { useT } from "./providers/LanguageProvider";

const kindTone: Record<string, string> = {
  Transcript: "border-cyan-400/30 text-cyan-200 bg-cyan-400/10",
  Degree: "border-amber-400/30 text-amber-200 bg-amber-400/10",
  Certificate: "border-indigo-400/30 text-indigo-200 bg-indigo-400/10",
};

export default function Archive() {
  const t = useT();
  return (
    <section id="archive" className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeader
          eyebrow={t.archive.eyebrow}
          title={t.archive.title}
          description={t.archive.description}
        />

        <div className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {archive.map((item) => {
            const link = item.href ?? item.image;
            const Card = (
              <>
                {item.image && (
                  <div className="relative mb-4 aspect-[4/3] w-full overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
                    <Image
                      src={item.image}
                      alt={`${item.title} — ${item.issuer}`}
                      fill
                      sizes="(max-width: 640px) 100vw, 33vw"
                      className="object-cover object-top transition duration-300 group-hover:scale-[1.03]"
                    />
                  </div>
                )}
                <div className="flex items-start gap-3">
                  <div className="relative h-11 w-11 shrink-0 rounded-xl bg-white/[0.04] border border-white/10 overflow-hidden flex items-center justify-center">
                    <Image
                      src={item.logo}
                      alt={`${item.issuer} logo`}
                      fill
                      sizes="44px"
                      className="object-contain p-1.5"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] uppercase tracking-[0.14em] rounded-full px-2 py-0.5 border ${kindTone[item.kind]}`}
                      >
                        {t.archive.kind[item.kind]}
                      </span>
                      <span className="text-[11px] text-white/45">
                        {item.date}
                      </span>
                    </div>
                    <h3 className="mt-2 text-sm font-semibold text-white leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-sm text-white/55">{item.issuer}</p>
                    {link && (
                      <span className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-cyan-200/80 group-hover:text-cyan-200">
                        {t.archive.view}
                        <svg
                          width="12"
                          height="12"
                          viewBox="0 0 24 24"
                          fill="none"
                          aria-hidden
                        >
                          <path
                            d="M7 17L17 7M9 7h8v8"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </span>
                    )}
                  </div>
                </div>
              </>
            );

            const className =
              "group glass card-hover rounded-2xl p-5 block";

            return link ? (
              <a
                key={item.slug}
                href={link}
                target="_blank"
                rel="noreferrer"
                className={className}
              >
                {Card}
              </a>
            ) : (
              <div key={item.slug} className={className}>
                {Card}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
