"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabase } from "./client";
import { NOKOR_MEDIA_BUCKET, nokorMediaUrl, type NokorAuthor } from "./useNokor";
import type { NokorStory } from "./types";

export const MAX_STORY_IMAGE_BYTES = 5 * 1024 * 1024;

/** Default lifetime when the author doesn't pick one. */
export const DEFAULT_STORY_HOURS = 24;
export const STORY_HOUR_OPTIONS = [1, 6, 12, 24, 48];

/** Background presets for text stories; `background` stores the key. */
export const STORY_BACKGROUNDS = [
  { key: "indigo", className: "bg-gradient-to-br from-indigo-500 to-purple-600" },
  { key: "sunset", className: "bg-gradient-to-br from-rose-500 to-amber-400" },
  { key: "ocean", className: "bg-gradient-to-br from-cyan-500 to-blue-600" },
  { key: "forest", className: "bg-gradient-to-br from-emerald-500 to-teal-600" },
  { key: "gold", className: "bg-gradient-to-br from-amber-400 to-yellow-600" },
  { key: "night", className: "bg-gradient-to-br from-slate-700 to-slate-900" },
];

export function storyBgClass(key: string | null) {
  return STORY_BACKGROUNDS.find((b) => b.key === key)?.className ?? STORY_BACKGROUNDS[0].className;
}

export type NokorStoryGroup = {
  userId: string;
  author: NokorAuthor | null;
  stories: NokorStory[];
  hasUnseen: boolean;
  /** Index of the first story the viewer hasn't seen, or 0 when all are seen. */
  firstUnseen: number;
};

export type NokorFollower = {
  userId: string;
  username: string | null;
  avatar_path: string | null;
};

export type AddStoryInput = {
  image?: File | null;
  /** Image caption, or the body of a text story. */
  text?: string;
  /** Background preset key (text stories only). */
  background?: string | null;
  /** Hours until it expires; defaults to 24. */
  expiresHours?: number;
  /** Follower ids that should not see this story. */
  hiddenFrom?: string[];
};

export function nokorStoryUrl(story: NokorStory) {
  return nokorMediaUrl(story.image_path);
}

/** Reply to someone's story: opens (or reuses) the DM thread with the author
 *  and sends a message that quotes the story — like replying on Messenger. */
export async function nokorReplyToStory(meId: string | null, story: NokorStory, text: string) {
  const supabase = getSupabase();
  const body = text.trim();
  if (!supabase || !meId || !body || story.user_id === meId) return false;

  const { data: threadId, error: openErr } = await supabase.rpc("nokor_open_dm", {
    p_other: story.user_id,
  });
  if (openErr || !threadId) return false;

  const { error } = await supabase.from("nokor_dm_messages").insert({
    thread_id: threadId as string,
    sender_id: meId,
    body,
    kind: "text",
    story_id: story.id,
    story_snapshot: {
      kind: story.kind === "text" ? "text" : "image",
      caption: story.caption,
      image_path: story.image_path,
      background: story.background,
      author_id: story.user_id,
    },
  });
  return !error;
}

export function useNokorStories(meId: string | null) {
  const [groups, setGroups] = useState<NokorStoryGroup[]>([]);
  const [viewCounts, setViewCounts] = useState<Record<string, number>>({});
  const [followers, setFollowers] = useState<NokorFollower[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !meId) return;
    const nowIso = new Date().toISOString();
    // Stories hidden from this viewer are filtered out by RLS.
    const { data: rows } = await supabase
      .from("nokor_stories")
      .select("*")
      .gt("expires_at", nowIso)
      .order("created_at", { ascending: true });
    const stories = (rows ?? []) as NokorStory[];
    const storyIds = stories.map((s) => s.id);
    const userIds = [...new Set(stories.map((s) => s.user_id))];

    const [profileRes, viewRes] = await Promise.all([
      userIds.length
        ? supabase.from("profiles").select("user_id, username, avatar_path").in("user_id", userIds)
        : Promise.resolve({ data: [] }),
      storyIds.length
        ? supabase.from("nokor_story_views").select("story_id, user_id").in("story_id", storyIds)
        : Promise.resolve({ data: [] }),
    ]);

    const authors = new Map(
      (profileRes.data ?? []).map((p) => [p.user_id, { username: p.username, avatar_path: p.avatar_path }]),
    );
    const views = viewRes.data ?? [];
    const seenByMe = new Set(views.filter((v) => v.user_id === meId).map((v) => v.story_id));
    const counts: Record<string, number> = {};
    for (const v of views) counts[v.story_id] = (counts[v.story_id] ?? 0) + 1;

    // Group by author; my own group first, then unseen, then the rest.
    const byUser = new Map<string, NokorStory[]>();
    for (const s of stories) {
      const list = byUser.get(s.user_id) ?? [];
      list.push(s);
      byUser.set(s.user_id, list);
    }
    const list: NokorStoryGroup[] = [...byUser.entries()].map(([userId, userStories]) => {
      const firstUnseen = userStories.findIndex((s) => !seenByMe.has(s.id));
      return {
        userId,
        author: authors.get(userId) ?? null,
        stories: userStories,
        hasUnseen: firstUnseen !== -1,
        firstUnseen: firstUnseen === -1 ? 0 : firstUnseen,
      };
    });
    list.sort((a, b) => {
      if (a.userId === meId) return -1;
      if (b.userId === meId) return 1;
      if (a.hasUnseen !== b.hasUnseen) return a.hasUnseen ? -1 : 1;
      return 0;
    });

    setGroups(list);
    setViewCounts(counts);
    setLoaded(true);
  }, [meId]);

  /** People who follow me — the candidates for the "hide from" list. */
  const loadFollowers = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !meId) return;
    const { data: rows } = await supabase
      .from("nokor_follows")
      .select("follower_id")
      .eq("following_id", meId);
    const ids = (rows ?? []).map((r) => r.follower_id);
    if (!ids.length) {
      setFollowers([]);
      return;
    }
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, username, avatar_path")
      .in("user_id", ids);
    setFollowers(
      (profiles ?? []).map((p) => ({
        userId: p.user_id,
        username: p.username,
        avatar_path: p.avatar_path,
      })),
    );
  }, [meId]);

  const refreshRef = useRef(refresh);
  const followersRef = useRef(loadFollowers);
  useEffect(() => {
    refreshRef.current = refresh;
    followersRef.current = loadFollowers;
  });
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !meId) return;
    void refreshRef.current();
    void followersRef.current();
    let timer: ReturnType<typeof setTimeout> | null = null;
    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void refreshRef.current(), 400);
    };
    const channel = supabase
      .channel("nokor-stories")
      .on("postgres_changes", { event: "*", schema: "public", table: "nokor_stories" }, schedule)
      .on("postgres_changes", { event: "*", schema: "public", table: "nokor_story_views" }, schedule)
      .subscribe();
    return () => {
      if (timer) clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [meId]);

  const addStory = useCallback(
    async ({ image, text, background, expiresHours, hiddenFrom }: AddStoryInput) => {
      const supabase = getSupabase();
      if (!supabase || !meId) return false;
      const body = (text ?? "").trim();
      // Must be an image story or a text story with words in it.
      if (!image && !body) return false;
      if (image && image.size > MAX_STORY_IMAGE_BYTES) return false;

      setBusy(true);
      let imagePath: string | null = null;
      if (image) {
        const ext = image.name.split(".").pop()?.toLowerCase() || "jpg";
        imagePath = `${meId}/story-${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from(NOKOR_MEDIA_BUCKET)
          .upload(imagePath, image, { contentType: image.type || "image/jpeg" });
        if (upErr) {
          setBusy(false);
          return false;
        }
      }

      const hours = expiresHours && expiresHours > 0 ? expiresHours : DEFAULT_STORY_HOURS;
      const expiresAt = new Date(Date.now() + hours * 3600 * 1000).toISOString();

      const { data: inserted, error: insErr } = await supabase
        .from("nokor_stories")
        .insert({
          user_id: meId,
          kind: image ? "image" : "text",
          image_path: imagePath,
          caption: body || null,
          background: image ? null : (background ?? STORY_BACKGROUNDS[0].key),
          expires_at: expiresAt,
        })
        .select("id")
        .single();

      if (insErr || !inserted) {
        setBusy(false);
        return false;
      }

      if (hiddenFrom?.length) {
        await supabase
          .from("nokor_story_hidden")
          .insert(hiddenFrom.map((uid) => ({ story_id: inserted.id, user_id: uid })));
      }

      setBusy(false);
      void refresh();
      return true;
    },
    [meId, refresh],
  );

  const deleteStory = useCallback(
    async (story: NokorStory) => {
      const supabase = getSupabase();
      if (!supabase || !meId || story.user_id !== meId) return;
      await supabase.from("nokor_stories").delete().eq("id", story.id);
      if (story.image_path) {
        try {
          await supabase.storage.from(NOKOR_MEDIA_BUCKET).remove([story.image_path]);
        } catch {
          /* orphan is harmless */
        }
      }
      void refresh();
    },
    [meId, refresh],
  );

  const markViewed = useCallback(
    async (storyId: string, authorId: string) => {
      const supabase = getSupabase();
      if (!supabase || !meId || authorId === meId) return;
      await supabase
        .from("nokor_story_views")
        .upsert({ story_id: storyId, user_id: meId }, { onConflict: "story_id,user_id" });
    },
    [meId],
  );

  return { groups, viewCounts, followers, loaded, busy, addStory, deleteStory, markViewed };
}
