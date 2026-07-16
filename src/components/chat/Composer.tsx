"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import Image from "next/image";
import { useRecorder, recorderSupported } from "@/lib/media/useRecorder";
import {
  formatBytes,
  formatDuration,
  kindForMime,
  MAX_UPLOAD_BYTES,
  type Draft,
} from "@/lib/supabase/attachments";
import type { ChatMessage } from "@/lib/supabase/types";
import { EmojiPicker } from "./EmojiPicker";
import { VideoNoteRecorder } from "./VideoNoteRecorder";
import { MicIcon, PaperclipIcon, SmileIcon, VideoIcon } from "./icons";

const MIN_ROWS = 2;
const MAX_ROWS = 5;

export type ComposerLabels = {
  placeholder: string;
  send: string;
  replyingTo: string;
  editing: string;
  cancel: string;
  attach: string;
  voice: string;
  video: string;
  emoji: string;
  recording: string;
  tooLarge: string;
};

export function Composer({
  labels,
  disabled,
  replyTo,
  editing,
  onSend,
  onCancelReply,
  onCancelEdit,
  onSubmitEdit,
  onTyping,
}: {
  labels: ComposerLabels;
  disabled?: boolean;
  replyTo?: ChatMessage | null;
  editing?: ChatMessage | null;
  onSend: (text: string, draft?: Draft) => void | Promise<void>;
  onCancelReply?: () => void;
  onCancelEdit?: () => void;
  onSubmitEdit?: (text: string) => void | Promise<void>;
  onTyping?: () => void;
}) {
  // Seeded from `editing`; ThreadView keys this component on the edited id, so
  // entering or leaving edit mode remounts and re-seeds rather than syncing.
  const [value, setValue] = useState(editing?.body ?? "");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const voice = useRecorder("audio", (r) => {
    setDraft({
      file: r.blob,
      name: `voice-message.${r.mime.includes("mp4") ? "m4a" : "webm"}`,
      kind: "audio",
      mime: r.mime,
      durationMs: r.durationMs,
    });
  });

  // Grow from MIN_ROWS to MAX_ROWS, then scroll. Measured off scrollHeight so
  // it tracks wrapped lines, not just newlines.
  const resize = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    const cs = window.getComputedStyle(el);
    const lineHeight = parseFloat(cs.lineHeight) || 20;
    const vPad = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    const min = lineHeight * MIN_ROWS + vPad;
    const max = lineHeight * MAX_ROWS + vPad;
    el.style.height = "auto";
    const next = Math.min(Math.max(el.scrollHeight, min), max);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > max ? "auto" : "hidden";
  }, []);

  useEffect(resize, [value, resize]);

  const clear = () => {
    if (draft?.previewUrl) URL.revokeObjectURL(draft.previewUrl);
    setValue("");
    setDraft(null);
    setLocalError(null);
  };

  const submit = () => {
    if (disabled) return;
    const text = value.trim();

    if (editing) {
      if (!text) return;
      void onSubmitEdit?.(text);
      setValue("");
      return;
    }
    if (!text && !draft) return;
    void onSend(text, draft ?? undefined);
    clear();
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    } else if (e.key === "Escape") {
      if (editing) onCancelEdit?.();
      else if (replyTo) onCancelReply?.();
    }
  };

  const pickFile = (file: File) => {
    if (file.size > MAX_UPLOAD_BYTES) {
      setLocalError(labels.tooLarge);
      return;
    }
    const kind = kindForMime(file.type);
    setLocalError(null);
    setDraft({
      file,
      name: file.name,
      kind,
      mime: file.type || "application/octet-stream",
      previewUrl: kind === "image" ? URL.createObjectURL(file) : undefined,
    });
  };

  const busy = disabled || voice.recording;

  return (
    <div className="relative">
      {showVideo && (
        <VideoNoteRecorder
          cancelLabel={labels.cancel}
          sendLabel={labels.send}
          onClose={() => setShowVideo(false)}
          onDone={(r) =>
            setDraft({
              file: r.blob,
              name: `video-note.${r.mime.includes("mp4") ? "mp4" : "webm"}`,
              kind: "video",
              mime: r.mime,
              durationMs: r.durationMs,
            })
          }
        />
      )}

      {/* Reply / edit context bar */}
      {(replyTo || editing) && (
        <div className="flex items-center gap-2 px-2 py-1.5 mb-2 rounded-lg bg-surface border-l-2 border-indigo-400">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-indigo-600 dark:text-indigo-300">
              {editing ? labels.editing : labels.replyingTo}
            </p>
            <p className="text-[11px] text-foreground/60 truncate">
              {(editing ?? replyTo)?.body || (editing ?? replyTo)?.attachment_name}
            </p>
          </div>
          <button
            type="button"
            aria-label={labels.cancel}
            onClick={() => (editing ? onCancelEdit?.() : onCancelReply?.())}
            className="text-foreground/50 hover:text-foreground text-xs px-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* Attachment preview */}
      {draft && (
        <div className="flex items-center gap-2 px-2 py-1.5 mb-2 rounded-lg bg-surface border border-border">
          {draft.previewUrl ? (
            <Image
              src={draft.previewUrl}
              alt=""
              width={32}
              height={32}
              unoptimized
              className="h-8 w-8 rounded object-cover"
            />
          ) : (
            <span className="text-base">
              {draft.kind === "audio" ? "🎤" : draft.kind === "video" ? "🎥" : "📎"}
            </span>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-[11px] text-foreground/80 truncate">{draft.name}</p>
            <p className="text-[10px] text-foreground/40">
              {draft.durationMs
                ? formatDuration(draft.durationMs)
                : formatBytes(draft.file.size)}
            </p>
          </div>
          <button
            type="button"
            aria-label={labels.cancel}
            onClick={clear}
            className="text-foreground/50 hover:text-foreground text-xs px-1"
          >
            ✕
          </button>
        </div>
      )}

      {localError && <p className="mb-1 text-[11px] text-rose-600 dark:text-rose-300">{localError}</p>}
      {voice.error && <p className="mb-1 text-[11px] text-rose-600 dark:text-rose-300">{voice.error}</p>}

      {voice.recording ? (
        // Recording takes over the row so the stop/cancel targets are large.
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
          <p className="text-xs text-foreground/70 flex-1 tabular-nums">
            {labels.recording} {formatDuration(voice.elapsedMs)}
          </p>
          <button
            type="button"
            onClick={voice.cancel}
            className="text-xs text-foreground/60 hover:text-foreground px-2"
          >
            {labels.cancel}
          </button>
          <button
            type="button"
            onClick={voice.stop}
            aria-label={labels.send}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-rose-500 text-white hover:scale-105 transition"
          >
            <span className="h-3 w-3 rounded-sm bg-white" />
          </button>
        </div>
      ) : (
        <div className="flex items-end gap-1.5">
          {/* Attach leads the row, ahead of the input. */}
          {!editing && (
            <div className="pb-1">
              <IconButton label={labels.attach} onClick={() => fileRef.current?.click()}>
                <PaperclipIcon />
              </IconButton>
            </div>
          )}

          <textarea
            ref={textareaRef}
            rows={MIN_ROWS}
            autoFocus={Boolean(editing)}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              onTyping?.();
            }}
            onKeyDown={onKey}
            placeholder={labels.placeholder}
            className="flex-1 min-w-0 resize-none rounded-xl bg-surface border border-border px-3 py-2 text-sm text-foreground placeholder-foreground/40 focus:outline-none focus:border-indigo-400 leading-5"
          />

          <div className="flex items-center gap-0.5 pb-1">
            {!editing && (
              <>
                <IconButton
                  label={labels.emoji}
                  onClick={() => setShowEmoji((v) => !v)}
                >
                  <SmileIcon />
                </IconButton>
                {recorderSupported() && (
                  <>
                    <IconButton label={labels.voice} onClick={() => void voice.start()}>
                      <MicIcon />
                    </IconButton>
                    <IconButton label={labels.video} onClick={() => setShowVideo(true)}>
                      <VideoIcon />
                    </IconButton>
                  </>
                )}
              </>
            )}
            <button
              type="button"
              aria-label={labels.send}
              onClick={submit}
              disabled={(!value.trim() && !draft) || busy}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 transition"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path
                  d="M3 11l18-8-8 18-2-8-8-2z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      )}

      {showEmoji && (
        <EmojiPicker
          onClose={() => setShowEmoji(false)}
          onPick={(e) => {
            setValue((v) => v + e);
            textareaRef.current?.focus();
          }}
        />
      )}

      <input
        ref={fileRef}
        type="file"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) pickFile(f);
          e.target.value = ""; // let the same file be picked again
        }}
      />
    </div>
  );
}

function IconButton({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="h-8 w-8 grid place-items-center rounded-lg text-sm hover:bg-surface-strong transition"
    >
      {children}
    </button>
  );
}
