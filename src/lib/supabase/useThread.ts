"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import { getSupabase } from "./client";
import {
  removeAttachment,
  uploadAttachment,
  type Draft,
} from "./attachments";
import type { ChatMessage, Database, Reaction, Sender } from "./types";

/** At most one typing ping per this interval, however fast someone types. */
const PING_THROTTLE_MS = 1800;
/** Indicator hides this long after the last ping received. */
const TYPING_TTL_MS = 4000;

function sortByTime(list: ChatMessage[]) {
  return [...list].sort((a, b) => a.created_at.localeCompare(b.created_at));
}

function applyInsert(list: ChatMessage[], msg: ChatMessage) {
  if (list.some((m) => m.id === msg.id)) return list;
  return sortByTime([...list, msg]);
}

function applyUpdate(list: ChatMessage[], msg: ChatMessage) {
  return list.map((m) => (m.id === msg.id ? msg : m));
}

export type SendOptions = {
  draft?: Draft;
  replyToId?: string | null;
  /** Set only when sent from a suggestion chip; the DB trigger auto-answers it. */
  suggestionKey?: string | null;
};

export type ReactionMap = Record<string, Reaction[]>;

/**
 * One conversation's messages and reactions, live. Shared by the visitor widget
 * and the admin inbox — `sender` is what the caller writes as, and RLS checks
 * it independently.
 */
export function useThread(
  conversationId: string | null,
  sender: Sender,
  enabled: boolean,
) {
  const [thread, setThread] = useState<{ id: string | null; list: ChatMessage[] }>({
    id: null,
    list: [],
  });
  const [reactions, setReactions] = useState<{ id: string | null; list: Reaction[] }>({
    id: null,
    list: [],
  });
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  // Timestamp of the last typing ping from the *other* party.
  const [peerTypingAt, setPeerTypingAt] = useState(0);
  const [now, setNow] = useState(0);
  const typingChannelRef = useRef<RealtimeChannel | null>(null);
  const lastPingRef = useRef(0);

  const active = enabled && Boolean(conversationId);

  // Messages: history + live inserts/updates (edit and soft-delete are updates).
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !active || !conversationId) return;
    let cancelled = false;

    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!cancelled) setMyUserId(auth.user?.id ?? null);

      const { data, error: selErr } = await supabase
        .from("messages")
        .select("*")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });
      if (cancelled) return;
      if (selErr) setError(selErr.message);
      else setThread({ id: conversationId, list: data ?? [] });
    })();

    const channel = supabase
      .channel(`thread:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const row = payload.new as ChatMessage;
          setThread((prev) => {
            if (prev.id !== conversationId) return prev;
            if (payload.eventType === "INSERT") {
              return { id: prev.id, list: applyInsert(prev.list, row) };
            }
            if (payload.eventType === "UPDATE") {
              return { id: prev.id, list: applyUpdate(prev.list, row) };
            }
            return prev;
          });
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [active, conversationId]);

  // Reactions. There's no conversation_id to filter on server-side, so RLS does
  // the limiting and we drop anything outside this thread on arrival.
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !active || !conversationId) return;
    let cancelled = false;

    const load = async () => {
      const { data } = await supabase
        .from("message_reactions")
        .select("*, messages!inner(conversation_id)")
        .eq("messages.conversation_id", conversationId);
      if (cancelled) return;
      const rows = (data ?? []).map((r) => {
        const { message_id, user_id, emoji, created_at } = r as unknown as Reaction;
        return { message_id, user_id, emoji, created_at };
      });
      setReactions({ id: conversationId, list: rows });
    };
    void load();

    const channel = supabase
      .channel(`reactions:${conversationId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "message_reactions" },
        () => void load(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [active, conversationId]);

  // Typing indicator. Broadcast-only (never touches the DB): each keystroke
  // pings at most once every PING_THROTTLE_MS, and the bubble hides itself
  // TYPING_TTL_MS after the last ping, so a dropped "stopped" is self-healing.
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !active || !conversationId) return;

    const channel = supabase
      .channel(`typing:${conversationId}`, { config: { broadcast: { self: false } } })
      .on("broadcast", { event: "typing" }, (payload) => {
        // Only the other side's pings light up the indicator.
        if ((payload.payload as { sender?: Sender })?.sender !== sender) {
          setPeerTypingAt(Date.now());
        }
      })
      .subscribe();

    typingChannelRef.current = channel;
    return () => {
      typingChannelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [active, conversationId, sender]);

  const peerTyping = peerTypingAt > 0 && now - peerTypingAt < TYPING_TTL_MS;

  // Ticks only while the indicator is up; it stops itself once the ping
  // expires, and a fresh ping restarts it.
  useEffect(() => {
    if (!peerTyping) return;
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [peerTyping]);

  const sendTyping = useCallback(() => {
    const channel = typingChannelRef.current;
    if (!channel) return;
    const ts = Date.now();
    if (ts - lastPingRef.current < PING_THROTTLE_MS) return;
    lastPingRef.current = ts;
    void channel.send({ type: "broadcast", event: "typing", payload: { sender } });
  }, [sender]);

  const send = useCallback(
    async (body: string, opts: SendOptions = {}) => {
      const supabase = getSupabase();
      const trimmed = body.trim();
      if (!supabase || !conversationId) return false;
      if (!trimmed && !opts.draft) return false;

      setSending(true);
      setError(null);

      // The id is minted here so the attachment can be uploaded to a path that
      // already names its message.
      const id = crypto.randomUUID();
      let path: string | null = null;

      try {
        if (opts.draft) {
          path = await uploadAttachment(
            supabase as SupabaseClient<Database>,
            conversationId,
            id,
            opts.draft,
          );
        }

        const { error: insErr } = await supabase.from("messages").insert({
          id,
          conversation_id: conversationId,
          sender,
          body: trimmed,
          kind: opts.draft?.kind ?? "text",
          attachment_path: path,
          attachment_name: opts.draft?.name ?? null,
          attachment_size: opts.draft ? opts.draft.file.size : null,
          attachment_mime: opts.draft?.mime ?? null,
          duration_ms: opts.draft?.durationMs ?? null,
          reply_to_id: opts.replyToId ?? null,
          suggestion_key: opts.suggestionKey ?? null,
        });
        if (insErr) throw insErr;
        return true;
      } catch (e) {
        // Don't leave the uploaded file orphaned if the row never landed.
        if (path) await removeAttachment(supabase as SupabaseClient<Database>, path);
        setError(e instanceof Error ? e.message : "Message didn't send.");
        return false;
      } finally {
        setSending(false);
      }
    },
    [conversationId, sender],
  );

  const edit = useCallback(async (messageId: string, body: string) => {
    const supabase = getSupabase();
    if (!supabase) return false;
    const { error: rpcErr } = await supabase.rpc("edit_message", {
      p_message_id: messageId,
      p_body: body.trim(),
    });
    if (rpcErr) {
      setError(rpcErr.message);
      return false;
    }
    return true;
  }, []);

  const remove = useCallback(async (messageId: string) => {
    const supabase = getSupabase();
    if (!supabase) return false;
    // The RPC clears the row and hands back the storage key, so the file can go too.
    const { data, error: rpcErr } = await supabase.rpc("delete_message", {
      p_message_id: messageId,
    });
    if (rpcErr) {
      setError(rpcErr.message);
      return false;
    }
    if (typeof data === "string" && data) {
      await removeAttachment(supabase as SupabaseClient<Database>, data);
    }
    return true;
  }, []);

  const toggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      const supabase = getSupabase();
      if (!supabase || !myUserId) return;
      const mine = reactions.list.some(
        (r) => r.message_id === messageId && r.user_id === myUserId && r.emoji === emoji,
      );
      if (mine) {
        await supabase
          .from("message_reactions")
          .delete()
          .eq("message_id", messageId)
          .eq("user_id", myUserId)
          .eq("emoji", emoji);
      } else {
        await supabase
          .from("message_reactions")
          .insert({ message_id: messageId, user_id: myUserId, emoji });
      }
    },
    [myUserId, reactions.list],
  );

  // A stale thread from a previously open conversation reads as empty.
  const messages = thread.id === conversationId ? thread.list : [];
  const reactionList = reactions.id === conversationId ? reactions.list : [];

  const reactionsByMessage: ReactionMap = {};
  for (const r of reactionList) {
    (reactionsByMessage[r.message_id] ??= []).push(r);
  }

  return {
    messages,
    reactionsByMessage,
    myUserId,
    error,
    setError,
    sending,
    peerTyping,
    sendTyping,
    send,
    edit,
    remove,
    toggleReaction,
  };
}
