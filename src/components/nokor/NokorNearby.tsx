"use client";

import Image from "next/image";
import { nokorAvatarUrl } from "@/lib/supabase/useNokor";
import { NEARBY_RADIUS_KM, useNokorNearby } from "@/lib/supabase/useNokorNearby";
import { useT } from "../providers/LanguageProvider";
import { useNokorNav } from "./useNokorNav";

function name(username: string | null, userId: string) {
  return username?.trim() || `user-${userId.slice(0, 4) || "anon"}`;
}

/** Opt-in "people near you" suggestions, shown above the activity list. */
export default function NokorNearby({ meId }: { meId: string | null }) {
  const t = useT();
  const n = t.nokor.nearby;
  const nav = useNokorNav();
  const nearby = useNokorNearby(meId);

  if (!nearby.loaded) return null;

  // Not sharing yet — explain the trade and let them opt in.
  if (!nearby.sharing) {
    return (
      <div className="glass rounded-2xl p-4">
        <h3 className="text-sm font-semibold">{n.title}</h3>
        <p className="mt-1 text-xs opacity-70">
          {n.explain.replace("{km}", String(NEARBY_RADIUS_KM))}
        </p>
        <p className="mt-1 text-xs opacity-50">{n.privacy}</p>
        {nearby.error === "permission-denied" && (
          <p className="mt-2 text-xs text-rose-400">{n.denied}</p>
        )}
        {nearby.error === "geolocation-unsupported" && (
          <p className="mt-2 text-xs text-rose-400">{n.unsupported}</p>
        )}
        <button
          type="button"
          onClick={() => void nearby.share()}
          disabled={nearby.busy}
          className="mt-3 rounded-full bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:opacity-40"
        >
          {nearby.busy ? n.locating : n.enable}
        </button>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{n.title}</h3>
        <button
          type="button"
          onClick={() => void nearby.stopSharing()}
          className="text-xs opacity-60 transition hover:opacity-100"
        >
          {n.turnOff}
        </button>
      </div>

      {nearby.people.length === 0 ? (
        <p className="mt-2 text-xs opacity-60">{n.empty.replace("{km}", String(NEARBY_RADIUS_KM))}</p>
      ) : (
        <div className="no-scrollbar mt-3 flex gap-3 overflow-x-auto">
          {nearby.people.map((p) => {
            const avatar = nokorAvatarUrl({ username: p.username, avatar_path: p.avatar_path });
            const label = name(p.username, p.user_id);
            return (
              <div
                key={p.user_id}
                className="flex w-32 shrink-0 flex-col items-center gap-1 rounded-xl border border-border bg-surface p-3"
              >
                <button type="button" onClick={() => nav?.openProfile(p.user_id)} className="relative">
                  {avatar ? (
                    <Image
                      src={avatar}
                      alt=""
                      width={56}
                      height={56}
                      unoptimized
                      className="h-14 w-14 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-500/30 text-sm font-semibold uppercase">
                      {label.slice(0, 2)}
                    </span>
                  )}
                  {p.is_new && (
                    <span className="absolute -top-1 -right-1 rounded-full bg-emerald-500 px-1.5 text-[9px] font-semibold text-white">
                      {n.new}
                    </span>
                  )}
                </button>
                <p className="w-full truncate text-center text-xs font-medium">{label}</p>
                <p className="text-[10px] opacity-60">
                  {n.kmAway.replace("{km}", String(p.distance_km))}
                </p>
                <button
                  type="button"
                  onClick={() => void nearby.follow(p.user_id)}
                  className="mt-1 w-full rounded-full bg-indigo-500 py-1 text-xs font-medium text-white transition hover:bg-indigo-400"
                >
                  {t.nokor.profile.follow}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
