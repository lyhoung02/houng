"use client";

import { useTheme, type ThemeMode } from "./providers/ThemeProvider";
import { useLanguage } from "./providers/LanguageProvider";
import type { Lang } from "@/lib/i18n/messages";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { mode, setMode } = useTheme();
  const { t } = useLanguage();

  const options: { key: ThemeMode; label: string; icon: React.ReactNode }[] = [
    {
      key: "light",
      label: t.settings.themeLight,
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
      label: t.settings.themeDark,
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
      label: t.settings.themeSystem,
      icon: (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
          <rect
            x="3"
            y="4"
            width="18"
            height="13"
            rx="2"
            stroke="currentColor"
            strokeWidth="2"
          />
          <path
            d="M8 21h8M12 17v4"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      ),
    },
  ];

  return (
    <div
      role="radiogroup"
      aria-label={t.settings.theme}
      className="inline-flex items-center gap-0.5 rounded-full border border-white/10 bg-white/[0.03] p-0.5"
    >
      {options.map((o) => {
        const active = mode === o.key;
        return (
          <button
            key={o.key}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setMode(o.key)}
            title={o.label}
            className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[11px] transition ${
              active
                ? "bg-white text-slate-950 shadow"
                : "text-white/70 hover:text-white"
            }`}
          >
            {o.icon}
            {!compact && <span>{o.label}</span>}
          </button>
        );
      })}
    </div>
  );
}

export function LanguageToggle() {
  const { lang, setLang } = useLanguage();
  const options: { key: Lang; label: string }[] = [
    { key: "en", label: "EN" },
    { key: "km", label: "ខ្មែរ" },
  ];

  return (
    <div
      role="radiogroup"
      aria-label="Language"
      className="inline-flex items-center gap-0.5 rounded-full border border-white/10 bg-white/[0.03] p-0.5"
    >
      {options.map((o) => {
        const active = lang === o.key;
        return (
          <button
            key={o.key}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setLang(o.key)}
            className={`rounded-full px-2.5 py-1 text-[11px] font-medium transition ${
              active
                ? "bg-white text-slate-950 shadow"
                : "text-white/70 hover:text-white"
            } ${o.key === "km" ? "km" : ""}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
