"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabase } from "./client";
import type { NokorAuthor, NokorFeedPost } from "./useNokor";
import { nokorPostImages } from "./useNokor";
import type { Gender, NokorBadgeKind, Relationship } from "./types";

const PROFILE_COLUMNS =
  "username, avatar_path, bio, work, education, hometown, current_city, current_province_code, current_district_code, current_commune_code, current_village_code, home_province_code, home_district_code, home_commune_code, home_village_code, relationship, website, birthday, gender, phone, badge";

export type NokorUserProfile = {
  userId: string;
  username: string | null;
  avatar_path: string | null;
  bio: string | null;
  work: string | null;
  education: string | null;
  hometown: string | null;
  current_city: string | null;
  current_province_code: string | null;
  current_district_code: string | null;
  current_commune_code: string | null;
  current_village_code: string | null;
  home_province_code: string | null;
  home_district_code: string | null;
  home_commune_code: string | null;
  home_village_code: string | null;
  relationship: Relationship | null;
  website: string | null;
  birthday: string | null;
  gender: Gender | null;
  phone: string | null;
  badge: NokorBadgeKind | null;
  followers: number;
  following: number;
  postCount: number;
  isFollowedByMe: boolean;
};

export type NokorActivityKind = "like" | "comment" | "follow";

export type NokorActivityItem = {
  key: string;
  kind: NokorActivityKind;
  actorId: string;
  actor: NokorAuthor | null;
  postId: string | null;
  preview: string | null;
  createdAt: string;
};

/** Follow state + counts for one user relative to the signed-in viewer. */
export function useNokorFollow(meId: string | null, userId: string | null) {
  const [profile, setProfile] = useState<NokorUserProfile | null>(null);
  const [posts, setPosts] = useState<NokorFeedPost[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !userId) return;
    const [profileRes, statsRes, postRes, mine] = await Promise.all([
      supabase.from("profiles").select(PROFILE_COLUMNS).eq("user_id", userId).maybeSingle(),
      supabase
        .from("nokor_user_stats")
        .select("post_count, follower_count, following_count")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase.from("nokor_posts").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      meId
        ? supabase.from("nokor_follows").select("follower_id").eq("follower_id", meId).eq("following_id", userId).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    const row = profileRes.data;
    const stats = statsRes.data;
    setProfile({
      userId,
      username: row?.username ?? null,
      avatar_path: row?.avatar_path ?? null,
      bio: row?.bio ?? null,
      work: row?.work ?? null,
      education: row?.education ?? null,
      hometown: row?.hometown ?? null,
      current_city: row?.current_city ?? null,
      current_province_code: row?.current_province_code ?? null,
      current_district_code: row?.current_district_code ?? null,
      current_commune_code: row?.current_commune_code ?? null,
      current_village_code: row?.current_village_code ?? null,
      home_province_code: row?.home_province_code ?? null,
      home_district_code: row?.home_district_code ?? null,
      home_commune_code: row?.home_commune_code ?? null,
      home_village_code: row?.home_village_code ?? null,
      relationship: row?.relationship ?? null,
      website: row?.website ?? null,
      birthday: row?.birthday ?? null,
      gender: row?.gender ?? null,
      phone: row?.phone ?? null,
      badge: row?.badge ?? null,
      followers: stats?.follower_count ?? 0,
      following: stats?.following_count ?? 0,
      postCount: stats?.post_count ?? 0,
      isFollowedByMe: Boolean(mine.data),
    });

    const author: NokorAuthor = {
      username: profileRes.data?.username ?? null,
      avatar_path: profileRes.data?.avatar_path ?? null,
      badge: profileRes.data?.badge ?? null,
    };
    setPosts(
      (postRes.data ?? []).map((p) => ({
        ...p,
        author,
        likeCount: 0,
        likedByMe: false,
        comments: [],
      })),
    );
    setLoaded(true);
  }, [meId, userId]);

  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  });
  useEffect(() => {
    void loadRef.current();
  }, [userId, meId]);

  const toggleFollow = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !meId || !userId || meId === userId || !profile) return;
    const now = profile.isFollowedByMe;
    const set = (followed: boolean) =>
      setProfile((p) =>
        p ? { ...p, isFollowedByMe: followed, followers: p.followers + (followed ? 1 : -1) } : p,
      );
    // Optimistic; roll back if the write fails.
    set(!now);
    const { error: mutErr } = now
      ? await supabase.from("nokor_follows").delete().eq("follower_id", meId).eq("following_id", userId)
      : await supabase.from("nokor_follows").insert({ follower_id: meId, following_id: userId });
    if (mutErr) set(now);
  }, [meId, userId, profile]);

  return { profile, posts, loaded, reload: load, toggleFollow };
}

/** Notifications for the signed-in user: likes and comments on their posts,
 *  plus new followers — merged and sorted, derived from the base tables. */
export function useNokorActivity(meId: string | null) {
  const [items, setItems] = useState<NokorActivityItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !meId) return;

    const { data: myPosts } = await supabase.from("nokor_posts").select("id").eq("user_id", meId);
    const myPostIds = (myPosts ?? []).map((p) => p.id);

    const [likesRes, commentsRes, followsRes] = await Promise.all([
      myPostIds.length
        ? supabase.from("nokor_likes").select("post_id, user_id, created_at").in("post_id", myPostIds)
        : Promise.resolve({ data: [] }),
      myPostIds.length
        ? supabase.from("nokor_comments").select("id, post_id, user_id, body, created_at").in("post_id", myPostIds)
        : Promise.resolve({ data: [] }),
      supabase.from("nokor_follows").select("follower_id, created_at").eq("following_id", meId),
    ]);

    const likes = (likesRes.data ?? []).filter((l) => l.user_id !== meId);
    const comments = (commentsRes.data ?? []).filter((c) => c.user_id !== meId);
    const follows = followsRes.data ?? [];

    const actorIds = [
      ...new Set([
        ...likes.map((l) => l.user_id),
        ...comments.map((c) => c.user_id),
        ...follows.map((f) => f.follower_id),
      ]),
    ];
    const { data: profileRows } = actorIds.length
      ? await supabase.from("profiles").select("user_id, username, avatar_path, badge").in("user_id", actorIds)
      : { data: [] };
    const authors = new Map(
      (profileRows ?? []).map((p) => [
        p.user_id,
        { username: p.username, avatar_path: p.avatar_path, badge: p.badge },
      ]),
    );

    const merged: NokorActivityItem[] = [
      ...likes.map((l) => ({
        key: `like-${l.post_id}-${l.user_id}`,
        kind: "like" as const,
        actorId: l.user_id,
        actor: authors.get(l.user_id) ?? null,
        postId: l.post_id,
        preview: null,
        createdAt: l.created_at,
      })),
      ...comments.map((c) => ({
        key: `comment-${c.id}`,
        kind: "comment" as const,
        actorId: c.user_id,
        actor: authors.get(c.user_id) ?? null,
        postId: c.post_id,
        preview: c.body,
        createdAt: c.created_at,
      })),
      ...follows.map((f) => ({
        key: `follow-${f.follower_id}`,
        kind: "follow" as const,
        actorId: f.follower_id,
        actor: authors.get(f.follower_id) ?? null,
        postId: null,
        preview: null,
        createdAt: f.created_at,
      })),
    ].sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    setItems(merged);
    setLoaded(true);
  }, [meId]);

  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  });
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !meId) return;
    void loadRef.current();
    let timer: ReturnType<typeof setTimeout> | null = null;
    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void loadRef.current(), 400);
    };
    const channel = supabase
      .channel("nokor-activity")
      .on("postgres_changes", { event: "*", schema: "public", table: "nokor_likes" }, schedule)
      .on("postgres_changes", { event: "*", schema: "public", table: "nokor_comments" }, schedule)
      .on("postgres_changes", { event: "*", schema: "public", table: "nokor_follows" }, schedule)
      .subscribe();
    return () => {
      if (timer) clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [meId]);

  return { items, loaded };
}

export type NokorSuggestion = {
  userId: string;
  username: string | null;
  avatar_path: string | null;
  badge: NokorBadgeKind | null;
  followers: number;
  posts: number;
};

/** "Who to follow" — users the signed-in viewer isn't following yet, ranked by
 *  follower count then post count so new accounts have people to discover. */
export function useNokorSuggestions(meId: string | null) {
  const [items, setItems] = useState<NokorSuggestion[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !meId) return;

    const [followsRes, profRes, statsRes] = await Promise.all([
      supabase.from("nokor_follows").select("following_id").eq("follower_id", meId),
      supabase.from("profiles").select("user_id, username, avatar_path, badge").neq("user_id", meId).limit(100),
      supabase.from("nokor_user_stats").select("user_id, follower_count, post_count"),
    ]);

    const followed = new Set((followsRes.data ?? []).map((f) => f.following_id));
    const stats = new Map(
      (statsRes.data ?? []).map((s) => [s.user_id, { followers: s.follower_count, posts: s.post_count }]),
    );

    const next: NokorSuggestion[] = (profRes.data ?? [])
      .filter((r) => !followed.has(r.user_id))
      .map((r) => ({
        userId: r.user_id,
        username: r.username,
        avatar_path: r.avatar_path,
        badge: r.badge,
        followers: stats.get(r.user_id)?.followers ?? 0,
        posts: stats.get(r.user_id)?.posts ?? 0,
      }))
      .sort((a, b) => b.followers - a.followers || b.posts - a.posts)
      .slice(0, 10);

    setItems(next);
    setLoaded(true);
  }, [meId]);

  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  });
  useEffect(() => {
    void loadRef.current();
  }, [meId]);

  const follow = useCallback(
    async (userId: string) => {
      const supabase = getSupabase();
      if (!supabase || !meId || userId === meId) return;
      setItems((list) => list.filter((s) => s.userId !== userId));
      const { error } = await supabase.from("nokor_follows").insert({ follower_id: meId, following_id: userId });
      if (error) void loadRef.current();
    },
    [meId],
  );

  const dismiss = useCallback((userId: string) => {
    setItems((list) => list.filter((s) => s.userId !== userId));
  }, []);

  return { items, loaded, follow, dismiss };
}

/** Images helper re-export kept close to profile grids that use it. */
export { nokorPostImages };
