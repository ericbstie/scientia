import { test, expect, reset, signIn, signOut, token, client, users, PASSWORD, type Who } from "./fixtures";
import type { Page } from "@playwright/test";

test.beforeEach(() => reset());

async function openUsers(page: Page) {
  await signIn(page, "admin");
  await expect(page.getByRole("heading", { level: 1, name: "Users" })).toBeVisible();
}
const userRows = (page: Page) => page.getByRole("table", { name: "Users" }).getByRole("row").filter({ has: page.getByRole("rowheader") });
const rowOf = (page: Page, name: string) => userRows(page).filter({ hasText: name });

async function newUser(page: Page, f: { name: string; email: string; role?: string; password: string }) {
  await page.getByRole("button", { name: "New user" }).click();
  const dialog = page.getByRole("dialog", { name: "New user" });
  await dialog.getByLabel("Name").fill(f.name);
  await dialog.getByLabel("Email").fill(f.email);
  if (f.role) await dialog.getByLabel("Role").selectOption(f.role);
  await dialog.getByLabel("Password", { exact: true }).fill(f.password);
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
  // An admin has no courses, due work or notifications, so the top bar holds only what they use.
  await expect(page.getByRole("navigation", { name: "Main" }).getByRole("link")).toHaveText(["Users", "Courses"]);
  await expect(userRows(page)).toHaveCount(7);
  const expected: [Who, string][] = [["admin", "admin"], ["ingrid", "teacher"], ["maya", "student"], ["liam", "student"], ["sofia", "student"], ["noah", "student"], ["priya", "student"]];
  for (const [who, role] of expected) {
    const row = rowOf(page, users[who].name);
    await expect(row).toHaveCount(1);
    const cells = row.getByRole("cell");
    await expect(cells.nth(0)).toHaveText(users[who].email);
    if (who === "admin") await expect(cells.nth(1)).toHaveText(role); // your own role is not editable
    else await expect(cells.nth(1).getByRole("combobox", { name: `Role for ${users[who].name}` })).toHaveValue(role);
    await expect(cells.nth(2)).toHaveText("Active");
  }

  await page.getByLabel("Search").fill("okafor");
  await expect(userRows(page)).toHaveCount(1);
  await expect(userRows(page).first()).toContainText("Maya Okafor");

  await page.getByLabel("Search").fill("");
  await page.getByLabel("Show role").selectOption("teacher");
  await expect(userRows(page)).toHaveCount(1);
  await expect(userRows(page).first()).toContainText("Dr. Ingrid Solberg");

  await page.getByLabel("Search").fill("zzzz");
  await expect(page.getByText("No users match your search")).toBeVisible();
});

test("@US-39 admin creates a user", async ({ page }) => {
  await openUsers(page);
  await newUser(page, { name: "Eva Lund", email: "eva.lund@scientia.test", role: "student", password: "Start-pass-1" });
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(userRows(page)).toHaveCount(8);
  const eva = rowOf(page, "Eva Lund");
  await expect(page.getByRole("status").filter({ hasText: "Eva Lund added as a student" })).toBeVisible();
  await expect(eva.getByRole("combobox", { name: "Role for Eva Lund" })).toHaveValue("student");
  await expect(eva.getByRole("cell").nth(2)).toHaveText("Active");
});

test("@US-39 the new password is masked until shown and says what happens to it", async ({ page }) => {
  await openUsers(page);
  await page.getByRole("button", { name: "New user" }).click();
  const dialog = page.getByRole("dialog", { name: "New user" });
  const password = dialog.getByLabel("Password", { exact: true });
  await expect(dialog).toContainText("It works straight away and stays until it is changed under Settings. Nothing is sent: give it to the person yourself.");
  await password.fill("Start-pass-1");
  await expect(password).toHaveAttribute("type", "password");
  await page.getByLabel("Show password").check();
  await expect(password).toHaveAttribute("type", "text");
  await expect(password).toHaveValue("Start-pass-1");
});

test("@US-39 admin corrects the role of an account", async ({ page }) => {
  await openUsers(page);
  await newUser(page, { name: "Tomas Lind", email: "tomas.lind@scientia.test", password: "Start-pass-1" });
  await expect(page.getByRole("dialog")).toBeHidden();
  await rowOf(page, "Tomas Lind").getByRole("combobox", { name: "Role for Tomas Lind" }).selectOption("teacher");
  await expect(page.getByRole("status").filter({ hasText: "Tomas Lind is now a teacher" })).toBeVisible();
  await page.reload();
  await expect(rowOf(page, "Tomas Lind").getByRole("combobox", { name: "Role for Tomas Lind" })).toHaveValue("teacher");
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Courses" }).click();
  await page.getByRole("button", { name: "New course" }).click();
  await expect(page.getByRole("dialog").getByLabel("Teacher").locator("option", { hasText: "Tomas Lind" })).toHaveCount(1);
});

test("@US-39 a new user signs in and sees the empty dashboard", async ({ page, browser }) => {
  await openUsers(page);
  await newUser(page, { name: "Eva Lund", email: "eva.lund@scientia.test", role: "student", password: "Start-pass-1" });
  await expect(rowOf(page, "Eva Lund")).toBeVisible();
  const { p, ctx } = await tryLogin(browser, "eva.lund@scientia.test", "Start-pass-1");
  await expect(p.getByRole("banner")).toContainText("Eva Lund");
  await expect(p.getByText("No courses yet")).toBeVisible();
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
  await expect(dialog.locator(".error-text", { hasText: "Enter a valid email address" })).toBeVisible();
  await expect(dialog.locator(".error-text", { hasText: "Password must be at least 8 characters" })).toBeVisible();
  await expect(dialog.getByLabel("Email")).toHaveAccessibleDescription(/Enter a valid email address/);
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(userRows(page)).toHaveCount(7);
});

async function importFile(page: Page, lines: string[]) {
  await page.getByRole("button", { name: "Import users" }).click();
  const dialog = page.getByRole("dialog", { name: "Import users" });
  await dialog.getByLabel("CSV file").setInputFiles({ name: "people.csv", mimeType: "text/csv", buffer: Buffer.from(lines.join("\r\n")) });
  return dialog;
}

test("@US-46 admin previews a CSV file and adds the ready rows", async ({ page }) => {
  await openUsers(page);
  const dialog = await importFile(page, [
    "name,email,role,password",
    '"Berg, Astrid",astrid.berg@scientia.test,,Welcome-2026',
    "Jonas Holm,Jonas.Holm@scientia.test,Teacher,Welcome-2026",
    "No Email,not-an-email,student,Welcome-2026",
    `Maya Again,${users.maya.email},student,Welcome-2026`,
    "Jonas Twin,jonas.holm@scientia.test,student,Welcome-2026",
    "Head Teacher,head@scientia.test,principal,Welcome-2026",
    "Short Pass,short@scientia.test,student,abc",
  ]);
  await expect(dialog.getByText("2 ready to add. 5 with problems will be skipped:")).toBeVisible();
  const skipped = [
    "Row 4, not-an-email: Enter a valid email address",
    `Row 5, ${users.maya.email}: An account with this email already exists`,
    "Row 6, jonas.holm@scientia.test: Same email as row 3",
    "Row 7, head@scientia.test: Role must be student, teacher or admin",
    "Row 8, short@scientia.test: Password must be at least 8 characters",
  ];
  await expect(dialog.getByRole("listitem")).toHaveText(skipped);
  const preview = dialog.getByRole("table", { name: "Ready to add" }).getByRole("row");
  await expect(preview.filter({ hasText: "Berg, Astrid" })).toContainText("astrid.berg@scientia.teststudent");
  await expect(preview.filter({ hasText: "Jonas Holm" })).toContainText("jonas.holm@scientia.testteacher");
  await expect(userRows(page)).toHaveCount(7);

  await dialog.getByRole("button", { name: "Add 2 users" }).click();
  await expect(page.getByRole("status").filter({ hasText: "2 users added" })).toBeVisible();
  await expect(dialog.getByText("2 added. These rows were not added:")).toBeVisible();
  await expect(dialog.getByRole("listitem")).toHaveText(skipped);
  await dialog.getByRole("button", { name: "Close" }).click();
  await expect(userRows(page)).toHaveCount(9);
  await expect(rowOf(page, "Berg, Astrid").getByRole("combobox")).toHaveValue("student");
  await expect(rowOf(page, "Jonas Holm").getByRole("combobox")).toHaveValue("teacher");

  const { anonKey } = await (await page.request.get("/config.json")).json();
  const astrid = await page.request.post("/auth/v1/token?grant_type=password", { headers: { apikey: anonKey }, data: { email: "astrid.berg@scientia.test", password: "Welcome-2026" } });
  expect(astrid.ok(), "Astrid signs in with the password from the file").toBe(true);
});

test("@US-46 a file without the needed columns is refused; semicolons work like commas", async ({ page }) => {
  await openUsers(page);
  const dialog = await importFile(page, ["first name,last name,email", "Astrid,Berg,astrid.berg@scientia.test"]);
  await expect(dialog.getByText("The first row must name the columns name, email and password. A role column is optional.")).toBeVisible();
  await expect(dialog.getByRole("button", { name: /^Add/ })).toHaveCount(0);

  await dialog.getByLabel("CSV file").setInputFiles({ name: "people.csv", mimeType: "text/csv", buffer: Buffer.from("Name;Email;Password\nAstrid Berg;astrid.berg@scientia.test;Welcome-2026\n") });
  await expect(dialog.getByText("1 ready to add.")).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Add 1 user" })).toBeVisible();
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
  await expect(own).toContainText("You can't deactivate your own account");
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
  await expect(dialog).toContainText("The new password works straight away and stays until it is changed under Settings. Nothing is sent: give it to Liam Hansen yourself.");
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
  const adminLink = page.getByRole("banner").getByRole("link", { name: "Users" });
  const adminUrl = new URL(await adminLink.evaluate((a) => (a as HTMLAnchorElement).href)).pathname;
  await signOut(page);

  await signIn(page, "maya");
  await expect(page.getByRole("banner").getByRole("link", { name: "Users" })).toHaveCount(0);
  await page.goto(adminUrl);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("You don't have access");
  await expect(page.getByRole("banner").getByRole("link", { name: "Users" })).toHaveCount(0);
  await signOut(page);

  await signIn(page, "ingrid");
  await page.goto(adminUrl);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("You don't have access");
});

test("@US-43 gradebook, grading and data API are closed to students", async ({ page }) => {
  const [{ id: bio }] = await (await client(page.request, "ingrid")).get("courses?code=eq.BIO101&select=id");

  await signIn(page, "maya");
  for (const path of ["gradebook", "grading"]) {
    await page.goto(`/courses/${bio}/${path}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("You don't have access");
    const text = await page.getByRole("main").innerText();
    for (const s of ["Hansen", "Reyes", "72", "Released"]) expect(text).not.toContain(s);
  }

  const { headers } = await token(page.request, "maya");
  const body = await (await page.request.get("/rest/v1/profiles?select=email,full_name", { headers })).text();
  for (const s of ["liam.hansen@", "sofia.reyes@", "noah.berg@", "priya.nair@", "ingrid.solberg@", "admin@"]) expect(body).not.toContain(s);

  const create = await page.request.post("/api/admin/users", { headers, data: { email: "x@scientia.test", password: "Start-pass-1", full_name: "X" } });
  expect(create.status()).toBe(403);
  expect(await create.text()).toBe('{"error":"Only administrators can create users."}');
});
