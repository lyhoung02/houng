"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { getSupabase } from "@/lib/supabase/client";
import {
  formatBytes,
  formatDuration,
  getSignedUrl,
} from "@/lib/supabase/attachments";
import type { ChatMessage } from "@/lib/supabase/types";

/**
 * Only the attachment-bearing fields are needed, so any message shape carrying
 * them works — the portfolio chat and Nokor DMs both pass through here.
 */
type AttachmentLike = Pick<
  ChatMessage,
  "kind" | "attachment_path" | "attachment_name" | "attachment_size" | "duration_ms"
>;

/** Attachments live in a private bucket, so every render mints a signed URL. */
export function Attachment({ message }: { message: AttachmentLike }) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const path = message.attachment_path;

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !path) return;
    let cancelled = false;
    void getSignedUrl(supabase, path).then((u) => {
      if (cancelled) return;
      if (u) setUrl(u);
      else setFailed(true);
    });
    return () => {
      cancelled = true;
    };
  }, [path]);

  if (!path) return null;
  if (failed) {
    return <p className="text-[11px] text-rose-600 dark:text-rose-300">Attachment unavailable.</p>;
  }
  if (!url) {
    return <div className="h-16 w-40 rounded-lg bg-surface-strong animate-pulse" />;
  }

  if (message.kind === "image") {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="block">
        <Image
          src={url}
          alt={message.attachment_name ?? ""}
          width={240}
          height={240}
          unoptimized
          className="rounded-lg max-h-60 w-auto object-cover"
        />
      </a>
    );
  }

  if (message.kind === "audio") {
    return (
      <div className="flex items-center gap-2 min-w-[180px]">
        <span className="text-base">🎤</span>
        <audio src={url} controls className="h-8 max-w-[200px]" />
        {message.duration_ms != null && (
          <span className="text-[10px] text-foreground/50 tabular-nums">
            {formatDuration(message.duration_ms)}
          </span>
        )}
      </div>
    );
  }

  if (message.kind === "video") {
    // Recorded notes (video-<ts>.webm) show round like Telegram; an attached
    // video file shows as a normal rectangular player.
    const isNote = message.attachment_name?.startsWith("video-") ?? false;
    return isNote ? (
      <video
        src={url}
        controls
        playsInline
        className="h-44 w-44 rounded-full object-cover bg-black"
      />
    ) : (
      <video src={url} controls playsInline className="max-h-72 max-w-full rounded-lg bg-black" />
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="flex items-center gap-2 rounded-lg bg-surface border border-border px-2.5 py-2 hover:bg-surface-strong transition min-w-[160px]"
    >
      <span className="text-base">📎</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] text-foreground truncate">
          {message.attachment_name}
        </span>
        {message.attachment_size != null && (
          <span className="block text-[10px] text-foreground/40">
            {formatBytes(message.attachment_size)}
          </span>
        )}
      </span>
    </a>
  );
}
