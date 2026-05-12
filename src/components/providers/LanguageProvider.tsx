"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { messages, type Lang, type Messages } from "@/lib/i18n/messages";

type LanguageContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Messages;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = "houng.lang";

export function LanguageProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (stored === "en" || stored === "km") {
      setLangState(stored);
      document.documentElement.lang = stored;
      document.documentElement.classList.toggle("km", stored === "km");
    }
  }, []);

  const setLang = useCallback((next: Lang) => {
    localStorage.setItem(STORAGE_KEY, next);
    setLangState(next);
    document.documentElement.lang = next;
    document.documentElement.classList.toggle("km", next === "km");
  }, []);

  const value = useMemo<LanguageContextValue>(
    () => ({ lang, setLang, t: messages[lang] }),
    [lang, setLang],
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useLanguage must be used inside <LanguageProvider>");
  }
  return ctx;
}

export function useT() {
  return useLanguage().t;
}
