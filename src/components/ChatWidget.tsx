"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { useLanguage } from "./providers/LanguageProvider";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useAdminSession, useVisitorChat } from "@/lib/supabase/useChat";
import { AdminPanel } from "./chat/AdminPanel";
import { VisitorPanel } from "./chat/VisitorPanel";
import { CommunityPanel } from "./chat/CommunityPanel";
import { ProfilePanel } from "./chat/ProfilePanel";
import {
  ChatTabIcon,
  CollapseIcon,
  ExpandIcon,
  UserTabIcon,
  UsersTabIcon,
} from "./chat/icons";

const ADMIN_TAPS = 7;
const TAP_WINDOW_MS = 3000;

type Tab = "chat" | "community" | "profile";

const TAB_ICONS: Record<Tab, React.ReactNode> = {
  chat: <ChatTabIcon />,
  community: <UsersTabIcon />,
  profile: <UserTabIcon />,
};

export default function ChatWidget() {
  const { t, lang } = useLanguage();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [adminMode, setAdminMode] = useState(false);
  const [tab, setTab] = useState<Tab>("chat");

  const chat = useVisitorChat(lang);
  // Always watching: an admin signing in through the normal form goes straight
  // to the inbox, no 7-tap needed. The tap remains as a fallback door.
  const admin = useAdminSession(true);
  const isAdminView = adminMode || (admin.ready && admin.isAdmin);

  // Seven taps on the avatar (within a rolling window) reveal the admin door.
  // This only *reveals* the panel — RLS is what actually protects the inbox.
  const taps = useRef<number[]>([]);
  const onAvatarTap = useCallback(() => {
    const now = Date.now();
    taps.current = [...taps.current, now].filter((ts) => now - ts < TAP_WINDOW_MS);
    if (taps.current.length >= ADMIN_TAPS) {
      taps.current = [];
      setAdminMode(true);
    }
  }, []);

  const handleSignOut = useCallback(async () => {
    await admin.signOut();
    setAdminMode(false);
  }, [admin]);

  return (
    <>
      {/* Floating button */}
      <button
        type="button"
        aria-label={open ? t.chat.close : t.chat.open}
        onClick={() => setOpen((v) => !v)}
        className={`no-print fixed bottom-5 right-5 z-50 inline-flex items-center justify-center h-14 w-14 rounded-full shadow-lg shadow-indigo-500/30 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
          open
            ? "bg-slate-900 text-white"
            : "bg-gradient-to-br from-indigo-500 via-violet-500 to-cyan-400 text-white hover:scale-105"
        }`}
      >
        {open ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M6 6l12 12M6 18L18 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        ) : (
          <>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              <path
                d="M21 12a8 8 0 0 1-11.6 7.1L4 21l1.9-5.4A8 8 0 1 1 21 12z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
            <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-slate-950" />
          </>
        )}
      </button>

      {/* Chat panel */}
      <div
        role="dialog"
        aria-label={t.chat.title}
        aria-hidden={!open}
        className={`no-print fixed bottom-24 right-5 z-50 w-[calc(100vw-2.5rem)] origin-bottom-right transition-all duration-200 ${
          expanded ? "max-w-[760px]" : "max-w-[380px]"
        } ${
          open
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-3 pointer-events-none"
        }`}
      >
        <div
          // Solid bg-background (not .glass): page content bleeding through the
          // blur made the chat hard to read.
          className={`bg-background rounded-2xl overflow-hidden border border-border shadow-2xl shadow-slate-950/40 flex flex-col transition-all duration-200 ${
            expanded ? "h-[85vh] max-h-[850px]" : "h-[70vh] max-h-[560px]"
          }`}
        >
          {/* Header */}
          <div className="flex items-center gap-3 p-4 border-b border-border bg-gradient-to-r from-indigo-500/20 via-violet-500/15 to-cyan-400/20">
            <button
              type="button"
              onClick={onAvatarTap}
              aria-label={t.chat.title}
              className="relative h-10 w-10 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-cyan-400 shrink-0 cursor-default"
            >
              <Image
                src="/profile-nobg.png"
                alt=""
                fill
                sizes="40px"
                className="object-cover object-top pointer-events-none"
              />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {isAdminView ? t.chat.admin.inbox : t.chat.title}
              </p>
              <p className="text-[11px] text-foreground/70 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                {isAdminView
                  ? (admin.email ?? "—")
                  : `${t.chat.status} · ${t.chat.subtitle}`}
              </p>
            </div>
            {/* Escape hatch for the tapped-open login form; a detected admin
                signs out from inside the inbox instead. */}
            {adminMode && !admin.isAdmin ? (
              <button
                type="button"
                onClick={() => setAdminMode(false)}
                className="text-[11px] text-foreground/60 hover:text-foreground px-1"
              >
                {t.chat.admin.back}
              </button>
            ) : (
              !isAdminView &&
              chat.user && (
                <button
                  type="button"
                  onClick={() => void chat.signOut()}
                  className="text-[11px] text-foreground/60 hover:text-foreground px-1"
                >
                  {t.chat.admin.signOut}
                </button>
              )
            )}
            <button
              type="button"
              aria-label={expanded ? t.chat.collapse : t.chat.expand}
              title={expanded ? t.chat.collapse : t.chat.expand}
              onClick={() => setExpanded((v) => !v)}
              className="text-foreground/70 hover:text-foreground p-1 rounded"
            >
              {expanded ? <CollapseIcon /> : <ExpandIcon />}
            </button>
            <button
              type="button"
              aria-label={t.chat.close}
              onClick={() => setOpen(false)}
              className="text-foreground/70 hover:text-foreground p-1 rounded"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M6 6l12 12M6 18L18 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>

          {!isSupabaseConfigured ? (
            <div className="flex-1 grid place-items-center p-6">
              <p className="text-sm text-foreground/60 text-center">{t.chat.unavailable}</p>
            </div>
          ) : isAdminView ? (
            <AdminPanel
              session={admin}
              signIn={admin.signIn}
              signOut={handleSignOut}
            />
          ) : (
            <>
              {/* Tabs appear once signed in. */}
              {chat.user && (
                <div className="flex border-b border-border">
                  {(["chat", "community", "profile"] as const).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setTab(key)}
                      className={`flex-1 py-2 text-[11px] font-medium transition border-b-2 inline-flex items-center justify-center gap-1.5 ${
                        tab === key
                          ? "border-indigo-500 text-foreground"
                          : "border-transparent text-foreground/50 hover:text-foreground"
                      }`}
                    >
                      {TAB_ICONS[key]}
                      {t.chat.tabs[key]}
                    </button>
                  ))}
                </div>
              )}
              {!chat.user || tab === "chat" ? (
                <VisitorPanel chat={chat} />
              ) : tab === "community" ? (
                <CommunityPanel userId={chat.user.id} />
              ) : (
                <ProfilePanel userId={chat.user.id} email={chat.user.email} />
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
