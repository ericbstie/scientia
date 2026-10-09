// Serves the Scientia SPA and reverse-proxies the Supabase APIs on the same
// origin, so the browser talks to one host and no API gateway is needed.
import index from "./index.html";

const upstream = {
  "/auth/v1": process.env.AUTH_URL ?? "http://localhost:9999",
  "/rest/v1": process.env.REST_URL ?? "http://localhost:3001",
  "/storage/v1": process.env.STORAGE_URL ?? "http://localhost:5000",
};
const anonKey = process.env.ANON_KEY ?? "";

function proxy(prefix: keyof typeof upstream) {
  return async (req: Request) => {
    const url = new URL(req.url);
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
    return new Response(res.body, { status: res.status, statusText: res.statusText, headers: res.headers });
  };
}

const server = Bun.serve({
  port: Number(process.env.PORT ?? 3000),
  development: process.env.NODE_ENV !== "production",
  routes: {
    "/healthz": new Response("ok"),
    "/config.json": () => Response.json({ anonKey }, { headers: { "cache-control": "no-store" } }),
    "/auth/v1/*": proxy("/auth/v1"),
    "/rest/v1/*": proxy("/rest/v1"),
    "/storage/v1/*": proxy("/storage/v1"),
    "/*": index,
  },
});

console.log(`Scientia on ${server.url}`);
