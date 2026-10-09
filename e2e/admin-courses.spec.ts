import { test, expect, reset, signIn, token, users, PASSWORD } from "./fixtures";
import type { Page } from "@playwright/test";

test.beforeEach(() => reset());

async function openCourses(page: Page) {
  await signIn(page, "admin");
  await page.getByRole("navigation", { name: "Admin" }).getByRole("link", { name: "Courses" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Courses" })).toBeVisible();
}

test("@US-42 admin creates a course and assigns its teacher", async ({ page }) => {
  await openCourses(page);
  await expect(page.getByRole("row", { name: /BIO101/ })).toContainText("Dr. Ingrid Solberg");
  await page.getByRole("button", { name: "New course" }).click();
  const dialog = page.getByRole("dialog", { name: "New course" });
  await dialog.getByLabel("Code").fill("CHE110");
  await dialog.getByLabel("Title").fill("General Chemistry");
  await dialog.getByLabel("Teacher").selectOption({ label: users.ingrid.name });
  await dialog.getByRole("button", { name: "Save" }).click();
  const row = page.getByRole("row", { name: /CHE110/ });
  await expect(row).toBeVisible();
  await expect(row).toContainText("General Chemistry");
  await expect(row).toContainText(users.ingrid.name);
});

// Needs the Dashboard, Modules and Assignments slices.
test("@US-42 the assigned teacher sees the new course", async ({ page, browser }) => {
  await openCourses(page);
  await page.getByRole("button", { name: "New course" }).click();
  const dialog = page.getByRole("dialog", { name: "New course" });
  await dialog.getByLabel("Code").fill("CHE110");
  await dialog.getByLabel("Title").fill("General Chemistry");
  await dialog.getByLabel("Teacher").selectOption({ label: users.ingrid.name });
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("row", { name: /CHE110/ })).toBeVisible();

  const ctx = await browser.newContext();
  const p = await ctx.newPage();
  await p.goto("/sign-in");
  await p.getByLabel("Email").fill(users.ingrid.email);
  await p.getByLabel("Password").fill(PASSWORD);
  await p.getByRole("button", { name: "Sign in" }).click();
  const card = p.getByRole("link", { name: "General Chemistry" });
  await expect(card).toBeVisible();
  await expect(p.getByText("0 students")).toBeVisible();
  await card.click();
  const nav = p.getByRole("navigation", { name: "Course" });
  await expect(nav.getByRole("link")).toHaveText(["CHE110General Chemistry", "Home", "Modules", "Assignments", "Announcements", "Discussions", "Grading", "Gradebook", "People"]);
  await nav.getByRole("link", { name: "Modules" }).click();
  await expect(p.getByText("No modules yet")).toBeVisible();
  await expect(p.getByRole("button", { name: "Add module" }).first()).toBeVisible();
  await nav.getByRole("link", { name: "Assignments" }).click();
  await expect(p.getByText("No assignments yet")).toBeVisible();
  await expect(p.getByRole("link", { name: "New assignment" }).or(p.getByRole("button", { name: "New assignment" })).first()).toBeVisible();
  await ctx.close();
});

test("@US-42 duplicate code and missing teacher are rejected", async ({ page }) => {
  await openCourses(page);
  await expect(page.getByRole("row", { name: /HIS201/ })).toBeVisible();
  const before = await page.getByRole("table").getByRole("row").count();
  await page.getByRole("button", { name: "New course" }).click();
  const dialog = page.getByRole("dialog", { name: "New course" });
  await dialog.getByLabel("Code").fill("BIO101");
  await dialog.getByLabel("Title").fill("Duplicate");
  await dialog.getByLabel("Teacher").selectOption({ label: users.ingrid.name });
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(dialog.getByText("A course with this code already exists")).toBeVisible();

  await dialog.getByLabel("Code").fill("CHE110");
  await dialog.getByLabel("Teacher").selectOption({ label: "Select a teacher" });
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(dialog.getByText("Choose a teacher")).toBeVisible();
  await expect(dialog.getByLabel("Teacher")).toHaveAccessibleDescription(/Choose a teacher$/);
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByRole("table").getByRole("row")).toHaveCount(before);
  await expect(page.getByRole("row", { name: /CHE110/ })).toHaveCount(0);
});

test("@US-42 admin adds a student to an existing course", async ({ page, browser }) => {
  await openCourses(page);
  await page.getByRole("row", { name: /HIS201/ }).getByRole("link", { name: "People in HIS201" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "People" })).toBeVisible();
  await page.getByRole("button", { name: "Add student" }).first().click();
  const dialog = page.getByRole("dialog", { name: "Add student" });
  await dialog.getByLabel("Email").fill(users.sofia.email);
  await dialog.getByRole("button", { name: "Add student" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Sofia Reyes added" })).toBeVisible();

  await page.goto("/admin/courses");
  await expect(page.getByRole("row", { name: /HIS201/ }).getByRole("cell").nth(2)).toHaveText("3");

  const ctx = await browser.newContext();
  const p = await ctx.newPage();
  await p.goto("/sign-in");
  await p.getByLabel("Email").fill(users.sofia.email);
  await p.getByLabel("Password").fill(PASSWORD);
  await p.getByRole("button", { name: "Sign in" }).click();
  await expect(p.getByRole("region", { name: "Your courses" }).getByRole("link", { name: /HIS201/ })).toBeVisible();
  await ctx.close();
});

test("@US-44 admin renames a course", async ({ page }) => {
  await openCourses(page);
  await page.getByRole("button", { name: "Edit HIS201" }).click();
  const dialog = page.getByRole("dialog", { name: "Edit HIS201" });
  await expect(dialog.getByLabel("Teacher")).toHaveValue(/.+/);
  await dialog.getByLabel("Title").fill("Modern European History, 1789–1918");
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("status").filter({ hasText: "HIS201 saved" })).toBeVisible();
  await expect(page.getByRole("row", { name: /HIS201/ })).toContainText("Modern European History, 1789–1918");

  await page.getByRole("button", { name: "Edit HIS201" }).click();
  await dialog.getByLabel("Code").fill("BIO101");
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(dialog.getByText("A course with this code already exists")).toBeVisible();
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByRole("row", { name: /HIS201/ })).toBeVisible();
});

test("@US-44 admin hands a course to another teacher", async ({ page, browser }) => {
  const tomas = { email: "tomas.lind@scientia.test", password: "Start-pass-1", full_name: "Tomas Lind", role: "teacher" };
  const created = await page.request.post("/api/admin/users", { headers: (await token(page.request, "admin")).headers, data: tomas });
  expect(created.status()).toBe(201);

  await openCourses(page);
  await page.getByRole("button", { name: "Edit BIO101" }).click();
  const dialog = page.getByRole("dialog", { name: "Edit BIO101" });
  await dialog.getByLabel("Teacher").selectOption({ label: "Tomas Lind" });
  await dialog.getByRole("button", { name: "Save" }).click();
  await expect(page.getByRole("status").filter({ hasText: "BIO101 saved" })).toBeVisible();
  const row = page.getByRole("row", { name: /BIO101/ });
  await expect(row).toContainText("Tomas Lind");
  await expect(row).not.toContainText(users.ingrid.name);
  await expect(row.getByRole("cell").nth(2)).toHaveText("4");

  const ctx = await browser.newContext();
  const p = await ctx.newPage();
  await p.goto("/sign-in");
  await p.getByLabel("Email").fill(tomas.email);
  await p.getByLabel("Password").fill(tomas.password);
  await p.getByRole("button", { name: "Sign in" }).click();
  const courses = p.getByRole("region", { name: "Your courses" });
  await expect(courses.getByRole("link", { name: "Introduction to Biology" })).toBeVisible();
  await signIn(p, "ingrid");
  await expect(courses.getByRole("link", { name: "Modern European History" })).toBeVisible();
  await expect(courses.getByRole("link", { name: "Introduction to Biology" })).toHaveCount(0);
  await ctx.close();
});
