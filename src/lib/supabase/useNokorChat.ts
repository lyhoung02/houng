"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getSupabase } from "./client";
import type { NokorAuthor } from "./useNokor";
import type { NokorDmMessage } from "./types";

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

/** Live messages for one open thread + a sender. */
export function useNokorConversation(threadId: string | null, meId: string | null) {
  const [messages, setMessages] = useState<NokorDmMessage[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !threadId) return;
    const { data } = await supabase
      .from("nokor_dm_messages")
      .select("*")
      .eq("thread_id", threadId)
      .order("created_at", { ascending: true });
    setMessages((data ?? []) as NokorDmMessage[]);
    setLoaded(true);
  }, [threadId]);

  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  });
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !threadId) return;
    void loadRef.current();
    const channel = supabase
      .channel(`nokor-dm-${threadId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "nokor_dm_messages", filter: `thread_id=eq.${threadId}` },
        (payload) => setMessages((prev) => [...prev, payload.new as NokorDmMessage]),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [threadId]);

  const send = useCallback(
    async (body: string) => {
      const supabase = getSupabase();
      if (!supabase || !threadId || !meId || !body.trim()) return false;
      const { error } = await supabase
        .from("nokor_dm_messages")
        .insert({ thread_id: threadId, sender_id: meId, body: body.trim() });
      return !error;
    },
    [threadId, meId],
  );

  return { messages, loaded, send };
}
