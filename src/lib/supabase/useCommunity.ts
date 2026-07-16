"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";
import { getSupabase } from "./client";
import { removeAttachment, uploadAttachment, type Draft } from "./attachments";
import { mapDbError } from "./useThread";
import type { CommunityMessage, Database, Reaction } from "./types";
import type { ProfileState } from "./useProfile";

/** Storage prefix for community attachments (see owns_attachment_path). */
const COMMUNITY_PREFIX = "community";

/** At most one typing ping per this interval; indicator hides after the TTL. */
const PING_THROTTLE_MS = 1800;
const TYPING_TTL_MS = 4000;

function sortByTime(list: CommunityMessage[]) {
  return [...list].sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export type CommunitySend = {
  draft?: Draft;
  replyToId?: string | null;
};

/**
 * The single community room: membership, live messages, and the author
 * profiles needed to render names and avatars.
 */
/** How many member avatars the join screen stacks before the overflow badge. */
export const MEMBER_STACK_MAX = 9;

export type MemberPreview = {
  user_id: string;
  username: string | null;
  avatar_path: string | null;
};

export function useCommunity(userId: string | null, enabled: boolean, isAdmin = false) {
  const [isMember, setIsMember] = useState<boolean | null>(null);
  const [memberCount, setMemberCount] = useState<number | null>(null);
  const [memberPreviews, setMemberPreviews] = useState<MemberPreview[]>([]);
  const [memberRefresh, setMemberRefresh] = useState(0);
  const [messages, setMessages] = useState<CommunityMessage[]>([]);
  const [reactions, setReactions] = useState<Reaction[]>([]);
  const [profiles, setProfiles] = useState<Record<string, ProfileState>>({});
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [joining, setJoining] = useState(false);
  const [peerTypingAt, setPeerTypingAt] = useState(0);
  const [now, setNow] = useState(0);
  const typingChannelRef = useRef<RealtimeChannel | null>(null);
  const lastPingRef = useRef(0);

  // Membership, member count, and the first few members for the avatar stack.
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !enabled || !userId) return;
    let cancelled = false;
    (async () => {
      const [{ data: mine }, { count }, { data: firstMembers }] = await Promise.all([
        supabase
          .from("community_members")
          .select("user_id")
          .eq("user_id", userId)
          .maybeSingle(),
        supabase
          .from("community_members")
          .select("*", { count: "exact", head: true }),
        supabase
          .from("community_members")
          .select("user_id")
          .order("joined_at", { ascending: true })
          .limit(MEMBER_STACK_MAX),
      ]);
      if (cancelled) return;
      setIsMember(Boolean(mine));
      setMemberCount(count ?? null);

      const ids = (firstMembers ?? []).map((m) => m.user_id);
      if (ids.length === 0) {
        setMemberPreviews([]);
        return;
      }
      const { data: profileRows } = await supabase
        .from("profiles")
        .select("user_id, username, avatar_path")
        .in("user_id", ids);
      if (cancelled) return;
      const byUser = new Map((profileRows ?? []).map((p) => [p.user_id, p]));
      // Preserve join order; members without a profile row still get a circle.
      setMemberPreviews(
        ids.map((id) => ({
          user_id: id,
          username: byUser.get(id)?.username ?? null,
          avatar_path: byUser.get(id)?.avatar_path ?? null,
        })),
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, userId, memberRefresh]);

  // Messages + realtime. RLS lets admins read without joining, so the gate
  // mirrors that: member OR admin.
  const canRead = Boolean(isMember) || isAdmin;
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !enabled || !canRead) return;
    let cancelled = false;

    (async () => {
      const { data, error: selErr } = await supabase
        .from("community_messages")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(200);
      if (cancelled) return;
      if (selErr) setError(selErr.message);
      else setMessages(data ?? []);
    })();

    const channel = supabase
      .channel("community:messages")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "community_messages" },
        (payload) => {
          const row = payload.new as CommunityMessage;
          setMessages((prev) => {
            if (payload.eventType === "INSERT") {
              if (prev.some((m) => m.id === row.id)) return prev;
              return sortByTime([...prev, row]);
            }
            if (payload.eventType === "UPDATE") {
              return prev.map((m) => (m.id === row.id ? row : m));
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
  }, [enabled, canRead]);

  // Reactions: load + reload on any change (RLS scopes rows to the room).
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !enabled || !canRead) return;
    let cancelled = false;

    const load = async () => {
      const { data } = await supabase.from("community_reactions").select("*");
      if (!cancelled) setReactions((data ?? []) as Reaction[]);
    };
    void load();

    const channel = supabase
      .channel("community:reactions")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "community_reactions" },
        () => void load(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [enabled, canRead]);

  const toggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      const supabase = getSupabase();
      if (!supabase || !userId) return;
      const mine = reactions.some(
        (r) => r.message_id === messageId && r.user_id === userId && r.emoji === emoji,
      );
      if (mine) {
        await supabase
          .from("community_reactions")
          .delete()
          .eq("message_id", messageId)
          .eq("user_id", userId)
          .eq("emoji", emoji);
      } else {
        await supabase
          .from("community_reactions")
          .insert({ message_id: messageId, user_id: userId, emoji });
      }
    },
    [reactions, userId],
  );

  // Typing indicator: broadcast-only, same self-healing pattern as the 1:1
  // thread — pings throttle on the way out and expire on the way in.
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !enabled || !canRead || !userId) return;

    const channel = supabase
      .channel("community:typing", { config: { broadcast: { self: false } } })
      .on("broadcast", { event: "typing" }, (payload) => {
        if ((payload.payload as { userId?: string })?.userId !== userId) {
          setPeerTypingAt(Date.now());
        }
      })
      .subscribe();

    typingChannelRef.current = channel;
    return () => {
      typingChannelRef.current = null;
      supabase.removeChannel(channel);
    };
  }, [enabled, canRead, userId]);

  const peerTyping = peerTypingAt > 0 && now - peerTypingAt < TYPING_TTL_MS;

  useEffect(() => {
    if (!peerTyping) return;
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [peerTyping]);

  const sendTyping = useCallback(() => {
    const channel = typingChannelRef.current;
    if (!channel || !userId) return;
    const ts = Date.now();
    if (ts - lastPingRef.current < PING_THROTTLE_MS) return;
    lastPingRef.current = ts;
    void channel.send({ type: "broadcast", event: "typing", payload: { userId } });
  }, [userId]);

  // Live profile edits (username/avatar) land in open chats immediately.
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !enabled || !canRead) return;
    const channel = supabase
      .channel("community:profiles")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        (payload) => {
          const row = payload.new as {
            user_id?: string;
            username: string | null;
            phone: string | null;
            avatar_path: string | null;
          };
          if (!row?.user_id) return;
          setProfiles((prev) => ({
            ...prev,
            [row.user_id as string]: {
              username: row.username,
              phone: row.phone,
              avatar_path: row.avatar_path,
            },
          }));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, canRead]);

  // Fetch author profiles for anyone we haven't seen yet.
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || messages.length === 0) return;
    const missing = [
      ...new Set(
        messages
          .map((m) => m.user_id)
          .filter((id): id is string => Boolean(id && !(id in profiles))),
      ),
    ];
    if (missing.length === 0) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("user_id, username, phone, avatar_path")
        .in("user_id", missing);
      if (cancelled) return;
      setProfiles((prev) => {
        const next = { ...prev };
        // Users without a profile row still get an entry, so we don't refetch
        // them on every render.
        for (const id of missing) {
          next[id] = { username: null, phone: null, avatar_path: null };
        }
        for (const p of data ?? []) {
          next[p.user_id] = {
            username: p.username,
            phone: p.phone,
            avatar_path: p.avatar_path,
          };
        }
        return next;
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [messages, profiles]);

  const join = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !userId) return false;
    setJoining(true);
    setError(null);
    const { error: insErr } = await supabase
      .from("community_members")
      .insert({ user_id: userId });
    setJoining(false);
    // Already a member is fine (unique violation).
    if (insErr && !insErr.message.includes("duplicate")) {
      setError(insErr.message);
      return false;
    }
    setIsMember(true);
    setMemberCount((n) => (n == null ? n : n + 1));
    // Refetch the stack so the new member's own circle appears.
    setMemberRefresh((n) => n + 1);
    return true;
  }, [userId]);

  const send = useCallback(
    async (body: string, opts: CommunitySend = {}) => {
      const supabase = getSupabase();
      const trimmed = body.trim();
      if (!supabase || !userId) return false;
      if (!trimmed && !opts.draft) return false;

      setSending(true);
      setError(null);
      const id = crypto.randomUUID();
      let path: string | null = null;

      try {
        if (opts.draft) {
          path = await uploadAttachment(
            supabase as SupabaseClient<Database>,
            COMMUNITY_PREFIX,
            id,
            opts.draft,
          );
        }
        const { error: insErr } = await supabase.from("community_messages").insert({
          id,
          user_id: userId,
          body: trimmed,
          kind: opts.draft?.kind ?? "text",
          attachment_path: path,
          attachment_name: opts.draft?.name ?? null,
          attachment_size: opts.draft ? opts.draft.file.size : null,
          attachment_mime: opts.draft?.mime ?? null,
          duration_ms: opts.draft?.durationMs ?? null,
          reply_to_id: opts.replyToId ?? null,
        });
        if (insErr) throw insErr;
        return true;
      } catch (e) {
        if (path) await removeAttachment(supabase as SupabaseClient<Database>, path);
        setError(e instanceof Error ? mapDbError(e.message) : "Message didn't send.");
        return false;
      } finally {
        setSending(false);
      }
    },
    [userId],
  );

  const edit = useCallback(async (messageId: string, body: string) => {
    const supabase = getSupabase();
    if (!supabase) return false;
    const { error: rpcErr } = await supabase.rpc("edit_community_message", {
      p_message_id: messageId,
      p_body: body.trim(),
    });
    if (rpcErr) {
      setError(mapDbError(rpcErr.message));
      return false;
    }
    return true;
  }, []);

  const remove = useCallback(async (messageId: string) => {
    const supabase = getSupabase();
    if (!supabase) return false;
    const { data, error: rpcErr } = await supabase.rpc("delete_community_message", {
      p_message_id: messageId,
    });
    if (rpcErr) {
      setError(mapDbError(rpcErr.message));
      return false;
    }
    if (typeof data === "string" && data) {
      await removeAttachment(supabase as SupabaseClient<Database>, data);
    }
    return true;
  }, []);

  const reactionsByMessage: Record<string, Reaction[]> = {};
  for (const r of reactions) {
    (reactionsByMessage[r.message_id] ??= []).push(r);
  }

  return {
    isMember,
    memberCount,
    memberPreviews,
    messages,
    reactionsByMessage,
    toggleReaction,
    profiles,
    error,
    sending,
    joining,
    peerTyping,
    sendTyping,
    join,
    send,
    edit,
    remove,
  };
}
