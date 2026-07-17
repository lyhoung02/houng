"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabase } from "./client";
import { AVATAR_BUCKET, avatarUrl, MAX_AVATAR_BYTES } from "./attachments";
import type { Profile } from "./types";

export type ProfileState = Pick<Profile, "username" | "phone" | "avatar_path"> & {
  bio?: string | null;
};

const EMPTY: ProfileState = { username: null, phone: null, avatar_path: null, bio: null };

/** Display name for chat: username if set, otherwise an anonymised user tag. */
export function displayName(p: ProfileState | undefined, userId: string | null) {
  const name = p?.username?.trim();
  if (name) return name;
  return `user-${(userId ?? "").slice(0, 4) || "anon"}`;
}

export function useProfile(userId: string | null) {
  const [profile, setProfile] = useState<ProfileState>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !userId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("username, phone, avatar_path, bio")
        .eq("user_id", userId)
        .maybeSingle();
      if (!cancelled) {
        setProfile(data ?? EMPTY);
        setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const save = useCallback(
    async (fields: Partial<ProfileState>) => {
      const supabase = getSupabase();
      if (!supabase || !userId) return false;
      setSaving(true);
      setError(null);
      const next = { ...profile, ...fields };
      const { error: upErr } = await supabase.from("profiles").upsert({
        user_id: userId,
        username: next.username?.trim() || null,
        phone: next.phone?.trim() || null,
        avatar_path: next.avatar_path,
        bio: next.bio?.trim() || null,
      });
      setSaving(false);
      if (upErr) {
        setError(upErr.message);
        return false;
      }
      setProfile(next);
      return true;
    },
    [profile, userId],
  );

  const uploadAvatar = useCallback(
    async (file: File) => {
      const supabase = getSupabase();
      if (!supabase || !userId) return false;
      if (file.size > MAX_AVATAR_BYTES) {
        setError("avatar-too-large");
        return false;
      }
      setSaving(true);
      setError(null);
      const ext = file.name.split(".").pop()?.toLowerCase() || "png";
      // Timestamped name so the public URL changes and caches don't serve the
      // old picture.
      const path = `${userId}/avatar-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(path, file, { contentType: file.type || "image/png" });
      if (upErr) {
        setSaving(false);
        setError(upErr.message);
        return false;
      }
      const old = profile.avatar_path;
      const ok = await save({ avatar_path: path });
      if (ok && old) {
        // Best-effort: an orphaned old avatar is harmless.
        try {
          await supabase.storage.from(AVATAR_BUCKET).remove([old]);
        } catch {
          /* ignore */
        }
      }
      setSaving(false);
      return ok;
    },
    [profile.avatar_path, save, userId],
  );

  const changePassword = useCallback(async (password: string) => {
    const supabase = getSupabase();
    if (!supabase) return "unconfigured";
    const { error: pwErr } = await supabase.auth.updateUser({ password });
    return pwErr ? pwErr.message : null;
  }, []);

  const supabase = getSupabase();
  const avatar = supabase ? avatarUrl(supabase, profile.avatar_path) : null;

  return { profile, loaded, saving, error, avatar, save, uploadAvatar, changePassword };
}
