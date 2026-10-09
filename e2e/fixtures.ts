// Shared e2e helpers. Every spec imports { test, expect } from here.
//  - reset(): restores the documented demo data (docs/stories/README.md). Call it
//    in beforeEach of any spec that changes data.
//  - signIn(page, who): signs in (replacing any signed-in user) and opens the dashboard.
//    It uses the auth API, not the form, which auth.spec.ts covers.
//  - api(page, path), openCourse(page, code, path), coursePath(page, code): data API
//    calls and course pages as the signed-in user.
//  - token(request, who), client(request, who): sign in through the auth API and call
//    the data API, for checks without a page.
//  - Every test fails if the security policy blocked anything on the page. At the end
//    of every passing test the page gets an axe accessibility scan and fails if it
//    scrolls sideways at phone width. Results feed `mise run metrics`.
import { test as base, expect, type APIRequestContext, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { appendFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

export const PASSWORD = "Demo-pass-123";
export const users = {
  admin: { email: "admin@scientia.test", name: "Alex Admin" },
  ingrid: { email: "ingrid.solberg@scientia.test", name: "Dr. Ingrid Solberg" },
  maya: { email: "maya.okafor@scientia.test", name: "Maya Okafor" },
  liam: { email: "liam.hansen@scientia.test", name: "Liam Hansen" },
  sofia: { email: "sofia.reyes@scientia.test", name: "Sofia Reyes" },
  noah: { email: "noah.berg@scientia.test", name: "Noah Berg" },
  priya: { email: "priya.nair@scientia.test", name: "Priya Nair" },
} as const;
export type Who = keyof typeof users;

export function reset() {
  execFileSync("bun", ["run", "supabase/reset.ts"], { stdio: "pipe" });
}

export async function signIn(page: Page, who: Who, password = PASSWORD) {
  const { ok, session } = await token(page.request, who, password);
  expect(ok, `sign in as ${who}`).toBe(true);
  if (!page.url().startsWith("http")) await page.goto("/config.json");
  await page.evaluate((s) => localStorage.setItem("scientia-auth", s), JSON.stringify(session));
  await page.goto("/");
  await expect(page.getByRole("button", { name: /account menu/i })).toBeVisible();
  await expect(page.getByRole("main").getByRole("heading", { level: 1 })).toBeVisible();
}

export async function signOut(page: Page) {
  await page.getByRole("button", { name: /account menu/i }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await page.waitForURL(/\/sign-in/);
}

/** Calls the data API from the page as the signed-in user; `data` is the parsed JSON body, if any. */
export async function api(page: Page, path: string, init: { method?: string; body?: unknown } = {}) {
  return page.evaluate(async ({ path, method, body }) => {
    const { anonKey } = await (await fetch("/config.json")).json();
    const token = JSON.parse(localStorage.getItem("scientia-auth")!).access_token;
    const headers = { apikey: anonKey, authorization: `Bearer ${token}`, "content-type": "application/json" };
    const res = await fetch(path, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
    const text = await res.text();
    let data = null;
    try { data = JSON.parse(text); } catch {}
    return { status: res.status, text, data };
  }, { path, ...init });
}

export async function coursePath(page: Page, code: string) {
  const [course] = (await api(page, `/rest/v1/courses?select=id&code=eq.${code}`)).data;
  return `/courses/${course.id}`;
}

/** Opens a course page, e.g. openCourse(page, "BIO101", "/grading"), and returns the course id. */
export async function openCourse(page: Page, code: string, path = "") {
  const base = await coursePath(page, code);
  await page.goto(base + path);
  await expect(page.getByRole("navigation", { name: "Course" })).toBeVisible();
  return base.slice("/courses/".length);
}

/** Signs in through the auth API; `headers` authorise data API requests as that user. */
export async function token(request: APIRequestContext, who: Who, password = PASSWORD) {
  const { anonKey } = await (await request.get("/config.json")).json();
  const res = await request.post("/auth/v1/token?grant_type=password", { headers: { apikey: anonKey }, data: { email: users[who].email, password } });
  const body = res.ok() ? await res.json() : null;
  return {
    ok: res.ok(),
    session: body,
    anonKey: anonKey as string,
    id: body?.user.id as string,
    headers: { apikey: anonKey, authorization: `Bearer ${body?.access_token}`, prefer: "return=representation" },
  };
}

/** Data API calls as a user, each expected to succeed (see "Data API checks" in docs/stories/README.md). */
export async function client(request: APIRequestContext, who: Who) {
  const { ok, headers } = await token(request, who);
  expect(ok, `sign in as ${who}`).toBe(true);
  const call = async (method: string, path: string, data?: object) => {
    const r = await request.fetch(`/rest/v1/${path}`, { method, headers, data });
    expect(r.ok(), `${path}: ${await r.text()}`).toBe(true);
    return r.json();
  };
  return { get: (path: string) => call("GET", path), post: (path: string, data: object) => call("POST", path, data), patch: (path: string, data: object) => call("PATCH", path, data) };
}

async function scan(page: Page) {
  if (page.isClosed() || !page.url().startsWith("http")) return;
  await page.waitForLoadState("networkidle").catch(() => {});
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  const line = {
    url: page.url(),
    test: base.info().title,
    violations: results.violations.map((v) => ({ id: v.id, impact: v.impact ?? "minor", nodes: v.nodes.length, help: v.help, targets: v.nodes.slice(0, 3).map((n) => n.target.join(" ")) })),
    overflow: await phoneOverflow(page),
  };
  appendFileSync("e2e/.results/a11y.jsonl", JSON.stringify(line) + "\n");
  return line;
}

/** At phone width the page itself must not scroll sideways (tables may, inside .table-wrap). Returns the widest offender, or null. */
async function phoneOverflow(page: Page) {
  const size = page.viewportSize();
  await page.setViewportSize({ width: 390, height: 844 });
  const found = await page.evaluate(() => {
    const root = document.documentElement;
    if (root.scrollWidth <= root.clientWidth) return null;
    const el = [...document.body.querySelectorAll<HTMLElement>("*")].find(
      (e) => e.getBoundingClientRect().right > root.clientWidth + 1 && !e.closest(".table-wrap") && getComputedStyle(e).position !== "fixed",
    );
    const name = el ? el.tagName.toLowerCase() + [...el.classList].map((c) => `.${c}`).join("") : "unknown element";
    return `${name} "${(el?.textContent ?? "").trim().slice(0, 40)}" makes the page ${root.scrollWidth}px wide`;
  });
  if (size) await page.setViewportSize(size);
  return found;
}

export const test = base.extend<{ autoScan: void }>({
  autoScan: [
    async ({ page }, use) => {
      const blocked: string[] = [];
      page.on("console", (m) => { if (m.type() === "error" && m.text().includes("Content Security Policy")) blocked.push(m.text().slice(0, 120)); });
      await use();
      if (base.info().status !== "passed") return;
      expect(blocked, "the security policy blocked part of the page").toEqual([]);
      const line = await scan(page);
      expect(line?.overflow ?? null, `${line?.url} scrolls sideways at 390 px wide`).toBeNull();
    },
    { auto: true },
  ],
});

export { expect };
