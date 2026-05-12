"use client";

import { profile } from "@/lib/portfolio-data";
import { useT } from "./providers/LanguageProvider";

export default function Footer() {
  const t = useT();
  return (
    <footer className="mt-auto border-t border-white/5">
      <div className="mx-auto max-w-6xl px-5 sm:px-8 py-8 flex flex-wrap items-center justify-between gap-3 text-xs text-white/50">
        <p>
          © {new Date().getFullYear()} {profile.name}. {t.footer.built}
        </p>
        <p>
          {t.footer.from} {profile.location} ·{" "}
          <a
            href={`mailto:${profile.email}`}
            className="hover:text-white transition"
          >
            {profile.email}
          </a>
        </p>
      </div>
    </footer>
  );
}
