"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { nokorAvatarUrl } from "@/lib/supabase/useNokor";
import { useNokorFollowers } from "@/lib/supabase/useNokorRooms";
import type { NokorRoomKind } from "@/lib/supabase/types";
import { useT } from "../providers/LanguageProvider";

function label(username: string | null, userId: string) {
  return username?.trim() || `user-${userId.slice(0, 4)}`;
}

export default function NokorCreateRoom({
  meId,
  onCreate,
  onSetPhoto,
  onClose,
}: {
  meId: string;
  onCreate: (kind: NokorRoomKind, name: string, description: string, members: string[]) => Promise<string | null>;
  onSetPhoto: (roomId: string, file: File) => Promise<boolean>;
  onClose: () => void;
}) {
  const t = useT();
  const c = t.nokor.chat;
  const { people } = useNokorFollowers(meId);
  const [kind, setKind] = useState<NokorRoomKind>("group");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [members, setMembers] = useState<string[]>([]);
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  const toggle = (id: string) =>
    setMembers((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const pickPhoto = (f: File | null) => {
    if (!f) return;
    if (preview) URL.revokeObjectURL(preview);
    setPhoto(f);
    setPreview(URL.createObjectURL(f));
  };

  const submit = async () => {
    if (!name.trim() || busy) return;
    setBusy(true);
    setError(null);
    const id = await onCreate(kind, name, description, members);
    // The room must exist before its photo can be attached to it.
    if (id && photo) await onSetPhoto(id, photo);
    setBusy(false);
    if (id) {
      if (preview) URL.revokeObjectURL(preview);
      onClose();
    } else {
      setError(c.createFailed);
    }
  };

  const field =
    "w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none focus:border-indigo-400/60";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="glass my-auto w-full max-w-sm rounded-2xl p-4" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold">{c.createTitle}</h2>
          <button type="button" onClick={onClose} aria-label={t.nokor.feed.cancel} className="text-lg leading-none opacity-70 hover:opacity-100">
            ✕
          </button>
        </div>

        <div className="mb-3 flex rounded-full border border-border p-0.5 text-sm">
          {(["group", "channel"] as const).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setKind(k)}
              className={`flex-1 rounded-full py-1.5 transition ${
                kind === k ? "bg-indigo-500 text-white" : "opacity-70 hover:opacity-100"
              }`}
            >
              {k === "group" ? c.group : c.channel}
            </button>
          ))}
        </div>
        <p className="mb-3 text-xs opacity-60">{kind === "group" ? c.groupHint : c.channelHint}</p>

        {/* Logo + name */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => photoRef.current?.click()}
            aria-label={c.changePhoto}
            className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-dashed border-border bg-surface"
          >
            {preview ? (
              <Image src={preview} alt="" fill unoptimized className="object-cover" />
            ) : (
              <span className="text-lg opacity-60">📷</span>
            )}
          </button>
          <input
            ref={photoRef}
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => pickPhoto(e.target.files?.[0] ?? null)}
          />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={c.roomName}
            maxLength={80}
            className={field}
          />
        </div>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={c.roomDescription}
          rows={2}
          maxLength={300}
          className={`${field} mt-2 resize-none`}
        />

        <p className="mt-3 mb-1 text-xs opacity-60">
          {c.addMembers} {members.length > 0 && `(${members.length})`}
        </p>
        {people.length === 0 ? (
          <p className="text-xs opacity-50">{c.noFollowers}</p>
        ) : (
          <div className="max-h-40 space-y-1 overflow-y-auto rounded-xl border border-border p-1">
            {people.map((p) => {
              const avatar = nokorAvatarUrl({ username: p.username, avatar_path: p.avatar_path });
              const on = members.includes(p.userId);
              return (
                <button
                  key={p.userId}
                  type="button"
                  onClick={() => toggle(p.userId)}
                  className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm transition hover:bg-surface-strong"
                >
                  {avatar ? (
                    <Image src={avatar} alt="" width={24} height={24} unoptimized className="h-6 w-6 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/30 text-[10px] font-semibold uppercase">
                      {label(p.username, p.userId).slice(0, 2)}
                    </span>
                  )}
                  <span className="min-w-0 flex-1 truncate">{label(p.username, p.userId)}</span>
                  <input type="checkbox" readOnly checked={on} className="pointer-events-none accent-indigo-500" />
                </button>
              );
            })}
          </div>
        )}

        {error && <p className="mt-2 text-sm text-rose-400">{error}</p>}

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => void submit()}
            disabled={!name.trim() || busy}
            className="rounded-full bg-indigo-500 px-5 py-2 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:opacity-40"
          >
            {busy ? c.creating : c.create}
          </button>
        </div>
      </div>
    </div>
  );
}
