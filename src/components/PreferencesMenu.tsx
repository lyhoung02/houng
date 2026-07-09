"use client";

import { useTheme } from "./providers/ThemeProvider";
import { useLanguage } from "./providers/LanguageProvider";

export default function PreferencesMenu() {
  const { resolved, setMode } = useTheme();
  const { lang, setLang, t } = useLanguage();
  const nextTheme = resolved === "dark" ? "light" : "dark";
  const nextLang = lang === "en" ? "km" : "en";

  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        aria-label={`${t.settings.theme}: ${resolved}. ${t.settings.theme} ${nextTheme}`}
        title={resolved === "dark" ? t.settings.themeLight : t.settings.themeDark}
        onClick={() => setMode(nextTheme)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/75 transition hover:border-white/20 hover:bg-white/10 hover:text-white"
      >
        {resolved === "dark" ? <MoonIcon /> : <SunIcon />}
      </button>

      <button
        type="button"
        aria-label={`${t.settings.language}: ${lang.toUpperCase()}`}
        title={lang === "en" ? "ភាសាខ្មែរ" : "English"}
        onClick={() => setLang(nextLang)}
        className={`inline-flex h-9 min-w-12 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] px-3 text-xs font-semibold text-white/80 transition hover:border-white/20 hover:bg-white/10 hover:text-white ${
          lang === "km" ? "km" : ""
        }`}
      >
        {lang === "en" ? "EN" : "ខ្មែរ"}
      </button>
    </div>
  );
}

function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M20 14.5A8 8 0 1 1 9.5 4 6.5 6.5 0 0 0 20 14.5z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}
