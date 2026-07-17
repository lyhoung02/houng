"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { nokorAvatarUrl } from "@/lib/supabase/useNokor";
import {
  DEFAULT_STORY_HOURS,
  MAX_STORY_IMAGE_BYTES,
  STORY_BACKGROUNDS,
  STORY_HOUR_OPTIONS,
  storyBgClass,
  type AddStoryInput,
  type NokorFollower,
} from "@/lib/supabase/useNokorStories";
import { useT } from "../providers/LanguageProvider";

function followerName(f: NokorFollower) {
  return f.username?.trim() || `user-${f.userId.slice(0, 4)}`;
}

export default function NokorAddStory({
  busy,
  followers,
  onAdd,
  onClose,
}: {
  busy: boolean;
  followers: NokorFollower[];
  onAdd: (input: AddStoryInput) => Promise<boolean>;
  onClose: () => void;
}) {
  const t = useT();
  const s = t.nokor.stories;
  const [mode, setMode] = useState<"photo" | "text">("photo");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [background, setBackground] = useState(STORY_BACKGROUNDS[0].key);
  const [hours, setHours] = useState(DEFAULT_STORY_HOURS);
  const [hidden, setHidden] = useState<string[]>([]);
  const [showHide, setShowHide] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const pick = (f: File | null) => {
    setError(null);
    if (!f) return;
    if (f.size > MAX_STORY_IMAGE_BYTES) {
      setError(t.nokor.composer.imageTooLarge);
      return;
    }
    if (preview) URL.revokeObjectURL(preview);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const toggleHidden = (userId: string) =>
    setHidden((prev) => (prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]));

  const canShare = mode === "photo" ? Boolean(file) : Boolean(text.trim());

  const submit = async () => {
    if (!canShare || busy) return;
    setError(null);
    const ok = await onAdd({
      image: mode === "photo" ? file : null,
      text,
      background: mode === "text" ? background : null,
      expiresHours: hours,
      hiddenFrom: hidden,
    });
    if (ok) {
      if (preview) URL.revokeObjectURL(preview);
      onClose();
    } else {
      setError(s.failed);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="glass my-auto w-full max-w-sm rounded-2xl p-4" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">{s.add}</h2>
          <button type="button" onClick={onClose} aria-label={t.nokor.feed.cancel} className="text-lg leading-none opacity-70 hover:opacity-100">
            ✕
          </button>
        </div>

        {/* Photo / Text switch */}
        <div className="mb-3 flex rounded-full border border-border p-0.5 text-sm">
          {(["photo", "text"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex-1 rounded-full py-1.5 transition ${
                mode === m ? "bg-indigo-500 text-white" : "opacity-70 hover:opacity-100"
              }`}
            >
              {m === "photo" ? s.photoStory : s.textStory}
            </button>
          ))}
        </div>

        <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => pick(e.target.files?.[0] ?? null)} />

        {/* Preview / editor */}
        {mode === "photo" ? (
          preview ? (
            <div className="relative aspect-[9/16] max-h-[42vh] overflow-hidden rounded-xl border border-border bg-surface">
              <Image src={preview} alt="" fill unoptimized className="object-contain" />
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex aspect-[9/16] max-h-[42vh] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-surface text-sm opacity-70"
            >
              <span className="text-3xl">＋</span>
              {s.pickImage}
            </button>
          )
        ) : (
          <div className={`relative flex aspect-[9/16] max-h-[42vh] w-full items-center justify-center overflow-hidden rounded-xl ${storyBgClass(background)}`}>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={s.textPlaceholder}
              maxLength={200}
              className="h-full w-full resize-none bg-transparent p-6 text-center text-lg font-semibold text-white placeholder:text-white/60 outline-none"
            />
          </div>
        )}

        {/* Photo caption */}
        {mode === "photo" && preview && (
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={s.captionPlaceholder}
            maxLength={200}
            className="mt-3 w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-indigo-400/60"
          />
        )}

        {/* Background swatches for text stories */}
        {mode === "text" && (
          <div className="mt-3 flex gap-2">
            {STORY_BACKGROUNDS.map((bg) => (
              <button
                key={bg.key}
                type="button"
                onClick={() => setBackground(bg.key)}
                aria-label={bg.key}
                className={`h-7 w-7 rounded-full ${bg.className} ${
                  background === bg.key ? "ring-2 ring-indigo-400 ring-offset-2 ring-offset-transparent" : ""
                }`}
              />
            ))}
          </div>
        )}

        {/* Expiry */}
        <div className="mt-3 flex items-center justify-between gap-2">
          <label htmlFor="story-hours" className="text-sm opacity-70">
            {s.expiresIn}
          </label>
          <select
            id="story-hours"
            value={hours}
            onChange={(e) => setHours(Number(e.target.value))}
            className="rounded-xl border border-border bg-surface px-3 py-1.5 text-sm outline-none focus:border-indigo-400/60"
          >
            {STORY_HOUR_OPTIONS.map((h) => (
              <option key={h} value={h}>
                {h === 24 ? s.hours24Default : s.hoursN.replace("{n}", String(h))}
              </option>
            ))}
          </select>
        </div>

        {/* Hide from followers */}
        {followers.length > 0 && (
          <div className="mt-3">
            <button
              type="button"
              onClick={() => setShowHide((v) => !v)}
              className="flex w-full items-center justify-between rounded-xl border border-border px-3 py-2 text-sm"
            >
              <span className="opacity-70">{s.hideFrom}</span>
              <span className="opacity-60">{hidden.length ? s.hiddenCount.replace("{n}", String(hidden.length)) : s.none}</span>
            </button>
            {showHide && (
              <div className="mt-2 max-h-36 space-y-1 overflow-y-auto rounded-xl border border-border p-1">
                {followers.map((f) => {
                  const avatar = nokorAvatarUrl({ username: f.username, avatar_path: f.avatar_path });
                  const on = hidden.includes(f.userId);
                  return (
                    <button
                      key={f.userId}
                      type="button"
                      onClick={() => toggleHidden(f.userId)}
                      className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition hover:bg-surface-strong"
                    >
                      {avatar ? (
                        <Image src={avatar} alt="" width={24} height={24} unoptimized className="h-6 w-6 rounded-full object-cover" />
                      ) : (
                        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/30 text-[10px] font-semibold uppercase">
                          {followerName(f).slice(0, 2)}
                        </span>
                      )}
                      <span className="min-w-0 flex-1 truncate">{followerName(f)}</span>
                      <span className={`text-xs ${on ? "text-rose-400" : "opacity-40"}`}>
                        {on ? s.hidden : ""}
                      </span>
                      <input type="checkbox" readOnly checked={on} className="pointer-events-none accent-indigo-500" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {error && <p className="mt-2 text-sm text-rose-400">{error}</p>}

        <div className="mt-4 flex justify-end gap-2">
          {mode === "photo" && preview && (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="rounded-full px-4 py-2 text-sm opacity-70 transition hover:opacity-100"
            >
              {s.changeImage}
            </button>
          )}
          <button
            type="button"
            onClick={() => void submit()}
            disabled={!canShare || busy}
            className="rounded-full bg-indigo-500 px-5 py-2 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:opacity-40"
          >
            {busy ? t.nokor.composer.posting : s.share}
          </button>
        </div>
      </div>
    </div>
  );
}
