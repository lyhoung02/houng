"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../providers/LanguageProvider";
import { DateChip, dayLabel, formatTime, isSameDay } from "./datetime";
import { BAD_WORDS_ERROR, type useThread } from "@/lib/supabase/useThread";
import type { ChatMessage, Sender } from "@/lib/supabase/types";
import type { Draft } from "@/lib/supabase/attachments";
import { ChatBubble, TypingBubble, type BubbleAuthor } from "./ChatBubble";
import { Composer } from "./Composer";
import { useJumpToMessage } from "./useJumpToMessage";

type Thread = ReturnType<typeof useThread>;

/**
 * The message list + composer, shared by the visitor widget, the resume page
 * and the admin inbox. `mineIs` flips which side renders as "me".
 */
export function ThreadView({
  thread,
  mineIs,
  header,
  beforeComposer,
  peerAuthor,
}: {
  thread: Thread;
  mineIs: Sender;
  /** Rendered above the first message (e.g. the canned welcome). */
  header?: React.ReactNode;
  /** Sits between the message list and the composer (e.g. suggestion chips). */
  beforeComposer?: React.ReactNode;
  /** The other side's name/avatar, shown next to their bubbles. */
  peerAuthor?: BubbleAuthor | null;
}) {
  const { t, lang } = useLanguage();
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [editing, setEditing] = useState<ChatMessage | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const jump = useJumpToMessage();

  const byId = new Map(thread.messages.map((m) => [m.id, m]));

  // Stick to the bottom as messages and the typing bubble come and go.
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [thread.messages, thread.peerTyping]);

  const labels = {
    deleted: t.chat.msg.deleted,
    edited: t.chat.msg.edited,
    reply: t.chat.msg.reply,
    edit: t.chat.msg.edit,
    delete: t.chat.msg.delete,
    react: t.chat.msg.react,
  };

  const composerLabels = {
    placeholder: t.chat.placeholder,
    send: t.chat.send,
    replyingTo: t.chat.msg.replyingTo,
    editing: t.chat.msg.editing,
    cancel: t.chat.msg.cancel,
    attach: t.chat.msg.attach,
    voice: t.chat.msg.voice,
    video: t.chat.msg.video,
    emoji: t.chat.msg.emoji,
    recording: t.chat.msg.recording,
    tooLarge: t.chat.msg.tooLarge,
    blockedType: t.chat.msg.blockedType,
    fmtBold: t.chat.msg.fmtBold,
    fmtItalic: t.chat.msg.fmtItalic,
    fmtUnderline: t.chat.msg.fmtUnderline,
    fmtStrike: t.chat.msg.fmtStrike,
    fmtSpoiler: t.chat.msg.fmtSpoiler,
    fmtCode: t.chat.msg.fmtCode,
  };

  return (
    <>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {header}
        {/* Empty state — only when there's no welcome header filling the void. */}
        {!header && thread.messages.length === 0 && (
          <div className="h-full grid place-items-center">
            <div className="text-center space-y-2">
              <p className="text-2xl">💬</p>
              <p className="text-[11px] text-foreground/40">
                {t.chat.community.empty}
              </p>
            </div>
          </div>
        )}
        {thread.messages.map((m, i) => {
          const mine = m.sender === mineIs;
          const seen = mine
            ? Boolean(
                thread.peerLastReadAt && m.created_at <= thread.peerLastReadAt,
              )
            : undefined;
          const reactionRows = (thread.reactionsByMessage[m.id] ?? []).map((r) => ({
            emoji: r.emoji,
            name: r.user_id === thread.myUserId ? t.chat.msg.you : (peerAuthor?.name ?? "—"),
          }));
          return (
            <div key={m.id}>
              {/* Day separator whenever the calendar date changes. */}
              {(i === 0 || !isSameDay(thread.messages[i - 1].created_at, m.created_at)) && (
                <DateChip label={dayLabel(m.created_at, lang, t.chat.msg)} />
              )}
              <div ref={jump.register(m.id)} className={jump.highlightClass(m.id)}>
                <ChatBubble
                  message={m}
                  mineIs={mineIs}
                  author={peerAuthor}
                  labels={labels}
                  time={formatTime(m.created_at, lang)}
                  seen={seen}
                  reactions={thread.reactionsByMessage[m.id]}
                  myUserId={thread.myUserId}
                  replyTarget={m.reply_to_id ? (byId.get(m.reply_to_id) ?? null) : null}
                  onReply={setReplyTo}
                  onEdit={setEditing}
                  onDelete={(msg) => void thread.remove(msg.id)}
                  onReact={(msg, emoji) => void thread.toggleReaction(msg.id, emoji)}
                  onQuoteClick={
                    m.reply_to_id ? () => jump.jumpTo(m.reply_to_id!) : undefined
                  }
                  menuFooter={
                    mine || reactionRows.length > 0 ? (
                      <>
                        {mine && (
                          <p>
                            {seen
                              ? `✓✓ ${t.chat.msg.seen}`
                              : `✓ ${t.chat.msg.notSeen}`}
                          </p>
                        )}
                        {reactionRows.map((r, idx) => (
                          <p key={idx}>
                            {r.emoji} {r.name}
                          </p>
                        ))}
                      </>
                    ) : undefined
                  }
                />
              </div>
            </div>
          );
        })}
        {thread.peerTyping && <TypingBubble label={t.chat.typing} />}
      </div>

      <div className="border-t border-border p-3">
        {beforeComposer}
        <Composer
          // Remount on entering/leaving edit mode so the box re-seeds itself.
          key={editing?.id ?? "new"}
          labels={composerLabels}
          disabled={thread.sending}
          replyTo={replyTo}
          editing={editing}
          onTyping={thread.sendTyping}
          onCancelReply={() => setReplyTo(null)}
          onCancelEdit={() => setEditing(null)}
          onSubmitEdit={async (text) => {
            if (!editing) return;
            await thread.edit(editing.id, text);
            setEditing(null);
          }}
          onSend={async (text, draft?: Draft) => {
            const ok = await thread.send(text, { draft, replyToId: replyTo?.id ?? null });
            if (ok) setReplyTo(null);
          }}
        />
        <p className="mt-2 text-[10px] text-foreground/40 leading-snug text-center">
          {thread.error === BAD_WORDS_ERROR
            ? t.chat.msg.badWords
            : (thread.error ?? t.chat.liveNote)}
        </p>
      </div>
    </>
  );
}
