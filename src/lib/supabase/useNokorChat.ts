"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabase } from "./client";
import { removeAttachment, uploadAttachment, type Draft } from "./attachments";
import type { NokorAuthor } from "./useNokor";
import type { NokorDmMessage, NokorDmReaction } from "./types";

export type NokorDmSummary = {
  threadId: string;
  otherId: string;
  other: NokorAuthor | null;
  lastMessage: string | null;
  lastMessageAt: string;
};

/** All of the signed-in user's DM threads, newest activity first. */
export function useNokorThreads(meId: string | null) {
  const [threads, setThreads] = useState<NokorDmSummary[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !meId) return;
    const { data: rows } = await supabase
      .from("nokor_dm_threads")
      .select("*")
      .order("last_message_at", { ascending: false });
    const list = rows ?? [];
    const otherIds = list.map((t) => (t.user_lo === meId ? t.user_hi : t.user_lo));

    const [profileRes, lastRes] = await Promise.all([
      otherIds.length
        ? supabase.from("profiles").select("user_id, username, avatar_path").in("user_id", otherIds)
        : Promise.resolve({ data: [] }),
      list.length
        ? supabase
            .from("nokor_dm_messages")
            .select("thread_id, body, created_at")
            .in("thread_id", list.map((t) => t.id))
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [] }),
    ]);

    const authors = new Map(
      (profileRes.data ?? []).map((p) => [p.user_id, { username: p.username, avatar_path: p.avatar_path }]),
    );
    const lastByThread = new Map<string, string>();
    for (const m of lastRes.data ?? []) {
      if (!lastByThread.has(m.thread_id)) lastByThread.set(m.thread_id, m.body);
    }

    setThreads(
      list.map((t) => {
        const otherId = t.user_lo === meId ? t.user_hi : t.user_lo;
        return {
          threadId: t.id,
          otherId,
          other: authors.get(otherId) ?? null,
          lastMessage: lastByThread.get(t.id) ?? null,
          lastMessageAt: t.last_message_at,
        };
      }),
    );
    setLoaded(true);
  }, [meId]);

  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  });
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !meId) return;
    void loadRef.current();
    let timer: ReturnType<typeof setTimeout> | null = null;
    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void loadRef.current(), 300);
    };
    const channel = supabase
      .channel("nokor-threads")
      .on("postgres_changes", { event: "*", schema: "public", table: "nokor_dm_threads" }, schedule)
      .on("postgres_changes", { event: "*", schema: "public", table: "nokor_dm_messages" }, schedule)
      .subscribe();
    return () => {
      if (timer) clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [meId]);

  /** Get-or-create the thread with another user; returns its id. */
  const openWith = useCallback(async (otherId: string) => {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data, error } = await supabase.rpc("nokor_open_dm", { p_other: otherId });
    if (error) return null;
    void load();
    return data as string;
  }, [load]);

  return { threads, loaded, openWith };
}

/** At most one typing ping per interval; the indicator hides after the TTL. */
const PING_THROTTLE_MS = 1800;
const TYPING_TTL_MS = 4000;

export type NokorDmSend = {
  body?: string;
  draft?: Draft;
  replyToId?: string | null;
};

/**
 * One open DM thread: live messages, reactions, typing presence and read
 * receipts. Attachments go to the private chat-attachments bucket keyed by
 * thread id, so the storage policy authorises on thread membership.
 */
export function useNokorConversation(threadId: string | null, meId: string | null) {
  const [messages, setMessages] = useState<NokorDmMessage[]>([]);
  const [reactions, setReactions] = useState<NokorDmReaction[]>([]);
  const [otherReadAt, setOtherReadAt] = useState<string | null>(null);
  const [otherTyping, setOtherTyping] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const lastPingRef = useRef(0);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !threadId || !meId) return;
    const { data: rows } = await supabase
      .from("nokor_dm_messages")
      .select("*")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });
    const list = (rows ?? []) as NokorDmMessage[];
    setMessages(list);

    const ids = list.map((m) => m.id);
    const [reactRes, readRes] = await Promise.all([
      ids.length
        ? supabase.from("nokor_dm_reactions").select("*").in("message_id", ids)
        : Promise.resolve({ data: [] }),
      supabase.from("nokor_dm_reads").select("user_id, last_read_at").eq("thread_id", threadId),
    ]);
    setReactions((reactRes.data ?? []) as NokorDmReaction[]);
    const other = (readRes.data ?? []).find((r) => r.user_id !== meId);
    setOtherReadAt(other?.last_read_at ?? null);
    setLoaded(true);
  }, [threadId, meId]);

  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  });

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !threadId || !meId) return;
    void loadRef.current();
    let timer: ReturnType<typeof setTimeout> | null = null;
    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void loadRef.current(), 150);
    };
    const channel = supabase
      .channel(`nokor-dm-${threadId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "nokor_dm_messages", filter: `thread_id=eq.${threadId}` },
        schedule,
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "nokor_dm_reactions" }, schedule)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "nokor_dm_reads", filter: `thread_id=eq.${threadId}` },
        schedule,
      )
      // Typing is ephemeral — broadcast only, never stored.
      .on("broadcast", { event: "typing" }, (payload) => {
        const from = (payload.payload as { userId?: string })?.userId;
        if (!from || from === meId) return;
        setOtherTyping(true);
        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => setOtherTyping(false), TYPING_TTL_MS);
      })
      .subscribe();
    channelRef.current = channel;
    return () => {
      if (timer) clearTimeout(timer);
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      channelRef.current = null;
      void supabase.removeChannel(channel);
    };
  }, [threadId, meId]);

  const pingTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastPingRef.current < PING_THROTTLE_MS) return;
    lastPingRef.current = now;
    void channelRef.current?.send({
      type: "broadcast",
      event: "typing",
      payload: { userId: meId },
    });
  }, [meId]);

  const send = useCallback(
    async ({ body, draft, replyToId }: NokorDmSend) => {
      const supabase = getSupabase();
      if (!supabase || !threadId || !meId) return false;
      const text = (body ?? "").trim();
      if (!text && !draft) return false;
      setError(null);

      // The id is minted client-side so the file can land before the row.
      const messageId = crypto.randomUUID();
      let path: string | null = null;
      if (draft) {
        try {
          path = await uploadAttachment(supabase, threadId, messageId, draft);
        } catch (e) {
          setError(e instanceof Error ? e.message : "upload-failed");
          return false;
        }
      }

      const { error: insErr } = await supabase.from("nokor_dm_messages").insert({
        id: messageId,
        thread_id: threadId,
        sender_id: meId,
        body: text,
        kind: draft ? draft.kind : "text",
        attachment_path: path,
        attachment_name: draft ? draft.name : null,
        attachment_size: draft ? draft.file.size : null,
        attachment_mime: draft ? draft.mime : null,
        duration_ms: draft?.durationMs ?? null,
        reply_to_id: replyToId ?? null,
      });
      if (insErr) {
        if (path) await removeAttachment(supabase, path);
        setError(insErr.message);
        return false;
      }
      void load();
      return true;
    },
    [threadId, meId, load],
  );

  const editMessage = useCallback(
    async (messageId: string, body: string) => {
      const supabase = getSupabase();
      if (!supabase || !body.trim()) return false;
      const { error: upErr } = await supabase
        .from("nokor_dm_messages")
        .update({ body: body.trim(), edited_at: new Date().toISOString() })
        .eq("id", messageId);
      if (upErr) return false;
      void load();
      return true;
    },
    [load],
  );

  /** Soft delete: the row stays so the bubble can render "message deleted". */
  const deleteMessage = useCallback(
    async (message: NokorDmMessage) => {
      const supabase = getSupabase();
      if (!supabase) return;
      await supabase
        .from("nokor_dm_messages")
        .update({
          deleted_at: new Date().toISOString(),
          body: "",
          attachment_path: null,
          attachment_name: null,
          attachment_size: null,
          attachment_mime: null,
          duration_ms: null,
          kind: "text",
        })
        .eq("id", message.id);
      if (message.attachment_path) await removeAttachment(supabase, message.attachment_path);
      void load();
    },
    [load],
  );

  const toggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      const supabase = getSupabase();
      if (!supabase || !meId) return;
      const mine = reactions.some(
        (r) => r.message_id === messageId && r.user_id === meId && r.emoji === emoji,
      );
      if (mine) {
        await supabase
          .from("nokor_dm_reactions")
          .delete()
          .eq("message_id", messageId)
          .eq("user_id", meId)
          .eq("emoji", emoji);
      } else {
        await supabase
          .from("nokor_dm_reactions")
          .insert({ message_id: messageId, user_id: meId, emoji });
      }
      void load();
    },
    [meId, reactions, load],
  );

  /** Stamp my read marker; the other side's bubbles show "seen" past it. */
  const markRead = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !threadId || !meId) return;
    await supabase
      .from("nokor_dm_reads")
      .upsert(
        { thread_id: threadId, user_id: meId, last_read_at: new Date().toISOString() },
        { onConflict: "thread_id,user_id" },
      );
  }, [threadId, meId]);

  return {
    messages,
    reactions,
    otherReadAt,
    otherTyping,
    loaded,
    error,
    send,
    editMessage,
    deleteMessage,
    toggleReaction,
    markRead,
    pingTyping,
  };
}
