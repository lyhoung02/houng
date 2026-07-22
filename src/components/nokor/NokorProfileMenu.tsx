"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { displayName, useProfile } from "@/lib/supabase/useProfile";
import { useT } from "../providers/LanguageProvider";
import NokorLoginActivity from "./NokorLoginActivity";

export default function NokorProfileMenu({
  userId,
  email,
  onSignOut,
  onAddPasskey,
}: {
  userId: string;
  email: string | null;
  onSignOut: () => void;
  onAddPasskey?: () => Promise<string | null>;
}) {
  const t = useT();
  const { profile, avatar } = useProfile(userId);
  const [open, setOpen] = useState(false);
  const [passkeyState, setPasskeyState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [showActivity, setShowActivity] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const name = displayName(profile, userId);

  // Close on outside click or Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={name}
        className="flex items-center gap-2 rounded-full border border-border bg-surface py-1 pr-3 pl-1 text-sm transition hover:bg-surface-strong"
      >
        <Avatar avatar={avatar} name={name} />
        <span className="max-w-28 truncate font-medium">{name}</span>
      </button>

      {open && (
        <div
          role="menu"
          className="glass absolute right-0 z-20 mt-2 w-56 rounded-xl border border-border p-1 shadow-lg"
        >
          <div className="flex items-center gap-3 px-3 py-2.5">
            <Avatar avatar={avatar} name={name} size={40} />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{name}</p>
              {email && <p className="truncate text-xs opacity-60">{email}</p>}
            </div>
          </div>
          <div className="my-1 h-px bg-border" />
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              setShowActivity(true);
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-surface-strong"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M12 8v4l3 2 M21 12a9 9 0 1 1-9-9 9 9 0 0 1 9 9z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {t.nokor.auth.loginActivity}
          </button>
          {onAddPasskey && (
            <button
              type="button"
              role="menuitem"
              disabled={passkeyState === "busy"}
              onClick={async () => {
                setPasskeyState("busy");
                const err = await onAddPasskey();
                setPasskeyState(err ? "error" : "done");
              }}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-surface-strong disabled:opacity-50"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
                <path
                  d="M12 11a4 4 0 1 0-4-4 M12 3a4 4 0 0 1 4 4c0 1.1-.45 2.1-1.17 2.83 M6 21v-1a6 6 0 0 1 8.5-5.45 M17.5 14.5a2.5 2.5 0 0 1 1 4.8V21l1.5 1.5L21.5 21l-1-1 1-1-1.3-1.3a2.5 2.5 0 0 0-2.7-2.2z"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              {passkeyState === "done"
                ? t.nokor.auth.passkeyAdded
                : passkeyState === "error"
                  ? t.nokor.auth.passkeyFailed
                  : t.nokor.auth.addPasskey}
            </button>
          )}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false);
              onSignOut();
            }}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-rose-400 transition hover:bg-surface-strong"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M15 12H3m0 0 4-4m-4 4 4 4M9 5V4a2 2 0 0 1 2-2h7a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2v-1"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {t.nokor.auth.signOut}
          </button>
        </div>
      )}
      {showActivity && <NokorLoginActivity onClose={() => setShowActivity(false)} />}
    </div>
  );
}

function Avatar({
  avatar,
  name,
  size = 28,
}: {
  avatar: string | null;
  name: string;
  size?: number;
}) {
  if (avatar) {
    return (
      <Image
        src={avatar}
        alt={name}
        width={size}
        height={size}
        unoptimized
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-indigo-500/30 text-xs font-semibold uppercase"
      style={{ width: size, height: size }}
    >
      {name.slice(0, 2)}
    </div>
  );
}
