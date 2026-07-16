"use client";

import { useState } from "react";
import type { ChatMessage, Reaction, Sender } from "@/lib/supabase/types";
import { Attachment } from "./Attachment";
import { QUICK_REACTIONS } from "./EmojiPicker";
import { Popover } from "./Popover";

export type BubbleLabels = {
  deleted: string;
  edited: string;
  reply: string;
  edit: string;
  delete: string;
  react: string;
};

/** Who wrote an incoming message — drives the avatar circle and name line. */
export type BubbleAuthor = {
  name: string;
  avatarUrl?: string | null;
  /** e.g. an "Admin" chip in the community room. */
  badge?: string | null;
};

export function ChatBubble({
  message,
  mineIs,
  mineOverride,
  author,
  showName,
  labels,
  reactions,
  myUserId,
  replyTarget,
  onReply,
  onEdit,
  onDelete,
  onReact,
  onQuoteClick,
}: {
  message: ChatMessage;
  /** Which sender renders as the right-hand "my" bubble. */
  mineIs: Sender;
  /** Community messages aren't visitor/admin — the caller decides ownership. */
  mineOverride?: boolean;
  /** Rendered for incoming messages only. */
  author?: BubbleAuthor | null;
  /** Group rooms show the author's name above the bubble; 1:1 doesn't. */
  showName?: boolean;
  labels: BubbleLabels;
  reactions?: Reaction[];
  myUserId?: string | null;
  /** The message being replied to, if it's still loaded. */
  replyTarget?: ChatMessage | null;
  onReply?: (m: ChatMessage) => void;
  onEdit?: (m: ChatMessage) => void;
  onDelete?: (m: ChatMessage) => void;
  onReact?: (m: ChatMessage, emoji: string) => void;
  /** Tap the quoted preview to jump to the original message. */
  onQuoteClick?: () => void;
}) {
  // The trigger's rect, captured on click — doubles as the "menu is open" flag.
  const [menuAnchor, setMenuAnchor] = useState<DOMRect | null>(null);
  const mine = mineOverride ?? message.sender === mineIs;
  const deleted = Boolean(message.deleted_at);

  // Group identical emoji so the row shows "👍 3" rather than three thumbs.
  const grouped = new Map<string, { count: number; mine: boolean }>();
  for (const r of reactions ?? []) {
    const cur = grouped.get(r.emoji) ?? { count: 0, mine: false };
    grouped.set(r.emoji, {
      count: cur.count + 1,
      mine: cur.mine || r.user_id === myUserId,
    });
  }

  if (deleted) {
    return (
      <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
        <div className="max-w-[85%] rounded-2xl px-3 py-2 text-sm italic text-foreground/40 border border-border border-dashed">
          {labels.deleted}
        </div>
      </div>
    );
  }

  const avatar = !mine && author ? <AuthorAvatar author={author} /> : null;

  return (
    <div className={`group flex flex-col ${mine ? "items-end" : "items-start"}`}>
      <div className={`flex items-end gap-1.5 max-w-[85%] ${mine ? "flex-row-reverse" : ""}`}>
        {avatar}
        <div
          className={`rounded-2xl px-3 py-2 text-sm leading-relaxed min-w-0 ${
            mine
              ? "bg-gradient-to-br from-indigo-500 to-cyan-500 text-white rounded-br-md"
              : "bg-surface text-foreground rounded-bl-md border border-border"
          }`}
        >
          {showName && !mine && author && (
            <p className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-300 mb-0.5 flex items-center gap-1">
              {author.name}
              {author.badge && (
                <span className="rounded-full bg-indigo-500/20 px-1.5 py-px text-[9px] font-medium">
                  {author.badge}
                </span>
              )}
            </p>
          )}
          {replyTarget && (
            <div className="mb-1.5 pl-2 border-l-2 border-current opacity-50">
              <p className="text-[10px] truncate max-w-[200px]">
                {replyTarget.deleted_at
                  ? labels.deleted
                  : replyTarget.body || replyTarget.attachment_name}
              </p>
            </div>
          )}

          {message.kind !== "text" && (
            <div className="mb-1">
              <Attachment message={message} />
            </div>
          )}

          {message.body && <p className="whitespace-pre-wrap">{message.body}</p>}

          {message.edited_at && (
            <span className="text-[9px] opacity-60 ml-1">({labels.edited})</span>
          )}
        </div>

        {/* Action affordance: hover on desktop, always present on touch. */}
        <div>
          <button
            type="button"
            aria-label={labels.react}
            onClick={(e) => {
              // Measure now: currentTarget is nulled out by the time the state
              // updater below runs.
              const rect = e.currentTarget.getBoundingClientRect();
              setMenuAnchor((cur) => (cur ? null : rect));
            }}
            className="h-6 w-6 grid place-items-center rounded-full text-foreground/40 hover:text-foreground hover:bg-surface-strong opacity-0 group-hover:opacity-100 focus:opacity-100 transition text-xs"
          >
            ⋯
          </button>

          {menuAnchor && (
            <Popover anchor={menuAnchor} width={176} onClose={() => setMenuAnchor(null)}>
              {onReact && (
                <div className="flex gap-0.5 p-1 border-b border-border mb-1">
                  {QUICK_REACTIONS.slice(0, 6).map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => {
                        onReact(message, e);
                        setMenuAnchor(null);
                      }}
                      className="h-6 w-6 grid place-items-center rounded hover:bg-surface-strong text-sm"
                    >
                      {e}
                    </button>
                  ))}
                </div>
              )}
              <MenuItem
                onClick={() => {
                  onReply?.(message);
                  setMenuAnchor(null);
                }}
              >
                ↩ {labels.reply}
              </MenuItem>
              {/* Only text you wrote can be edited; attachments are immutable. */}
              {mine && message.kind === "text" && (
                <MenuItem
                  onClick={() => {
                    onEdit?.(message);
                    setMenuAnchor(null);
                  }}
                >
                  ✎ {labels.edit}
                </MenuItem>
              )}
              {onDelete && (
                <MenuItem
                  danger
                  onClick={() => {
                    onDelete(message);
                    setMenuAnchor(null);
                  }}
                >
                  🗑 {labels.delete}
                </MenuItem>
              )}
            </Popover>
          )}
        </div>
      </div>

      {grouped.size > 0 && (
        <div className={`flex gap-1 mt-1 ${mine ? "justify-end" : "justify-start"}`}>
          {[...grouped.entries()].map(([emoji, { count, mine: reacted }]) => (
            <button
              key={emoji}
              type="button"
              onClick={() => onReact?.(message, emoji)}
              className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] border transition ${
                reacted
                  ? "bg-indigo-500/30 border-indigo-400/60 text-foreground"
                  : "bg-surface border-border text-foreground/70 hover:bg-surface-strong"
              }`}
            >
              <span>{emoji}</span>
              {count > 1 && <span className="tabular-nums">{count}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function MenuItem({
  onClick,
  danger,
  children,
}: {
  onClick: () => void;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left px-2 py-1.5 rounded-lg text-xs transition ${
        danger ? "text-rose-600 dark:text-rose-300 hover:bg-rose-500/15" : "text-foreground/80 hover:bg-surface-strong"
      }`}
    >
      {children}
    </button>
  );
}

/** Circle avatar: picture when set, otherwise a tinted initial. */
function AuthorAvatar({ author }: { author: BubbleAuthor }) {
  const initial = (author.name.trim()[0] ?? "?").toUpperCase();
  return author.avatarUrl ? (
    // Plain <img>: avatar URLs come from Supabase storage at runtime, and the
    // static export can't optimise remote images anyway.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={author.avatarUrl}
      alt=""
      title={author.name}
      className="h-6 w-6 rounded-full object-cover shrink-0 border border-border"
    />
  ) : (
    <span
      title={author.name}
      className="h-6 w-6 rounded-full shrink-0 grid place-items-center bg-indigo-500/25 text-[10px] font-semibold text-indigo-700 dark:text-indigo-200 border border-border"
    >
      {initial}
    </span>
  );
}

export function TypingBubble({ label }: { label: string }) {
  return (
    <div className="flex justify-start">
      <div className="rounded-2xl rounded-bl-md bg-surface border border-border px-3 py-2 flex items-center gap-1">
        <Dot />
        <Dot delay="0.15s" />
        <Dot delay="0.3s" />
        <span className="sr-only">{label}</span>
      </div>
    </div>
  );
}

function Dot({ delay }: { delay?: string }) {
  return (
    <span
      className="inline-block h-1.5 w-1.5 rounded-full bg-foreground/70 animate-bounce"
      style={delay ? { animationDelay: delay } : undefined}
    />
  );
}
