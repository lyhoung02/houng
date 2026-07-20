"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabase } from "./client";
import type { NokorComment, NokorPost } from "./types";
import type { NokorFeedComment, NokorFeedPost } from "./useNokor";

/** Loads a single post by id — including posts outside the 50-item feed window
 *  — with its author, likes, and comments, so `#/post/<id>` deep links resolve.
 *  Mirrors the feed assembly in useNokor but scoped to one post. */
export function useNokorPost(postId: string | null, meId: string | null) {
  const [post, setPost] = useState<NokorFeedPost | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !postId || !meId) return;

    const { data: row } = await supabase
      .from("nokor_posts")
      .select("*")
      .eq("id", postId)
      .maybeSingle();
    if (!row) {
      setPost(null);
      setNotFound(true);
      setLoaded(true);
      return;
    }
    const base = row as NokorPost;

    // Counts come from the trigger-maintained columns; only the viewer's own
    // like rows are fetched to resolve likedByMe.
    const [myLikeRes, commentRes] = await Promise.all([
      supabase
        .from("nokor_likes")
        .select("post_id")
        .eq("post_id", postId)
        .eq("user_id", meId)
        .maybeSingle(),
      supabase
        .from("nokor_comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: true }),
    ]);
    const likedByMe = Boolean(myLikeRes.data);
    const comments = (commentRes.data ?? []) as NokorComment[];

    const commentIds = comments.map((c) => c.id);
    let myLikedComments = new Set<string>();
    if (commentIds.length) {
      const { data } = await supabase
        .from("nokor_comment_likes")
        .select("comment_id")
        .eq("user_id", meId)
        .in("comment_id", commentIds);
      myLikedComments = new Set((data ?? []).map((l) => l.comment_id));
    }

    const authorIds = [...new Set([base.user_id, ...comments.map((c) => c.user_id)])];
    const { data: profileRows } = await supabase
      .from("profiles")
      .select("user_id, username, avatar_path, badge")
      .in("user_id", authorIds);
    const authors = new Map(
      (profileRows ?? []).map((p) => [
        p.user_id,
        { username: p.username, avatar_path: p.avatar_path, badge: p.badge },
      ]),
    );

    setPost({
      ...base,
      author: authors.get(base.user_id) ?? null,
      likeCount: base.like_count,
      likedByMe,
      comments: comments.map((c) => ({
        ...c,
        author: authors.get(c.user_id) ?? null,
        likeCount: c.like_count,
        likedByMe: myLikedComments.has(c.id),
      })),
    });
    setNotFound(false);
    setLoaded(true);
  }, [postId, meId]);

  // Reload after any post-scoped change (filtered subscriptions only — no
  // table-wide listeners).
  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  });
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !postId || !meId) return;
    void loadRef.current();
    let timer: ReturnType<typeof setTimeout> | null = null;
    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void loadRef.current(), 250);
    };
    const filter = `post_id=eq.${postId}`;
    const channel = supabase
      .channel(`nokor-post-${postId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "nokor_posts", filter: `id=eq.${postId}` }, schedule)
      .on("postgres_changes", { event: "*", schema: "public", table: "nokor_likes", filter }, schedule)
      .on("postgres_changes", { event: "*", schema: "public", table: "nokor_comments", filter }, schedule)
      .subscribe();
    return () => {
      if (timer) clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [postId, meId]);

  const toggleLike = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !meId || !post) return;
    const wasLiked = post.likedByMe;
    const flip = (liked: boolean) =>
      setPost((p) =>
        p ? { ...p, likedByMe: liked, likeCount: p.likeCount + (liked ? 1 : -1) } : p,
      );
    flip(!wasLiked);
    const { error } = wasLiked
      ? await supabase.from("nokor_likes").delete().eq("post_id", post.id).eq("user_id", meId)
      : await supabase.from("nokor_likes").insert({ post_id: post.id, user_id: meId });
    if (error) flip(wasLiked);
  }, [meId, post]);

  const addComment = useCallback(
    async (body: string, replyToId: string | null) => {
      const supabase = getSupabase();
      if (!supabase || !meId || !post || !body.trim()) return false;
      const { error } = await supabase.from("nokor_comments").insert({
        post_id: post.id,
        user_id: meId,
        body: body.trim(),
        reply_to_id: replyToId ?? null,
      });
      if (error) return false;
      void load();
      return true;
    },
    [meId, post, load],
  );

  const editPost = useCallback(
    async (body: string) => {
      const supabase = getSupabase();
      if (!supabase || !meId || !post || !body.trim()) return false;
      const { error } = await supabase
        .from("nokor_posts")
        .update({ body: body.trim(), edited_at: new Date().toISOString() })
        .eq("id", post.id);
      if (error) return false;
      void load();
      return true;
    },
    [meId, post, load],
  );

  const deletePost = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !meId || !post) return;
    await supabase.from("nokor_posts").delete().eq("id", post.id);
  }, [meId, post]);

  const toggleCommentLike = useCallback(
    async (comment: NokorFeedComment) => {
      const supabase = getSupabase();
      if (!supabase || !meId || !post) return;
      const wasLiked = comment.likedByMe;
      const flip = (liked: boolean) =>
        setPost((p) =>
          p
            ? {
                ...p,
                comments: p.comments.map((c) =>
                  c.id !== comment.id
                    ? c
                    : { ...c, likedByMe: liked, likeCount: c.likeCount + (liked ? 1 : -1) },
                ),
              }
            : p,
        );
      flip(!wasLiked);
      const { error } = wasLiked
        ? await supabase
            .from("nokor_comment_likes")
            .delete()
            .eq("comment_id", comment.id)
            .eq("user_id", meId)
        : await supabase
            .from("nokor_comment_likes")
            .insert({ comment_id: comment.id, user_id: meId });
      if (error) flip(wasLiked);
    },
    [meId, post],
  );

  const deleteComment = useCallback(
    async (commentId: string) => {
      const supabase = getSupabase();
      if (!supabase || !meId) return;
      await supabase.from("nokor_comments").delete().eq("id", commentId);
      void load();
    },
    [meId, load],
  );

  return {
    post,
    loaded,
    notFound,
    toggleLike,
    addComment,
    editPost,
    deletePost,
    toggleCommentLike,
    deleteComment,
  };
}
