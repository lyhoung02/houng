"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import {
  MAX_POST_IMAGE_BYTES,
  MAX_POST_IMAGES,
  useNokor,
} from "@/lib/supabase/useNokor";
import { useT } from "../providers/LanguageProvider";
import NokorPrefs from "./NokorPrefs";
import NokorProfileMenu from "./NokorProfileMenu";
import PostCard from "./PostCard";

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

type ImagePick = { file: File; url: string };

function Composer({
  busy,
  onPost,
  onDone,
  autoFocus,
}: {
  busy: boolean;
  onPost: (body: string, images: File[]) => Promise<boolean>;
  onDone?: () => void;
  autoFocus?: boolean;
}) {
  const t = useT();
  const [body, setBody] = useState("");
  const [picks, setPicks] = useState<ImagePick[]>([]);
  const [localError, setLocalError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const clearAll = () => {
    picks.forEach((p) => URL.revokeObjectURL(p.url));
    setPicks([]);
    if (fileRef.current) fileRef.current.value = "";
  };

  const addFiles = (files: FileList | null) => {
    setLocalError(null);
    if (!files || !files.length) return;
    const incoming = Array.from(files);
    if (incoming.some((f) => f.size > MAX_POST_IMAGE_BYTES)) {
      setLocalError(t.nokor.composer.imageTooLarge);
      return;
    }
    setPicks((prev) => {
      const room = MAX_POST_IMAGES - prev.length;
      if (room <= 0) {
        setLocalError(t.nokor.composer.tooManyImages.replace("{n}", String(MAX_POST_IMAGES)));
        return prev;
      }
      if (incoming.length > room) {
        setLocalError(t.nokor.composer.tooManyImages.replace("{n}", String(MAX_POST_IMAGES)));
      }
      const added = incoming.slice(0, room).map((file) => ({
        file,
        url: URL.createObjectURL(file),
      }));
      return [...prev, ...added];
    });
    if (fileRef.current) fileRef.current.value = "";
  };

  const removeAt = (i: number) => {
    setPicks((prev) => {
      const target = prev[i];
      if (target) URL.revokeObjectURL(target.url);
      return prev.filter((_, idx) => idx !== i);
    });
  };

  const submit = async () => {
    if (busy || (!body.trim() && !picks.length)) return;
    const ok = await onPost(
      body,
      picks.map((p) => p.file),
    );
    if (ok) {
      setBody("");
      clearAll();
      onDone?.();
    }
  };

  const atMax = picks.length >= MAX_POST_IMAGES;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
      className="glass rounded-2xl p-4 sm:p-5"
    >
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={t.nokor.composer.placeholder}
        rows={3}
        maxLength={2000}
        autoFocus={autoFocus}
        className="w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-indigo-400/60"
      />
      {picks.length > 0 && (
        <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
          {picks.map((p, i) => (
            <div key={p.url} className="relative aspect-square overflow-hidden rounded-xl border border-border">
              <Image src={p.url} alt="" fill unoptimized className="object-cover" />
              <button
                type="button"
                onClick={() => removeAt(i)}
                aria-label={t.nokor.composer.removePhoto}
                className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-xs text-white"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
      {localError && <p className="mt-2 text-sm text-rose-400">{localError}</p>}
      <div className="mt-3 flex items-center justify-between">
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => addFiles(e.target.files)}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={atMax}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm opacity-70 transition hover:bg-surface-strong hover:opacity-100 disabled:opacity-40"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <rect x="3" y="5" width="18" height="14" rx="2" stroke="currentColor" strokeWidth="1.6" />
            <circle cx="9" cy="10" r="1.6" fill="currentColor" />
            <path d="M5 17l4.5-4.5 3 3L16 12l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
          </svg>
          {t.nokor.composer.addPhoto}
          {picks.length > 0 && <span className="opacity-60">{picks.length}/{MAX_POST_IMAGES}</span>}
        </button>
        <button
          type="submit"
          disabled={busy || (!body.trim() && !picks.length)}
          className="rounded-full bg-indigo-500 px-5 py-2 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:opacity-40"
        >
          {busy ? t.nokor.composer.posting : t.nokor.composer.post}
        </button>
      </div>
    </form>
  );
}

export default function NokorApp() {
  const t = useT();
  const fk = useNokor();
  const [composeOpen, setComposeOpen] = useState(false);

  return (
    <div className="mx-auto min-h-dvh w-full max-w-2xl px-4 pb-16 sm:px-6">
      <header className="sticky top-0 z-10 -mx-4 mb-6 border-b border-border bg-background/80 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
        <div className="flex items-center gap-2">
          <Image
            src="/nokor.png"
            alt={t.nokor.title}
            width={56}
            height={36}
            unoptimized
            priority
            className="h-9 w-14 shrink-0 rounded-lg object-contain ring-1 ring-border"
          />
          <h1 className="font-nokor text-gold pb-0.5 text-3xl font-bold leading-tight sm:text-4xl">
            {t.nokor.title}
          </h1>
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
        <div className="space-y-4">
          <Composer busy={fk.busy} onPost={fk.createPost} />
          {fk.error && <p className="text-sm text-rose-400">{fk.error}</p>}
          {!fk.feedLoaded ? (
            <p className="py-10 text-center text-sm opacity-60">{t.nokor.feed.loading}</p>
          ) : fk.posts.length === 0 ? (
            <p className="py-10 text-center text-sm opacity-60">{t.nokor.feed.empty}</p>
          ) : (
            fk.posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                userId={fk.userId!}
                onToggleLike={() => void fk.toggleLike(post)}
                onEdit={(body) => fk.editPost(post.id, body)}
                onDelete={() => void fk.deletePost(post)}
                onComment={(body, replyToId) => fk.addComment(post.id, body, replyToId)}
                onToggleCommentLike={(comment) => void fk.toggleCommentLike(post.id, comment)}
                onDeleteComment={(id) => void fk.deleteComment(id)}
              />
            ))
          )}
        </div>
      )}

      {/* Floating compose button — post from anywhere in the feed without
          scrolling back to the top. */}
      {isSupabaseConfigured && fk.userId && (
        <button
          type="button"
          onClick={() => setComposeOpen(true)}
          aria-label={t.nokor.feed.newPost}
          className="fixed right-5 bottom-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500 text-white shadow-lg shadow-indigo-500/30 transition hover:bg-indigo-400 sm:right-8 sm:bottom-8"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>
      )}

      {composeOpen && (
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
            <Composer
              busy={fk.busy}
              onPost={fk.createPost}
              onDone={() => setComposeOpen(false)}
              autoFocus
            />
          </div>
        </div>
      )}

      <footer className="mt-12 text-center">
        <Link href="/" className="text-xs opacity-50 transition hover:opacity-100">
          ← {t.nokor.backToPortfolio}
        </Link>
      </footer>
    </div>
  );
}
