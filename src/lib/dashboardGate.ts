"use client";

import { useEffect, useState } from "react";

// The 7-tap + PIN only *reveals* the Dashboard nav entry — RLS (is_admin())
// is what actually protects the data. Same model as the chat admin door.
export const DASHBOARD_PIN =
  process.env.NEXT_PUBLIC_DASHBOARD_PIN ?? "280220";

const STORAGE_KEY = "houng.dashboard";
const EVENT = "houng:dashboard-unlock";

export function isDashboardUnlocked(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(STORAGE_KEY) === "1";
}

export function unlockDashboard() {
  localStorage.setItem(STORAGE_KEY, "1");
  window.dispatchEvent(new Event(EVENT));
}

export function lockDashboard() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event(EVENT));
}

export function useDashboardUnlocked(): boolean {
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    const sync = () => setUnlocked(isDashboardUnlocked());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return unlocked;
}
