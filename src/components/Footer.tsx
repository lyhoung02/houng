"use client";

import Link from "next/link";
import { profile } from "@/lib/portfolio-data";
import { useT } from "./providers/LanguageProvider";

export default function Footer() {
  const t = useT();
  const primaryPhone = profile.phones[0];
  const phoneHref = `tel:${primaryPhone.replace(/\s/g, "")}`;

  return (
    <footer className="mt-auto border-t border-white/5">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 py-8">
        <div className="grid gap-6 md:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <p className="text-sm font-semibold text-white">{profile.name}</p>
            <p className="mt-2 max-w-sm text-xs leading-relaxed text-white/55">
              {t.footer.from} {profile.location}. {t.footer.built}
            </p>
          </div>

          <div className="space-y-2 text-xs text-white/60">
            <p className="text-[10px] uppercase tracking-[0.15em] text-white/40">
              {t.nav.contact}
            </p>
            <a
              href={`mailto:${profile.email}`}
              className="block break-words hover:text-white transition"
            >
              {profile.email}
            </a>
            <a
              href={`mailto:${profile.workEmail}`}
              className="block break-words hover:text-white transition"
            >
              {profile.workEmail}
            </a>
            <a href={phoneHref} className="block break-words hover:text-white transition">
              {primaryPhone}
            </a>
          </div>

          <div className="space-y-3 text-xs text-white/60">
            <p>{profile.address}</p>
            <Link
              href="/contact"
              className="inline-flex rounded-full border border-white/12 bg-white/[0.04] px-3 py-1.5 font-medium text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              {t.nav.contact}
            </Link>
          </div>
        </div>

        <p className="mt-6 border-t border-white/5 pt-4 text-xs text-white/40">
          © {new Date().getFullYear()} {profile.name}.
        </p>
      </div>
    </footer>
  );
}
