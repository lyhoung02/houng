"use client";

import { useCallback, useEffect, useState } from "react";
import { getSupabase, isSupabaseConfigured } from "./client";
import { useThread } from "./useThread";
import type { Conversation } from "./types";

// ---------------------------------------------------------------- visitor side

export type VisitorChat = ReturnType<typeof useVisitorChat>;

/** Display name for the inbox, derived from the address they signed up with. */
function nameFromEmail(email: string) {
  const local = email.split("@")[0] ?? "";
  return (local.replace(/[._-]+/g, " ").trim() || email).slice(0, 80);
}

/**
 * Visitors hold real email+password accounts, so the account *is* the identity:
 * their conversation is found by visitor_id = auth.uid() and follows them to
 * any device they sign in on. Nothing is kept in localStorage.
 */
export function useVisitorChat(lang: string) {
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  // With no backend there's no session to wait for, so start ready.
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Set when signup succeeded but returned no session, i.e. the project still
  // has "Confirm email" switched on.
  const [awaitingConfirm, setAwaitingConfirm] = useState(false);
  // Set when this account is on the ban list; survives the forced sign-out so
  // the notice stays on screen.
  const [blockedReason, setBlockedReason] = useState<"blocked" | "removed" | null>(
    null,
  );
  const thread = useThread(conversationId, "visitor", true);

  // Ban check on sign-in, plus a live subscription so blocking kicks the user
  // out on the spot. Sign-out is forced; the reason state keeps the notice up.
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !user) return;
    let cancelled = false;

    const kick = (reason: "blocked" | "removed") => {
      if (cancelled) return;
      setBlockedReason(reason);
      setConversationId(null);
      void supabase.auth.signOut();
    };

    (async () => {
      const { data } = await supabase
        .from("blocked_users")
        .select("reason")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data) kick(data.reason);
    })();

    const channel = supabase
      .channel(`blocked:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "blocked_users",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => kick((payload.new as { reason: "blocked" | "removed" }).reason),
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Track the signed-in visitor. Admins and anonymous sessions don't count:
  // the widget should ask them to sign in as a visitor.
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user;
      setUser(u && !u.is_anonymous && u.email ? { id: u.id, email: u.email } : null);
      setAuthReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  // Once signed in, open (or reuse) this account's conversation.
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !user) return;
    let cancelled = false;

    (async () => {
      // Admins land in the inbox, not the visitor thread — don't mint a
      // conversation where the admin chats with themselves.
      const { data: adminFlag } = await supabase.rpc("is_admin");
      if (adminFlag || cancelled) return;

      const { data, error: rpcErr } = await supabase.rpc("start_conversation", {
        p_name: nameFromEmail(user.email),
        p_email: user.email,
        // Stored on the conversation so auto-replies come back in this language.
        p_lang: lang,
      });
      if (cancelled) return;
      if (rpcErr) {
        setError(rpcErr.message);
        return;
      }
      const id = data?.[0]?.out_conversation_id ?? null;
      setConversationId(id);
      if (id) await supabase.rpc("mark_visitor_read", { p_conversation_id: id });
    })();

    return () => {
      cancelled = true;
    };
  }, [user, lang]);

  // Re-stamp the read receipt when a new admin message arrives while the
  // thread is open (keyed on the id, not count — edits shouldn't re-mark).
  const lastIncomingId =
    [...thread.messages].reverse().find((m) => m.sender === "admin")?.id ?? null;
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !conversationId || !lastIncomingId) return;
    void supabase.rpc("mark_visitor_read", { p_conversation_id: conversationId });
  }, [conversationId, lastIncomingId]);

  const signUp = useCallback(async (email: string, password: string) => {
    const supabase = getSupabase();
    if (!supabase) {
      setError("unconfigured");
      return false;
    }
    setLoading(true);
    setError(null);
    setAwaitingConfirm(false);
    const { data, error: authErr } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (authErr) {
      setError(authErr.message);
      return false;
    }
    // No session means the address needs confirming first.
    if (!data.session) {
      setAwaitingConfirm(true);
      return false;
    }
    return true;
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = getSupabase();
    if (!supabase) {
      setError("unconfigured");
      return false;
    }
    setLoading(true);
    setError(null);
    setAwaitingConfirm(false);
    const { error: authErr } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setLoading(false);
    if (authErr) {
      setError(authErr.message);
      return false;
    }
    return true;
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    await supabase.auth.signOut();
    setConversationId(null);
    setError(null);
  }, []);

  /** Open the thread behind an emailed "continue the conversation" link. */
  const claim = useCallback(async (token: string) => {
    const supabase = getSupabase();
    if (!supabase) {
      setError("unconfigured");
      return null;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc("claim_conversation", {
        p_token: token,
      });
      if (rpcError) throw rpcError;
      setConversationId(data);
      return data;
    } catch (e) {
      setError(e instanceof Error ? e.message : "invalid or expired link");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    // Thread surface: messages, reactions, send/edit/remove/react.
    ...thread,
    user,
    authReady,
    conversationId,
    loading,
    awaitingConfirm,
    blockedReason,
    clearBlocked: () => setBlockedReason(null),
    // Auth errors take precedence over in-thread ones.
    error: error ?? thread.error,
    signUp,
    signIn,
    signOut,
    claim,
  };
}

// ------------------------------------------------------------------ admin side

export type AdminSession = {
  ready: boolean;
  isAdmin: boolean;
  email: string | null;
  userId: string | null;
};

export function useAdminSession(enabled: boolean) {
  const [state, setState] = useState<AdminSession>({
    ready: false,
    isAdmin: false,
    email: null,
    userId: null,
  });

  const refresh = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData.session?.user ?? null;
    if (!user || user.is_anonymous) {
      setState({ ready: true, isAdmin: false, email: null, userId: null });
      return;
    }
    // is_admin() is the real gate — the 7-tap only reveals this panel.
    const { data: adminFlag } = await supabase.rpc("is_admin");
    setState({
      ready: true,
      isAdmin: Boolean(adminFlag),
      email: user.email ?? null,
      userId: user.id,
    });
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const supabase = getSupabase();
    if (!supabase) return;
    // onAuthStateChange fires INITIAL_SESSION on subscribe, so this covers the
    // first read as well as later sign-in/sign-out.
    const { data } = supabase.auth.onAuthStateChange(() => {
      void refresh();
    });
    return () => data.subscription.unsubscribe();
  }, [enabled, refresh]);

  const signIn = useCallback(async (email: string, password: string) => {
    const supabase = getSupabase();
    if (!supabase) return "Chat backend is not configured.";
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return error.message;
    await refresh();
    return null;
  }, [refresh]);

  const signOut = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    await supabase.auth.signOut();
    setState({ ready: true, isAdmin: false, email: null, userId: null });
  }, []);

  return { ...state, signIn, signOut, refresh };
}

export function useAdminInbox(active: boolean) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const thread = useThread(selectedId, "admin", active);

  // Conversation list + live updates.
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !active) return;
    let cancelled = false;

    const load = async () => {
      const { data, error: selErr } = await supabase
        .from("conversations")
        .select("*")
        .order("last_message_at", { ascending: false });
      if (cancelled) return;
      if (selErr) setError(selErr.message);
      else setConversations(data ?? []);
    };
    void load();

    const channel = supabase
      .channel("admin:conversations")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "conversations" },
        () => void load(),
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [active]);

  // Clear the admin badge + stamp the read receipt for the open thread,
  // re-stamping when a new visitor message lands while it's open. The local
  // list clears optimistically — the realtime reload confirms it after.
  const lastVisitorMsgId =
    [...thread.messages].reverse().find((m) => m.sender === "visitor")?.id ?? null;
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase || !active || !selectedId) return;
    void supabase
      .from("conversations")
      .update({ unread_for_admin: 0, admin_last_read_at: new Date().toISOString() })
      .eq("id", selectedId)
      .then(({ error: upErr }) => {
        // Surfaced, not swallowed: a silent failure here leaves the badge stuck.
        if (upErr) setError(upErr.message);
      });
  }, [active, selectedId, lastVisitorMsgId]);

  // Opening a thread zeroes its badge locally right away; the DB write above
  // and the realtime reload confirm it.
  const selectConversation = useCallback((id: string | null) => {
    setSelectedId(id);
    if (id) {
      setConversations((prev) =>
        prev.map((c) => (c.id === id ? { ...c, unread_for_admin: 0 } : c)),
      );
    }
  }, []);

  const totalUnread = conversations.reduce((n, c) => n + c.unread_for_admin, 0);

  return {
    ...thread,
    conversations,
    selectedId,
    setSelectedId: selectConversation,
    error: error ?? thread.error,
    totalUnread,
  };
}
