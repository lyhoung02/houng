"use client";

import { useEffect, useState } from "react";
import { useT } from "../providers/LanguageProvider";
import { getSupabase } from "@/lib/supabase/client";
import { avatarUrl } from "@/lib/supabase/attachments";
import { useAdminInbox, type AdminSession } from "@/lib/supabase/useChat";
import { ThreadView } from "./ThreadView";
import { CommunityPanel } from "./CommunityPanel";
import { ProfilePanel } from "./ProfilePanel";
import { ChatTabIcon, UsersTabIcon, UserTabIcon } from "./icons";

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
  const [tab, setTab] = useState<"inbox" | "community" | "profile">("inbox");

  if (!session.ready) {
    return <div className="flex-1 grid place-items-center text-foreground/50 text-sm">…</div>;
  }
  if (!session.isAdmin) {
    return <AdminLogin signIn={signIn} signedInEmail={session.email} />;
  }

  const tabMeta = {
    inbox: { icon: <ChatTabIcon />, label: t.chat.admin.inbox },
    community: { icon: <UsersTabIcon />, label: t.chat.tabs.community },
    profile: { icon: <UserTabIcon />, label: t.chat.tabs.profile },
  } as const;

  return (
    <>
      <div className="flex border-b border-border">
        {(["inbox", "community", "profile"] as const).map((key) => (
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
            {tabMeta[key].icon}
            {tabMeta[key].label}
          </button>
        ))}
      </div>
      {tab === "inbox" ? (
        <AdminInbox signOut={signOut} />
      ) : !session.userId ? null : tab === "community" ? (
        <CommunityPanel userId={session.userId} isAdmin />
      ) : (
        <ProfilePanel userId={session.userId} email={session.email ?? ""} />
      )}
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
  // Avatar URL per visitor, fetched in one query for everyone in the list and
  // reused for the open thread. Missing profiles are stored as null so they
  // aren't refetched every render.
  const [avatars, setAvatars] = useState<Record<string, string | null>>({});
  // Ban list, keyed by user id.
  const [blocked, setBlocked] = useState<Record<string, "blocked" | "removed">>({});
  const [blockedRefresh, setBlockedRefresh] = useState(0);
  const [modError, setModError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.from("blocked_users").select("user_id, reason");
      if (cancelled) return;
      setBlocked(Object.fromEntries((data ?? []).map((b) => [b.user_id, b.reason])));
    })();
    return () => {
      cancelled = true;
    };
  }, [blockedRefresh]);

  const moderate = async (
    action: "admin_block_user" | "admin_unblock_user" | "admin_remove_user",
    targetId: string,
    confirmText?: string,
  ) => {
    const supabase = getSupabase();
    if (!supabase) return;
    if (confirmText && !window.confirm(confirmText)) return;
    const { error: rpcErr } = await supabase.rpc(action, { p_user_id: targetId });
    if (rpcErr) {
      setModError(rpcErr.message);
      return;
    }
    setModError(null);
    setBlockedRefresh((n) => n + 1);
    // A removed user's conversations are gone; drop back to the list.
    if (action === "admin_remove_user") setSelectedId(null);
  };

  const selected = conversations.find((c) => c.id === selectedId) ?? null;
  const visitorId = selected?.visitor_id ?? null;

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || conversations.length === 0) return;
    const missing = [
      ...new Set(
        conversations
          .map((c) => c.visitor_id)
          .filter((id): id is string => Boolean(id && !(id in avatars))),
      ),
    ];
    if (missing.length === 0) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, avatar_path")
        .in("user_id", missing);
      if (cancelled) return;
      setAvatars((prev) => {
        const next = { ...prev };
        for (const id of missing) next[id] = null;
        for (const p of data ?? []) next[p.user_id] = avatarUrl(supabase, p.avatar_path);
        return next;
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [conversations, avatars]);

  const visitorAvatar = visitorId ? (avatars[visitorId] ?? null) : null;

  if (!selected) {
    return (
      <>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 && (
            <p className="p-4 text-sm text-foreground/50">{t.chat.admin.empty}</p>
          )}
          {conversations.map((c) => {
            const url = c.visitor_id ? avatars[c.visitor_id] : null;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedId(c.id)}
                className="w-full text-left px-4 py-3 border-b border-border hover:bg-surface transition flex items-center gap-3"
              >
                {url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={url}
                    alt=""
                    className="h-9 w-9 rounded-full object-cover shrink-0 border border-border"
                  />
                ) : (
                  <span className="h-9 w-9 rounded-full shrink-0 grid place-items-center bg-indigo-500/25 text-xs font-semibold text-indigo-700 dark:text-indigo-200 border border-border">
                    {(c.visitor_name.trim()[0] ?? "?").toUpperCase()}
                  </span>
                )}
                <span className="flex-1 min-w-0">
                  <span className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground truncate flex-1">
                      {c.visitor_name}
                    </span>
                    {c.visitor_id && blocked[c.visitor_id] && (
                      <span className="shrink-0 rounded-full bg-rose-500/20 text-rose-600 dark:text-rose-300 text-[10px] px-1.5 py-0.5">
                        {t.chat.admin.blockedBadge}
                      </span>
                    )}
                    {c.unread_for_admin > 0 && (
                      <span className="shrink-0 rounded-full bg-indigo-500 text-white text-[10px] px-1.5 py-0.5">
                        {c.unread_for_admin}
                      </span>
                    )}
                  </span>
                  <span className="block text-[11px] text-foreground/50 truncate">
                    {c.visitor_email}
                  </span>
                </span>
              </button>
            );
          })}
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

  const isBlocked = Boolean(visitorId && blocked[visitorId]);

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
        <p className="text-xs text-foreground/50 truncate flex-1">
          {selected.visitor_email}
        </p>
        {visitorId && (
          <>
            <button
              type="button"
              onClick={() =>
                isBlocked
                  ? void moderate("admin_unblock_user", visitorId)
                  : void moderate(
                      "admin_block_user",
                      visitorId,
                      t.chat.admin.confirmBlock.replace("{name}", selected.visitor_name),
                    )
              }
              className="text-[11px] text-amber-600 dark:text-amber-300 hover:underline px-1"
            >
              {isBlocked ? t.chat.admin.unblock : t.chat.admin.block}
            </button>
            <button
              type="button"
              onClick={() =>
                void moderate(
                  "admin_remove_user",
                  visitorId,
                  t.chat.admin.confirmRemove.replace("{name}", selected.visitor_name),
                )
              }
              className="text-[11px] text-rose-600 dark:text-rose-300 hover:underline px-1"
            >
              {t.chat.admin.remove}
            </button>
          </>
        )}
      </div>
      {modError && (
        <p className="px-4 py-2 text-xs text-rose-600 dark:text-rose-300">{modError}</p>
      )}
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
