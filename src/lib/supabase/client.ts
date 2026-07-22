"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient<Database> | null = null;

/**
 * Returns null when the env vars are absent, so the site still builds and runs
 * (chat just degrades to unavailable) before Supabase is wired up.
 */
export function getSupabase(): SupabaseClient<Database> | null {
  if (!url || !anonKey) return null;
  if (!client) {
    client = createClient<Database>(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        // Opt-in for auth.signInWithPasskey() / auth.registerPasskey().
        experimental: { passkey: true },
      },
    });
  }
  return client;
}

export const isSupabaseConfigured = Boolean(url && anonKey);
