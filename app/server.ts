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
const service = { authorization: `Bearer ${serviceKey}`, apikey: serviceKey, "content-type": "application/json" };
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const roles = ["student", "teacher", "admin"];

const error = (message: string, status: number) => Response.json({ error: message }, { status });
const asService = (url: string, method: string, body: unknown) => fetch(url, { method, headers: service, body: JSON.stringify(body) });
const patchProfile = (id: string, body: Record<string, unknown>) => asService(`${upstream["/rest/v1"]}/profiles?id=eq.${id}`, "PATCH", body);

/** Returns the caller's user id if their JWT is valid and they are an admin. */
async function requireAdmin(req: Request): Promise<string | null> {
  const auth = req.headers.get("authorization");
  if (!auth) return null;
  const me = await fetch(`${upstream["/auth/v1"]}/user`, { headers: { authorization: auth, apikey: anonKey } });
  if (!me.ok) return null;
  const { id } = (await me.json()) as { id: string };
  if (!uuid.test(id)) return null;
  const rows = await fetch(`${upstream["/rest/v1"]}/profiles?id=eq.${id}&select=is_admin,deactivated`, { headers: service });
  const [row] = rows.ok ? ((await rows.json()) as { is_admin: boolean; deactivated: boolean }[]) : [];
  return row?.is_admin && !row.deactivated ? id : null;
}

/** Admin: create a user account (email + temporary password). */
async function createUser(req: Request) {
  if (!(await requireAdmin(req))) return error("Only administrators can create users.", 403);
  const { email, password, full_name, role = "student" } = (await req.json()) as { email: string; password: string; full_name: string; role?: string };
  if (!roles.includes(role)) return error("Role must be student, teacher or admin.", 400);
  if (!email || !password || password.length < 8) return error("Email and a password of at least 8 characters are required.", 400);
  const res = await asService(`${upstream["/auth/v1"]}/admin/users`, "POST", { email, password, email_confirm: true, user_metadata: { full_name } });
  const body = (await res.json()) as { id?: string; msg?: string; message?: string; error_description?: string };
  if (!res.ok) {
    const msg = body.msg ?? body.message ?? body.error_description ?? "";
    if (res.status === 422 && /already/i.test(msg)) return error("An account with this email already exists.", 409);
    return error(msg || "Could not create the account. Try again.", res.status);
  }
  // The role is set with the service key, never from signup metadata (ADR 0006).
  if (!(await patchProfile(body.id!, { role })).ok) return error("The account was created, but its role could not be set. Change it in the list.", 502);
  return Response.json({ id: body.id }, { status: 201 });
}

/** Admin: change role, deactivate/reactivate (bans sign-in, keeps data) or set a new password. */
async function updateUser(req: Request & { params: { id: string } }) {
  const adminId = await requireAdmin(req);
  if (!adminId) return error("Only administrators can change accounts.", 403);
  const id = req.params.id;
  if (!uuid.test(id)) return error("Unknown account.", 404);
  const { deactivated, password, role } = (await req.json()) as { deactivated?: boolean; password?: string; role?: string };
  if (deactivated !== undefined && id === adminId) return error("You can't deactivate your own account.", 400);
  if (role !== undefined && id === adminId) return error("You can't change your own role.", 400);
  if (role !== undefined && !roles.includes(role)) return error("Role must be student, teacher or admin.", 400);
  if (password !== undefined && password.length < 8) return error("The password must be at least 8 characters.", 400);
  const failed = (res: Response) => error("Could not update the account. Try again.", res.status);
  if (password !== undefined || deactivated !== undefined) {
    const res = await asService(`${upstream["/auth/v1"]}/admin/users/${id}`, "PUT", {
      password,
      ban_duration: deactivated === undefined ? undefined : deactivated ? "876000h" : "none",
    });
    if (!res.ok) return failed(res);
  }
  if (role !== undefined || deactivated !== undefined) {
    const res = await patchProfile(id, { role, deactivated });
    if (!res.ok) return failed(res);
  }
  return Response.json({ ok: true });
}

// Security headers for every response from this origin.
const securityHeaders: Record<string, string> = {
  "x-content-type-options": "nosniff",
  "referrer-policy": "strict-origin-when-cross-origin",
  "x-frame-options": "DENY",
  "content-security-policy":
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' ws: wss:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
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
      return withHeaders(error("Not found", 404));
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

// Bun serves the bundled page without a way to add headers, so it sits on a private path
// and every page request fetches it from there and adds the security headers.
const pagePath = `/_page/${crypto.randomUUID()}`;

const server = Bun.serve({
  port: Number(process.env.PORT ?? 3000),
  // No hot module reload: its bundler breaks on a circular import inside @digdir/designsystemet-react. `bun --hot` still restarts on change.
  development: process.env.NODE_ENV === "production" ? false : { hmr: false },
  routes: {
    "/healthz": () => withHeaders(new Response("ok")),
    "/config.json": () => withHeaders(Response.json({ anonKey, demo: process.env.SEED_DEMO !== "false" }, { headers: { "cache-control": "no-store" } })),
    "/api/admin/users": { POST: async (req) => withHeaders(await createUser(req)) },
    "/api/admin/users/:id": { PATCH: async (req) => withHeaders(await updateUser(req)) },
    "/auth/v1/*": proxy("/auth/v1"),
    "/rest/v1/*": proxy("/rest/v1"),
    "/storage/v1/*": proxy("/storage/v1"),
    [pagePath as "/_page"]: index,
    "/*": async (_req, srv) => withHeaders(await fetch(new URL(pagePath, srv.url))),
  },
});

console.log(`Scientia on ${server.url}`);
if (anonKey.endsWith("2NBkUj6pIlehmICc3ObpZY916qsoIzqcG17aKxiMS8o"))
  console.warn("WARNING: using the public development JWT secret and keys. Set JWT_SECRET, ANON_KEY and SERVICE_ROLE_KEY before exposing Scientia to anyone (see .env.example).");
