"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { nokorAvatarUrl } from "@/lib/supabase/useNokor";
import { nokorReplyToStory, nokorStoryUrl, storyBgClass, type NokorStoryGroup } from "@/lib/supabase/useNokorStories";
import { useT } from "../providers/LanguageProvider";
import NokorReportSheet, { type NokorReportTarget } from "./NokorReportSheet";

const STORY_MS = 5000; // keep in sync with .nokor-story-fill animation duration
const STORY_QUICK_REACTIONS = ["❤️", "😂", "😮", "😢", "👏", "🔥"];

function name(username: string | null, userId: string) {
  return username?.trim() || `user-${userId.slice(0, 4) || "anon"}`;
}

function timeAgo(
  iso: string,
  t: { justNow: string; minutesAgo: string; hoursAgo: string; daysAgo: string },
) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return t.justNow;
  if (mins < 60) return t.minutesAgo.replace("{n}", String(mins));
  const hours = Math.floor(mins / 60);
  return t.hoursAgo.replace("{n}", String(hours));
}

export default function NokorStoryViewer({
  groups,
  startIndex,
  meId,
  viewCounts,
  onMarkViewed,
  onDelete,
  onClose,
}: {
  groups: NokorStoryGroup[];
  startIndex: number;
  meId: string | null;
  viewCounts: Record<string, number>;
  onMarkViewed: (storyId: string, authorId: string) => void;
  onDelete: (storyId: string) => void;
  onClose: () => void;
}) {
  const t = useT();
  const [gi, setGi] = useState(startIndex);
  // Open at the first story the viewer hasn't seen yet, not always the first one.
  const [si, setSi] = useState(() => groups[startIndex]?.firstUnseen ?? 0);
  const [paused, setPaused] = useState(false);
  const [reportTarget, setReportTarget] = useState<NokorReportTarget | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const group = groups[gi];
  const story = group?.stories[si];

  // Advance timer; restarts whenever the current story changes.
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!story || paused) return;
    onMarkViewed(story.id, group.userId);
    timerRef.current = setTimeout(() => next(), STORY_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gi, si, paused]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Don't steal keys while the report dialog is open over the viewer.
      if (reportTarget) return;
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gi, si, reportTarget]);

  async function sendReply(override?: string) {
    const textToSend = (override ?? reply).trim();
    if (!story || !meId || !textToSend || sending) return;
    setSending(true);
    const ok = await nokorReplyToStory(meId, story, textToSend);
    setSending(false);
    if (ok) {
      if (!override) setReply("");
      setSent(true);
      setTimeout(() => setSent(false), 2000);
    }
  }

  if (!group || !story) return null;

  function next() {
    if (si < group.stories.length - 1) {
      setSi((v) => v + 1);
    } else if (gi < groups.length - 1) {
      // Entering the next author's group: start at their first unseen story.
      setGi((v) => v + 1);
      setSi(groups[gi + 1]?.firstUnseen ?? 0);
    } else {
      onClose();
    }
  }

  function prev() {
    if (si > 0) {
      setSi((v) => v - 1);
    } else if (gi > 0) {
      const pg = groups[gi - 1];
      setGi((v) => v - 1);
      setSi(pg.stories.length - 1);
    }
  }

  const url = nokorStoryUrl(story);
  const avatar = nokorAvatarUrl(group.author);
  const own = story.user_id === meId;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 sm:p-4">
      <div className="relative flex h-dvh w-full max-w-md flex-col overflow-hidden bg-black sm:h-[92vh] sm:max-h-[900px] sm:rounded-2xl">
        {/* Readability scrims behind the header and the reply bar */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-[5] h-28 bg-gradient-to-b from-black/70 via-black/25 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-[5] h-32 bg-gradient-to-t from-black/75 via-black/25 to-transparent" />

        {/* Progress bars */}
        <div className="absolute inset-x-0 top-0 z-10 flex gap-1 p-3">
          {group.stories.map((s, i) => (
            <div key={s.id} className="h-0.5 flex-1 overflow-hidden rounded-full bg-white/30">
              <div
                className={`h-full bg-white ${i === si ? "nokor-story-fill" : ""}`}
                style={{ width: i < si ? "100%" : i > si ? "0%" : undefined }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute inset-x-0 top-4 z-10 flex items-center gap-2.5 px-3 pt-2 text-white">
          {avatar ? (
            <Image src={avatar} alt="" width={32} height={32} unoptimized className="h-8 w-8 rounded-full object-cover" />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-semibold uppercase">
              {name(group.author?.username ?? null, group.userId).slice(0, 2)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{name(group.author?.username ?? null, group.userId)}</p>
            <p className="text-xs opacity-70">{timeAgo(story.created_at, t.nokor.feed)}</p>
          </div>
          {own ? (
            <button
              type="button"
              onClick={() => {
                onDelete(story.id);
                next();
              }}
              className="rounded-full px-2 py-1 text-xs opacity-80 hover:opacity-100"
            >
              {t.nokor.feed.delete}
            </button>
          ) : (
            meId && (
              <button
                type="button"
                onClick={() => {
                  setPaused(true);
                  setReportTarget({
                    kind: "story",
                    id: story.id,
                    userId: story.user_id,
                    snapshot: story.caption,
                  });
                }}
                className="rounded-full px-2 py-1 text-xs opacity-80 hover:opacity-100"
              >
                {t.nokor.report.action}
              </button>
            )
          )}
          <button type="button" onClick={onClose} aria-label={t.nokor.feed.cancel} className="rounded-full px-2 py-1 text-lg leading-none opacity-80 hover:opacity-100">
            ✕
          </button>
        </div>

        {/* Content: an image (with optional caption) or a text story */}
        <div className="relative flex-1">
          {story.kind === "text" ? (
            <div className={`flex h-full w-full items-center justify-center ${storyBgClass(story.background)}`}>
              <p className="max-w-[85%] text-center text-2xl font-semibold whitespace-pre-wrap text-white">
                {story.caption}
              </p>
            </div>
          ) : (
            <>
              {url && <Image src={url} alt="" fill unoptimized className="object-contain" />}
              {story.caption && (
                <p className="absolute inset-x-0 bottom-16 mx-auto max-w-[90%] rounded-xl bg-black/50 px-3 py-2 text-center text-sm text-white">
                  {story.caption}
                </p>
              )}
            </>
          )}
          {/* Tap zones */}
          <button
            type="button"
            aria-label="previous"
            onClick={prev}
            onPointerDown={() => setPaused(true)}
            onPointerUp={() => setPaused(false)}
            className="absolute inset-y-0 left-0 w-1/3"
          />
          <button
            type="button"
            aria-label="next"
            onClick={next}
            onPointerDown={() => setPaused(true)}
            onPointerUp={() => setPaused(false)}
            className="absolute inset-y-0 right-0 w-2/3"
          />
        </div>

        {own ? (
          <div className="absolute inset-x-0 bottom-5 z-10 flex items-center justify-center gap-1.5 text-sm text-white/90">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
              <path d="M12 5c-5 0-9 4.5-10 7 1 2.5 5 7 10 7s9-4.5 10-7c-1-2.5-5-7-10-7zm0 11a4 4 0 110-8 4 4 0 010 8zm0-2a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
            {viewCounts[story.id] ?? 0}
          </div>
        ) : (
          meId && (
            <div className="absolute inset-x-0 bottom-0 z-10 space-y-2.5 p-3">
              {/* Quick emoji reactions */}
              <div className="flex justify-center gap-2">
                {STORY_QUICK_REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    disabled={sending}
                    onClick={() => void sendReply(emoji)}
                    className="text-2xl transition hover:scale-125 disabled:opacity-50"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void sendReply();
                }}
                className="flex items-center gap-2"
              >
                <input
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onFocus={() => setPaused(true)}
                  onBlur={() => setPaused(false)}
                  placeholder={sent ? t.nokor.stories.replySent : t.nokor.stories.replyPlaceholder.replace("{name}", name(group.author?.username ?? null, group.userId))}
                  maxLength={500}
                  className="flex-1 rounded-full border border-white/40 bg-white/10 px-4 py-2.5 text-sm text-white placeholder:text-white/70 outline-none backdrop-blur-sm focus:border-white/80"
                />
                <button
                  type="submit"
                  disabled={!reply.trim() || sending}
                  aria-label={t.nokor.stories.replySend}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-500 text-white transition hover:bg-indigo-400 disabled:opacity-40"
                >
                  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                    <path d="M22 2 11 13" />
                    <path d="M22 2 15 22l-4-9-9-4 20-7z" />
                  </svg>
                </button>
              </form>
            </div>
          )
        )}
      </div>

      {reportTarget && meId && (
        <NokorReportSheet
          meId={meId}
          target={reportTarget}
          onClose={() => {
            setReportTarget(null);
            setPaused(false);
          }}
        />
      )}
    </div>
  );
}
