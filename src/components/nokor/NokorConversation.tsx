"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { kindForMime, isAllowedFileName, type Draft } from "@/lib/supabase/attachments";
import { useRecorder, recorderSupported } from "@/lib/media/useRecorder";
import { nokorAvatarUrl, nokorMediaUrl, type NokorAuthor } from "@/lib/supabase/useNokor";
import { storyBgClass } from "@/lib/supabase/useNokorStories";
import { nokorErrorText } from "@/lib/supabase/nokorErrors";
import type { NokorStorySnapshot } from "@/lib/supabase/types";
import NokorReportSheet, { type NokorReportTarget } from "./NokorReportSheet";
import type { Draft as AttachmentDraft } from "@/lib/supabase/attachments";
import { Attachment } from "../chat/Attachment";
import { EmojiPicker } from "../chat/EmojiPicker";
import { FormattedText } from "../chat/FormattedText";
import { VideoNoteRecorder } from "../chat/VideoNoteRecorder";
import { useT } from "../providers/LanguageProvider";

const QUICK_REACTIONS = ["❤️", "😂", "👍", "😮", "😢", "🔥"];

/** The minimum a message needs for this UI — DMs and room messages both fit. */
export type ChatMessageLike = {
  id: string;
  sender_id: string;
  body: string;
  kind: "text" | "image" | "file" | "audio" | "video";
  attachment_path: string | null;
  attachment_name: string | null;
  attachment_size: number | null;
  duration_ms: number | null;
  reply_to_id: string | null;
  story_snapshot?: NokorStorySnapshot | null;
  edited_at: string | null;
  deleted_at: string | null;
  created_at: string;
};

/**
 * Everything the chat UI needs from a backing hook. useNokorConversation (DMs)
 * and useNokorRoomConversation (groups/channels) both satisfy this, so the two
 * share one renderer.
 */
export type ChatSource<M extends ChatMessageLike> = {
  messages: M[];
  reactions: { message_id: string; user_id: string; emoji: string }[];
  loaded: boolean;
  error: string | null;
  send: (input: {
    body?: string;
    draft?: AttachmentDraft;
    replyToId?: string | null;
  }) => Promise<boolean>;
  editMessage: (id: string, body: string) => Promise<boolean>;
  deleteMessage: (message: M) => Promise<void>;
  toggleReaction: (id: string, emoji: string) => Promise<void>;
  markRead: () => Promise<void>;
};

function name(username: string | null, userId: string) {
  return username?.trim() || `user-${userId.slice(0, 4) || "anon"}`;
}

/** The little "replied to a story" quote shown above a story-reply message. */
function StoryQuote({ snapshot, label }: { snapshot: NokorStorySnapshot; label: string }) {
  const url = snapshot.image_path ? nokorMediaUrl(snapshot.image_path) : null;
  return (
    <div className="mb-1 flex items-center gap-2 opacity-90">
      <div className="relative h-12 w-8 shrink-0 overflow-hidden rounded-md border border-border">
        {url ? (
          <Image src={url} alt="" fill unoptimized className="object-cover" />
        ) : (
          <div className={`flex h-full w-full items-center justify-center ${storyBgClass(snapshot.background)}`}>
            <span className="line-clamp-2 px-0.5 text-center text-[7px] font-semibold text-white">
              {snapshot.caption}
            </span>
          </div>
        )}
      </div>
      <span className="text-[11px] opacity-60">{label}</span>
    </div>
  );
}

function clock(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function Avatar({ author, userId, size = 32 }: { author: NokorAuthor | null; userId: string; size?: number }) {
  const url = nokorAvatarUrl(author);
  if (url) {
    return (
      <Image
        src={url}
        alt=""
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
      style={{ width: size, height: size, fontSize: size * 0.34 }}
    >
      {name(author?.username ?? null, userId).slice(0, 2)}
    </div>
  );
}

export default function NokorConversation<M extends ChatMessageLike>({
  meId,
  conv,
  title,
  subtitle,
  avatar,
  canPost = true,
  lockedNote,
  seenAt,
  senderName,
  onTyping,
  onBack,
  onTitleClick,
  headerIcon,
  headerExtra,
  reportKind,
}: {
  meId: string;
  conv: ChatSource<M>;
  title: string;
  subtitle?: string | null;
  avatar?: { author: NokorAuthor | null; userId: string } | null;
  /** Channels lock the composer for non-admins. */
  canPost?: boolean;
  lockedNote?: string;
  /** DMs pass the other side's read stamp to render "Seen". */
  seenAt?: string | null;
  /** Rooms label each bubble with its author. */
  senderName?: (senderId: string) => string;
  onTyping?: () => void;
  onBack: () => void;
  /** Rooms open their info screen from the header. */
  onTitleClick?: () => void;
  /** Overrides the avatar slot (rooms show their photo). */
  headerIcon?: React.ReactNode;
  headerExtra?: React.ReactNode;
  /** When set, non-own messages can be reported as this kind. */
  reportKind?: "dm_message" | "room_message";
}) {
  const t = useT();
  const c = t.nokor.chat;
  const [draft, setDraft] = useState("");
  const [reportTarget, setReportTarget] = useState<NokorReportTarget | null>(null);
  const [replyTo, setReplyTo] = useState<M | null>(null);
  const [editing, setEditing] = useState<M | null>(null);
  const [pending, setPending] = useState<Draft | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [reactFor, setReactFor] = useState<string | null>(null);
  const [showVideo, setShowVideo] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const voice = useRecorder("audio", (rec) => {
    setPending({
      file: rec.blob,
      name: `voice-${Date.now()}.webm`,
      kind: "audio",
      mime: rec.mime,
      durationMs: rec.durationMs,
    });
  });

  const byId = useMemo(() => new Map(conv.messages.map((m) => [m.id, m])), [conv.messages]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [conv.messages.length]);

  // Any time we see the thread, stamp our read marker.
  useEffect(() => {
    if (conv.loaded) void conv.markRead();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conv.loaded, conv.messages.length]);

  const pickFile = (f: File | null) => {
    if (!f) return;
    if (!isAllowedFileName(f.name)) return;
    setPending({ file: f, name: f.name, kind: kindForMime(f.type), mime: f.type || "application/octet-stream" });
    if (fileRef.current) fileRef.current.value = "";
  };

  const submit = async () => {
    if (editing) {
      const ok = await conv.editMessage(editing.id, draft);
      if (ok) {
        setEditing(null);
        setDraft("");
      }
      return;
    }
    if (!draft.trim() && !pending) return;
    const ok = await conv.send({ body: draft, draft: pending ?? undefined, replyToId: replyTo?.id ?? null });
    if (ok) {
      setDraft("");
      setPending(null);
      setReplyTo(null);
    }
  };

  const lastMine = [...conv.messages].reverse().find((m) => m.sender_id === meId);
  const seen = lastMine && seenAt ? seenAt.localeCompare(lastMine.created_at) >= 0 : false;

  return (
    <div className="glass flex h-[70vh] flex-col rounded-2xl">
      <header className="flex items-center gap-3 border-b border-border px-3 py-2.5">
        <button
          type="button"
          onClick={onBack}
          aria-label={c.back}
          className="flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-surface-strong"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        {headerIcon ??
          (avatar ? (
            <Avatar author={avatar.author} userId={avatar.userId} />
          ) : (
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-500/30 text-sm">
              #
            </span>
          ))}
        <button
          type="button"
          onClick={onTitleClick}
          disabled={!onTitleClick}
          className="min-w-0 flex-1 text-left disabled:cursor-default"
        >
          <p className="truncate text-sm font-semibold">{title}</p>
          {subtitle && <p className="truncate text-xs text-indigo-400">{subtitle}</p>}
        </button>
        {headerExtra}
      </header>

      <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3">
        {conv.messages.map((m) => {
          const mine = m.sender_id === meId;
          const parent = m.reply_to_id ? byId.get(m.reply_to_id) : null;
          const mReactions = conv.reactions.filter((r) => r.message_id === m.id);
          const grouped = [...new Set(mReactions.map((r) => r.emoji))].map((emoji) => ({
            emoji,
            count: mReactions.filter((r) => r.emoji === emoji).length,
            mine: mReactions.some((r) => r.emoji === emoji && r.user_id === meId),
          }));

          return (
            <div key={m.id} className={`group flex flex-col ${mine ? "items-end" : "items-start"}`}>
              <div className={`flex max-w-[80%] flex-col ${mine ? "items-end" : "items-start"}`}>
                {!mine && senderName && (
                  <span className="mb-0.5 px-1 text-[11px] font-semibold opacity-70">
                    {senderName(m.sender_id)}
                  </span>
                )}
                {m.story_snapshot && (
                  <StoryQuote
                    snapshot={m.story_snapshot}
                    label={
                      m.story_snapshot.author_id === meId
                        ? t.nokor.stories.repliedToStory
                        : t.nokor.stories.repliedToTheirStory
                    }
                  />
                )}
                {parent && (
                  <div className="mb-0.5 max-w-full truncate rounded-lg border-l-2 border-indigo-400 bg-surface px-2 py-1 text-xs opacity-70">
                    {parent.deleted_at ? c.deleted : parent.body || `📎 ${parent.attachment_name ?? ""}`}
                  </div>
                )}

                <div
                  className={`rounded-2xl px-3.5 py-2 text-sm ${
                    m.deleted_at
                      ? "bg-surface italic opacity-60"
                      : mine
                        ? "bg-indigo-500 text-white"
                        : "bg-surface"
                  }`}
                >
                  {m.deleted_at ? (
                    c.deleted
                  ) : (
                    <>
                      {m.attachment_path && (
                        <div className={m.body ? "mb-1.5" : ""}>
                          <Attachment message={m} />
                        </div>
                      )}
                      {m.body && <FormattedText text={m.body} />}
                    </>
                  )}
                </div>

                <div className="mt-0.5 flex items-center gap-1.5 text-[10px] opacity-50">
                  <span>{clock(m.created_at)}</span>
                  {m.edited_at && !m.deleted_at && <span>· {t.nokor.feed.edited}</span>}
                  {mine && m.id === lastMine?.id && seen && <span>· {c.seen}</span>}
                </div>

                {grouped.length > 0 && (
                  <div className="mt-0.5 flex gap-1">
                    {grouped.map((g) => (
                      <button
                        key={g.emoji}
                        type="button"
                        onClick={() => void conv.toggleReaction(m.id, g.emoji)}
                        className={`rounded-full border px-1.5 py-0.5 text-[11px] transition ${
                          g.mine ? "border-indigo-400 bg-indigo-500/20" : "border-border bg-surface"
                        }`}
                      >
                        {g.emoji} {g.count}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              {!m.deleted_at && (
                <div className="mt-0.5 flex gap-2 text-[10px] opacity-0 transition group-hover:opacity-60">
                  <button type="button" onClick={() => setReactFor(reactFor === m.id ? null : m.id)}>
                    {c.react}
                  </button>
                  <button type="button" onClick={() => setReplyTo(m)}>
                    {t.nokor.feed.reply}
                  </button>
                  {mine && m.body && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditing(m);
                        setDraft(m.body);
                      }}
                    >
                      {t.nokor.feed.edit}
                    </button>
                  )}
                  {mine && (
                    <button type="button" onClick={() => void conv.deleteMessage(m)}>
                      {t.nokor.feed.delete}
                    </button>
                  )}
                  {!mine && reportKind && (
                    <button
                      type="button"
                      onClick={() =>
                        setReportTarget({
                          kind: reportKind,
                          id: m.id,
                          userId: m.sender_id,
                          snapshot: m.body || null,
                        })
                      }
                    >
                      {t.nokor.feed.report}
                    </button>
                  )}
                </div>
              )}

              {reactFor === m.id && (
                <div className="mt-1 flex gap-1 rounded-full border border-border bg-background p-1 shadow-lg">
                  {QUICK_REACTIONS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        void conv.toggleReaction(m.id, emoji);
                        setReactFor(null);
                      }}
                      className="rounded-full px-1 text-base transition hover:scale-125"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      {/* Reply / edit / attachment context */}
      {(replyTo || editing || pending) && (
        <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-1.5 text-xs">
          <span className="min-w-0 flex-1 truncate opacity-70">
            {editing
              ? `${t.nokor.feed.edit}: ${editing.body}`
              : replyTo
                ? t.nokor.feed.replyingTo.replace(
                    "{name}",
                    replyTo.sender_id === meId
                      ? c.you
                      : (senderName?.(replyTo.sender_id) ?? title),
                  )
                : `📎 ${pending?.name}`}
          </span>
          <button
            type="button"
            onClick={() => {
              setReplyTo(null);
              setEditing(null);
              setPending(null);
              setDraft(editing ? "" : draft);
            }}
            aria-label={t.nokor.feed.cancel}
            className="opacity-60 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      )}

      {conv.error && (
        <p className="px-3 pb-1 text-xs text-rose-400">
          {nokorErrorText(conv.error, t.nokor.errors)}
        </p>
      )}

      {!canPost ? (
        <p className="border-t border-border p-3 text-center text-xs opacity-60">
          {lockedNote ?? c.readOnly}
        </p>
      ) : (
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
        className="relative flex items-center gap-1.5 border-t border-border p-2.5"
      >
        <input ref={fileRef} type="file" hidden onChange={(e) => pickFile(e.target.files?.[0] ?? null)} />

        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          aria-label={c.attach}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full opacity-70 transition hover:bg-surface-strong hover:opacity-100"
        >
          📎
        </button>

        <button
          type="button"
          onClick={() => setShowEmoji((v) => !v)}
          aria-label={c.emoji}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full opacity-70 transition hover:bg-surface-strong hover:opacity-100"
        >
          🙂
        </button>

        {showEmoji && (
          <div className="absolute bottom-14 left-2 z-20">
            <EmojiPicker
              onPick={(emoji) => {
                setDraft((d) => d + emoji);
                setShowEmoji(false);
              }}
              onClose={() => setShowEmoji(false)}
            />
          </div>
        )}

        <input
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            onTyping?.();
          }}
          placeholder={c.messagePlaceholder}
          maxLength={4000}
          className="min-w-0 flex-1 rounded-full border border-border bg-surface px-4 py-2 text-sm outline-none focus:border-indigo-400/60"
        />

        {recorderSupported() && !editing && (
          <>
            <button
              type="button"
              onClick={() => (voice.recording ? voice.stop() : voice.start())}
              aria-label={c.voice}
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition ${
                voice.recording ? "bg-rose-500 text-white" : "opacity-70 hover:bg-surface-strong hover:opacity-100"
              }`}
            >
              🎤
            </button>
            <button
              type="button"
              onClick={() => setShowVideo(true)}
              aria-label={c.videoNote}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full opacity-70 transition hover:bg-surface-strong hover:opacity-100"
            >
              🎥
            </button>
          </>
        )}

        <button
          type="submit"
          disabled={!draft.trim() && !pending}
          className="shrink-0 rounded-full bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:opacity-40"
        >
          {editing ? t.nokor.feed.save : t.nokor.feed.send}
        </button>
      </form>
      )}

      {showVideo && (
        <VideoNoteRecorder
          onDone={(rec) =>
            setPending({
              file: rec.blob,
              name: `video-${Date.now()}.webm`,
              kind: "video",
              mime: rec.mime,
              durationMs: rec.durationMs,
            })
          }
          onClose={() => setShowVideo(false)}
          cancelLabel={t.nokor.feed.cancel}
          sendLabel={t.nokor.feed.send}
        />
      )}

      {reportTarget && (
        <NokorReportSheet
          meId={meId}
          target={reportTarget}
          onClose={() => setReportTarget(null)}
        />
      )}
    </div>
  );
}
