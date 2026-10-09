import { test, expect, reset, users, PASSWORD, type Who } from "./fixtures";
import type { Page } from "@playwright/test";

// e2e/fixtures.ts signIn() visits /signin, which is not a route (the app uses /sign-in); local copy until the fixture is fixed.
async function signIn(page: Page, who: Who, password = PASSWORD) {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(users[who].email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("banner")).toContainText(users[who].name);
}
async function signOut(page: Page) {
  await page.getByRole("button", { name: /account menu/i }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await page.waitForURL(/\/sign-in/);
}

test.beforeEach(() => reset());

async function openUsers(page: Page) {
  await signIn(page, "admin");
  await expect(page.getByRole("heading", { level: 1, name: "Users" })).toBeVisible();
}
const userRows = (page: Page) => page.getByRole("table").getByRole("row").filter({ has: page.getByRole("rowheader") });
const rowOf = (page: Page, name: string) => userRows(page).filter({ hasText: name });

async function newUser(page: Page, f: { name: string; email: string; role?: string; password: string }) {
  await page.getByRole("button", { name: "New user" }).click();
  const dialog = page.getByRole("dialog", { name: "New user" });
  await dialog.getByLabel("Name").fill(f.name);
  await dialog.getByLabel("Email").fill(f.email);
  if (f.role) await dialog.getByLabel("Role").selectOption(f.role);
  await dialog.getByLabel("Password").fill(f.password);
  await dialog.getByRole("button", { name: "Save" }).click();
  return dialog;
}

async function tryLogin(browser: import("@playwright/test").Browser, email: string, password: string) {
  const ctx = await browser.newContext();
  const p = await ctx.newPage();
  await p.goto("/sign-in");
  await p.getByLabel("Email").fill(email);
  await p.getByLabel("Password").fill(password);
  await p.getByRole("button", { name: "Sign in" }).click();
  return { p, ctx };
}

test("@US-38 admin lands on the Users table with seven accounts and can search and filter", async ({ page }) => {
  await openUsers(page);
  await expect(page.getByRole("navigation", { name: "Admin" })).toBeVisible();
  await expect(userRows(page)).toHaveCount(7);
  const expected: [Who, string][] = [["admin", "admin"], ["ingrid", "teacher"], ["maya", "student"], ["liam", "student"], ["sofia", "student"], ["noah", "student"], ["priya", "student"]];
  for (const [who, role] of expected) {
    const row = rowOf(page, users[who].name);
    await expect(row).toHaveCount(1);
    const cells = row.getByRole("cell");
    await expect(cells.nth(0)).toHaveText(users[who].email);
    await expect(cells.nth(1)).toHaveText(role);
    await expect(cells.nth(2)).toHaveText("Active");
  }

  await page.getByLabel("Search").fill("okafor");
  await expect(userRows(page)).toHaveCount(1);
  await expect(userRows(page).first()).toContainText("Maya Okafor");

  await page.getByLabel("Search").fill("");
  await page.getByLabel("Role").selectOption("teacher");
  await expect(userRows(page)).toHaveCount(1);
  await expect(userRows(page).first()).toContainText("Dr. Ingrid Solberg");

  await page.getByLabel("Search").fill("zzzz");
  await expect(page.getByText("No users match your search.")).toBeVisible();
});

test("@US-39 admin creates a user", async ({ page }) => {
  await openUsers(page);
  await newUser(page, { name: "Eva Lund", email: "eva.lund@scientia.test", role: "student", password: "Start-pass-1" });
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(userRows(page)).toHaveCount(8);
  const eva = rowOf(page, "Eva Lund");
  await expect(eva.getByRole("cell").nth(1)).toHaveText("student");
  await expect(eva.getByRole("cell").nth(2)).toHaveText("Active");

});

// Needs the Dashboard slice for the empty-state text.
test("@US-39 a new user signs in and sees the empty dashboard", async ({ page, browser }) => {
  await openUsers(page);
  await newUser(page, { name: "Eva Lund", email: "eva.lund@scientia.test", role: "student", password: "Start-pass-1" });
  await expect(rowOf(page, "Eva Lund")).toBeVisible();
  const { p, ctx } = await tryLogin(browser, "eva.lund@scientia.test", "Start-pass-1");
  await expect(p.getByRole("banner")).toContainText("Eva Lund");
  await expect(p.getByText("You are not enrolled in any course yet.")).toBeVisible();
  await expect(p.locator(".course-card")).toHaveCount(0);
  await ctx.close();
});

test("@US-39 duplicate email and invalid fields are rejected", async ({ page }) => {
  await openUsers(page);
  const dialog = await newUser(page, { name: "Maya Two", email: users.maya.email, password: "Start-pass-1" });
  await expect(dialog.getByText("An account with this email already exists")).toBeVisible();
  await expect(dialog.getByLabel("Email")).toBeFocused();
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(userRows(page)).toHaveCount(7);

  await newUser(page, { name: "Eva Lund", email: "eva.lund", password: "short12" });
  await expect(dialog.getByText("Enter a valid email address")).toBeVisible();
  await expect(dialog.getByText("Password must be at least 8 characters")).toBeVisible();
  await expect(dialog.getByLabel("Email")).toHaveAccessibleDescription(/Enter a valid email address/);
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(userRows(page)).toHaveCount(7);
});

test("@US-40 admin deactivates and reactivates a user", async ({ page, browser }) => {
  await openUsers(page);
  const priya = rowOf(page, "Priya Nair");
  await priya.getByRole("button", { name: /Deactivate/ }).click();
  const confirm = page.getByRole("dialog", { name: "Deactivate Priya Nair?" });
  await expect(confirm.getByRole("button", { name: "Cancel" })).toBeFocused();
  await confirm.getByRole("button", { name: "Deactivate" }).click();
  await expect(priya.getByRole("cell").nth(2)).toHaveText("Deactivated");

  const { p, ctx } = await tryLogin(browser, users.priya.email, PASSWORD);
  await expect(p.getByRole("alert")).toHaveText("This account is deactivated. Contact your administrator.");
  await expect(p).toHaveURL(/\/sign-in/);

  await priya.getByRole("button", { name: /Reactivate/ }).click();
  await expect(priya.getByRole("cell").nth(2)).toHaveText("Active");
  await p.getByRole("button", { name: "Sign in" }).click();
  await expect(p).not.toHaveURL(/\/sign-in/);
  await expect(p.getByRole("banner")).toContainText("Priya Nair");
  await ctx.close();

  const own = rowOf(page, "Alex Admin");
  await expect(own.getByRole("button", { name: /Deactivate/ })).toBeDisabled();
  await expect(own).toContainText("You can't deactivate yourself");
});

test("@US-41 admin resets a password", async ({ page, browser }) => {
  await openUsers(page);
  const liam = rowOf(page, "Liam Hansen");

  // Too short: rejected, old password still works.
  await liam.getByRole("button", { name: /Reset password/ }).click();
  let dialog = page.getByRole("dialog", { name: /Reset password/ });
  await dialog.getByLabel("New password").fill("short12");
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(dialog.getByText("Password must be at least 8 characters")).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel" }).click();

  let t = await tryLogin(browser, users.liam.email, PASSWORD);
  await expect(t.p.getByRole("banner")).toContainText("Liam Hansen");
  await t.ctx.close();

  await liam.getByRole("button", { name: /Reset password/ }).click();
  dialog = page.getByRole("dialog", { name: /Reset password/ });
  await dialog.getByLabel("New password").fill("Reset-pass-9");
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("status")).toContainText("Password reset for Liam Hansen");

  t = await tryLogin(browser, users.liam.email, PASSWORD);
  await expect(t.p.getByRole("alert")).toHaveText("Email or password is incorrect.");
  await t.ctx.close();
  t = await tryLogin(browser, users.liam.email, "Reset-pass-9");
  await expect(t.p.getByRole("banner")).toContainText("Liam Hansen");
  await t.ctx.close();
});

test("@US-43 admin area is closed to other roles", async ({ page }) => {
  await signIn(page, "admin");
  const adminLink = page.getByRole("banner").getByRole("link", { name: "Admin" });
  const adminUrl = new URL(await adminLink.evaluate((a) => (a as HTMLAnchorElement).href)).pathname;
  await signOut(page);

  await signIn(page, "maya");
  await expect(page.getByRole("banner").getByRole("link", { name: "Admin" })).toHaveCount(0);
  await page.goto(adminUrl);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("You don't have access");
  await expect(page.getByRole("banner").getByRole("link", { name: "Admin" })).toHaveCount(0);
  await signOut(page);

  await signIn(page, "ingrid");
  await page.goto(adminUrl);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("You don't have access");
});

test("@US-43 gradebook, grading and data API are closed to students", async ({ page }) => {
  const { anonKey } = await (await page.request.get("/config.json")).json();
  async function token(who: Who) {
    const r = await page.request.post("/auth/v1/token?grant_type=password", { headers: { apikey: anonKey }, data: { email: users[who].email, password: PASSWORD } });
    return (await r.json()).access_token as string;
  }
  const ingridToken = await token("ingrid");
  const courses = await (await page.request.get("/rest/v1/courses?code=eq.BIO101&select=id", { headers: { apikey: anonKey, authorization: `Bearer ${ingridToken}` } })).json();
  const bio = courses[0].id as string;

  await signIn(page, "maya");
  for (const path of ["gradebook", "grading"]) {
    await page.goto(`/courses/${bio}/${path}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("You don't have access");
    const text = await page.getByRole("main").innerText();
    for (const s of ["Hansen", "Reyes", "72", "Released"]) expect(text).not.toContain(s);
  }

  const headers = { apikey: anonKey, authorization: `Bearer ${await token("maya")}` };
  const body = await (await page.request.get("/rest/v1/profiles?select=email,full_name", { headers })).text();
  for (const s of ["liam.hansen@", "sofia.reyes@", "noah.berg@", "priya.nair@", "ingrid.solberg@", "admin@"]) expect(body).not.toContain(s);

  const create = await page.request.post("/api/admin/users", { headers, data: { email: "x@scientia.test", password: "Start-pass-1", full_name: "X" } });
  expect(create.status()).toBe(403);
  expect(await create.text()).toBe('{"error":"Only administrators can create users."}');
});
