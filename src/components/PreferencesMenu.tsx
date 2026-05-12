"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme, type ThemeMode } from "./providers/ThemeProvider";
import { useLanguage } from "./providers/LanguageProvider";
import type { Lang } from "@/lib/i18n/messages";

const themeOptions: { key: ThemeMode; labelKey: "themeLight" | "themeDark" | "themeSystem"; icon: React.ReactNode }[] = [
  {
    key: "light",
    labelKey: "themeLight",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
        <path
          d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    key: "dark",
    labelKey: "themeDark",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <path
          d="M20 14.5A8 8 0 1 1 9.5 4 6.5 6.5 0 0 0 20 14.5z"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    key: "system",
    labelKey: "themeSystem",
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="2" />
        <path d="M8 21h8M12 17v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
];

const langOptions: { key: Lang; label: string }[] = [
  { key: "en", label: "EN" },
  { key: "km", label: "ខ្មែរ" },
];

export default function PreferencesMenu() {
  const { mode, setMode, resolved } = useTheme();
  const { lang, setLang, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Trigger icon mirrors the active theme so users see the current state at a glance
  const triggerIcon =
    resolved === "dark" ? themeOptions[1].icon : themeOptions[0].icon;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={`${t.settings.theme} · ${t.settings.language}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs font-medium text-white/80 hover:text-white hover:border-white/20 transition"
      >
        <span className="inline-flex h-4 w-4 items-center justify-center">
          {triggerIcon}
        </span>
        <span className={lang === "km" ? "km" : undefined}>
          {langOptions.find((l) => l.key === lang)?.label}
        </span>
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M6 9l6 6 6-6"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <div
        role="menu"
        aria-hidden={!open}
        className={`absolute right-0 mt-2 w-56 origin-top-right glass rounded-xl border border-white/10 shadow-xl shadow-slate-950/40 p-3 z-50 transition ${
          open
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 -translate-y-1 pointer-events-none"
        }`}
      >
        <PrefGroup label={t.settings.theme}>
          {themeOptions.map((o) => {
            const active = mode === o.key;
            return (
              <button
                key={o.key}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => setMode(o.key)}
                className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[11px] transition ${
                  active
                    ? "bg-white text-slate-950"
                    : "text-white/75 hover:text-white hover:bg-white/[0.06]"
                }`}
              >
                {o.icon}
                <span>{t.settings[o.labelKey]}</span>
              </button>
            );
          })}
        </PrefGroup>

        <PrefGroup label={t.settings.language}>
          {langOptions.map((o) => {
            const active = lang === o.key;
            return (
              <button
                key={o.key}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                onClick={() => setLang(o.key)}
                className={`inline-flex flex-1 items-center justify-center rounded-md px-2 py-1.5 text-[11px] font-medium transition ${
                  active
                    ? "bg-white text-slate-950"
                    : "text-white/75 hover:text-white hover:bg-white/[0.06]"
                } ${o.key === "km" ? "km" : ""}`}
              >
                {o.label}
              </button>
            );
          })}
        </PrefGroup>
      </div>
    </div>
  );
}

function PrefGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-2 last:mb-0">
      <p className="text-[10px] uppercase tracking-[0.15em] text-white/45 mb-1.5">
        {label}
      </p>
      <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/[0.02] p-0.5">
        {children}
      </div>
    </div>
  );
}
