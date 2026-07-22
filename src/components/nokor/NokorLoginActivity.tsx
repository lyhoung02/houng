"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { useT } from "../providers/LanguageProvider";

type SessionRow = {
  id: string;
  created_at: string;
  updated_at: string;
  user_agent: string | null;
  ip: string | null;
  is_current: boolean;
};

type HistoryRow = {
  action: string | null;
  ip: string | null;
  created_at: string;
};

function deviceLabel(ua: string | null): string {
  if (!ua) return "Unknown device";
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /Chrome\//.test(ua)
      ? "Chrome"
      : /Firefox\//.test(ua)
        ? "Firefox"
        : /Safari\//.test(ua)
          ? "Safari"
          : "Browser";
  const os = /Windows/.test(ua)
    ? "Windows"
    : /Android/.test(ua)
      ? "Android"
      : /iPhone|iPad/.test(ua)
        ? "iOS"
        : /Mac OS X|Macintosh/.test(ua)
          ? "macOS"
          : /Linux/.test(ua)
            ? "Linux"
            : "";
  return os ? `${browser} · ${os}` : browser;
}

/** Modal listing the account's active sessions (auth.sessions) and recent
 *  auth events (auth.audit_log_entries), via the migration-0038 RPCs. */
export default function NokorLoginActivity({ onClose }: { onClose: () => void }) {
  const t = useT();
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    void Promise.all([
      supabase.rpc("nokor_my_sessions"),
      supabase.rpc("nokor_my_login_history"),
    ]).then(([s, h]) => {
      setSessions(s.data ?? []);
      setHistory(h.data ?? []);
      setLoaded(true);
    });
  }, []);

  const fmt = (iso: string) => new Date(iso).toLocaleString();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="glass max-h-[80vh] w-full max-w-md overflow-y-auto rounded-2xl border border-border p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">{t.nokor.auth.loginActivity}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg px-2 py-1 text-sm opacity-70 transition hover:bg-surface-strong hover:opacity-100"
          >
            ✕
          </button>
        </div>

        <h3 className="mt-4 text-sm font-medium opacity-70">{t.nokor.auth.activeSessions}</h3>
        <ul className="mt-2 space-y-2">
          {sessions.map((s) => (
            <li key={s.id} className="rounded-xl border border-border p-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{deviceLabel(s.user_agent)}</span>
                {s.is_current && (
                  <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-400">
                    {t.nokor.auth.currentSession}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs opacity-60">
                {s.ip && <>{s.ip} · </>}
                {t.nokor.auth.lastActive} {fmt(s.updated_at)}
              </p>
            </li>
          ))}
          {loaded && sessions.length === 0 && (
            <li className="text-sm opacity-60">{t.nokor.auth.noActivity}</li>
          )}
        </ul>

        <h3 className="mt-5 text-sm font-medium opacity-70">{t.nokor.auth.recentActivity}</h3>
        <ul className="mt-2 space-y-1">
          {history.map((h, i) => (
            <li
              key={`${h.created_at}-${i}`}
              className="flex items-center justify-between gap-2 rounded-lg px-1 py-1.5 text-sm"
            >
              <span className="font-medium">{h.action ?? "—"}</span>
              <span className="text-right text-xs opacity-60">
                {h.ip && <>{h.ip} · </>}
                {fmt(h.created_at)}
              </span>
            </li>
          ))}
          {loaded && history.length === 0 && (
            <li className="text-sm opacity-60">{t.nokor.auth.noActivity}</li>
          )}
        </ul>
      </div>
    </div>
  );
}
