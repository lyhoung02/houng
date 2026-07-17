"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabase, isSupabaseConfigured } from "./client";
import { avatarUrl } from "./attachments";
import type { NokorComment, NokorPost } from "./types";

export const NOKOR_MEDIA_BUCKET = "nokor-media";
export const MAX_POST_IMAGE_BYTES = 5 * 1024 * 1024; // keep in sync with the bucket limit
export const MAX_POST_IMAGES = 6;

const FEED_LIMIT = 50;

export type NokorAuthor = {
  username: string | null;
  avatar_path: string | null;
};

export type NokorFeedComment = NokorComment & {
  author: NokorAuthor | null;
  likeCount: number;
  likedByMe: boolean;
};

export type NokorFeedPost = NokorPost & {
  author: NokorAuthor | null;
  likeCount: number;
  likedByMe: boolean;
  comments: NokorFeedComment[];
};

export function nokorMediaUrl(imagePath: string | null) {
  const supabase = getSupabase();
  if (!supabase || !imagePath) return null;
  return supabase.storage.from(NOKOR_MEDIA_BUCKET).getPublicUrl(imagePath).data.publicUrl;
}

/** All image URLs for a post, newest schema first, falling back to legacy. */
export function nokorPostImages(post: Pick<NokorPost, "image_paths" | "image_path">) {
  const paths = post.image_paths?.length
    ? post.image_paths
    : post.image_path
      ? [post.image_path]
      : [];
  return paths.map((p) => nokorMediaUrl(p)).filter((u): u is string => Boolean(u));
}

export function nokorAvatarUrl(author: NokorAuthor | null) {
  const supabase = getSupabase();
  if (!supabase) return null;
  return avatarUrl(supabase, author?.avatar_path ?? null);
}

export function useNokor() {
  const [userId, setUserId] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  // Unconfigured Supabase means there is no auth to wait for.
  const [authLoaded, setAuthLoaded] = useState(!isSupabaseConfigured);
  const [posts, setPosts] = useState<NokorFeedPost[]>([]);
  const [feedLoaded, setFeedLoaded] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auth ----------------------------------------------------------------

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
      setEmail(session?.user?.email ?? null);
      setAuthLoaded(true);
      if (!session) {
        // Signed out: drop the feed so the next sign-in starts clean.
        setPosts([]);
        setFeedLoaded(false);
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (emailArg: string, password: string) => {
    const supabase = getSupabase();
    if (!supabase) return "unconfigured";
    const { error: err } = await supabase.auth.signInWithPassword({
      email: emailArg,
      password,
    });
    return err ? err.message : null;
  }, []);

  const signUp = useCallback(async (emailArg: string, password: string) => {
    const supabase = getSupabase();
    if (!supabase) return "unconfigured";
    const { error: err } = await supabase.auth.signUp({ email: emailArg, password });
    return err ? err.message : null;
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    await supabase.auth.signOut();
  }, []);

  // Feed ----------------------------------------------------------------

  const refresh = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !userId) return;
    const { data: postRows, error: postErr } = await supabase
      .from("nokor_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(FEED_LIMIT);
    if (postErr) {
      setError(postErr.message);
      return;
    }
    const rows = postRows ?? [];
    const postIds = rows.map((p) => p.id);

    let likes: { post_id: string; user_id: string }[] = [];
    let comments: NokorComment[] = [];
    if (postIds.length) {
      const [likeRes, commentRes] = await Promise.all([
        supabase.from("nokor_likes").select("post_id, user_id").in("post_id", postIds),
        supabase
          .from("nokor_comments")
          .select("*")
          .in("post_id", postIds)
          .order("created_at", { ascending: true }),
      ]);
      likes = likeRes.data ?? [];
      comments = (commentRes.data ?? []) as NokorComment[];
    }

    const commentIds = comments.map((c) => c.id);
    let commentLikes: { comment_id: string; user_id: string }[] = [];
    if (commentIds.length) {
      const { data } = await supabase
        .from("nokor_comment_likes")
        .select("comment_id, user_id")
        .in("comment_id", commentIds);
      commentLikes = data ?? [];
    }

    const authorIds = [
      ...new Set([...rows.map((p) => p.user_id), ...comments.map((c) => c.user_id)]),
    ];
    const { data: profileRows } = authorIds.length
      ? await supabase
          .from("profiles")
          .select("user_id, username, avatar_path")
          .in("user_id", authorIds)
      : { data: [] };
    const authors = new Map(
      (profileRows ?? []).map((p) => [
        p.user_id,
        { username: p.username, avatar_path: p.avatar_path },
      ]),
    );

    setPosts(
      rows.map((p) => ({
        ...p,
        author: authors.get(p.user_id) ?? null,
        likeCount: likes.filter((l) => l.post_id === p.id).length,
        likedByMe: likes.some((l) => l.post_id === p.id && l.user_id === userId),
        comments: comments
          .filter((c) => c.post_id === p.id)
          .map((c) => ({
            ...c,
            author: authors.get(c.user_id) ?? null,
            likeCount: commentLikes.filter((l) => l.comment_id === c.id).length,
            likedByMe: commentLikes.some(
              (l) => l.comment_id === c.id && l.user_id === userId,
            ),
          })),
      })),
    );
    setFeedLoaded(true);
  }, [userId]);

  // Initial load + realtime: any change to posts/likes/comments re-pulls the
  // feed (debounced) — simple and always consistent at this feed size.
  const refreshRef = useRef(refresh);
  useEffect(() => {
    refreshRef.current = refresh;
  });

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !userId) return;
    void refreshRef.current();
    let timer: ReturnType<typeof setTimeout> | null = null;
    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void refreshRef.current(), 250);
    };
    const channel = supabase
      .channel("nokor-feed")
      .on("postgres_changes", { event: "*", schema: "public", table: "nokor_posts" }, schedule)
      .on("postgres_changes", { event: "*", schema: "public", table: "nokor_likes" }, schedule)
      .on("postgres_changes", { event: "*", schema: "public", table: "nokor_comments" }, schedule)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "nokor_comment_likes" },
        schedule,
      )
      .subscribe();
    return () => {
      if (timer) clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  // Actions ---------------------------------------------------------------

  const createPost = useCallback(
    async (body: string, images: File[] = []) => {
      const supabase = getSupabase();
      if (!supabase || !userId) return false;
      const files = images.slice(0, MAX_POST_IMAGES);
      if (files.some((f) => f.size > MAX_POST_IMAGE_BYTES)) {
        setError("image-too-large");
        return false;
      }
      setBusy(true);
      setError(null);
      const imagePaths: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${userId}/post-${Date.now()}-${i}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from(NOKOR_MEDIA_BUCKET)
          .upload(path, file, { contentType: file.type || "image/jpeg" });
        if (upErr) {
          setBusy(false);
          setError(upErr.message);
          return false;
        }
        imagePaths.push(path);
      }
      const { error: insErr } = await supabase
        .from("nokor_posts")
        .insert({ user_id: userId, body: body.trim(), image_paths: imagePaths });
      setBusy(false);
      if (insErr) {
        setError(insErr.message);
        return false;
      }
      void refresh();
      return true;
    },
    [refresh, userId],
  );

  const deletePost = useCallback(
    async (post: NokorFeedPost) => {
      const supabase = getSupabase();
      if (!supabase || !userId) return;
      await supabase.from("nokor_posts").delete().eq("id", post.id);
      const paths = [
        ...(post.image_paths ?? []),
        ...(post.image_path ? [post.image_path] : []),
      ];
      if (paths.length && post.user_id === userId) {
        // Best-effort: orphaned images are harmless.
        try {
          await supabase.storage.from(NOKOR_MEDIA_BUCKET).remove(paths);
        } catch {
          /* ignore */
        }
      }
      void refresh();
    },
    [refresh, userId],
  );

  const editPost = useCallback(
    async (postId: string, body: string) => {
      const supabase = getSupabase();
      if (!supabase || !userId || !body.trim()) return false;
      const { error: upErr } = await supabase
        .from("nokor_posts")
        .update({ body: body.trim(), edited_at: new Date().toISOString() })
        .eq("id", postId);
      if (upErr) {
        setError(upErr.message);
        return false;
      }
      void refresh();
      return true;
    },
    [refresh, userId],
  );

  const toggleLike = useCallback(
    async (post: NokorFeedPost) => {
      const supabase = getSupabase();
      if (!supabase || !userId) return;
      // Optimistic flip; realtime refresh reconciles.
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id
            ? {
                ...p,
                likedByMe: !p.likedByMe,
                likeCount: p.likeCount + (p.likedByMe ? -1 : 1),
              }
            : p,
        ),
      );
      if (post.likedByMe) {
        await supabase.from("nokor_likes").delete().eq("post_id", post.id).eq("user_id", userId);
      } else {
        await supabase.from("nokor_likes").insert({ post_id: post.id, user_id: userId });
      }
    },
    [userId],
  );

  const addComment = useCallback(
    async (postId: string, body: string, replyToId?: string | null) => {
      const supabase = getSupabase();
      if (!supabase || !userId || !body.trim()) return false;
      const { error: insErr } = await supabase.from("nokor_comments").insert({
        post_id: postId,
        user_id: userId,
        body: body.trim(),
        reply_to_id: replyToId ?? null,
      });
      if (insErr) {
        setError(insErr.message);
        return false;
      }
      void refresh();
      return true;
    },
    [refresh, userId],
  );

  const toggleCommentLike = useCallback(
    async (postId: string, comment: NokorFeedComment) => {
      const supabase = getSupabase();
      if (!supabase || !userId) return;
      // Optimistic flip; realtime refresh reconciles.
      setPosts((prev) =>
        prev.map((p) =>
          p.id !== postId
            ? p
            : {
                ...p,
                comments: p.comments.map((c) =>
                  c.id !== comment.id
                    ? c
                    : {
                        ...c,
                        likedByMe: !c.likedByMe,
                        likeCount: c.likeCount + (c.likedByMe ? -1 : 1),
                      },
                ),
              },
        ),
      );
      if (comment.likedByMe) {
        await supabase
          .from("nokor_comment_likes")
          .delete()
          .eq("comment_id", comment.id)
          .eq("user_id", userId);
      } else {
        await supabase
          .from("nokor_comment_likes")
          .insert({ comment_id: comment.id, user_id: userId });
      }
    },
    [userId],
  );

  const deleteComment = useCallback(
    async (commentId: string) => {
      const supabase = getSupabase();
      if (!supabase || !userId) return;
      await supabase.from("nokor_comments").delete().eq("id", commentId);
      void refresh();
    },
    [refresh, userId],
  );

  return {
    userId,
    email,
    authLoaded,
    posts,
    feedLoaded,
    busy,
    error,
    signIn,
    signUp,
    signOut,
    createPost,
    editPost,
    deletePost,
    toggleLike,
    addComment,
    toggleCommentLike,
    deleteComment,
  };
}
