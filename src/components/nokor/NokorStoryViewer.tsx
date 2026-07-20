"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { nokorAvatarUrl } from "@/lib/supabase/useNokor";
import { nokorStoryUrl, storyBgClass, type NokorStoryGroup } from "@/lib/supabase/useNokorStories";
import { useT } from "../providers/LanguageProvider";
import NokorReportSheet, { type NokorReportTarget } from "./NokorReportSheet";

const STORY_MS = 5000; // keep in sync with .nokor-story-fill animation duration

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90">
      <div className="relative flex h-full w-full max-w-md flex-col">
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

        {own && (
          <div className="absolute inset-x-0 bottom-4 z-10 text-center text-xs text-white/80">
            👁 {viewCounts[story.id] ?? 0}
          </div>
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
