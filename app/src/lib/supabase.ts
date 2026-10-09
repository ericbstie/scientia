// The three Supabase clients the app uses (auth, data, files), without realtime and
// edge functions, which the bundled supabase-js client would otherwise ship.
import { AuthClient } from "@supabase/auth-js";
import { PostgrestClient } from "@supabase/postgrest-js";
import { StorageClient } from "@supabase/storage-js";

type Client = { auth: InstanceType<typeof AuthClient>; from: PostgrestClient["from"]; rpc: PostgrestClient["rpc"]; storage: StorageClient };
let client: Client;
let demo = false;

/** Loads runtime config from the server and creates the clients (same origin). */
export async function initSupabase() {
  const { anonKey, demo: showDemo } = await (await fetch("/config.json")).json();
  demo = showDemo === true;
  const api = window.location.origin;
  const keys = { apikey: anonKey, Authorization: `Bearer ${anonKey}` };
  const auth = new AuthClient({ url: `${api}/auth/v1`, headers: keys, storageKey: "scientia-auth", persistSession: true, autoRefreshToken: true });
  // Data and file requests carry the signed-in user's token (the anon key when signed out).
  const authed = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    headers.set("apikey", anonKey);
    if (!headers.has("Authorization")) headers.set("Authorization", `Bearer ${(await auth.getSession()).data.session?.access_token ?? anonKey}`);
    return fetch(input, { ...init, headers });
  }) as typeof fetch;
  const rest = new PostgrestClient(`${api}/rest/v1`, { fetch: authed });
  client = { auth, from: rest.from.bind(rest), rpc: rest.rpc.bind(rest), storage: new StorageClient(`${api}/storage/v1`, {}, authed) };
}

export const db = () => client;
/** True when the server was started with SEED_DEMO (not "false"): the sign-in page lists the demo accounts. */
export const isDemo = () => demo;

/** Throws on Supabase errors so callers can use plain try/catch. */
export function must<T>(res: { data: T; error: { message: string } | null }): T {
  if (res.error) throw new Error(res.error.message);
  return res.data;
}

/** Ids in URLs are checked before querying, so a mistyped link shows "not found" instead of an error. */
export const isUuid = (s: string | undefined): s is string => /^[0-9a-f-]{36}$/i.test(s ?? "");

/** Largest file a teacher or student can upload (the storage service allows more). */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
