"use client";

import { useRef, useState } from "react";
import { useT } from "../providers/LanguageProvider";
import { useProfile } from "@/lib/supabase/useProfile";

const MIN_PASSWORD = 6;

export function ProfilePanel({
  userId,
  email,
}: {
  userId: string;
  email: string;
}) {
  const t = useT();
  const p = useProfile(userId);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const [username, setUsername] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);
  const [savedTick, setSavedTick] = useState(false);

  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pwBusy, setPwBusy] = useState(false);

  if (!p.loaded) {
    return (
      <div className="flex-1 grid place-items-center text-foreground/40 text-sm">…</div>
    );
  }

  // Local edits overlay the loaded profile until saved.
  const usernameValue = username ?? p.profile.username ?? "";
  const phoneValue = phone ?? p.profile.phone ?? "";

  const saveInfo = async () => {
    const ok = await p.save({ username: usernameValue, phone: phoneValue });
    if (ok) {
      setSavedTick(true);
      window.setTimeout(() => setSavedTick(false), 2000);
    }
  };

  const changePassword = async () => {
    if (pw1.length < MIN_PASSWORD) {
      setPwMsg({ ok: false, text: t.chat.profile.passwordTooShort });
      return;
    }
    if (pw1 !== pw2) {
      setPwMsg({ ok: false, text: t.chat.profile.passwordMismatch });
      return;
    }
    setPwBusy(true);
    setPwMsg(null);
    const err = await p.changePassword(pw1);
    setPwBusy(false);
    if (err) setPwMsg({ ok: false, text: err });
    else {
      setPwMsg({ ok: true, text: t.chat.profile.passwordUpdated });
      setPw1("");
      setPw2("");
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {/* Avatar + email */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          aria-label={t.chat.profile.changeAvatar}
          className="relative h-14 w-14 rounded-full overflow-hidden border border-border bg-surface grid place-items-center hover:opacity-80 transition shrink-0"
        >
          {p.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.avatar} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-lg font-semibold text-indigo-700 dark:text-indigo-200">
              {(usernameValue.trim()[0] || email[0] || "?").toUpperCase()}
            </span>
          )}
          <span className="absolute inset-x-0 bottom-0 bg-black/50 text-white text-[8px] py-0.5 text-center">
            {t.chat.profile.changeAvatar}
          </span>
        </button>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">
            {usernameValue.trim() || email.split("@")[0]}
          </p>
          <p className="text-[11px] text-foreground/50 truncate">{email}</p>
        </div>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void p.uploadAvatar(f);
          e.target.value = "";
        }}
      />

      {/* Editable info */}
      <div className="space-y-3">
        <Field
          label={t.chat.profile.username}
          value={usernameValue}
          placeholder={t.chat.profile.usernamePlaceholder}
          onChange={setUsername}
        />
        <Field
          label={t.chat.profile.phone}
          value={phoneValue}
          placeholder={t.chat.profile.phonePlaceholder}
          onChange={setPhone}
          type="tel"
        />
        {p.error && (
          <p className="text-xs text-rose-600 dark:text-rose-300">
            {p.error === "avatar-too-large" ? t.chat.profile.avatarTooLarge : p.error}
          </p>
        )}
        <button
          type="button"
          onClick={() => void saveInfo()}
          disabled={p.saving}
          className="w-full rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 text-white text-sm font-medium py-2 disabled:opacity-40 hover:scale-[1.01] transition"
        >
          {p.saving
            ? t.chat.profile.saving
            : savedTick
              ? t.chat.profile.saved
              : t.chat.profile.save}
        </button>
      </div>

      {/* Password */}
      <div className="pt-3 border-t border-border space-y-3">
        <p className="text-xs font-semibold text-foreground">
          {t.chat.profile.changePassword}
        </p>
        <Field
          label={t.chat.profile.newPassword}
          value={pw1}
          onChange={setPw1}
          type="password"
          autoComplete="new-password"
        />
        <Field
          label={t.chat.profile.confirmPassword}
          value={pw2}
          onChange={setPw2}
          type="password"
          autoComplete="new-password"
        />
        {pwMsg && (
          <p
            className={`text-xs ${
              pwMsg.ok
                ? "text-emerald-600 dark:text-emerald-300"
                : "text-rose-600 dark:text-rose-300"
            }`}
          >
            {pwMsg.text}
          </p>
        )}
        <button
          type="button"
          onClick={() => void changePassword()}
          disabled={pwBusy || !pw1 || !pw2}
          className="w-full rounded-xl border border-border bg-surface text-foreground text-sm font-medium py-2 disabled:opacity-40 hover:bg-surface-strong transition"
        >
          {pwBusy ? t.chat.profile.saving : t.chat.profile.updatePassword}
        </button>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  placeholder,
  onChange,
  type = "text",
  autoComplete,
}: {
  label: string;
  value: string;
  placeholder?: string;
  onChange: (v: string) => void;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] text-foreground/60">{label}</span>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl bg-surface border border-border px-3 py-2 text-sm text-foreground placeholder-foreground/40 focus:outline-none focus:border-indigo-400"
      />
    </label>
  );
}
