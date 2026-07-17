"use client";

import Image from "next/image";
import { nokorAvatarUrl } from "@/lib/supabase/useNokor";
import {
  useNokorActivity,
  type NokorActivityItem,
} from "@/lib/supabase/useNokorSocial";
import { useT } from "../providers/LanguageProvider";
import NokorNearby from "./NokorNearby";
import { useNokorNav } from "./useNokorNav";

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
  if (hours < 24) return t.hoursAgo.replace("{n}", String(hours));
  return t.daysAgo.replace("{n}", String(Math.floor(hours / 24)));
}

function Row({ item }: { item: NokorActivityItem }) {
  const t = useT();
  const a = t.nokor.activity;
  const nav = useNokorNav();
  const who = name(item.actor?.username ?? null, item.actorId);
  const avatar = nokorAvatarUrl(item.actor ? { username: item.actor.username, avatar_path: item.actor.avatar_path } : null);
  const verb = item.kind === "like" ? a.liked : item.kind === "comment" ? a.commented : a.followed;

  return (
    <button
      type="button"
      onClick={() => nav?.openProfile(item.actorId)}
      className="flex w-full items-center gap-3 rounded-xl px-2 py-2.5 text-left transition hover:bg-surface-strong"
    >
      {avatar ? (
        <Image src={avatar} alt="" width={40} height={40} unoptimized className="h-10 w-10 rounded-full object-cover" />
      ) : (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500/30 text-sm font-semibold uppercase">
          {who.slice(0, 2)}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-sm">
          <span className="font-semibold">{who}</span> <span className="opacity-80">{verb}</span>
        </p>
        {item.preview && <p className="truncate text-xs opacity-60">{item.preview}</p>}
      </div>
      <span className="shrink-0 text-xs opacity-50">{timeAgo(item.createdAt, t.nokor.feed)}</span>
    </button>
  );
}

export default function NokorActivity({ meId }: { meId: string | null }) {
  const t = useT();
  const { items, loaded } = useNokorActivity(meId);

  return (
    <div className="space-y-4">
      <NokorNearby meId={meId} />
      {!loaded ? (
        <p className="py-10 text-center text-sm opacity-60">{t.nokor.feed.loading}</p>
      ) : !items.length ? (
        <p className="py-10 text-center text-sm opacity-60">{t.nokor.activity.empty}</p>
      ) : (
        <div className="glass rounded-2xl p-2">
          {items.map((item) => (
            <Row key={item.key} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
