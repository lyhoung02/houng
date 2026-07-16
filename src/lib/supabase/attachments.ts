"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, MessageKind } from "./types";

export const BUCKET = "chat-attachments";
export const MAX_UPLOAD_BYTES = 25 * 1024 * 1024; // keep in sync with the bucket limit

export type Draft = {
  file: Blob;
  name: string;
  kind: MessageKind;
  mime: string;
  durationMs?: number;
  /** Object URL for the local preview; caller revokes it. */
  previewUrl?: string;
};

export function kindForMime(mime: string): MessageKind {
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("audio/")) return "audio";
  if (mime.startsWith("video/")) return "video";
  return "file";
}

export function formatBytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function formatDuration(ms: number) {
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** Strip anything that would confuse the storage key or a Content-Disposition. */
function safeName(name: string) {
  const cleaned = name.replace(/[^\w.\-]+/g, "_").slice(-80);
  return cleaned || "file";
}

/**
 * Uploads to <prefix>/<message_id>/<filename>, where prefix is a conversation
 * id or the literal "community". The message id is generated client-side so
 * the file can land before the row exists — storage RLS authorises on the
 * prefix, not the message.
 */
export async function uploadAttachment(
  supabase: SupabaseClient<Database>,
  prefix: string,
  messageId: string,
  draft: Draft,
): Promise<string> {
  if (draft.file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`File is over ${formatBytes(MAX_UPLOAD_BYTES)}.`);
  }
  const path = `${prefix}/${messageId}/${safeName(draft.name)}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, draft.file, {
    contentType: draft.mime,
    upsert: false,
  });
  if (error) throw error;
  return path;
}

/** Best-effort cleanup: an orphaned file is harmless, a failed send is not. */
export async function removeAttachment(
  supabase: SupabaseClient<Database>,
  path: string,
) {
  try {
    await supabase.storage.from(BUCKET).remove([path]);
  } catch {
    /* ignore */
  }
}

const SIGNED_TTL_SECONDS = 60 * 60;

type CacheEntry = { url: string; expiresAt: number };
const signedCache = new Map<string, CacheEntry>();

/** Signed URLs are minted per path and reused until they near expiry. */
export async function getSignedUrl(
  supabase: SupabaseClient<Database>,
  path: string,
): Promise<string | null> {
  const cached = signedCache.get(path);
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.url;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(path, SIGNED_TTL_SECONDS);
  if (error || !data) return null;

  signedCache.set(path, {
    url: data.signedUrl,
    expiresAt: Date.now() + SIGNED_TTL_SECONDS * 1000,
  });
  return data.signedUrl;
}

export const AVATAR_BUCKET = "avatars";
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // keep in sync with the bucket limit

/** Avatars live in a public bucket, so the URL is stable — no signing. */
export function avatarUrl(
  supabase: SupabaseClient<Database>,
  path: string | null | undefined,
): string | null {
  if (!path) return null;
  return supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path).data.publicUrl;
}
