"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { nokorAvatarUrl } from "@/lib/supabase/useNokor";
import { useNokorThreads, type NokorDmSummary } from "@/lib/supabase/useNokorChat";
import { useNokorRooms, type NokorRoomSummary } from "@/lib/supabase/useNokorRooms";
import type { NokorAuthor } from "@/lib/supabase/useNokor";
import type { NokorRoomKind } from "@/lib/supabase/types";
import { useT } from "../providers/LanguageProvider";
import NokorCreateRoom from "./NokorCreateRoom";
import NokorDmView from "./NokorDmView";
import NokorRoomView from "./NokorRoomView";

function name(username: string | null, userId: string) {
  return username?.trim() || `user-${userId.slice(0, 4) || "anon"}`;
}

function Avatar({ author, userId, size = 44 }: { author: NokorAuthor | null; userId: string; size?: number }) {
  const url = nokorAvatarUrl(author);
  if (url) {
    return (
      <Image
        src={url}
        alt=""
        width={size}
        height={size}
        unoptimized
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-indigo-500/30 font-semibold uppercase"
      style={{ width: size, height: size, fontSize: size * 0.34 }}
    >
      {name(author?.username ?? null, userId).slice(0, 2)}
    </div>
  );
}

function Row({
  icon,
  title,
  subtitle,
  onOpen,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition hover:bg-surface-strong"
    >
      {icon}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{title}</p>
        <p className="truncate text-xs opacity-60">{subtitle}</p>
      </div>
    </button>
  );
}

type Open =
  | { type: "dm"; threadId: string; otherId: string }
  | { type: "room"; roomId: string };

export default function NokorChat({
  meId,
  openWithUserId,
  onConsumed,
}: {
  meId: string | null;
  openWithUserId: string | null;
  onConsumed: () => void;
}) {
  const t = useT();
  const c = t.nokor.chat;
  const { threads, loaded, openWith } = useNokorThreads(meId);
  const { rooms, loaded: roomsLoaded, createRoom, leaveRoom } = useNokorRooms(meId);
  const [open, setOpen] = useState<Open | null>(null);
  const [creating, setCreating] = useState(false);
  const openWithRef = useRef(openWith);
  useEffect(() => {
    openWithRef.current = openWith;
  });

  // A "Message" tap from a profile hands us a user id to open a thread with.
  useEffect(() => {
    if (!openWithUserId) return;
    let cancelled = false;
    (async () => {
      const tid = await openWithRef.current(openWithUserId);
      if (!cancelled && tid) setOpen({ type: "dm", threadId: tid, otherId: openWithUserId });
      onConsumed();
    })();
    return () => {
      cancelled = true;
    };
  }, [openWithUserId, onConsumed]);

  if (!meId) return null;

  if (open?.type === "dm") {
    const other = threads.find((th) => th.threadId === open.threadId)?.other ?? null;
    return (
      <NokorDmView
        key={open.threadId}
        meId={meId}
        summary={{ threadId: open.threadId, otherId: open.otherId, other }}
        onBack={() => setOpen(null)}
      />
    );
  }

  if (open?.type === "room") {
    const room = rooms.find((r) => r.id === open.roomId);
    if (room) {
      return (
        <NokorRoomView
          key={room.id}
          meId={meId}
          room={room}
          onBack={() => setOpen(null)}
          onLeave={async () => {
            await leaveRoom(room.id);
            setOpen(null);
          }}
        />
      );
    }
  }

  const empty = loaded && roomsLoaded && !threads.length && !rooms.length;

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-400"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          {c.createTitle}
        </button>
      </div>

      {!loaded || !roomsLoaded ? (
        <p className="py-10 text-center text-sm opacity-60">{t.nokor.feed.loading}</p>
      ) : empty ? (
        <p className="py-10 text-center text-sm opacity-60">{c.empty}</p>
      ) : (
        <div className="glass rounded-2xl p-2">
          {rooms.map((r: NokorRoomSummary) => (
            <Row
              key={r.id}
              icon={
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-indigo-500/25 text-lg">
                  {r.kind === "channel" ? "📢" : "👥"}
                </span>
              }
              title={r.name}
              subtitle={r.lastMessage || (r.kind === "channel" ? c.channel : c.group)}
              onOpen={() => setOpen({ type: "room", roomId: r.id })}
            />
          ))}
          {threads.map((th: NokorDmSummary) => (
            <Row
              key={th.threadId}
              icon={<Avatar author={th.other} userId={th.otherId} />}
              title={name(th.other?.username ?? null, th.otherId)}
              subtitle={th.lastMessage ?? c.noMessages}
              onOpen={() => setOpen({ type: "dm", threadId: th.threadId, otherId: th.otherId })}
            />
          ))}
        </div>
      )}

      {creating && (
        <NokorCreateRoom
          meId={meId}
          onCreate={(kind: NokorRoomKind, n, d, m) => createRoom(kind, n, d, m)}
          onClose={() => setCreating(false)}
        />
      )}
    </div>
  );
}
