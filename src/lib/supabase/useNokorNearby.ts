"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabase } from "./client";
import type { NokorNearbyUser } from "./types";

export const NEARBY_RADIUS_KM = 10;

/**
 * Opt-in proximity suggestions. Sharing only happens when the user explicitly
 * calls `share()` and the browser grants permission; the coordinates are
 * written to a row only they can read, and the suggestions come back from an
 * RPC that returns distances, never other people's coordinates.
 */
export function useNokorNearby(meId: string | null) {
  const [people, setPeople] = useState<NokorNearbyUser[]>([]);
  const [sharing, setSharing] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !meId) return;
    // Only my own row is readable, so this doubles as the opt-in check.
    const { data: mine } = await supabase
      .from("nokor_user_locations")
      .select("user_id")
      .eq("user_id", meId)
      .maybeSingle();
    const on = Boolean(mine);
    setSharing(on);
    if (!on) {
      setPeople([]);
      setLoaded(true);
      return;
    }
    const { data, error: rpcErr } = await supabase.rpc("nokor_nearby_users", {
      p_radius_km: NEARBY_RADIUS_KM,
    });
    if (rpcErr) setError(rpcErr.message);
    else setPeople((data ?? []) as NokorNearbyUser[]);
    setLoaded(true);
  }, [meId]);

  const refreshRef = useRef(refresh);
  useEffect(() => {
    refreshRef.current = refresh;
  });
  useEffect(() => {
    if (!meId) return;
    void refreshRef.current();
  }, [meId]);

  /** Ask the browser for a fix and store it. Requires a user gesture. */
  const share = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !meId) return false;
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("geolocation-unsupported");
      return false;
    }
    setBusy(true);
    setError(null);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: false,
          timeout: 10_000,
          maximumAge: 300_000,
        }),
      );
      const { error: upErr } = await supabase.from("nokor_user_locations").upsert(
        {
          user_id: meId,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        },
        { onConflict: "user_id" },
      );
      setBusy(false);
      if (upErr) {
        setError(upErr.message);
        return false;
      }
      await refresh();
      return true;
    } catch {
      setBusy(false);
      setError("permission-denied");
      return false;
    }
  }, [meId, refresh]);

  /** Opt out: drop the row entirely so nothing of ours is stored. */
  const stopSharing = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !meId) return;
    await supabase.from("nokor_user_locations").delete().eq("user_id", meId);
    setPeople([]);
    setSharing(false);
  }, [meId]);

  const follow = useCallback(
    async (userId: string) => {
      const supabase = getSupabase();
      if (!supabase || !meId) return;
      await supabase.from("nokor_follows").insert({ follower_id: meId, following_id: userId });
      // Followed people drop out of the suggestion list.
      setPeople((prev) => prev.filter((p) => p.user_id !== userId));
    },
    [meId],
  );

  return { people, sharing, loaded, busy, error, share, stopSharing, follow, refresh };
}
