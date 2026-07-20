"use client";

import Image from "next/image";
import { nokorAvatarUrl } from "@/lib/supabase/useNokor";
import { useNokorSuggestions } from "@/lib/supabase/useNokorSocial";
import { useT } from "../providers/LanguageProvider";
import NokorBadge from "./NokorBadge";
import { useNokorNav } from "./useNokorNav";

function name(username: string | null, userId: string) {
  return username?.trim() || `user-${userId.slice(0, 4) || "anon"}`;
}

export default function NokorSuggestions({ meId }: { meId: string | null }) {
  const t = useT();
  const p = t.nokor.profile;
  const nav = useNokorNav();
  const { items, loaded, follow, dismiss } = useNokorSuggestions(meId);

  if (!loaded || items.length === 0) return null;

  return (
    <div className="glass rounded-2xl p-4">
      <p className="mb-3 text-sm font-semibold">{t.nokor.feed.suggested}</p>
      <div className="-mx-1 flex gap-3 overflow-x-auto px-1 pb-1">
        {items.map((s) => {
          const label = name(s.username, s.userId);
          const avatar = nokorAvatarUrl({ username: s.username, avatar_path: s.avatar_path });
          return (
            <div
              key={s.userId}
              className="relative flex w-36 shrink-0 flex-col items-center rounded-xl border border-border bg-surface p-3 text-center"
            >
              <button
                type="button"
                onClick={() => dismiss(s.userId)}
                aria-label={t.nokor.feed.cancel}
                className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full text-xs opacity-50 transition hover:bg-surface-strong hover:opacity-100"
              >
                ✕
              </button>
              <button type="button" onClick={() => nav?.openProfile(s.userId)} className="flex flex-col items-center">
                {avatar ? (
                  <Image
                    src={avatar}
                    alt=""
                    width={56}
                    height={56}
                    unoptimized
                    className="h-14 w-14 rounded-full object-cover"
                    style={{ width: 56, height: 56 }}
                  />
                ) : (
                  <div
                    className="flex items-center justify-center rounded-full bg-indigo-500/30 text-base font-semibold uppercase"
                    style={{ width: 56, height: 56 }}
                  >
                    {label.slice(0, 2)}
                  </div>
                )}
                <span className="mt-2 flex max-w-full items-center gap-1 truncate text-sm font-medium">
                  <span className="truncate">{label}</span>
                  <NokorBadge kind={s.badge} size={14} />
                </span>
              </button>
              <button
                type="button"
                onClick={() => void follow(s.userId)}
                className="mt-3 w-full rounded-full bg-indigo-500 py-1.5 text-xs font-medium text-white transition hover:bg-indigo-400"
              >
                {p.follow}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
