import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient;

/** Loads runtime config from the server and creates the Supabase client (same origin). */
export async function initSupabase() {
  const { anonKey } = await (await fetch("/config.json")).json();
  client = createClient(window.location.origin, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, storageKey: "scientia-auth" },
  });
  return client;
}

export const db = () => client;

/** Throws on Supabase errors so callers can use plain try/catch. */
export function must<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}
