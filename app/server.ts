// Serves the Scientia SPA and reverse-proxies the Supabase APIs on the same
// origin, so the browser talks to one host and no API gateway is needed.
import index from "./index.html";

const upstream = {
  "/auth/v1": process.env.AUTH_URL ?? "http://localhost:9999",
  "/rest/v1": process.env.REST_URL ?? "http://localhost:3001",
  "/storage/v1": process.env.STORAGE_URL ?? "http://localhost:5000",
};
const anonKey = process.env.ANON_KEY ?? "";
const serviceKey = process.env.SERVICE_ROLE_KEY ?? "";

/** Returns the caller's user id if their JWT is valid and they are an admin. */
async function requireAdmin(req: Request): Promise<string | null> {
  const auth = req.headers.get("authorization");
  if (!auth) return null;
  const me = await fetch(`${upstream["/auth/v1"]}/user`, { headers: { authorization: auth, apikey: anonKey } });
  if (!me.ok) return null;
  const { id } = (await me.json()) as { id: string };
  if (!uuid.test(id)) return null;
  const rows = await fetch(`${upstream["/rest/v1"]}/profiles?id=eq.${id}&select=is_admin,deactivated`, {
    headers: { authorization: `Bearer ${serviceKey}`, apikey: serviceKey },
  });
  const [row] = rows.ok ? ((await rows.json()) as { is_admin: boolean; deactivated: boolean }[]) : [];
  return row?.is_admin && !row.deactivated ? id : null;
}

/** Admin: create a user account (email + temporary password). */
async function createUser(req: Request) {
  if (!(await requireAdmin(req))) return Response.json({ error: "Only administrators can create users." }, { status: 403 });
  const { email, password, full_name, role = "student" } = (await req.json()) as { email: string; password: string; full_name: string; role?: string };
  if (!["student", "teacher", "admin"].includes(role)) return Response.json({ error: "Role must be student, teacher or admin." }, { status: 400 });
  if (!email || !password || password.length < 8) return Response.json({ error: "Email and a password of at least 8 characters are required." }, { status: 400 });
  const res = await fetch(`${upstream["/auth/v1"]}/admin/users`, {
    method: "POST",
    headers: { authorization: `Bearer ${serviceKey}`, apikey: serviceKey, "content-type": "application/json" },
    body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { full_name } }),
  });
  const body = (await res.json()) as { id?: string; msg?: string; message?: string; error_description?: string };
  if (!res.ok) {
    const msg = body.msg ?? body.message ?? body.error_description ?? "";
    if (res.status === 422 && /already/i.test(msg)) return Response.json({ error: "An account with this email already exists." }, { status: 409 });
    return Response.json({ error: msg || "Could not create the account. Try again." }, { status: res.status });
  }
  // The role is set with the service key, never from signup metadata (ADR 0006).
  await fetch(`${upstream["/rest/v1"]}/profiles?id=eq.${body.id}`, {
    method: "PATCH",
    headers: { authorization: `Bearer ${serviceKey}`, apikey: serviceKey, "content-type": "application/json" },
    body: JSON.stringify({ role }),
  });
  return Response.json({ id: body.id }, { status: 201 });
}

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Security headers for every response from this origin.
const securityHeaders: Record<string, string> = {
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "x-frame-options": "DENY",
  "content-security-policy":
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' ws: wss:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
};
const withHeaders = (res: Response, extra: Record<string, string> = {}) => {
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries({ ...securityHeaders, ...extra })) headers.set(k, v);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
};

function proxy(prefix: keyof typeof upstream) {
  return async (req: Request) => {
    const url = new URL(req.url);
    // GoTrue admin routes need the service key; refuse anything else before it reaches GoTrue.
    if (prefix === "/auth/v1" && url.pathname.startsWith("/auth/v1/admin") && req.headers.get("authorization") !== `Bearer ${serviceKey}`)
      return Response.json({ error: "Not found" }, { status: 404 });
    const target = upstream[prefix] + url.pathname.slice(prefix.length) + url.search;
    const headers = new Headers(req.headers);
    headers.delete("host");
    headers.set("x-forwarded-host", url.host);
    headers.set("x-forwarded-proto", url.protocol.replace(":", ""));
    const res = await fetch(target, {
      method: req.method,
      headers,
      body: req.method === "GET" || req.method === "HEAD" ? undefined : req.body,
      redirect: "manual",
      decompress: false,
    } as RequestInit);
    // Uploaded files are untrusted: never let them run as a page on this origin.
    const extra: Record<string, string> = prefix === "/storage/v1" ? { "content-security-policy": "sandbox; default-src 'none'" } : {};
    return withHeaders(res, extra);
  };
}

/** Admin: deactivate/reactivate (bans sign-in, keeps data) or set a new password. */
async function updateUser(req: Request & { params: { id: string } }) {
  const adminId = await requireAdmin(req);
  if (!adminId) return Response.json({ error: "Only administrators can change accounts." }, { status: 403 });
  const id = req.params.id;
  if (!uuid.test(id)) return Response.json({ error: "Unknown account." }, { status: 404 });
  const { deactivated, password } = (await req.json()) as { deactivated?: boolean; password?: string };
  if (deactivated !== undefined && id === adminId) return Response.json({ error: "You can't deactivate your own account." }, { status: 400 });
  if (password !== undefined && password.length < 8) return Response.json({ error: "The password must be at least 8 characters." }, { status: 400 });
  const body: Record<string, unknown> = {};
  if (password !== undefined) body.password = password;
  if (deactivated !== undefined) body.ban_duration = deactivated ? "876000h" : "none";
  const res = await fetch(`${upstream["/auth/v1"]}/admin/users/${id}`, {
    method: "PUT",
    headers: { authorization: `Bearer ${serviceKey}`, apikey: serviceKey, "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) return Response.json({ error: "Could not update the account. Try again." }, { status: res.status });
  if (deactivated !== undefined) {
    await fetch(`${upstream["/rest/v1"]}/profiles?id=eq.${id}`, {
      method: "PATCH",
      headers: { authorization: `Bearer ${serviceKey}`, apikey: serviceKey, "content-type": "application/json" },
      body: JSON.stringify({ deactivated }),
    });
  }
  return Response.json({ ok: true });
}

const server = Bun.serve({
  port: Number(process.env.PORT ?? 3000),
  development: process.env.NODE_ENV !== "production",
  routes: {
    "/healthz": new Response("ok"),
    "/config.json": () => Response.json({ anonKey }, { headers: { "cache-control": "no-store" } }),
    "/api/admin/users": { POST: createUser },
    "/api/admin/users/:id": { PATCH: updateUser },
    "/auth/v1/*": proxy("/auth/v1"),
    "/rest/v1/*": proxy("/rest/v1"),
    "/storage/v1/*": proxy("/storage/v1"),
    "/*": index,
  },
});

console.log(`Scientia on ${server.url}`);
if (anonKey.endsWith("2NBkUj6pIlehmICc3ObpZY916qsoIzqcG17aKxiMS8o"))
  console.warn("WARNING: using the public development JWT secret and keys. Set JWT_SECRET, ANON_KEY and SERVICE_ROLE_KEY before exposing Scientia to anyone (see .env.example).");
