"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePortfolioContent } from "@/lib/supabase/usePortfolioContent";
import { DASHBOARD_PIN, unlockDashboard } from "@/lib/dashboardGate";
import { useT } from "./providers/LanguageProvider";

const UNLOCK_TAPS = 7;
const TAP_WINDOW_MS = 4000;

export default function Footer() {
  const t = useT();
  const router = useRouter();
  const { profile } = usePortfolioContent();
  const primaryPhone = profile.phones[0];
  const phoneHref = `tel:${primaryPhone.replace(/\s/g, "")}`;

  // Seven taps on the copyright line (within a rolling window) reveal the
  // PIN dialog. Like the chat admin door, this only reveals the Dashboard
  // nav entry — RLS is what actually protects the data.
  const taps = useRef<number[]>([]);
  const [pinOpen, setPinOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);

  const onCopyrightTap = useCallback(() => {
    const now = Date.now();
    taps.current = [...taps.current, now].filter((ts) => now - ts < TAP_WINDOW_MS);
    if (taps.current.length >= UNLOCK_TAPS) {
      taps.current = [];
      setPin("");
      setPinError(false);
      setPinOpen(true);
    }
  }, []);

  const submitPin = useCallback(() => {
    if (pin === DASHBOARD_PIN) {
      unlockDashboard();
      setPinOpen(false);
      router.push("/dashboard");
    } else {
      setPinError(true);
      setPin("");
    }
  }, [pin, router]);

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

        <p
          onClick={onCopyrightTap}
          className="mt-6 border-t border-white/5 pt-4 text-xs text-white/40 select-none"
        >
          © {new Date().getFullYear()} {profile.name}.
        </p>
      </div>

      {pinOpen && (
        <div
          role="dialog"
          aria-label={t.footer.pin.title}
          className="fixed inset-0 z-[60] grid place-items-center bg-slate-950/70 backdrop-blur-sm p-5"
          onClick={() => setPinOpen(false)}
        >
          <div
            className="w-full max-w-xs rounded-2xl border border-white/10 bg-background p-5 shadow-2xl shadow-slate-950/50"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-sm font-semibold text-foreground">
              {t.footer.pin.title}
            </p>
            <p className="mt-1 text-xs text-foreground/60">{t.footer.pin.hint}</p>
            <input
              type="password"
              inputMode="numeric"
              autoFocus
              maxLength={DASHBOARD_PIN.length}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/\D/g, ""));
                setPinError(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") submitPin();
                if (e.key === "Escape") setPinOpen(false);
              }}
              className="mt-4 w-full rounded-xl border border-border bg-white/[0.04] px-3 py-2 text-center text-lg tracking-[0.5em] text-foreground outline-none focus:border-indigo-400"
            />
            {pinError && (
              <p className="mt-2 text-xs text-rose-600 dark:text-rose-300">
                {t.footer.pin.wrong}
              </p>
            )}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setPinOpen(false)}
                className="flex-1 rounded-xl border border-border py-2 text-sm text-foreground/70 hover:text-foreground transition"
              >
                {t.footer.pin.cancel}
              </button>
              <button
                type="button"
                onClick={submitPin}
                disabled={pin.length < DASHBOARD_PIN.length}
                className="flex-1 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 py-2 text-sm font-medium text-white disabled:opacity-40 hover:scale-[1.01] transition"
              >
                {t.footer.pin.unlock}
              </button>
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}
