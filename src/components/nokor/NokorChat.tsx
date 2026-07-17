"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { nokorAvatarUrl } from "@/lib/supabase/useNokor";
import {
  useNokorConversation,
  useNokorThreads,
  type NokorDmSummary,
} from "@/lib/supabase/useNokorChat";
import type { NokorAuthor } from "@/lib/supabase/useNokor";
import { useT } from "../providers/LanguageProvider";

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

function Conversation({
  meId,
  summary,
  onBack,
}: {
  meId: string;
  summary: { threadId: string; otherId: string; other: NokorAuthor | null };
  onBack: () => void;
}) {
  const t = useT();
  const { messages, send } = useNokorConversation(summary.threadId, meId);
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  const submit = async () => {
    const body = draft.trim();
    if (!body) return;
    setDraft("");
    const ok = await send(body);
    if (!ok) setDraft(body);
  };

  return (
    <div className="glass flex h-[70vh] flex-col rounded-2xl">
      <header className="flex items-center gap-3 border-b border-border px-3 py-2.5">
        <button
          type="button"
          onClick={onBack}
          aria-label={t.nokor.chat.back}
          className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-surface-strong"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <Avatar author={summary.other} userId={summary.otherId} size={32} />
        <p className="text-sm font-semibold">{name(summary.other?.username ?? null, summary.otherId)}</p>
      </header>

      <div className="flex-1 space-y-2 overflow-y-auto px-3 py-3">
        {messages.map((m) => {
          const mine = m.sender_id === meId;
          return (
            <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap ${
                  mine ? "bg-indigo-500 text-white" : "bg-surface"
                }`}
              >
                {m.body}
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="flex items-center gap-2 border-t border-border p-2.5"
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t.nokor.chat.messagePlaceholder}
          maxLength={4000}
          className="min-w-0 flex-1 rounded-full border border-border bg-surface px-4 py-2 text-sm outline-none focus:border-indigo-400/60"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="rounded-full bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:opacity-40"
        >
          {t.nokor.feed.send}
        </button>
      </form>
    </div>
  );
}

function ThreadRow({ thread, onOpen }: { thread: NokorDmSummary; onOpen: () => void }) {
  const t = useT();
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition hover:bg-surface-strong"
    >
      <Avatar author={thread.other} userId={thread.otherId} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{name(thread.other?.username ?? null, thread.otherId)}</p>
        <p className="truncate text-xs opacity-60">{thread.lastMessage ?? t.nokor.chat.noMessages}</p>
      </div>
    </button>
  );
}

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
  const { threads, loaded, openWith } = useNokorThreads(meId);
  const [selected, setSelected] = useState<{ threadId: string; otherId: string } | null>(null);
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
      if (!cancelled && tid) setSelected({ threadId: tid, otherId: openWithUserId });
      onConsumed();
    })();
    return () => {
      cancelled = true;
    };
  }, [openWithUserId, onConsumed]);

  if (!meId) return null;

  if (selected) {
    const other = threads.find((th) => th.threadId === selected.threadId)?.other ?? null;
    return (
      <Conversation
        key={selected.threadId}
        meId={meId}
        summary={{ ...selected, other }}
        onBack={() => setSelected(null)}
      />
    );
  }

  if (!loaded) {
    return <p className="py-10 text-center text-sm opacity-60">{t.nokor.feed.loading}</p>;
  }
  if (!threads.length) {
    return <p className="py-10 text-center text-sm opacity-60">{t.nokor.chat.empty}</p>;
  }
  return (
    <div className="glass rounded-2xl p-2">
      {threads.map((th) => (
        <ThreadRow
          key={th.threadId}
          thread={th}
          onOpen={() => setSelected({ threadId: th.threadId, otherId: th.otherId })}
        />
      ))}
    </div>
  );
}
