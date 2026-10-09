import type { Page } from "@playwright/test";
import { test, expect, reset, signIn, api, coursePath } from "./fixtures";

const courseNav = (page: Page) => page.getByRole("navigation", { name: "Course" });
const studentItems = ["Home", "Modules", "Assignments", "Announcements", "Discussions", "Grades", "People"];

test.describe("Course layout and people", () => {
  test.beforeEach(() => reset());

  test("@US-5 every course has the same navigation and Maya's BIO101 home shows announcements and the next two due", async ({ page }) => {
    await signIn(page, "maya");
    const bio = await coursePath(page, "BIO101");
    const his = await coursePath(page, "HIS201");

    await page.goto(bio);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Introduction to Biology");
    await expect(courseNav(page).getByRole("link", { name: /^(Home|Modules|Assignments|Announcements|Discussions|Grades|People)$/ })).toHaveText(studentItems);
    await expect(courseNav(page).locator('[aria-current="page"]')).toHaveText("Home");

    const anns = page.getByRole("region", { name: "Announcements" });
    await expect(anns.getByRole("listitem").first()).toContainText("Welcome to BIO101");
    await expect(anns.getByRole("listitem").first()).toContainText("Pinned");
    await expect(anns.getByRole("listitem").filter({ hasText: "Lab report 1 marking update" })).toContainText("Unread");
    const due = page.getByRole("region", { name: "Next due" });
    await expect(due.getByRole("listitem")).toHaveCount(2);
    await expect(due.getByRole("listitem").nth(0)).toContainText("Photosynthesis worksheet");
    await expect(due.getByRole("listitem").nth(0)).toContainText("Not submitted");
    await expect(due.getByRole("listitem").nth(1)).toContainText("Field journal");

    await page.goto(his);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Modern European History");
    await expect(courseNav(page).getByRole("link", { name: /^(Home|Modules|Assignments|Announcements|Discussions|Grades|People)$/ })).toHaveText(studentItems);
    await courseNav(page).getByRole("link", { name: "People" }).click();
    await expect(courseNav(page).locator('[aria-current="page"]')).toHaveText("People");
  });

  test("@US-5 Maya sees the roster by name and role without emails", async ({ page }) => {
    await signIn(page, "maya");
    await page.goto(await coursePath(page, "BIO101"));
    await courseNav(page).getByRole("link", { name: "People" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("People");
    const rows = page.getByRole("listitem").and(page.locator(".row"));
    await expect(page.getByRole("region", { name: "Teachers" })).toContainText("Dr. Ingrid Solberg");
    await expect(page.getByRole("region", { name: "Teachers" })).toContainText("Teacher");
    const students = page.getByRole("region", { name: "4 students" }).getByRole("listitem");
    await expect(students).toHaveText([/Noah Berg/, /Liam Hansen/, /Maya Okafor/, /Sofia Reyes/]);
    await expect(rows.first()).toBeVisible();
    expect(await page.locator("main").innerText()).not.toContain("@scientia.test");
    await expect(page.getByRole("button", { name: "Add student" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Remove" })).toHaveCount(0);
  });

  test("@US-20 course home: skip link, landmarks, headings and visible focus", async ({ page }) => {
    await signIn(page, "maya");
    await page.goto(await coursePath(page, "BIO101"));
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await page.locator("body").press("Tab");
    const skip = page.getByRole("link", { name: "Skip to main content" });
    await expect(skip).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("main")).toBeFocused();

    await expect(page.getByRole("banner")).toHaveCount(1);
    await expect(page.getByRole("main")).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    const labels = await page.getByRole("navigation").evaluateAll((els) => els.map((e) => e.getAttribute("aria-label")));
    expect(labels.every(Boolean)).toBe(true);
    expect(new Set(labels).size).toBe(labels.length);

    // Every interactive control in the page content is at least 24 by 24 px and shows a focus outline.
    const controls = page.locator("main a[href]:visible, main button:visible");
    const count = await controls.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      const box = await controls.nth(i).boundingBox();
      expect(box!.width).toBeGreaterThanOrEqual(24);
      expect(box!.height).toBeGreaterThanOrEqual(24);
    }
    await page.keyboard.press("Tab");
    const outline = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      const s = getComputedStyle(el);
      return { width: parseFloat(s.outlineWidth), style: s.outlineStyle };
    });
    expect(outline.style).not.toBe("none");
    expect(outline.width).toBeGreaterThanOrEqual(2);
  });

  test("@US-34 Ingrid sees the BIO101 roster with emails, sorted by last name", async ({ page }) => {
    await signIn(page, "ingrid");
    const bio = await coursePath(page, "BIO101");
    await page.goto(`${bio}/people`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("People");
    await expect(page.getByRole("region", { name: "Teachers" })).toContainText("Dr. Ingrid Solberg");
    const students = page.getByRole("region", { name: "4 students" }).getByRole("listitem");
    await expect(students).toHaveText([
      /Noah Berg.*noah\.berg@scientia\.test/,
      /Liam Hansen.*liam\.hansen@scientia\.test/,
      /Maya Okafor.*maya\.okafor@scientia\.test/,
      /Sofia Reyes.*sofia\.reyes@scientia\.test/,
    ]);

    await page.goto(`${await coursePath(page, "HIS201")}/people`);
    const his = page.getByRole("region", { name: "2 students" }).getByRole("listitem");
    await expect(his).toHaveText([/Liam Hansen/, /Maya Okafor/]);
  });

  test("@US-35 Ingrid adds a student by email, with clear errors", async ({ page }) => {
    await signIn(page, "ingrid");
    const bio = await coursePath(page, "BIO101");
    await page.goto(`${bio}/people`);
    const students = page.getByRole("region", { name: /\d students?/ });

    // Unknown address, already enrolled, and a non-student account leave the roster unchanged.
    const attempts: [string, string][] = [
      ["nobody@scientia.test", "No Scientia account uses this email. Ask an administrator to create one."],
      ["maya.okafor@scientia.test", "Maya Okafor is already in this course."],
      ["admin@scientia.test", "Only student accounts can be added to a course."],
    ];
    await page.getByRole("button", { name: "Add student" }).first().click();
    const dialog = page.getByRole("dialog", { name: "Add student" });
    for (const [email, message] of attempts) {
      await dialog.getByLabel("Email").fill(email);
      await dialog.getByRole("button", { name: "Add student" }).click();
      const field = dialog.getByLabel("Email");
      await expect(dialog.locator(".error-text")).toHaveText(message);
      await expect(field).toHaveAttribute("aria-describedby", /error/);
    }
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(page.getByRole("region", { name: "4 students" })).toBeVisible();

    // Enter adds one address; Shift+Enter starts a new line in the same box. Emails match case-insensitively.
    await page.getByRole("button", { name: "Add student" }).first().click();
    const box = dialog.getByLabel("Email");
    await box.fill("one@scientia.test");
    await box.press("Shift+Enter");
    await expect(box).toHaveValue("one@scientia.test\n");
    await box.fill("PRIYA.NAIR@scientia.test");
    await box.press("Enter");
    await expect(page.getByRole("region", { name: "5 students" })).toContainText("Priya Nair");
    await expect(students).toHaveCount(1);

    // Priya now has the course, with its upcoming work on the course home.
    await signIn(page, "priya");
    const rows = (await api(page, "/rest/v1/courses?select=code")).data;
    expect(rows.map((r: { code: string }) => r.code)).toEqual(["BIO101"]);
    await page.goto(bio);
    const due = page.getByRole("region", { name: "Next due" });
    await expect(due).toContainText("Photosynthesis worksheet");
    await expect(due).toContainText("Field journal");
  });

  test("@US-35 a pasted list is checked as a whole: every problem is listed and nobody is added until Ingrid says so", async ({ page }) => {
    await signIn(page, "ingrid");
    await page.goto(`${await coursePath(page, "HIS201")}/people`);
    await page.getByRole("button", { name: "Add student" }).first().click();
    const dialog = page.getByRole("dialog", { name: "Add student" });
    const field = dialog.getByLabel("Email");
    const problems = "nobody@scientia.test: No Scientia account uses this email. Ask an administrator to create one. maya.okafor@scientia.test: Maya Okafor is already in this course.";
    await field.fill("sofia.reyes@scientia.test, noah.berg@scientia.test\nnobody@scientia.test\npriya.nair@scientia.test\nmaya.okafor@scientia.test");
    await dialog.getByRole("button", { name: "Add student" }).click();
    await expect(dialog.locator(".error-text")).toHaveText(`Nothing was added. ${problems}`);
    await expect(page.getByRole("region", { name: "2 students" })).toBeVisible();

    await dialog.getByRole("button", { name: "Add the other 3" }).click();
    await expect(page.getByRole("status").filter({ hasText: "3 students added" })).toBeVisible();
    await expect(page.getByRole("region", { name: "5 students" }).getByRole("listitem")).toHaveText([/Noah Berg/, /Liam Hansen/, /Priya Nair/, /Maya Okafor/, /Sofia Reyes/]);
    await expect(field).toHaveValue("nobody@scientia.test\nmaya.okafor@scientia.test");
    await expect(dialog.locator(".error-text")).toHaveText(problems);
    await expect(dialog.getByRole("button", { name: /Add the other/ })).toHaveCount(0);
  });

  test("@US-36 Ingrid removes Sofia, who then loses access, and adds her back", async ({ page }) => {
    await signIn(page, "sofia");
    const bio = await coursePath(page, "BIO101");
    const before = (await api(page, "/rest/v1/submissions?select=id")).data;
    expect(before).toHaveLength(1);

    await signIn(page, "ingrid");
    await page.goto(`${bio}/people`);
    const sofia = page.getByRole("listitem").filter({ hasText: "Sofia Reyes" });
    await sofia.getByRole("button", { name: "Remove" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading")).toContainText("Sofia Reyes");
    await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();
    await dialog.getByRole("button", { name: "Remove" }).click();
    await expect(page.getByRole("region", { name: "3 students" })).toBeVisible();
    await expect(page.getByText("Sofia Reyes")).toHaveCount(0);
    // Her ungraded Lab report 1 leaves every "need grading" count, not only the queue.
    await page.goto("/");
    await expect(page.locator(".course-card", { hasText: "BIO101" })).toContainText("1 need grading");
    await page.goto(bio);
    await expect(page.getByRole("link", { name: "1 need grading" })).toBeVisible();

    await signIn(page, "sofia");
    await page.goto(bio);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("You don't have access to this course");
    expect((await api(page, "/rest/v1/courses?select=id")).data).toEqual([]);

    await signIn(page, "ingrid");
    await page.goto(`${bio}/people`);
    await page.getByRole("button", { name: "Add student" }).first().click();
    await page.getByRole("dialog").getByLabel("Email").fill("sofia.reyes@scientia.test");
    await page.getByRole("dialog").getByRole("button", { name: "Add student" }).click();
    await expect(page.getByRole("region", { name: "4 students" })).toContainText("Sofia Reyes");

    // Her work is kept, so the Gradebook shows her Lab report 1 again.
    await signIn(page, "sofia");
    expect((await api(page, "/rest/v1/submissions?select=id")).data).toHaveLength(1);
  });
});
