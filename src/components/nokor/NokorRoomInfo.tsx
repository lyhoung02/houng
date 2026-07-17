"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { nokorAvatarUrl } from "@/lib/supabase/useNokor";
import {
  nokorRoomPhotoUrl,
  useNokorFollowers,
  useNokorRoomMembers,
  type NokorRoomSummary,
} from "@/lib/supabase/useNokorRooms";
import type { NokorRoomRole } from "@/lib/supabase/types";
import { useT } from "../providers/LanguageProvider";
import { useNokorNav } from "./useNokorNav";

function label(username: string | null, userId: string) {
  return username?.trim() || `user-${userId.slice(0, 4)}`;
}

export default function NokorRoomInfo({
  meId,
  room,
  onBack,
  onLeft,
  actions,
}: {
  meId: string;
  room: NokorRoomSummary;
  onBack: () => void;
  onLeft: () => void;
  actions: {
    setRoomPhoto: (roomId: string, file: File) => Promise<boolean>;
    addMembers: (roomId: string, members: string[]) => Promise<string | null>;
    setRole: (roomId: string, userId: string, role: "admin" | "member") => Promise<string | null>;
    transferOwner: (roomId: string, userId: string) => Promise<string | null>;
    removeMember: (roomId: string, userId: string) => Promise<string | null>;
    revokeInvite: (roomId: string) => Promise<string | null>;
    leaveRoom: (roomId: string) => Promise<string | null>;
  };
}) {
  const t = useT();
  const c = t.nokor.chat;
  const nav = useNokorNav();
  const { members, reload } = useNokorRoomMembers(room.id);
  const { people } = useNokorFollowers(meId);
  const [code, setCode] = useState(room.invite_code);
  const [copied, setCopied] = useState(false);
  const [adding, setAdding] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const photoRef = useRef<HTMLInputElement>(null);

  const myRole: NokorRoomRole =
    (members.find((m) => m.user_id === meId)?.role as NokorRoomRole) ?? room.role;
  const isOwner = myRole === "owner";
  const isAdmin = isOwner || myRole === "admin";
  const photo = nokorRoomPhotoUrl(room.photo_path);
  const inviteUrl =
    typeof window !== "undefined" ? `${window.location.origin}/nokor?join=${code}` : "";

  const run = async (fn: () => Promise<string | null>) => {
    const err = await fn();
    setError(err);
    await reload();
  };

  const copyInvite = async () => {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  const memberIds = new Set(members.map((m) => m.user_id));
  const candidates = people.filter((p) => !memberIds.has(p.userId));

  return (
    <div className="glass max-h-[70vh] overflow-y-auto rounded-2xl">
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-background/80 px-3 py-2.5 backdrop-blur">
        <button
          type="button"
          onClick={onBack}
          aria-label={c.back}
          className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-surface-strong"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <p className="text-sm font-semibold">{c.roomInfo}</p>
      </header>

      {/* Identity */}
      <div className="flex flex-col items-center gap-2 p-5">
        <div className="relative">
          {photo ? (
            <Image src={photo} alt="" width={88} height={88} unoptimized className="h-22 w-22 rounded-full object-cover" style={{ width: 88, height: 88 }} />
          ) : (
            <span className="flex items-center justify-center rounded-full bg-indigo-500/25 text-3xl" style={{ width: 88, height: 88 }}>
              {room.kind === "channel" ? "📢" : "👥"}
            </span>
          )}
          {isAdmin && (
            <>
              <button
                type="button"
                onClick={() => photoRef.current?.click()}
                aria-label={c.changePhoto}
                className="absolute -right-1 -bottom-1 flex h-8 w-8 items-center justify-center rounded-full border border-border bg-background text-sm"
              >
                📷
              </button>
              <input
                ref={photoRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void actions.setRoomPhoto(room.id, f);
                }}
              />
            </>
          )}
        </div>
        <h2 className="text-lg font-semibold">{room.name}</h2>
        <p className="text-xs opacity-60">
          {room.kind === "channel" ? c.channel : c.group} · {c.membersN.replace("{n}", String(members.length))}
        </p>
        {room.description && <p className="text-center text-sm opacity-80">{room.description}</p>}
      </div>

      {/* Invite link */}
      <div className="border-t border-border p-4">
        <p className="mb-1.5 text-xs font-semibold opacity-70">{c.inviteLink}</p>
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={inviteUrl}
            onFocus={(e) => e.currentTarget.select()}
            className="min-w-0 flex-1 truncate rounded-xl border border-border bg-surface px-3 py-2 text-xs outline-none"
          />
          <button
            type="button"
            onClick={() => void copyInvite()}
            className="shrink-0 rounded-full bg-indigo-500 px-3 py-2 text-xs font-medium text-white transition hover:bg-indigo-400"
          >
            {copied ? t.nokor.feed.copied : c.copyLink}
          </button>
        </div>
        {isAdmin && (
          <button
            type="button"
            onClick={async () => {
              const next = await actions.revokeInvite(room.id);
              if (next) setCode(next);
            }}
            className="mt-2 text-xs opacity-60 transition hover:opacity-100"
          >
            {c.resetLink}
          </button>
        )}
        <p className="mt-1 text-[11px] opacity-50">{c.inviteHint}</p>
      </div>

      {/* Members */}
      <div className="border-t border-border p-4">
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-semibold opacity-70">{c.membersN.replace("{n}", String(members.length))}</p>
          {isAdmin && candidates.length > 0 && (
            <button
              type="button"
              onClick={() => setAdding((v) => !v)}
              className="text-xs text-indigo-400 transition hover:opacity-80"
            >
              {c.addMembers}
            </button>
          )}
        </div>

        {adding && (
          <div className="mb-3 rounded-xl border border-border p-1">
            <div className="max-h-40 space-y-1 overflow-y-auto">
              {candidates.map((p) => {
                const on = picked.includes(p.userId);
                const avatar = nokorAvatarUrl({ username: p.username, avatar_path: p.avatar_path });
                return (
                  <button
                    key={p.userId}
                    type="button"
                    onClick={() =>
                      setPicked((prev) =>
                        prev.includes(p.userId) ? prev.filter((x) => x !== p.userId) : [...prev, p.userId],
                      )
                    }
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
            <button
              type="button"
              disabled={!picked.length}
              onClick={async () => {
                await run(() => actions.addMembers(room.id, picked));
                setPicked([]);
                setAdding(false);
              }}
              className="mt-1 w-full rounded-lg bg-indigo-500 py-1.5 text-xs font-medium text-white disabled:opacity-40"
            >
              {c.addSelected}
            </button>
          </div>
        )}

        <ul className="space-y-1">
          {members.map((m) => {
            const avatar = nokorAvatarUrl(m.author);
            const who = label(m.author?.username ?? null, m.user_id);
            const isMe = m.user_id === meId;
            // Admins manage members; only the owner manages admins; owner row is fixed.
            const manageable =
              !isMe &&
              m.role !== "owner" &&
              (isOwner || (myRole === "admin" && m.role === "member"));
            return (
              <li key={m.user_id} className="flex items-center gap-2 rounded-lg px-1 py-1.5">
                <button type="button" onClick={() => nav?.openProfile(m.user_id)} className="shrink-0">
                  {avatar ? (
                    <Image src={avatar} alt="" width={32} height={32} unoptimized className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-500/30 text-[11px] font-semibold uppercase">
                      {who.slice(0, 2)}
                    </span>
                  )}
                </button>
                <span className="min-w-0 flex-1 truncate text-sm">
                  {who} {isMe && <span className="opacity-50">({c.you})</span>}
                </span>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] ${
                    m.role === "owner"
                      ? "bg-amber-500/20 text-amber-400"
                      : m.role === "admin"
                        ? "bg-indigo-500/20 text-indigo-400"
                        : "opacity-50"
                  }`}
                >
                  {c.roles[m.role]}
                </span>

                {manageable && (
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() =>
                        void run(() =>
                          actions.setRole(room.id, m.user_id, m.role === "admin" ? "member" : "admin"),
                        )
                      }
                      className="rounded-full px-2 py-1 text-[10px] opacity-70 transition hover:bg-surface-strong hover:opacity-100"
                    >
                      {m.role === "admin" ? c.demote : c.promote}
                    </button>
                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(c.transferConfirm.replace("{name}", who))) {
                            void run(() => actions.transferOwner(room.id, m.user_id));
                          }
                        }}
                        className="rounded-full px-2 py-1 text-[10px] opacity-70 transition hover:bg-surface-strong hover:opacity-100"
                      >
                        {c.transfer}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(c.removeConfirm.replace("{name}", who))) {
                          void run(() => actions.removeMember(room.id, m.user_id));
                        }
                      }}
                      className="rounded-full px-2 py-1 text-[10px] text-rose-400 opacity-70 transition hover:bg-surface-strong hover:opacity-100"
                    >
                      {c.remove}
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
        {error && <p className="mt-2 text-xs text-rose-400">{error}</p>}
      </div>

      {/* Leave */}
      <div className="border-t border-border p-4">
        <button
          type="button"
          onClick={async () => {
            const err = await actions.leaveRoom(room.id);
            if (err) setError(err);
            else onLeft();
          }}
          className="w-full rounded-full border border-border py-2 text-sm font-medium text-rose-400 transition hover:bg-surface-strong"
        >
          {c.leave}
        </button>
        {isOwner && <p className="mt-1.5 text-center text-[11px] opacity-50">{c.ownerLeaveHint}</p>}
      </div>
    </div>
  );
}
