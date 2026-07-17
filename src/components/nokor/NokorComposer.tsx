"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { MAX_POST_IMAGE_BYTES, MAX_POST_IMAGES } from "@/lib/supabase/useNokor";
import { useT } from "../providers/LanguageProvider";

type ImagePick = { file: File; url: string };

export default function NokorComposer({
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
            <div
              key={p.url}
              className="relative aspect-square overflow-hidden rounded-xl border border-border"
            >
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
          {picks.length > 0 && (
            <span className="opacity-60">
              {picks.length}/{MAX_POST_IMAGES}
            </span>
          )}
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
