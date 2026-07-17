"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { getSupabase } from "./client";
import { removeAttachment, uploadAttachment, type Draft } from "./attachments";
import type {
  NokorAuthor,
} from "./useNokor";
import type {
  NokorRoom,
  NokorRoomKind,
  NokorRoomMember,
  NokorRoomMessage,
  NokorRoomReaction,
  NokorRoomRole,
} from "./types";

const PING_THROTTLE_MS = 1800;
const TYPING_TTL_MS = 4000;

export type NokorRoomSummary = NokorRoom & {
  role: NokorRoomRole;
  memberCount: number;
  lastMessage: string | null;
};

export type NokorPerson = { userId: string; username: string | null; avatar_path: string | null };

/** People you follow or who follow you — the candidates to add to a room. */
export function useNokorFollowers(meId: string | null) {
  const [people, setPeople] = useState<NokorPerson[]>([]);

  const load = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !meId) return;
    const [followersRes, followingRes] = await Promise.all([
      supabase.from("nokor_follows").select("follower_id").eq("following_id", meId),
      supabase.from("nokor_follows").select("following_id").eq("follower_id", meId),
    ]);
    const ids = [
      ...new Set([
        ...(followersRes.data ?? []).map((r) => r.follower_id),
        ...(followingRes.data ?? []).map((r) => r.following_id),
      ]),
    ];
    if (!ids.length) {
      setPeople([]);
      return;
    }
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, username, avatar_path")
      .in("user_id", ids);
    setPeople(
      (profiles ?? []).map((p) => ({
        userId: p.user_id,
        username: p.username,
        avatar_path: p.avatar_path,
      })),
    );
  }, [meId]);

  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  });
  useEffect(() => {
    if (!meId) return;
    void loadRef.current();
  }, [meId]);

  return { people, reload: load };
}

/** Rooms the signed-in user belongs to, newest activity first. */
export function useNokorRooms(meId: string | null) {
  const [rooms, setRooms] = useState<NokorRoomSummary[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !meId) return;
    // RLS limits both of these to rooms we're a member of.
    const { data: roomRows } = await supabase
      .from("nokor_rooms")
      .select("*")
      .order("last_message_at", { ascending: false });
    const list = (roomRows ?? []) as NokorRoom[];
    if (!list.length) {
      setRooms([]);
      setLoaded(true);
      return;
    }
    const ids = list.map((r) => r.id);
    const [memberRes, lastRes] = await Promise.all([
      supabase.from("nokor_room_members").select("room_id, user_id, role").in("room_id", ids),
      supabase
        .from("nokor_room_messages")
        .select("room_id, body, attachment_name, created_at")
        .in("room_id", ids)
        .order("created_at", { ascending: false }),
    ]);
    const members = memberRes.data ?? [];
    const lastByRoom = new Map<string, string>();
    for (const m of lastRes.data ?? []) {
      if (!lastByRoom.has(m.room_id)) {
        lastByRoom.set(m.room_id, m.body || (m.attachment_name ? `📎 ${m.attachment_name}` : ""));
      }
    }
    setRooms(
      list.map((r) => ({
        ...r,
        role: (members.find((m) => m.room_id === r.id && m.user_id === meId)?.role ??
          "member") as NokorRoomRole,
        memberCount: members.filter((m) => m.room_id === r.id).length,
        lastMessage: lastByRoom.get(r.id) ?? null,
      })),
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
      .channel("nokor-rooms")
      .on("postgres_changes", { event: "*", schema: "public", table: "nokor_rooms" }, schedule)
      .on("postgres_changes", { event: "*", schema: "public", table: "nokor_room_members" }, schedule)
      .on("postgres_changes", { event: "*", schema: "public", table: "nokor_room_messages" }, schedule)
      .subscribe();
    return () => {
      if (timer) clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, [meId]);

  const createRoom = useCallback(
    async (kind: NokorRoomKind, name: string, description: string, members: string[]) => {
      const supabase = getSupabase();
      if (!supabase || !name.trim()) return null;
      const { data, error } = await supabase.rpc("nokor_create_room", {
        p_kind: kind,
        p_name: name.trim(),
        p_description: description.trim() || null,
        p_members: members,
      });
      if (error) return null;
      await load();
      return data as string;
    },
    [load],
  );

  const leaveRoom = useCallback(
    async (roomId: string) => {
      const supabase = getSupabase();
      if (!supabase || !meId) return;
      await supabase.from("nokor_room_members").delete().eq("room_id", roomId).eq("user_id", meId);
      void load();
    },
    [meId, load],
  );

  return { rooms, loaded, createRoom, leaveRoom };
}

export type RoomMemberInfo = NokorRoomMember & { author: NokorAuthor | null };

/** Members of one room, with profiles for rendering. */
export function useNokorRoomMembers(roomId: string | null) {
  const [members, setMembers] = useState<RoomMemberInfo[]>([]);

  const load = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !roomId) return;
    const { data: rows } = await supabase.from("nokor_room_members").select("*").eq("room_id", roomId);
    const list = (rows ?? []) as NokorRoomMember[];
    const ids = list.map((m) => m.user_id);
    const { data: profiles } = ids.length
      ? await supabase.from("profiles").select("user_id, username, avatar_path").in("user_id", ids)
      : { data: [] };
    const authors = new Map(
      (profiles ?? []).map((p) => [p.user_id, { username: p.username, avatar_path: p.avatar_path }]),
    );
    setMembers(list.map((m) => ({ ...m, author: authors.get(m.user_id) ?? null })));
  }, [roomId]);

  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  });
  useEffect(() => {
    if (!roomId) return;
    void loadRef.current();
  }, [roomId]);

  return { members, reload: load };
}

/**
 * One open room. Mirrors useNokorConversation's shape so the same chat UI
 * renders both DMs and rooms — `canPost` is what channels use to lock the
 * composer for non-admins.
 */
export function useNokorRoomConversation(
  room: NokorRoomSummary | null,
  meId: string | null,
) {
  const roomId = room?.id ?? null;
  const [messages, setMessages] = useState<NokorRoomMessage[]>([]);
  const [reactions, setReactions] = useState<NokorRoomReaction[]>([]);
  const [authors, setAuthors] = useState<Record<string, NokorAuthor>>({});
  const [typingNames, setTypingNames] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const lastPingRef = useRef(0);
  const typingTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const load = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !roomId) return;
    const { data: rows } = await supabase
      .from("nokor_room_messages")
      .select("*")
      .eq("room_id", roomId)
      .order("created_at", { ascending: true });
    const list = (rows ?? []) as NokorRoomMessage[];
    setMessages(list);

    const ids = list.map((m) => m.id);
    const senderIds = [...new Set(list.map((m) => m.sender_id))];
    const [reactRes, profileRes] = await Promise.all([
      ids.length
        ? supabase.from("nokor_room_reactions").select("*").in("message_id", ids)
        : Promise.resolve({ data: [] }),
      senderIds.length
        ? supabase.from("profiles").select("user_id, username, avatar_path").in("user_id", senderIds)
        : Promise.resolve({ data: [] }),
    ]);
    setReactions((reactRes.data ?? []) as NokorRoomReaction[]);
    setAuthors(
      Object.fromEntries(
        (profileRes.data ?? []).map((p) => [
          p.user_id,
          { username: p.username, avatar_path: p.avatar_path },
        ]),
      ),
    );
    setLoaded(true);
  }, [roomId]);

  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  });

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !roomId || !meId) return;
    void loadRef.current();
    const timers = typingTimers.current;
    let timer: ReturnType<typeof setTimeout> | null = null;
    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void loadRef.current(), 150);
    };
    const channel = supabase
      .channel(`nokor-room-${roomId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "nokor_room_messages", filter: `room_id=eq.${roomId}` },
        schedule,
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "nokor_room_reactions" }, schedule)
      .on("broadcast", { event: "typing" }, (payload) => {
        const p = payload.payload as { userId?: string; name?: string };
        if (!p?.userId || p.userId === meId || !p.name) return;
        const who = p.name;
        setTypingNames((prev) => (prev.includes(who) ? prev : [...prev, who]));
        const existing = timers.get(who);
        if (existing) clearTimeout(existing);
        timers.set(
          who,
          setTimeout(() => setTypingNames((prev) => prev.filter((n) => n !== who)), TYPING_TTL_MS),
        );
      })
      .subscribe();
    channelRef.current = channel;
    return () => {
      if (timer) clearTimeout(timer);
      timers.forEach((tm) => clearTimeout(tm));
      timers.clear();
      channelRef.current = null;
      void supabase.removeChannel(channel);
    };
  }, [roomId, meId]);

  const pingTyping = useCallback(
    (displayName: string) => {
      const now = Date.now();
      if (now - lastPingRef.current < PING_THROTTLE_MS) return;
      lastPingRef.current = now;
      void channelRef.current?.send({
        type: "broadcast",
        event: "typing",
        payload: { userId: meId, name: displayName },
      });
    },
    [meId],
  );

  const send = useCallback(
    async ({ body, draft, replyToId }: { body?: string; draft?: Draft; replyToId?: string | null }) => {
      const supabase = getSupabase();
      if (!supabase || !roomId || !meId) return false;
      const text = (body ?? "").trim();
      if (!text && !draft) return false;
      setError(null);

      const messageId = crypto.randomUUID();
      let path: string | null = null;
      if (draft) {
        try {
          path = await uploadAttachment(supabase, roomId, messageId, draft);
        } catch (e) {
          setError(e instanceof Error ? e.message : "upload-failed");
          return false;
        }
      }
      const { error: insErr } = await supabase.from("nokor_room_messages").insert({
        id: messageId,
        room_id: roomId,
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
    [roomId, meId, load],
  );

  const editMessage = useCallback(
    async (messageId: string, body: string) => {
      const supabase = getSupabase();
      if (!supabase || !body.trim()) return false;
      const { error: upErr } = await supabase
        .from("nokor_room_messages")
        .update({ body: body.trim(), edited_at: new Date().toISOString() })
        .eq("id", messageId);
      if (upErr) return false;
      void load();
      return true;
    },
    [load],
  );

  const deleteMessage = useCallback(
    async (message: NokorRoomMessage) => {
      const supabase = getSupabase();
      if (!supabase) return;
      await supabase
        .from("nokor_room_messages")
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
          .from("nokor_room_reactions")
          .delete()
          .eq("message_id", messageId)
          .eq("user_id", meId)
          .eq("emoji", emoji);
      } else {
        await supabase.from("nokor_room_reactions").insert({ message_id: messageId, user_id: meId, emoji });
      }
      void load();
    },
    [meId, reactions, load],
  );

  const markRead = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !roomId || !meId) return;
    await supabase
      .from("nokor_room_reads")
      .upsert(
        { room_id: roomId, user_id: meId, last_read_at: new Date().toISOString() },
        { onConflict: "room_id,user_id" },
      );
  }, [roomId, meId]);

  // Channels are broadcast-only: members read, admins post.
  const canPost = room ? room.kind === "group" || room.role === "owner" || room.role === "admin" : false;

  return {
    messages,
    reactions,
    authors,
    typingNames,
    loaded,
    error,
    canPost,
    send,
    editMessage,
    deleteMessage,
    toggleReaction,
    markRead,
    pingTyping,
  };
}
