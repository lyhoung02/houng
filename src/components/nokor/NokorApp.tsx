"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useMemo, useState } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useNokor } from "@/lib/supabase/useNokor";
import type { Gender, NokorSignUpMeta } from "@/lib/supabase/types";
import { useT } from "../providers/LanguageProvider";
import NokorActivity from "./NokorActivity";
import NokorAddressSelect, { type AddressValue } from "./NokorAddressSelect";
import NokorCaptcha, { captchaEnabled } from "./NokorCaptcha";
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

const authField =
  "w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-indigo-400/60";

// Signup and password reset require a strong password: 8+ chars with an
// uppercase letter, a digit, and a symbol.
const passwordStrong = (pw: string) =>
  pw.length >= 8 && /[A-Z]/.test(pw) && /[0-9]/.test(pw) && /[^A-Za-z0-9]/.test(pw);

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </svg>
  );
}

function PasskeyIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 11a4 4 0 1 0-4-4 M12 3a4 4 0 0 1 4 4c0 1.1-.45 2.1-1.17 2.83 M6 21v-1a6 6 0 0 1 8.5-5.45 M17.5 14.5a2.5 2.5 0 0 1 1 4.8V21l1.5 1.5L21.5 21l-1-1 1-1-1.3-1.3a2.5 2.5 0 0 0-2.7-2.2z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AuthPanel({
  signIn,
  signUp,
  signInWithGoogle,
  signInWithPasskey,
  resetPassword,
}: {
  signIn: (identifier: string, password: string, captchaToken?: string) => Promise<string | null>;
  signUp: (
    email: string,
    password: string,
    meta?: NokorSignUpMeta,
    captchaToken?: string,
  ) => Promise<string | null>;
  signInWithGoogle: () => Promise<string | null>;
  signInWithPasskey: (captchaToken?: string) => Promise<string | null>;
  resetPassword: (email: string, captchaToken?: string) => Promise<string | null>;
}) {
  const t = useT();
  const [mode, setMode] = useState<"signin" | "signup" | "verify" | "forgot">("signin");
  const [notice, setNotice] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [gender, setGender] = useState<Gender | "">("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState<AddressValue>({
    province_code: null,
    district_code: null,
    commune_code: null,
    village_code: null,
  });
  const [addressDisplay, setAddressDisplay] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaReset, setCaptchaReset] = useState(0);

  // A captcha token is single-use: after a failed call, force a fresh one.
  const fail = (err: string) => {
    setError(err);
    if (captchaEnabled) setCaptchaReset((n) => n + 1);
  };

  const submit = async () => {
    if (busy || !email.trim() || (mode !== "forgot" && !password)) return;
    if (mode === "signup" && (!firstName.trim() || !lastName.trim())) return;
    if (captchaEnabled && !captchaToken) return;
    if (mode === "signup" && !passwordStrong(password)) {
      setError(t.nokor.auth.passwordRule);
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    const token = captchaToken ?? undefined;
    if (mode === "forgot") {
      const err = await resetPassword(email.trim(), token);
      if (err) fail(err);
      else setNotice(t.nokor.auth.resetSent);
    } else if (mode === "signup") {
      const err = await signUp(
        email.trim(),
        password,
        {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          gender: gender || null,
          phone: phone.trim() || null,
          current_province_code: address.province_code,
          current_district_code: address.district_code,
          current_commune_code: address.commune_code,
          current_village_code: address.village_code,
          current_city: addressDisplay || null,
        },
        token,
      );
      if (err) fail(err);
      else setMode("verify");
    } else {
      const err = await signIn(email.trim(), password, token);
      if (err) fail(err);
    }
    setBusy(false);
  };

  if (mode === "verify") {
    return (
      <div className="glass mx-auto mt-10 w-full max-w-sm rounded-2xl p-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-500/15 text-indigo-400">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M4 6h16v12H4z M4 7l8 6 8-6"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2 className="mt-4 text-lg font-semibold">{t.nokor.auth.verifyTitle}</h2>
        <p className="mt-2 text-sm opacity-70">{t.nokor.auth.verifySent}</p>
        <p className="mt-1 text-sm font-medium">{email.trim()}</p>
        <p className="mt-3 text-sm opacity-70">{t.nokor.auth.verifyHint}</p>
        <button
          type="button"
          onClick={() => setMode("signin")}
          className="mt-5 w-full rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-400"
        >
          {t.nokor.auth.backToSignIn}
        </button>
      </div>
    );
  }

  return (
    <div className="glass mx-auto mt-10 w-full max-w-sm rounded-2xl p-6">
      <h2 className="text-lg font-semibold">
        {mode === "signin"
          ? t.nokor.auth.signIn
          : mode === "forgot"
            ? t.nokor.auth.resetTitle
            : t.nokor.auth.signUp}
      </h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="mt-4 space-y-3"
      >
        {mode === "signup" && (
          <>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                required
                maxLength={40}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder={t.nokor.auth.firstName}
                className={authField}
              />
              <input
                type="text"
                required
                maxLength={40}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder={t.nokor.auth.lastName}
                className={authField}
              />
            </div>
            <select
              required
              value={gender}
              onChange={(e) => setGender(e.target.value as Gender | "")}
              className={`${authField} ${gender ? "" : "opacity-60"}`}
            >
              <option value="">{t.nokor.profile.gender} — {t.nokor.profile.address.select}</option>
              {(Object.keys(t.nokor.profile.genders) as Gender[]).map((g) => (
                <option key={g} value={g}>
                  {t.nokor.profile.genders[g]}
                </option>
              ))}
            </select>
            <input
              type="tel"
              required
              minLength={5}
              maxLength={30}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t.nokor.profile.phonePlaceholder}
              className={authField}
            />
            <NokorAddressSelect
              title={t.nokor.auth.address}
              labels={t.nokor.profile.address}
              value={address}
              onChange={(next, display) => {
                setAddress(next);
                setAddressDisplay(display);
              }}
            />
          </>
        )}
        <input
          type={mode === "signin" ? "text" : "email"}
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={mode === "signin" ? t.nokor.auth.emailOrPhone : t.nokor.auth.email}
          className={authField}
        />
        {mode !== "forgot" && (
          <input
            type="password"
            required
            minLength={mode === "signup" ? 8 : 6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t.nokor.auth.password}
            className={authField}
          />
        )}
        {mode === "signup" && !error && (
          <p className="text-xs opacity-60">{t.nokor.auth.passwordRule}</p>
        )}
        {error && <p className="text-sm text-rose-400">{error}</p>}
        {notice && <p className="text-sm text-emerald-400">{notice}</p>}
        <NokorCaptcha onToken={setCaptchaToken} resetSignal={captchaReset} />
        <button
          type="submit"
          disabled={busy || (captchaEnabled && !captchaToken)}
          className="w-full rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:opacity-50"
        >
          {mode === "signin"
            ? t.nokor.auth.signIn
            : mode === "forgot"
              ? t.nokor.auth.resetSend
              : t.nokor.auth.signUp}
        </button>
      </form>
      {mode === "signin" && (
        <button
          type="button"
          onClick={() => {
            setMode("forgot");
            setError(null);
            setNotice(null);
          }}
          className="mt-3 block text-sm opacity-70 transition hover:opacity-100"
        >
          {t.nokor.auth.forgotPassword}
        </button>
      )}
      {mode !== "forgot" && (
        <>
          <div className="mt-4 flex items-center gap-3 text-xs opacity-50">
            <span className="h-px flex-1 bg-border" />
            {t.nokor.auth.or}
            <span className="h-px flex-1 bg-border" />
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={async () => {
              setError(null);
              const err = await signInWithGoogle();
              if (err) setError(err);
            }}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium transition hover:border-indigo-400/60 disabled:opacity-50"
          >
            <GoogleIcon />
            {t.nokor.auth.continueWithGoogle}
          </button>
          {mode === "signin" && (
            <button
              type="button"
              disabled={busy || (captchaEnabled && !captchaToken)}
              onClick={async () => {
                setError(null);
                const err = await signInWithPasskey(captchaToken ?? undefined);
                if (err) fail(err);
              }}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-surface px-4 py-2.5 text-sm font-medium transition hover:border-indigo-400/60 disabled:opacity-50"
            >
              <PasskeyIcon />
              {t.nokor.auth.signInWithPasskey}
            </button>
          )}
        </>
      )}
      <button
        type="button"
        onClick={() => {
          setMode((m) => (m === "signin" ? "signup" : "signin"));
          setError(null);
          setNotice(null);
        }}
        className="mt-4 block text-sm opacity-70 transition hover:opacity-100"
      >
        {mode === "signin" ? t.nokor.auth.needAccount : t.nokor.auth.haveAccount}
      </button>
    </div>
  );
}

/** Shown after a password-reset link signs the user in (PASSWORD_RECOVERY):
 *  forces choosing a new strong password before entering the app. */
function ResetPasswordPanel({
  updatePassword,
}: {
  updatePassword: (password: string) => Promise<string | null>;
}) {
  const t = useT();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (busy || !password) return;
    if (!passwordStrong(password)) {
      setError(t.nokor.auth.passwordRule);
      return;
    }
    if (password !== confirm) {
      setError(t.nokor.auth.passwordMismatch);
      return;
    }
    setBusy(true);
    setError(null);
    const err = await updatePassword(password);
    if (err) setError(err);
    setBusy(false);
  };

  return (
    <div className="glass mx-auto mt-10 w-full max-w-sm rounded-2xl p-6">
      <h2 className="text-lg font-semibold">{t.nokor.auth.resetTitle}</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="mt-4 space-y-3"
      >
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t.nokor.auth.newPassword}
          className={authField}
        />
        <input
          type="password"
          required
          minLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder={t.nokor.auth.confirmPassword}
          className={authField}
        />
        {!error && <p className="text-xs opacity-60">{t.nokor.auth.passwordRule}</p>}
        {error && <p className="text-sm text-rose-400">{error}</p>}
        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:opacity-50"
        >
          {t.nokor.auth.savePassword}
        </button>
      </form>
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
                  onAddPasskey={fk.registerPasskey}
                />
              )}
            </div>
          </div>
        </header>

        {!isSupabaseConfigured ? (
          <p className="mt-16 text-center text-sm opacity-70">{t.nokor.unavailable}</p>
        ) : !fk.authLoaded ? null : !fk.userId ? (
          <AuthPanel
            signIn={fk.signIn}
            signUp={fk.signUp}
            signInWithGoogle={fk.signInWithGoogle}
            signInWithPasskey={fk.signInWithPasskey}
            resetPassword={fk.resetPassword}
          />
        ) : fk.recovery ? (
          <ResetPasswordPanel updatePassword={fk.updatePassword} />
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

        {process.env.NEXT_PUBLIC_APP !== "nokor" && (
          <footer className="mt-12 text-center">
            <Link
              href={process.env.NEXT_PUBLIC_PORTFOLIO_URL || "/"}
              className="text-xs opacity-50 transition hover:opacity-100"
            >
              ← {t.nokor.backToPortfolio}
            </Link>
          </footer>
        )}
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
