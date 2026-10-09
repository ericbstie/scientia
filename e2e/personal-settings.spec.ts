// Settings: notification choices (US-18) and profile and password (US-19).
import { test, expect, reset, users, PASSWORD, type Who } from "./fixtures";
import type { APIRequestContext, Page } from "@playwright/test";

async function login(page: Page, who: Who, password = PASSWORD) {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(users[who].email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Dashboard" })).toBeVisible();
}

async function token(request: APIRequestContext, who: Who, password = PASSWORD) {
  const { anonKey } = await (await request.get("/config.json")).json();
  const res = await request.post("/auth/v1/token?grant_type=password", { headers: { apikey: anonKey }, data: { email: users[who].email, password } });
  return { ok: res.ok(), anonKey, access: res.ok() ? ((await res.json()).access_token as string) : "" };
}

async function rest(request: APIRequestContext, who: Who, path: string, init?: { method?: "POST"; data?: object }) {
  const t = await token(request, who);
  const headers = { apikey: t.anonKey, authorization: `Bearer ${t.access}`, prefer: "return=representation" };
  const res = init?.method === "POST" ? await request.post(`/rest/v1/${path}`, { headers, data: init.data }) : await request.get(`/rest/v1/${path}`, { headers });
  expect(res.ok(), await res.text()).toBe(true);
  return res.json();
}

const KINDS = ["New announcement", "New assignment", "Due date changed", "Grade released", "Replies to me"];

test.describe("Notification settings", () => {
  test.beforeEach(() => reset());

  test("@US-18 five notification types, all on, in Scientia only", async ({ page }) => {
    await login(page, "maya");
    await page.getByRole("button", { name: /account menu/i }).click();
    await page.getByRole("menuitem", { name: "Settings" }).click();
    await expect(page).toHaveURL(/\/settings\/profile$/);
    await page.getByRole("navigation", { name: "Settings" }).getByRole("link", { name: "Notifications" }).click();
    await expect(page).toHaveURL(/\/settings\/notifications$/);
    await expect(page.getByRole("heading", { level: 1, name: "Settings" })).toBeVisible();
    await expect(page.getByText("Notifications appear in Scientia only. No email is sent.")).toBeVisible();
    await expect(page.getByRole("checkbox")).toHaveCount(5);
    for (const k of KINDS) await expect(page.getByRole("checkbox", { name: k })).toBeChecked();
  });

  test("@US-18 a choice is saved and survives a reload", async ({ page }) => {
    await login(page, "maya");
    await page.goto("/settings/notifications");
    await page.getByRole("checkbox", { name: "New announcement" }).uncheck();
    await expect(page.getByRole("status").filter({ hasText: "Saved" })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("checkbox", { name: "New announcement" })).not.toBeChecked();
    await expect(page.getByRole("checkbox", { name: "Grade released" })).toBeChecked();
    await page.getByRole("checkbox", { name: "New announcement" }).check();
    await expect(page.getByRole("status").filter({ hasText: "Saved" })).toBeVisible();
    await page.reload();
    await expect(page.getByRole("checkbox", { name: "New announcement" })).toBeChecked();
  });

  test("@US-18 a switched-off type stops notifications but not the announcement", async ({ page, request }) => {
    await login(page, "maya");
    await page.goto("/settings/notifications");
    await page.getByRole("checkbox", { name: "New announcement" }).uncheck();
    await expect(page.getByRole("status").filter({ hasText: "Saved" })).toBeVisible();

    const [bio] = await rest(request, "ingrid", "courses?code=eq.BIO101&select=id");
    await rest(request, "ingrid", "announcements", { method: "POST", data: { course_id: bio.id, title: "Field trip", body: "Bring boots." } });

    const mayaNotes = await rest(request, "maya", "notifications?select=title");
    expect(mayaNotes.map((n: { title: string }) => n.title)).not.toContain("New announcement: Field trip");
    const mayaAnnouncements = await rest(request, "maya", "announcements?select=title");
    expect(mayaAnnouncements.map((a: { title: string }) => a.title)).toContain("Field trip");
    const liamNotes = await rest(request, "liam", "notifications?select=title");
    expect(liamNotes.map((n: { title: string }) => n.title)).toContain("New announcement: Field trip");
  });

  test("@US-18 teachers see the same five types", async ({ page }) => {
    await login(page, "ingrid");
    await page.goto("/settings/notifications");
    await expect(page.getByRole("checkbox")).toHaveCount(5);
  });
});

test.describe("Profile", () => {
  test.beforeEach(() => reset());
  // reset() does not restore passwords, so put Maya's back if a test changed it.
  test.afterEach(async ({ request }) => {
    const changed = await token(request, "maya", "Maya-new-pass-1");
    if (changed.ok) await request.put("/auth/v1/user", { headers: { apikey: changed.anonKey, authorization: `Bearer ${changed.access}` }, data: { password: PASSWORD } });
  });

  test("@US-19 email is shown and cannot be edited", async ({ page }) => {
    await login(page, "maya");
    await page.goto("/settings/profile");
    await expect(page.getByRole("heading", { level: 1, name: "Settings" })).toBeVisible();
    const email = page.getByLabel("Email");
    await expect(email).toHaveValue(users.maya.email);
    await expect(email).not.toBeEditable();
    await expect(page.getByText("At least 8 characters")).toBeVisible();
  });

  test("@US-19 a new display name shows in the top bar and on replies", async ({ page, request }) => {
    await login(page, "maya");
    await page.goto("/settings/profile");
    await page.getByLabel("Display name").fill("Maya O. Okafor");
    await page.getByRole("button", { name: "Save name" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Saved" })).toBeVisible();
    await expect(page.getByRole("banner")).toContainText("Maya O. Okafor");
    await page.reload();
    await expect(page.getByRole("banner")).toContainText("Maya O. Okafor");

    const replies = await rest(request, "liam", "replies?select=body,profiles(full_name)&body=eq.Thanks,%20I%20wondered%20too.");
    expect(replies[0].profiles.full_name).toBe("Maya O. Okafor");
  });

  test("@US-19 an empty display name is refused", async ({ page }) => {
    await login(page, "maya");
    await page.goto("/settings/profile");
    await page.getByLabel("Display name").fill("   ");
    await page.getByRole("button", { name: "Save name" }).click();
    await expect(page.getByText("Enter a display name.")).toBeVisible();
    await expect(page.getByRole("banner")).toContainText("Maya Okafor");
  });

  test("@US-19 a wrong current password changes nothing", async ({ page, request }) => {
    await login(page, "maya");
    await page.goto("/settings/profile");
    await page.getByLabel("Current password").fill("not-my-password");
    await page.getByLabel("New password").fill("Maya-new-pass-1");
    await page.getByRole("button", { name: "Change password" }).click();
    await expect(page.getByText("Current password is incorrect")).toBeVisible();
    expect((await token(request, "maya")).ok).toBe(true);
    expect((await token(request, "maya", "Maya-new-pass-1")).ok).toBe(false);
  });

  test("@US-19 a short new password is refused", async ({ page, request }) => {
    await login(page, "maya");
    await page.goto("/settings/profile");
    await page.getByLabel("Current password").fill(PASSWORD);
    await page.getByLabel("New password").fill("1234567");
    await page.getByRole("button", { name: "Change password" }).click();
    await expect(page.getByText("Password must be at least 8 characters")).toBeVisible();
    expect((await token(request, "maya")).ok).toBe(true);
  });

  test("@US-19 the new password works at the next sign-in", async ({ page }) => {
    await login(page, "maya");
    await page.goto("/settings/profile");
    await page.getByLabel("Current password").fill(PASSWORD);
    await page.getByLabel("New password").fill("Maya-new-pass-1");
    await page.getByRole("button", { name: "Change password" }).click();
    await expect(page.getByRole("status").filter({ hasText: "Password changed" })).toBeVisible();

    await page.getByRole("button", { name: /account menu/i }).click();
    await page.getByRole("menuitem", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/sign-in/);
    await login(page, "maya", "Maya-new-pass-1");
    await expect(page.getByRole("banner")).toContainText(users.maya.name);
  });
});
