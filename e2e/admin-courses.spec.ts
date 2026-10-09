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
  const card = p.getByRole("link", { name: /CHE110/ }).first();
  await expect(card).toBeVisible();
  await expect(p.getByText("0 students")).toBeVisible();
  await card.click();
  const nav = p.getByRole("navigation", { name: "Course" });
  await expect(nav.getByRole("link")).toHaveText(["CHE110General Chemistry", "Home", "Modules", "Assignments", "Announcements", "Discussions", "Grading", "Gradebook", "People"]);
  await nav.getByRole("link", { name: "Modules" }).click();
  await expect(p.getByText("No modules yet")).toBeVisible();
  await expect(p.getByRole("button", { name: "Add module" })).toBeVisible();
  await nav.getByRole("link", { name: "Assignments" }).click();
  await expect(p.getByText("No assignments yet")).toBeVisible();
  await expect(p.getByRole("link", { name: "New assignment" }).or(p.getByRole("button", { name: "New assignment" }))).toBeVisible();
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
  await expect(dialog.getByLabel("Teacher")).toHaveAccessibleDescription("Choose a teacher");
  await dialog.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByRole("table").getByRole("row")).toHaveCount(before);
  await expect(page.getByRole("row", { name: /CHE110/ })).toHaveCount(0);
});
