"use client";

import { useEffect, useState } from "react";
import { useT } from "../providers/LanguageProvider";
import { getSupabase } from "@/lib/supabase/client";
import { avatarUrl } from "@/lib/supabase/attachments";
import { useAdminInbox, type AdminSession } from "@/lib/supabase/useChat";
import { ThreadView } from "./ThreadView";
import { CommunityPanel } from "./CommunityPanel";

type SignIn = (email: string, password: string) => Promise<string | null>;

export function AdminPanel({
  session,
  signIn,
  signOut,
}: {
  session: AdminSession;
  signIn: SignIn;
  signOut: () => Promise<void>;
}) {
  const t = useT();
  const [tab, setTab] = useState<"inbox" | "community">("inbox");

  if (!session.ready) {
    return <div className="flex-1 grid place-items-center text-foreground/50 text-sm">…</div>;
  }
  if (!session.isAdmin) {
    return <AdminLogin signIn={signIn} signedInEmail={session.email} />;
  }
  return (
    <>
      <div className="flex border-b border-border">
        {(["inbox", "community"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex-1 py-2 text-[11px] font-medium transition border-b-2 ${
              tab === key
                ? "border-indigo-500 text-foreground"
                : "border-transparent text-foreground/50 hover:text-foreground"
            }`}
          >
            {key === "inbox" ? t.chat.admin.inbox : t.chat.tabs.community}
          </button>
        ))}
      </div>
      {tab === "inbox" ? (
        <AdminInbox signOut={signOut} />
      ) : session.userId ? (
        <CommunityPanel userId={session.userId} isAdmin />
      ) : null}
    </>
  );
}

function AdminLogin({
  signIn,
  signedInEmail,
}: {
  signIn: SignIn;
  signedInEmail: string | null;
}) {
  const t = useT();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [signInError, setSignInError] = useState<string | null>(null);

  // Signed in with a real (non-anonymous) account that isn't in the admins
  // table — say so, rather than silently showing an empty login form.
  const error = signInError ?? (signedInEmail ? t.chat.admin.notAdmin : null);

  const submit = async () => {
    if (!email.trim() || !password) return;
    setBusy(true);
    setSignInError(null);
    const err = await signIn(email.trim(), password);
    setBusy(false);
    if (err) setSignInError(err);
    else setPassword("");
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      <p className="text-sm font-semibold text-foreground">{t.chat.admin.heading}</p>
      <Field
        label={t.chat.admin.email}
        type="email"
        value={email}
        onChange={setEmail}
        autoComplete="username"
      />
      <Field
        label={t.chat.admin.password}
        type="password"
        value={password}
        onChange={setPassword}
        autoComplete="current-password"
        onEnter={submit}
      />
      {error && <p className="text-xs text-rose-600 dark:text-rose-300">{error}</p>}
      <button
        type="button"
        onClick={submit}
        disabled={busy || !email.trim() || !password}
        className="w-full rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 text-white text-sm font-medium py-2 disabled:opacity-40 hover:scale-[1.01] transition"
      >
        {busy ? t.chat.admin.signingIn : t.chat.admin.signIn}
      </button>
    </div>
  );
}

function AdminInbox({ signOut }: { signOut: () => Promise<void> }) {
  const t = useT();
  const inbox = useAdminInbox(true);
  const { conversations, selectedId, setSelectedId, error } = inbox;
  // Tagged with the visitor it was fetched for, so switching threads derives
  // null instead of clearing state inside the effect.
  const [avatarState, setAvatarState] = useState<{ id: string; url: string | null }>({
    id: "",
    url: null,
  });

  const selected = conversations.find((c) => c.id === selectedId) ?? null;
  const visitorId = selected?.visitor_id ?? null;

  // The open thread's visitor avatar, if they've set one on their profile.
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !visitorId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("avatar_path")
        .eq("user_id", visitorId)
        .maybeSingle();
      if (!cancelled) {
        setAvatarState({ id: visitorId, url: avatarUrl(supabase, data?.avatar_path) });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visitorId]);

  const visitorAvatar = avatarState.id === visitorId ? avatarState.url : null;

  if (!selected) {
    return (
      <>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 && (
            <p className="p-4 text-sm text-foreground/50">{t.chat.admin.empty}</p>
          )}
          {conversations.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSelectedId(c.id)}
              className="w-full text-left px-4 py-3 border-b border-border hover:bg-surface transition"
            >
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground truncate flex-1">
                  {c.visitor_name}
                </p>
                {c.unread_for_admin > 0 && (
                  <span className="shrink-0 rounded-full bg-indigo-500 text-white text-[10px] px-1.5 py-0.5">
                    {c.unread_for_admin}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-foreground/50 truncate">{c.visitor_email}</p>
            </button>
          ))}
        </div>
        {error && <p className="px-4 py-2 text-xs text-rose-600 dark:text-rose-300">{error}</p>}
        <div className="border-t border-border p-3">
          <button
            type="button"
            onClick={() => void signOut()}
            className="text-xs text-foreground/60 hover:text-foreground"
          >
            {t.chat.admin.signOut}
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border">
        <button
          type="button"
          onClick={() => setSelectedId(null)}
          className="text-xs text-foreground/70 hover:text-foreground"
        >
          ← {t.chat.admin.back}
        </button>
        <p className="text-xs text-foreground/50 truncate">{selected.visitor_email}</p>
      </div>
      <ThreadView
        thread={inbox}
        mineIs="admin"
        peerAuthor={{
          name: selected.visitor_name,
          avatarUrl: visitorAvatar,
        }}
      />
    </>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  autoComplete,
  onEnter,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  onEnter?: () => void;
}) {
  return (
    <label className="block">
      <span className="text-[11px] text-foreground/60">{label}</span>
      <input
        type={type}
        value={value}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && onEnter) {
            e.preventDefault();
            onEnter();
          }
        }}
        className="mt-1 w-full rounded-xl bg-surface border border-border px-3 py-2 text-sm text-foreground placeholder-foreground/40 focus:outline-none focus:border-indigo-400"
      />
    </label>
  );
}
