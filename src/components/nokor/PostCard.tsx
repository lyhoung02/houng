"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import {
  nokorAvatarUrl,
  nokorMediaUrl,
  nokorPostImages,
  nokorRecordView,
  type NokorAuthor,
  type NokorFeedComment,
  type NokorFeedPost,
} from "@/lib/supabase/useNokor";
import { useT } from "../providers/LanguageProvider";
import { useNokorNav } from "./useNokorNav";
import NokorBadge from "./NokorBadge";
import NokorReportSheet, { type NokorReportTarget } from "./NokorReportSheet";

type FeedStrings = ReturnType<typeof useT>["nokor"]["feed"];

/** Username if set, otherwise the same anonymised tag chat uses. */
function authorName(author: NokorAuthor | null, userId: string) {
  return author?.username?.trim() || `user-${userId.slice(0, 4) || "anon"}`;
}

/** 1234 -> "1.2K", 1_500_000 -> "1.5M" (TikTok-style view counts). */
function compactCount(n: number) {
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10_000 ? 1 : 0)}K`.replace(".0", "");
  return `${(n / 1_000_000).toFixed(1)}M`.replace(".0", "");
}

function timeAgo(iso: string, t: FeedStrings) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return t.justNow;
  if (mins < 60) return t.minutesAgo.replace("{n}", String(mins));
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t.hoursAgo.replace("{n}", String(hours));
  return t.daysAgo.replace("{n}", String(Math.floor(hours / 24)));
}

function Avatar({
  author,
  userId,
  size = 40,
}: {
  author: NokorAuthor | null;
  userId: string;
  size?: number;
}) {
  const url = nokorAvatarUrl(author);
  const name = authorName(author, userId);
  if (url) {
    return (
      <Image
        src={url}
        alt={name}
        width={size}
        height={size}
        unoptimized
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-indigo-500/30 font-semibold uppercase"
      style={{ width: size, height: size, fontSize: size * 0.35 }}
    >
      {name.slice(0, 2)}
    </div>
  );
}

/** Add Supabase storage's download flag so the public URL responds with a
 *  Content-Disposition attachment header — forces a save, works cross-origin. */
function downloadHref(url: string) {
  return url + (url.includes("?") ? "&" : "?") + "download";
}

function DownloadButton({ url, label }: { url: string; label: string }) {
  return (
    <a
      href={downloadHref(url)}
      download
      aria-label={label}
      title={label}
      onClick={(e) => e.stopPropagation()}
      className="absolute top-2 left-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-black/80"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 3v12m0 0 4-4m-4 4-4-4M5 21h14"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </a>
  );
}

/** Post images: single image shown plain; multiple shown as an e-commerce-style
 *  gallery — one large main image plus a thumbnail strip to switch it. */
function Gallery({ images }: { images: string[] }) {
  const t = useT();
  const saveLabel = t.nokor.feed.saveImage;
  const [active, setActive] = useState(0);
  if (!images.length) return null;
  if (images.length === 1) {
    return (
      <div className="relative mt-3 aspect-square w-full overflow-hidden rounded-xl border border-border bg-surface">
        <Image src={images[0]} alt="" fill unoptimized className="object-contain" />
        <DownloadButton url={images[0]} label={saveLabel} />
      </div>
    );
  }
  const idx = Math.min(active, images.length - 1);
  return (
    <div className="mt-3">
      <div className="relative aspect-square w-full overflow-hidden rounded-xl border border-border bg-surface">
        <Image src={images[idx]} alt="" fill unoptimized className="object-contain" />
        <DownloadButton url={images[idx]} label={saveLabel} />
        <span className="absolute top-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
          {idx + 1}/{images.length}
        </span>
      </div>
      <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto">
        {images.map((src, i) => (
          <button
            key={src}
            type="button"
            onClick={() => setActive(i)}
            aria-label={`${i + 1}`}
            className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition ${
              i === idx ? "border-indigo-400" : "border-transparent opacity-60 hover:opacity-100"
            }`}
          >
            <Image src={src} alt="" fill unoptimized className="object-cover" />
          </button>
        ))}
      </div>
    </div>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"}>
      <path
        d="M12 21s-7.5-4.6-10-9.2C.4 8.4 2.6 4.5 6.4 4.5c2.2 0 3.7 1.2 5.6 3.3 1.9-2.1 3.4-3.3 5.6-3.3 3.8 0 6 3.9 4.4 7.3C19.5 16.4 12 21 12 21z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CommentItem({
  comment,
  userId,
  t,
  isReply,
  onToggleLike,
  onReply,
  onDelete,
  onReport,
}: {
  comment: NokorFeedComment;
  userId: string;
  t: FeedStrings;
  isReply?: boolean;
  onToggleLike: () => void;
  onReply: () => void;
  onDelete: () => void;
  onReport: () => void;
}) {
  return (
    <div className={`flex items-start gap-2.5 ${isReply ? "ml-9" : ""}`}>
      <Avatar author={comment.author} userId={comment.user_id} size={isReply ? 24 : 30} />
      <div className="min-w-0 flex-1">
        <div className="rounded-xl bg-surface px-3 py-2">
          <p className="flex items-center gap-1 text-xs font-semibold">
            <span className="truncate">{authorName(comment.author, comment.user_id)}</span>
            <NokorBadge kind={comment.author?.badge} size={13} />
            <span className="ml-1 font-normal opacity-50">
              {timeAgo(comment.created_at, t)}
            </span>
          </p>
          <p className="mt-0.5 text-sm whitespace-pre-wrap">{comment.body}</p>
        </div>
        <div className="mt-1 flex items-center gap-3 pl-1 text-xs">
          <button
            type="button"
            onClick={onToggleLike}
            className={`inline-flex items-center gap-1 transition hover:opacity-100 ${
              comment.likedByMe ? "text-rose-400" : "opacity-60"
            }`}
          >
            <HeartIcon filled={comment.likedByMe} />
            {comment.likeCount > 0 && <span>{comment.likeCount}</span>}
          </button>
          <button
            type="button"
            onClick={onReply}
            className="font-medium opacity-60 transition hover:opacity-100"
          >
            {t.reply}
          </button>
          {comment.user_id === userId ? (
            <button
              type="button"
              onClick={onDelete}
              className="opacity-60 transition hover:opacity-100"
            >
              {t.delete}
            </button>
          ) : (
            <button
              type="button"
              onClick={onReport}
              className="opacity-60 transition hover:opacity-100"
            >
              {t.report}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PostCard({
  post,
  userId,
  onToggleLike,
  onEdit,
  onDelete,
  onComment,
  onToggleCommentLike,
  onDeleteComment,
}: {
  post: NokorFeedPost;
  userId: string;
  onToggleLike: () => void;
  onEdit: (body: string) => Promise<boolean>;
  onDelete: () => void;
  onComment: (body: string, replyToId: string | null) => Promise<boolean>;
  onToggleCommentLike: (comment: NokorFeedComment) => void;
  onDeleteComment: (commentId: string) => void;
}) {
  const t = useT();
  const nav = useNokorNav();
  const feed = t.nokor.feed;
  const [showComments, setShowComments] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState<NokorFeedComment | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editDraft, setEditDraft] = useState(post.body);
  const [copied, setCopied] = useState(false);
  const [reportTarget, setReportTarget] = useState<NokorReportTarget | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);
  const articleRef = useRef<HTMLElement>(null);

  const images = nokorPostImages(post);
  const own = post.user_id === userId;

  // Count a view the first time this post is actually scrolled into view — one
  // per (post, viewer), and never for the author's own posts.
  useEffect(() => {
    const el = articleRef.current;
    if (!el || own || typeof IntersectionObserver === "undefined") return;
    let recorded = false;
    const io = new IntersectionObserver(
      (entries) => {
        if (recorded || !entries.some((e) => e.isIntersecting)) return;
        recorded = true;
        io.disconnect();
        void nokorRecordView(post.id, userId);
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [post.id, userId, own]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [menuOpen]);

  const submitComment = async () => {
    if (!draft.trim() || sending) return;
    setSending(true);
    const ok = await onComment(draft, replyTo?.id ?? null);
    setSending(false);
    if (ok) {
      setDraft("");
      setReplyTo(null);
    }
  };

  const startReply = (comment: NokorFeedComment) => {
    setReplyTo(comment);
    setShowComments(true);
    setTimeout(() => commentInputRef.current?.focus(), 0);
  };

  const share = async () => {
    setMenuOpen(false);
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/nokor/#/post/${post.id}`
        : "";
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable — ignore */
    }
  };

  const saveEdit = async () => {
    if (!editDraft.trim()) return;
    const ok = await onEdit(editDraft);
    if (ok) setEditing(false);
  };

  // Group replies under their top-level comment (one visual level of nesting).
  const byId = new Map(post.comments.map((c) => [c.id, c]));
  const rootIdOf = (c: NokorFeedComment) => {
    let cur = c;
    const seen = new Set<string>();
    while (cur.reply_to_id && byId.has(cur.reply_to_id) && !seen.has(cur.id)) {
      seen.add(cur.id);
      cur = byId.get(cur.reply_to_id)!;
    }
    return cur.id;
  };
  const topLevel = post.comments.filter((c) => !c.reply_to_id || !byId.has(c.reply_to_id));
  const repliesByRoot = new Map<string, NokorFeedComment[]>();
  for (const c of post.comments) {
    if (c.reply_to_id && byId.has(c.reply_to_id)) {
      const root = rootIdOf(c);
      const list = repliesByRoot.get(root) ?? [];
      list.push(c);
      repliesByRoot.set(root, list);
    }
  }

  return (
    <article ref={articleRef} id={`post-${post.id}`} className="glass rounded-2xl p-4 sm:p-5">
      <header className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => nav?.openProfile(post.user_id)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <Avatar author={post.author} userId={post.user_id} />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 text-sm font-semibold">
              <span className="truncate hover:underline">
                {authorName(post.author, post.user_id)}
              </span>
              <NokorBadge kind={post.author?.badge} />
            </p>
            <p className="text-xs opacity-60">
              {timeAgo(post.created_at, feed)}
              {post.edited_at && <span> · {feed.edited}</span>}
              {post.view_count > 0 && (
                <span>
                  {" "}
                  · {compactCount(post.view_count)} {feed.views}
                </span>
              )}
            </p>
          </div>
        </button>

        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={feed.share}
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            className="flex h-8 w-8 items-center justify-center rounded-full opacity-60 transition hover:bg-surface-strong hover:opacity-100"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <circle cx="5" cy="12" r="1.6" />
              <circle cx="12" cy="12" r="1.6" />
              <circle cx="19" cy="12" r="1.6" />
            </svg>
          </button>
          {menuOpen && (
            <div
              role="menu"
              className="glass absolute right-0 z-20 mt-1 w-40 rounded-xl border border-border p-1 shadow-lg"
            >
              <button
                type="button"
                role="menuitem"
                onClick={share}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-surface-strong"
              >
                {feed.share}
              </button>
              {!own && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    setReportTarget({
                      kind: "post",
                      id: post.id,
                      userId: post.user_id,
                      snapshot: post.body,
                    });
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-rose-400 transition hover:bg-surface-strong"
                >
                  {t.nokor.report.action}
                </button>
              )}
              {own && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setEditing(true);
                    setEditDraft(post.body);
                    setMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-surface-strong"
                >
                  {feed.edit}
                </button>
              )}
              {own && (
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    if (window.confirm(feed.deleteConfirm)) onDelete();
                  }}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-rose-400 transition hover:bg-surface-strong"
                >
                  {feed.delete}
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {copied && <p className="mt-2 text-xs text-emerald-400">{feed.copied}</p>}

      {editing ? (
        <div className="mt-3">
          <textarea
            value={editDraft}
            onChange={(e) => setEditDraft(e.target.value)}
            rows={3}
            maxLength={2000}
            className="w-full resize-none rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-indigo-400/60"
          />
          <div className="mt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="rounded-full px-4 py-1.5 text-sm opacity-70 transition hover:opacity-100"
            >
              {feed.cancel}
            </button>
            <button
              type="button"
              onClick={() => void saveEdit()}
              disabled={!editDraft.trim()}
              className="rounded-full bg-indigo-500 px-4 py-1.5 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:opacity-40"
            >
              {feed.save}
            </button>
          </div>
        </div>
      ) : (
        post.body && (
          <p className="mt-3 text-sm leading-relaxed whitespace-pre-wrap">{post.body}</p>
        )
      )}

      {post.video_path ? (
        <video
          src={nokorMediaUrl(post.video_path) ?? undefined}
          controls
          playsInline
          preload="metadata"
          className="mt-3 max-h-[70vh] w-full rounded-xl bg-black"
        />
      ) : (
        <Gallery images={images} />
      )}

      <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
        <button
          type="button"
          onClick={onToggleLike}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition hover:bg-surface-strong ${
            post.likedByMe ? "text-rose-400" : "opacity-70"
          }`}
        >
          <HeartIcon filled={post.likedByMe} />
          {post.likeCount > 0 && <span>{post.likeCount}</span>}
          <span className="sr-only">{post.likedByMe ? feed.unlike : feed.like}</span>
        </button>
        <button
          type="button"
          onClick={() => setShowComments((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm opacity-70 transition hover:bg-surface-strong"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M21 12a8 8 0 0 1-8 8H4l1.5-3.4A8 8 0 1 1 21 12z"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
          {post.comments.length > 0 && <span>{post.comments.length}</span>}
          <span className="sr-only">{feed.comments}</span>
        </button>
        <button
          type="button"
          onClick={() => void share()}
          className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm opacity-70 transition hover:bg-surface-strong"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path
              d="M4 12v7a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-7M16 6l-4-4-4 4M12 2v14"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className="sr-only">{feed.share}</span>
        </button>
      </div>

      {showComments && (
        <div className="mt-3 space-y-3">
          {topLevel.map((c) => {
            const replies = repliesByRoot.get(c.id) ?? [];
            return (
              <div key={c.id}>
                <div className={replies.length > 0 ? "relative pb-2" : "relative"}>
                  {/* Thread trunk running down from the parent avatar. */}
                  {replies.length > 0 && (
                    <span
                      aria-hidden
                      className="pointer-events-none absolute top-[30px] bottom-0 left-[14px] w-0 border-l border-border"
                    />
                  )}
                  <CommentItem
                    comment={c}
                    userId={userId}
                    t={feed}
                    onToggleLike={() => onToggleCommentLike(c)}
                    onReply={() => startReply(c)}
                    onDelete={() => onDeleteComment(c.id)}
                    onReport={() =>
                      setReportTarget({
                        kind: "comment",
                        id: c.id,
                        userId: c.user_id,
                        snapshot: c.body,
                      })
                    }
                  />
                </div>
                {replies.map((r, i) => (
                  <div key={r.id} className="relative pb-2 last:pb-0">
                    {/* Curved elbow from the trunk to this reply's avatar. */}
                    <span
                      aria-hidden
                      className="pointer-events-none absolute top-0 left-[14px] h-[13px] w-[22px] rounded-bl-[10px] border-b border-l border-border"
                    />
                    {/* Continue the trunk to the next reply. */}
                    {i < replies.length - 1 && (
                      <span
                        aria-hidden
                        className="pointer-events-none absolute top-[13px] bottom-0 left-[14px] w-0 border-l border-border"
                      />
                    )}
                    <CommentItem
                      comment={r}
                      userId={userId}
                      t={feed}
                      isReply
                      onToggleLike={() => onToggleCommentLike(r)}
                      onReply={() => startReply(r)}
                      onDelete={() => onDeleteComment(r.id)}
                      onReport={() =>
                        setReportTarget({
                          kind: "comment",
                          id: r.id,
                          userId: r.user_id,
                          snapshot: r.body,
                        })
                      }
                    />
                  </div>
                ))}
              </div>
            );
          })}

          {replyTo && (
            <div className="flex items-center justify-between rounded-lg bg-surface px-3 py-1.5 text-xs">
              <span className="opacity-70">
                {feed.replyingTo.replace("{name}", authorName(replyTo.author, replyTo.user_id))}
              </span>
              <button
                type="button"
                onClick={() => setReplyTo(null)}
                className="opacity-60 transition hover:opacity-100"
                aria-label={feed.cancel}
              >
                ✕
              </button>
            </div>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void submitComment();
            }}
            className="flex items-center gap-2"
          >
            <input
              ref={commentInputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={feed.writeComment}
              maxLength={1000}
              className="min-w-0 flex-1 rounded-full border border-border bg-surface px-4 py-2 text-sm outline-none focus:border-indigo-400/60"
            />
            <button
              type="submit"
              disabled={!draft.trim() || sending}
              className="rounded-full bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:opacity-40"
            >
              {feed.send}
            </button>
          </form>
        </div>
      )}

      {reportTarget && (
        <NokorReportSheet
          meId={userId}
          target={reportTarget}
          onClose={() => setReportTarget(null)}
        />
      )}
    </article>
  );
}
