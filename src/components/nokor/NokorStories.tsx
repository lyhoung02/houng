"use client";

import Image from "next/image";
import { useState } from "react";
import { createPortal } from "react-dom";
import { nokorAvatarUrl } from "@/lib/supabase/useNokor";
import {
  nokorStoryUrl,
  storyBgClass,
  useNokorStories,
  type NokorStoryGroup,
} from "@/lib/supabase/useNokorStories";
import { useProfile } from "@/lib/supabase/useProfile";
import { useT } from "../providers/LanguageProvider";
import NokorAddStory from "./NokorAddStory";
import NokorStoryViewer from "./NokorStoryViewer";

function name(username: string | null, userId: string) {
  return username?.trim() || `user-${userId.slice(0, 4) || "anon"}`;
}

/** Facebook-style card: the story itself fills the tile, the author's avatar
 *  sits stacked in the top-left corner, name along the bottom. */
function StoryCard({ group, onOpen }: { group: NokorStoryGroup; onOpen: () => void }) {
  const cover = group.stories[0];
  const avatar = nokorAvatarUrl(group.author);
  const label = name(group.author?.username ?? null, group.userId);
  const coverUrl = cover.kind === "image" ? nokorStoryUrl(cover) : null;

  return (
    <button
      type="button"
      onClick={onOpen}
      className="relative aspect-[9/16] w-24 shrink-0 overflow-hidden rounded-xl border border-border sm:w-28"
    >
      {coverUrl ? (
        <Image src={coverUrl} alt="" fill unoptimized className="object-cover" />
      ) : (
        <span className={`absolute inset-0 flex items-center justify-center p-2 ${storyBgClass(cover.background)}`}>
          <span className="line-clamp-4 text-center text-[11px] font-semibold text-white">
            {cover.caption}
          </span>
        </span>
      )}

      {/* Scrim so the name stays readable over any image */}
      <span className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/70 to-transparent" />

      {/* Stacked author avatar */}
      <span
        className={`absolute top-2 left-2 rounded-full p-[2px] ${
          group.hasUnseen ? "bg-indigo-500" : "bg-white/50"
        }`}
      >
        <span className="block rounded-full bg-background p-[1px]">
          {avatar ? (
            <Image src={avatar} alt="" width={28} height={28} unoptimized className="h-7 w-7 rounded-full object-cover" />
          ) : (
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500/40 text-[10px] font-semibold uppercase text-white">
              {label.slice(0, 2)}
            </span>
          )}
        </span>
      </span>

      {group.stories.length > 1 && (
        <span className="absolute top-2 right-2 rounded-full bg-black/60 px-1.5 text-[10px] text-white">
          {group.stories.length}
        </span>
      )}

      <span className="absolute inset-x-0 bottom-1 truncate px-1.5 text-[11px] font-medium text-white">
        {label}
      </span>
    </button>
  );
}

export default function NokorStories({ meId }: { meId: string | null }) {
  const t = useT();
  const s = t.nokor.stories;
  const stories = useNokorStories(meId);
  const me = useProfile(meId);
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);

  const myAvatar = me.avatar;
  // Overlays portal to <body>: the tray is a .glass element (backdrop-filter),
  // which would otherwise trap position:fixed children inside the tray box.
  const body = typeof document !== "undefined" ? document.body : null;

  return (
    <div className="glass rounded-2xl p-3">
      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {/* Create story card */}
        <button
          type="button"
          onClick={() => setAdding(true)}
          className="relative aspect-[9/16] w-24 shrink-0 overflow-hidden rounded-xl border border-border bg-surface sm:w-28"
        >
          <span className="absolute inset-x-0 top-0 h-2/3 overflow-hidden">
            {myAvatar ? (
              <Image src={myAvatar} alt="" fill unoptimized className="object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center bg-surface-strong text-2xl">🙂</span>
            )}
          </span>
          <span className="absolute inset-x-0 bottom-0 flex h-1/3 items-end justify-center bg-background pb-1.5">
            <span className="px-1 text-center text-[11px] font-medium leading-tight">{s.create}</span>
          </span>
          <span className="absolute left-1/2 top-2/3 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-4 border-background bg-indigo-500 text-sm font-bold text-white">
            +
          </span>
        </button>

        {stories.groups.map((group, i) => (
          <StoryCard key={group.userId} group={group} onOpen={() => setViewerIndex(i)} />
        ))}
      </div>

      {adding &&
        body &&
        createPortal(
          <NokorAddStory
            busy={stories.busy}
            followers={stories.followers}
            onAdd={stories.addStory}
            onClose={() => setAdding(false)}
          />,
          body,
        )}

      {viewerIndex !== null &&
        stories.groups[viewerIndex] &&
        body &&
        createPortal(
          <NokorStoryViewer
            groups={stories.groups}
            startIndex={viewerIndex}
            meId={meId}
            viewCounts={stories.viewCounts}
            onMarkViewed={stories.markViewed}
            onDelete={(storyId) => {
              const story = stories.groups.flatMap((g) => g.stories).find((st) => st.id === storyId);
              if (story) void stories.deleteStory(story);
            }}
            onClose={() => setViewerIndex(null)}
          />,
          body,
        )}
    </div>
  );
}
