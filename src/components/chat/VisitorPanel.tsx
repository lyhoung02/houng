"use client";

import { useState } from "react";
import { useT } from "../providers/LanguageProvider";
import type { VisitorChat } from "@/lib/supabase/useChat";
import { ChatBubble } from "./ChatBubble";
import { ThreadView } from "./ThreadView";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function VisitorPanel({ chat }: { chat: VisitorChat }) {
  // Wait for the stored session to resolve before deciding, or a returning
  // visitor sees the sign-up form flash before their thread loads.
  if (!chat.authReady) {
    return <div className="flex-1 grid place-items-center text-foreground/40 text-sm">…</div>;
  }
  if (!chat.user) return <AuthForm chat={chat} />;
  if (!chat.conversationId) {
    return <div className="flex-1 grid place-items-center text-foreground/40 text-sm">…</div>;
  }
  return (
    <ThreadView
      thread={chat}
      mineIs="visitor"
      header={<WelcomeBubble />}
      beforeComposer={<Suggestions chat={chat} />}
      peerAuthor={ADMIN_AUTHOR}
    />
  );
}

/** The site owner, shown beside admin replies in the 1:1 thread. */
const ADMIN_AUTHOR = { name: "Pov Lyhoung", avatarUrl: "/profile-nobg.png" };

/** The canned greeting isn't a real row, so it renders as a plain bubble. */
function WelcomeBubble() {
  const t = useT();
  return (
    <ChatBubble
      message={{
        id: "welcome",
        conversation_id: "",
        sender: "admin",
        body: t.chat.welcome,
        created_at: "",
        emailed_at: null,
        kind: "text",
        attachment_path: null,
        attachment_name: null,
        attachment_size: null,
        attachment_mime: null,
        duration_ms: null,
        reply_to_id: null,
        edited_at: null,
        deleted_at: null,
        suggestion_key: null,
      }}
      mineIs="visitor"
      author={ADMIN_AUTHOR}
      labels={{
        deleted: t.chat.msg.deleted,
        edited: t.chat.msg.edited,
        reply: t.chat.msg.reply,
        edit: t.chat.msg.edit,
        delete: t.chat.msg.delete,
        react: t.chat.msg.react,
      }}
    />
  );
}

const MIN_PASSWORD = 6;

/** Email + password, with a sign-up / sign-in toggle. */
export function AuthForm({ chat }: { chat: VisitorChat }) {
  const t = useT();
  const [mode, setMode] = useState<"signup" | "signin">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState(false);

  const emailError = !EMAIL_RE.test(email.trim()) ? t.chat.form.invalidEmail : null;
  const passwordError =
    password.length < MIN_PASSWORD ? t.chat.form.invalidPassword : null;

  const submit = () => {
    setTouched(true);
    if (emailError || passwordError) return;
    if (mode === "signup") void chat.signUp(email.trim(), password);
    else void chat.signIn(email.trim(), password);
  };

  const signup = mode === "signup";

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3">
      <div>
        <p className="text-sm font-semibold text-foreground">
          {signup ? t.chat.form.heading : t.chat.form.signInHeading}
        </p>
        <p className="text-[11px] text-foreground/60 mt-0.5 leading-snug">
          {t.chat.form.blurb}
        </p>
      </div>

      <label className="block">
        <span className="text-[11px] text-foreground/60">{t.chat.form.email}</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t.chat.form.emailPlaceholder}
          autoComplete="email"
          className="mt-1 w-full rounded-xl bg-surface border border-border px-3 py-2 text-sm text-foreground placeholder-foreground/40 focus:outline-none focus:border-indigo-400"
        />
      </label>
      {touched && emailError && <p className="text-xs text-rose-600 dark:text-rose-300">{emailError}</p>}

      <label className="block">
        <span className="text-[11px] text-foreground/60">{t.chat.form.password}</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={t.chat.form.passwordPlaceholder}
          autoComplete={signup ? "new-password" : "current-password"}
          className="mt-1 w-full rounded-xl bg-surface border border-border px-3 py-2 text-sm text-foreground placeholder-foreground/40 focus:outline-none focus:border-indigo-400"
        />
      </label>
      {touched && passwordError && (
        <p className="text-xs text-rose-600 dark:text-rose-300">{passwordError}</p>
      )}

      {chat.awaitingConfirm && (
        <p className="text-xs text-amber-600 dark:text-amber-300">{t.chat.form.confirmSent}</p>
      )}

      {chat.error && (
        <p className="text-xs text-rose-600 dark:text-rose-300">
          {chat.error === "unconfigured" ? t.chat.unavailable : chat.error}
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={chat.loading}
        className="w-full rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 text-white text-sm font-medium py-2 disabled:opacity-40 hover:scale-[1.01] transition"
      >
        {chat.loading
          ? t.chat.form.starting
          : signup
            ? t.chat.form.submit
            : t.chat.form.signIn}
      </button>

      <button
        type="button"
        onClick={() => {
          setMode(signup ? "signin" : "signup");
          setTouched(false);
        }}
        className="w-full text-[11px] text-indigo-600 dark:text-indigo-300 hover:text-indigo-500 dark:hover:text-indigo-200"
      >
        {signup ? t.chat.form.haveAccount : t.chat.form.needAccount}
      </button>

      <p className="text-[10px] text-foreground/40 text-center">{t.chat.form.privacy}</p>
    </div>
  );
}

/**
 * Starter prompts, shown above the composer until the visitor says something.
 * Sending with `suggestionKey` is what tells the database to auto-answer.
 */
export function Suggestions({ chat }: { chat: VisitorChat }) {
  const t = useT();
  if (chat.messages.length > 0) return null;
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-2 -mx-1 px-1 no-scrollbar">
      {t.chat.suggestions.map((s) => (
        <button
          key={s.key}
          type="button"
          onClick={() => void chat.send(s.label, { suggestionKey: s.key })}
          className="shrink-0 text-[11px] rounded-full px-2.5 py-1 border border-border bg-surface text-foreground/80 hover:bg-surface-strong transition"
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
