"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "../providers/LanguageProvider";
import { DateChip, dayLabel, formatTime, isSameDay } from "./datetime";
import { getSupabase } from "@/lib/supabase/client";
import { avatarUrl, type Draft } from "@/lib/supabase/attachments";
import {
  MEMBER_STACK_MAX,
  useCommunity,
  type MemberPreview,
} from "@/lib/supabase/useCommunity";
import { displayName } from "@/lib/supabase/useProfile";
import { BAD_WORDS_ERROR } from "@/lib/supabase/useThread";
import type { ChatMessage, CommunityMessage } from "@/lib/supabase/types";
import { ChatBubble, TypingBubble, type BubbleAuthor } from "./ChatBubble";
import { Composer } from "./Composer";
import { useJumpToMessage } from "./useJumpToMessage";

/**
 * Community rows reuse ChatBubble, which is typed for the 1:1 chat — the
 * missing 1:1-only fields are stubbed and ownership comes via mineOverride.
 */
function toChatMessage(m: CommunityMessage): ChatMessage {
  return {
    id: m.id,
    conversation_id: "community",
    sender: m.from_admin ? "admin" : "visitor",
    body: m.body,
    created_at: m.created_at,
    emailed_at: null,
    kind: m.kind,
    attachment_path: m.attachment_path,
    attachment_name: m.attachment_name,
    attachment_size: m.attachment_size,
    attachment_mime: m.attachment_mime,
    duration_ms: m.duration_ms,
    reply_to_id: m.reply_to_id,
    edited_at: m.edited_at,
    deleted_at: m.deleted_at,
    suggestion_key: null,
  };
}

/**
 * Overlapping member avatars, capped at MEMBER_STACK_MAX circles; anything
 * beyond that collapses into a trailing "9+" badge.
 */
function MemberStack({
  previews,
  total,
}: {
  previews: MemberPreview[];
  total: number;
}) {
  const supabase = getSupabase();
  const overflow = total - previews.length;
  return (
    <div className="flex justify-center -space-x-2">
      {previews.map((m) => {
        const url = supabase ? avatarUrl(supabase, m.avatar_path) : null;
        const name = displayName(
          { username: m.username, phone: null, avatar_path: m.avatar_path },
          m.user_id,
        );
        return url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={m.user_id}
            src={url}
            alt=""
            title={name}
            className="h-8 w-8 rounded-full object-cover border-2 border-background bg-surface"
          />
        ) : (
          <span
            key={m.user_id}
            title={name}
            className="h-8 w-8 rounded-full grid place-items-center border-2 border-background bg-indigo-500/25 text-[11px] font-semibold text-indigo-700 dark:text-indigo-200"
          >
            {(name.trim()[0] ?? "?").toUpperCase()}
          </span>
        );
      })}
      {overflow > 0 && (
        <span className="h-8 w-8 rounded-full grid place-items-center border-2 border-background bg-surface-strong text-[10px] font-semibold text-foreground/70">
          {MEMBER_STACK_MAX}+
        </span>
      )}
    </div>
  );
}

export function CommunityPanel({
  userId,
  isAdmin,
}: {
  userId: string;
  isAdmin?: boolean;
}) {
  const { t, lang } = useLanguage();
  const community = useCommunity(userId, true, isAdmin);
  const [replyTo, setReplyTo] = useState<CommunityMessage | null>(null);
  const [editing, setEditing] = useState<CommunityMessage | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const jump = useJumpToMessage();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [community.messages, community.peerTyping]);

  // Admins are in without joining; everyone else sees the join screen first.
  if (!isAdmin && community.isMember === false) {
    return (
      <div className="flex-1 grid place-items-center p-6">
        <div className="text-center space-y-3 max-w-[260px]">
          <p className="text-sm font-semibold text-foreground">
            {t.chat.community.title}
          </p>
          <p className="text-[11px] text-foreground/60 leading-snug">
            {t.chat.community.blurb}
          </p>
          {community.memberPreviews.length > 0 && (
            <MemberStack
              previews={community.memberPreviews}
              total={community.memberCount ?? community.memberPreviews.length}
            />
          )}
          {community.memberCount != null && community.memberCount > 0 && (
            <p className="text-[10px] text-foreground/40">
              {community.memberCount} {t.chat.community.members}
            </p>
          )}
          {community.error && (
            <p className="text-xs text-rose-600 dark:text-rose-300">{community.error}</p>
          )}
          <button
            type="button"
            onClick={() => void community.join()}
            disabled={community.joining}
            className="w-full rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 text-white text-sm font-medium py-2 disabled:opacity-40 hover:scale-[1.01] transition"
          >
            {community.joining ? t.chat.community.joining : t.chat.community.join}
          </button>
        </div>
      </div>
    );
  }

  if (community.isMember === null && !isAdmin) {
    return (
      <div className="flex-1 grid place-items-center text-foreground/40 text-sm">…</div>
    );
  }

  const supabase = getSupabase();
  const byId = new Map(community.messages.map((m) => [m.id, m]));

  const authorFor = (m: CommunityMessage): BubbleAuthor => {
    const profile = m.user_id ? community.profiles[m.user_id] : undefined;
    return {
      name: displayName(profile, m.user_id),
      avatarUrl: supabase ? avatarUrl(supabase, profile?.avatar_path) : null,
      badge: m.from_admin ? t.chat.community.adminBadge : null,
    };
  };

  const labels = {
    deleted: t.chat.msg.deleted,
    edited: t.chat.msg.edited,
    reply: t.chat.msg.reply,
    edit: t.chat.msg.edit,
    delete: t.chat.msg.delete,
    react: t.chat.msg.react,
  };

  return (
    <>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {community.messages.length === 0 && (
          <p className="text-center text-[11px] text-foreground/40 pt-6">
            {t.chat.community.empty}
          </p>
        )}
        {community.messages.map((m, i) => {
          const dateChip = (i === 0 ||
            !isSameDay(community.messages[i - 1].created_at, m.created_at)) && (
            <DateChip label={dayLabel(m.created_at, lang, t.chat.msg)} />
          );
          // Join notices: body carries the joiner's name, text localises here.
          if (m.is_system) {
            return (
              <div key={m.id}>
                {dateChip}
                <p className="text-center text-[10px] text-foreground/40 py-1">
                  👋 {t.chat.community.welcome.replace("{name}", m.body)}
                </p>
              </div>
            );
          }
          const mine = m.user_id === userId;
          const target = m.reply_to_id ? byId.get(m.reply_to_id) : null;

          const nameFor = (id: string) =>
            id === userId ? t.chat.msg.you : displayName(community.profiles[id], id);
          // Who has read past this message (besides its author).
          const seenNames = mine
            ? Object.entries(community.reads)
                .filter(([id, at]) => id !== m.user_id && at >= m.created_at)
                .map(([id]) => nameFor(id))
            : [];
          const seen = mine ? seenNames.length > 0 : undefined;
          const reactionRows = (community.reactionsByMessage[m.id] ?? []).map((r) => ({
            emoji: r.emoji,
            name: nameFor(r.user_id),
          }));

          return (
            <div key={m.id}>
              {dateChip}
              <div ref={jump.register(m.id)} className={jump.highlightClass(m.id)}>
                <ChatBubble
                  message={toChatMessage(m)}
                  mineIs="visitor"
                  mineOverride={mine}
                  author={authorFor(m)}
                  showName
                  labels={labels}
                  time={formatTime(m.created_at, lang)}
                  seen={seen}
                  reactions={community.reactionsByMessage[m.id]}
                  myUserId={userId}
                  onReact={(msg, emoji) => void community.toggleReaction(msg.id, emoji)}
                  replyTarget={target ? toChatMessage(target) : null}
                  onReply={() => setReplyTo(m)}
                  onEdit={mine ? () => setEditing(m) : undefined}
                  // Own messages always; admin moderates anything.
                  onDelete={
                    mine || isAdmin ? (msg) => void community.remove(msg.id) : undefined
                  }
                  onQuoteClick={
                    m.reply_to_id ? () => jump.jumpTo(m.reply_to_id!) : undefined
                  }
                  menuFooter={
                    mine || reactionRows.length > 0 ? (
                      <>
                        {mine && (
                          <p>
                            {seenNames.length > 0
                              ? `✓✓ ${t.chat.msg.seenBy} ${seenNames.slice(0, 5).join(", ")}${
                                  seenNames.length > 5
                                    ? ` +${seenNames.length - 5}`
                                    : ""
                                }`
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
        {community.peerTyping && <TypingBubble label={t.chat.typing} />}
      </div>

      <div className="border-t border-border p-3">
        <Composer
          key={editing?.id ?? "new"}
          labels={{
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
          }}
          disabled={community.sending}
          onTyping={community.sendTyping}
          replyTo={replyTo ? toChatMessage(replyTo) : null}
          editing={editing ? toChatMessage(editing) : null}
          onCancelReply={() => setReplyTo(null)}
          onCancelEdit={() => setEditing(null)}
          onSubmitEdit={async (text) => {
            if (!editing) return;
            await community.edit(editing.id, text);
            setEditing(null);
          }}
          onSend={async (text, draft?: Draft) => {
            const ok = await community.send(text, {
              draft,
              replyToId: replyTo?.id ?? null,
            });
            if (ok) setReplyTo(null);
          }}
        />
        <p className="mt-2 text-[10px] text-foreground/40 leading-snug text-center">
          {community.error === BAD_WORDS_ERROR
            ? t.chat.msg.badWords
            : (community.error ?? t.chat.community.note)}
        </p>
      </div>
    </>
  );
}
