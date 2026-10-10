// Dashboard (US-3, US-4, US-22), calendar (US-14) and the phone layout of the personal pages (US-21).
import { test, expect, reset, signIn, users, PASSWORD } from "./fixtures";
import type { Page } from "@playwright/test";

/** The date "T+Nd 23:59 UTC" for the moment t0, as the stories define it. */
const dueAt = (t0: number, days: number) => {
  const d = new Date(t0);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + days, 23, 59));
};
const isoDay = (d: Date) => d.toISOString().slice(0, 10);
function fmtDate(d: Date) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).formatToParts(d).map((x) => [x.type, x.value]));
  const year = d.getUTCFullYear() === new Date().getUTCFullYear() ? "" : ` ${p.year}`;
  return `${p.weekday} ${p.day} ${p.month}${year}`;
}
const fmtDue = (d: Date) => `${fmtDate(d)}, 23:59`;

test.describe("Dashboard", () => {
  let t0 = 0;
  test.beforeEach(() => {
    t0 = Date.now();
    reset();
  });

  test("@US-3 student sees everything due across courses, soonest first", async ({ page }) => {
    await signIn(page, "maya");
    const upcoming = page.getByRole("region", { name: "Upcoming" });
    const rows = upcoming.getByRole("listitem");
    await expect(rows).toHaveCount(4);
    const expected: [string, string, string, number][] = [
      ["Photosynthesis worksheet", "BIO101", "50 points", 2],
      ["Essay: the 1848 revolutions", "HIS201", "100 points", 5],
      ["Field journal", "BIO101", "100 points", 21],
      ["Source analysis", "HIS201", "50 points", 30],
    ];
    for (const [i, [title, code, points, days]] of expected.entries()) {
      await expect(rows.nth(i)).toContainText(title);
      await expect(rows.nth(i)).toContainText(code);
      await expect(rows.nth(i)).toContainText(points);
      await expect(rows.nth(i)).toContainText(fmtDue(dueAt(t0, days)));
    }
    await expect(upcoming.getByText("Final project")).toHaveCount(0);
  });

  test("@US-3 statuses and opening an assignment from its row", async ({ page }) => {
    await signIn(page, "liam");
    const rows = page.getByRole("region", { name: "Upcoming" }).getByRole("listitem");
    await expect(rows.filter({ hasText: "Photosynthesis worksheet" })).toContainText("Submitted");
    await expect(rows.filter({ hasText: "Photosynthesis worksheet" })).not.toContainText("Not submitted");
    await expect(rows.filter({ hasText: "Essay: the 1848 revolutions" })).toContainText("Not submitted");

    await page.getByRole("link", { name: "Photosynthesis worksheet" }).click();
    await expect(page).toHaveURL(/\/courses\/[0-9a-f-]+\/assignments\/[0-9a-f-]+$/);
  });

  test("@US-4 missing work is shown apart from upcoming work", async ({ page }) => {
    await signIn(page, "noah");
    const rows = page.getByRole("region", { name: "Missing" }).getByRole("listitem");
    await expect(rows).toHaveCount(2);
    await expect(rows.nth(0)).toContainText("Lab report 1");
    await expect(rows.nth(0)).toContainText("BIO101");
    await expect(rows.nth(0)).toContainText(fmtDue(dueAt(t0, -7)));
    await expect(rows.nth(0)).toContainText("Missing");
    await expect(rows.nth(0).getByRole("link", { name: "Submit", exact: true })).toBeVisible();
    await expect(rows.nth(1)).toContainText("Safety acknowledgement");
    await expect(rows.nth(1)).toContainText(fmtDue(dueAt(t0, -14)));
    await expect(rows.nth(1)).toContainText("Closed");
    await expect(rows.nth(1).getByRole("link", { name: "Submit", exact: true })).toHaveCount(0);

    const upcoming = page.getByRole("region", { name: "Upcoming" }).getByRole("listitem");
    await expect(upcoming.nth(0)).toContainText("Photosynthesis worksheet");
    await expect(upcoming.nth(1)).toContainText("Field journal");
    await expect(page.getByRole("region", { name: "Upcoming" })).not.toContainText("Lab report 1");
    await expect(page.getByRole("region", { name: "Upcoming" })).not.toContainText("Safety acknowledgement");

    await rows.nth(0).getByRole("link", { name: "Submit", exact: true }).click();
    await expect(page).toHaveURL(/\/courses\/[0-9a-f-]+\/assignments\/[0-9a-f-]+$/);
  });

  test("@US-4 nothing missing", async ({ page }) => {
    await signIn(page, "maya");
    await expect(page.getByRole("region", { name: "Missing" })).toContainText("Nothing missing");
  });

  test("@US-3 student lists their courses", async ({ page }) => {
    await signIn(page, "maya");
    const courses = page.getByRole("region", { name: "Your courses" });
    await expect(courses.getByRole("link", { name: "Introduction to Biology" })).toBeVisible();
    await expect(courses.getByRole("link", { name: "Modern European History" })).toBeVisible();
    await courses.getByRole("link", { name: "Modern European History" }).click();
    await expect(page).toHaveURL(/\/courses\/[0-9a-f-]+$/);
  });

  test("@US-22 teacher starts from a dashboard of courses and grading work", async ({ page }) => {
    await signIn(page, "ingrid");
    const bio = page.locator(".course-card", { hasText: "BIO101" });
    const his = page.locator(".course-card", { hasText: "HIS201" });
    await expect(bio).toContainText("4 students");
    await expect(bio).toContainText("2 need grading");
    await expect(his).toContainText("2 students");
    await expect(his).toContainText("0 need grading");

    await bio.getByRole("link", { name: "2 need grading" }).click();
    await expect(page).toHaveURL(/\/courses\/[0-9a-f-]+\/grading\?status=needs-grading$/);

    await page.goto("/");
    await page.locator(".course-card", { hasText: "HIS201" }).getByRole("link", { name: "Modern European History" }).click();
    const nav = page.getByRole("navigation", { name: "Course" });
    await expect(nav.getByRole("listitem")).toHaveText(["Home", "Modules", "Assignments", "Announcements", "Discussions", "Grading", "Gradebook", "People"]);
  });

  test("@US-22 an administrator is sent to the user list", async ({ page }) => {
    await page.goto("/sign-in");
    await page.getByLabel("Email").fill(users.admin.email);
    await page.getByLabel("Password").fill(PASSWORD);
    await page.getByRole("button", { name: "Sign in" }).click();
    await expect(page).toHaveURL(/\/admin\/users$/);
  });
});

test.describe("Calendar", () => {
  let t0 = 0;
  test.beforeEach(() => {
    t0 = Date.now();
    reset();
  });

  async function cellFor(page: Page, days: number) {
    const cell = page.locator(`td[data-date="${isoDay(dueAt(t0, days))}"]`);
    await expect(page.locator("table.cal-grid")).toBeVisible();
    await page.getByRole("button", { name: "Today" }).click();
    for (let i = 0; i < 4 && !(await cell.isVisible()); i++) await page.getByRole("button", { name: "Next month" }).click();
    await expect(cell).toBeVisible();
    return cell;
  }

  test("@US-14 month view opens on the current month with today marked", async ({ page }) => {
    await signIn(page, "maya");
    await page.getByRole("banner").getByRole("link", { name: "Calendar" }).click();
    await expect(page.getByRole("heading", { level: 1, name: "Calendar" })).toBeVisible();
    const today = page.locator('td[aria-current="date"]');
    await expect(today).toHaveCount(1);
    await expect(today).toHaveAttribute("data-date", isoDay(new Date(t0)));
    await expect(today).toContainText("Today");
    await expect(page.getByRole("heading", { level: 2 })).toHaveText(new Date(t0).toLocaleString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }));
  });

  test("@US-14 due dates appear on their day and open the assignment", async ({ page }) => {
    await signIn(page, "maya");
    await page.goto("/calendar");
    await expect(await cellFor(page, 2)).toContainText("BIO101 Photosynthesis worksheet");
    await expect(await cellFor(page, 5)).toContainText("HIS201 Essay: the 1848 revolutions");
    const journal = await cellFor(page, 21);
    await expect(journal).toContainText("BIO101 Field journal");

    await journal.getByRole("link", { name: "BIO101 Field journal" }).click();
    await expect(page).toHaveURL(/\/courses\/[0-9a-f-]+\/assignments\/[0-9a-f-]+$/);
  });

  test("@US-14 Previous month and Today move around the calendar", async ({ page }) => {
    await signIn(page, "maya");
    await page.goto("/calendar");
    const heading = page.getByRole("heading", { level: 2 });
    const first = await heading.textContent();
    await page.getByRole("button", { name: "Next month" }).click();
    await expect(heading).not.toHaveText(first!);
    await expect(page.locator('td[aria-current="date"]')).toHaveCount(0);
    await page.getByRole("button", { name: "Previous month" }).click();
    await expect(heading).toHaveText(first!);
    await page.getByRole("button", { name: "Previous month" }).click();
    await page.getByRole("button", { name: "Today" }).click();
    await expect(heading).toHaveText(first!);
    await expect(page.locator('td[aria-current="date"]')).toHaveCount(1);
  });

  test("@US-14 a month without deadlines says so", async ({ page }) => {
    await signIn(page, "maya");
    await page.goto("/calendar");
    for (let i = 0; i < 6; i++) await page.getByRole("button", { name: "Previous month" }).click();
    await expect(page.getByText("Nothing due this month")).toBeVisible();
  });
});

test.describe("Phone layout", () => {
  test.use({ viewport: { width: 390, height: 844 } });
  let t0 = 0;
  test.beforeEach(() => {
    t0 = Date.now();
    reset();
  });

  // The page content must fit. (The document-level check is the fixme test below.)
  const noHorizontalScroll = async (page: Page) =>
    expect(await page.evaluate(() => { const m = document.getElementById("main")!; return m.scrollWidth === m.clientWidth; })).toBe(true);

  test("@US-21 the dashboard fits a phone and lists the same four items in the same order", async ({ page }) => {
    await signIn(page, "maya");
    await noHorizontalScroll(page);
    const rows = page.getByRole("region", { name: "Upcoming" }).getByRole("listitem");
    await expect(rows).toHaveCount(4);
    for (const [i, title] of ["Photosynthesis worksheet", "Essay: the 1848 revolutions", "Field journal", "Source analysis"].entries()) {
      await expect(rows.nth(i)).toContainText(title);
    }
    await expect(rows.nth(0)).toContainText(fmtDue(dueAt(t0, 2)));
    // The title keeps its width beside the date and status (it was once squeezed to 40 px).
    const widths = await rows.locator(".row-title").evaluateAll((els) => els.map((e) => e.getBoundingClientRect().width));
    expect(Math.min(...widths)).toBeGreaterThan(200);
  });

  test("@US-21 the course home and the worksheet page fit a phone", async ({ page }) => {
    await signIn(page, "maya");
    await page.getByRole("link", { name: "Introduction to Biology" }).click();
    await expect(page).toHaveURL(/\/courses\/[0-9a-f-]+$/);
    await noHorizontalScroll(page);
    // The course pages sit behind a button that says it is the course menu.
    await page.getByRole("button", { name: "Course menu" }).click();
    await expect(page.getByRole("navigation", { name: "Course" }).getByRole("link", { name: "Modules" })).toBeVisible();
    await page.goto("/");
    await page.getByRole("link", { name: "Photosynthesis worksheet" }).click();
    await expect(page).toHaveURL(/\/assignments\//);
    await noHorizontalScroll(page);
  });

  test("@US-21 calendar, notifications and settings fit a phone", async ({ page }) => {
    await signIn(page, "maya");
    await page.goto("/calendar");
    await expect(page.getByRole("heading", { level: 1, name: "Calendar" })).toBeVisible();
    await noHorizontalScroll(page);
    // Under 820 px the grid becomes a list of the days that have items.
    await expect(page.locator("table.cal-grid")).toBeHidden();
    await expect(page.getByText("Loading…")).toHaveCount(0); // else the loop below can page past the month before the items arrive
    for (let i = 0; i < 4 && !(await page.getByRole("link", { name: "BIO101 Photosynthesis worksheet" }).isVisible()); i++) {
      await page.getByRole("button", { name: "Next month" }).click();
    }
    await expect(page.getByRole("link", { name: "BIO101 Photosynthesis worksheet" })).toBeVisible();
    for (const path of ["/notifications", "/settings/profile", "/settings/notifications"]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await noHorizontalScroll(page);
    }
  });

  test("@US-21 no page scrolls sideways", async ({ page }) => {
    await signIn(page, "maya");
    for (const path of ["/", "/calendar", "/notifications", "/settings/profile", "/settings/notifications"]) {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth === document.documentElement.clientWidth)).toBe(true);
    }
  });

  test("@US-21 the dashboard still fits at 320 px", async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 640 });
    await signIn(page, "noah");
    await noHorizontalScroll(page);
    await expect(page.getByRole("region", { name: "Missing" })).toBeVisible();
  });
});
