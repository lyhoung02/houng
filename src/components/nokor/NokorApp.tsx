"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useNokor } from "@/lib/supabase/useNokor";
import { useT } from "../providers/LanguageProvider";
import NokorActivity from "./NokorActivity";
import NokorChat from "./NokorChat";
import NokorComposer from "./NokorComposer";
import NokorFeed from "./NokorFeed";
import NokorPostDetail from "./NokorPostDetail";
import NokorPrefs from "./NokorPrefs";
import NokorProfile from "./NokorProfile";
import NokorProfileMenu from "./NokorProfileMenu";
import NokorTabBar, { type NokorTab } from "./NokorTabBar";
import { NokorNavProvider } from "./useNokorNav";
import { useNokorRoute } from "./useNokorRoute";

function AuthPanel({
  signIn,
  signUp,
}: {
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<string | null>;
}) {
  const t = useT();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy || !email.trim() || !password) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    if (mode === "signup") {
      const err = await signUp(email.trim(), password);
      if (err) setError(err);
      else setNotice(t.nokor.auth.checkEmail);
    } else {
      const err = await signIn(email.trim(), password);
      if (err) setError(err);
    }
    setBusy(false);
  };

  return (
    <div className="glass mx-auto mt-10 w-full max-w-sm rounded-2xl p-6">
      <h2 className="text-lg font-semibold">
        {mode === "signin" ? t.nokor.auth.signIn : t.nokor.auth.signUp}
      </h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="mt-4 space-y-3"
      >
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t.nokor.auth.email}
          className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-indigo-400/60"
        />
        <input
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t.nokor.auth.password}
          className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-indigo-400/60"
        />
        {error && <p className="text-sm text-rose-400">{error}</p>}
        {notice && <p className="text-sm text-emerald-400">{notice}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:opacity-50"
        >
          {mode === "signin" ? t.nokor.auth.signIn : t.nokor.auth.signUp}
        </button>
      </form>
      <button
        type="button"
        onClick={() => {
          setMode((m) => (m === "signin" ? "signup" : "signin"));
          setError(null);
          setNotice(null);
        }}
        className="mt-4 text-sm opacity-70 transition hover:opacity-100"
      >
        {mode === "signin" ? t.nokor.auth.needAccount : t.nokor.auth.haveAccount}
      </button>
    </div>
  );
}

export default function NokorApp() {
  const t = useT();
  const fk = useNokor();
  const { route, navigate } = useNokorRoute();
  const [chatUserId, setChatUserId] = useState<string | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);

  const openProfile = useCallback(
    (userId: string) => navigate({ name: "profile", userId }),
    [navigate],
  );
  const openChat = useCallback(
    (userId: string) => {
      setChatUserId(userId);
      navigate({ name: "chat" });
    },
    [navigate],
  );
  const openPost = useCallback(
    (postId: string) => navigate({ name: "post", postId }),
    [navigate],
  );
  const nav = useMemo(
    () => ({ openProfile, openChat, openPost }),
    [openProfile, openChat, openPost],
  );

  // Which bottom-tab is highlighted for the current route (post detail keeps
  // Home lit since it opens from the feed).
  const activeTab: NokorTab =
    route.name === "profile"
      ? "profile"
      : route.name === "chat"
        ? "chat"
        : route.name === "activity"
          ? "activity"
          : "home";
  const profileUserId = route.name === "profile" ? route.userId : null;

  const signedIn = isSupabaseConfigured && fk.userId;

  return (
    <NokorNavProvider value={nav}>
      <div className="mx-auto min-h-dvh w-full max-w-2xl px-4 pb-24 sm:px-6">
        <header className="sticky top-0 z-20 -mx-4 mb-6 border-b border-border bg-background/80 px-4 py-0 backdrop-blur sm:-mx-6 sm:px-6">
          <div className="flex items-center gap-2">
            <Image
              src="/nokor.png"
              alt={t.nokor.title}
              width={128}
              height={108}
              unoptimized
              priority
              className="h-20 w-28 shrink-0 object-contain"
            />
            <div className="ml-auto flex items-center gap-2">
              <NokorPrefs />
              {fk.userId && (
                <NokorProfileMenu
                  userId={fk.userId}
                  email={fk.email}
                  onSignOut={() => void fk.signOut()}
                />
              )}
            </div>
          </div>
        </header>

        {!isSupabaseConfigured ? (
          <p className="mt-16 text-center text-sm opacity-70">{t.nokor.unavailable}</p>
        ) : !fk.authLoaded ? null : !fk.userId ? (
          <AuthPanel signIn={fk.signIn} signUp={fk.signUp} />
        ) : (
          <>
            {route.name === "home" && <NokorFeed fk={fk} />}
            {route.name === "activity" && <NokorActivity meId={fk.userId} />}
            {route.name === "chat" && (
              <NokorChat
                meId={fk.userId}
                openWithUserId={chatUserId}
                onConsumed={() => setChatUserId(null)}
              />
            )}
            {route.name === "profile" && (
              <NokorProfile
                key={profileUserId ?? fk.userId}
                meId={fk.userId}
                userId={profileUserId ?? fk.userId}
              />
            )}
            {route.name === "post" && (
              <NokorPostDetail
                key={route.postId}
                postId={route.postId}
                meId={fk.userId}
                onBack={() => navigate({ name: "home" })}
              />
            )}
          </>
        )}

        <footer className="mt-12 text-center">
          <Link href="/" className="text-xs opacity-50 transition hover:opacity-100">
            ← {t.nokor.backToPortfolio}
          </Link>
        </footer>
      </div>

      {signedIn && (
        <NokorTabBar
          active={activeTab}
          onChange={(next) => {
            if (next === "profile") navigate({ name: "profile", userId: null });
            else navigate({ name: next });
          }}
          onNewPost={() => setComposeOpen(true)}
        />
      )}

      {signedIn && composeOpen && (
        <div
          className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm sm:items-center"
          onClick={() => setComposeOpen(false)}
        >
          <div className="w-full max-w-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">{t.nokor.feed.newPost}</h2>
              <button
                type="button"
                onClick={() => setComposeOpen(false)}
                aria-label={t.nokor.feed.cancel}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
              >
                ✕
              </button>
            </div>
            <NokorComposer
              busy={fk.busy}
              onPost={fk.createPost}
              onDone={() => setComposeOpen(false)}
              autoFocus
            />
          </div>
        </div>
      )}
    </NokorNavProvider>
  );
}
