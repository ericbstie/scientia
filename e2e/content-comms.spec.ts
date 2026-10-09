import type { Page } from "@playwright/test";
import { test, expect, reset, signIn, api, coursePath, type Who } from "./fixtures";

async function notificationTitles(page: Page) {
  return ((await api(page, "/rest/v1/notifications?select=title&order=title")).data as { title: string }[]).map((r) => r.title);
}

async function open(page: Page, who: Who, code: string, section: "Announcements" | "Discussions") {
  await signIn(page, who);
  await page.goto(await coursePath(page, code));
  await page.getByRole("navigation", { name: "Course" }).getByRole("link", { name: section }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(section);
}

/** "Wed 7 Oct": the day format used for dates without a time (browser runs in UTC, en-GB). */
function day(ms: number) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  return `${p.weekday} ${p.day} ${p.month}`;
}

const rows = (page: Page) => page.locator("main ul.list > li");
const posts = (page: Page) => page.getByRole("region", { name: "Posts" }).getByRole("listitem");

test.describe("Announcements", () => {
  let T = 0;
  test.beforeEach(() => { T = Date.now(); reset(); });

  test("@US-7 Maya reads announcements, newest pinned first, with unread markers", async ({ page }) => {
    await open(page, "maya", "BIO101", "Announcements");
    await expect(rows(page)).toHaveCount(2);
    await expect(rows(page).nth(0)).toContainText("Welcome to BIO101");
    await expect(rows(page).nth(0)).toContainText("Pinned");
    await expect(rows(page).nth(1)).toContainText("Lab report 1 marking update");
    await expect(page.getByText("Reading list posted")).toHaveCount(0);
    await expect(rows(page).nth(1)).toContainText("Unread");

    await rows(page).nth(1).getByRole("link", { name: "Lab report 1 marking update" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Lab report 1 marking update");
    await expect(page.getByText("Dr. Ingrid Solberg")).toBeVisible();
    await expect(page.getByText(day(T - 3 * 86400000))).toBeVisible();
    await expect(page.getByText("Lab reports are being marked this week. Released grades show up under Grades.")).toBeVisible();
    await expect(page.locator("main textarea")).toHaveCount(0);

    await page.getByRole("link", { name: /Announcements/ }).first().click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Announcements");
    await expect(rows(page).nth(1)).toContainText("Lab report 1 marking update");
    await expect(rows(page).nth(1)).not.toContainText("Unread");
    await expect(rows(page).nth(0)).not.toContainText("Unread");
  });

  test("@US-7 a notification link opens the announcement", async ({ page }) => {
    await signIn(page, "maya");
    const base = await coursePath(page, "BIO101");
    const [ann] = (await api(page, "/rest/v1/announcements?select=id&title=eq.Lab report 1 marking update")).data;
    await page.goto(`${base}/announcements#${ann.id}`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Lab report 1 marking update");
  });

  test("@US-25 Ingrid posts an announcement that students see as unread", async ({ page }) => {
    await open(page, "ingrid", "BIO101", "Announcements");
    await page.getByRole("link", { name: "New announcement" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("New announcement");

    // An empty title is refused and nothing is posted.
    await page.getByRole("button", { name: "Post" }).click();
    await expect(page.locator(".error-text").filter({ hasText: "Enter a title" })).toHaveText("Enter a title");
    await expect(page.getByLabel("Title")).toHaveAttribute("aria-describedby", /error/);
    await expect(page.getByLabel("Title")).toBeFocused();

    await page.getByLabel("Title").fill("Field trip");
    await page.getByLabel("Message").fill("Meet at the main gate at 09:00.");
    await page.getByRole("button", { name: "Post" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Announcements");
    await expect(rows(page)).toHaveCount(3);
    await expect(rows(page).nth(0)).toContainText("Welcome to BIO101");
    await expect(rows(page).nth(0)).toContainText("Pinned");
    await expect(rows(page).nth(1)).toContainText("Field trip");
    await expect(rows(page).nth(1)).toContainText("Dr. Ingrid Solberg");
    await expect(rows(page).nth(1)).toContainText(day(Date.now()));
    await expect(rows(page).nth(2)).toContainText("Lab report 1 marking update");

    // Maya sees it as unread; HIS201 is unaffected.
    await open(page, "maya", "BIO101", "Announcements");
    await expect(rows(page).filter({ hasText: "Field trip" })).toContainText("Unread");
    await open(page, "ingrid", "HIS201", "Announcements");
    await expect(rows(page)).toHaveCount(1);
    await expect(rows(page).first()).toContainText("Reading list posted");
  });

  test("@US-26 Ingrid pins, edits and deletes announcements", async ({ page }) => {
    await open(page, "ingrid", "BIO101", "Announcements");
    const lab = () => rows(page).filter({ hasText: "Lab report 1 marking update" });
    const mayaBefore = (await (async () => { await signIn(page, "maya"); return notificationTitles(page); })());
    await open(page, "ingrid", "BIO101", "Announcements");

    await lab().getByRole("button", { name: "Pin" }).click();
    await expect(lab().getByText("Pinned", { exact: true })).toBeVisible();
    await expect(rows(page).nth(0)).toContainText("Lab report 1 marking update");
    await expect(rows(page).nth(1)).toContainText("Welcome to BIO101");
    await lab().getByRole("button", { name: "Unpin" }).click();
    await expect(lab().getByText("Pinned", { exact: true })).toHaveCount(0);
    await expect(rows(page).nth(0)).toContainText("Welcome to BIO101");
    await expect(rows(page).nth(1)).toContainText("Lab report 1 marking update");

    // Edit.
    await lab().getByRole("link", { name: "Edit" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Edit announcement");
    await expect(page.getByLabel("Title")).toHaveValue("Lab report 1 marking update");
    await page.getByLabel("Title").fill("Lab report 1 marks (revised)");
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Announcements");
    const revised = rows(page).filter({ hasText: "Lab report 1 marks (revised)" });
    await expect(revised).toContainText("Edited");
    await expect(rows(page).filter({ hasText: "Welcome to BIO101" })).not.toContainText("Edited");

    // Delete: cancel keeps it, confirm removes it for everyone.
    await revised.getByRole("button", { name: "Delete" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("heading")).toContainText("Lab report 1 marks (revised)");
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(revised).toBeVisible();
    await revised.getByRole("button", { name: "Delete" }).click();
    await dialog.getByRole("button", { name: "Delete" }).click();
    await expect(page.getByText("Lab report 1 marks (revised)")).toHaveCount(0);
    await expect(rows(page)).toHaveCount(1);

    await open(page, "maya", "BIO101", "Announcements");
    await expect(rows(page)).toHaveCount(1);
    await expect(rows(page).first()).toContainText("Welcome to BIO101");
    // Pinning and editing sent no new notifications (the delete removed none either).
    expect(await notificationTitles(page)).toEqual(mayaBefore);
  });
});

test.describe("Discussions", () => {
  test.beforeEach(() => reset());

  test("@US-15 Maya reads, replies to and starts threads", async ({ page }) => {
    await open(page, "maya", "BIO101", "Discussions");
    await expect(rows(page)).toHaveCount(1);
    await expect(rows(page).first()).toContainText("Question about the lab report");
    await expect(rows(page).first()).toContainText("by Liam Hansen");
    await expect(rows(page).first()).toContainText("2 replies");

    await page.getByRole("link", { name: "Question about the lab report" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Question about the lab report");
    await expect(posts(page)).toHaveCount(3);
    await expect(posts(page).nth(0)).toContainText("Should the methods section list the microscope model?");
    await expect(posts(page).nth(1)).toContainText("Yes, please include it.");
    await expect(posts(page).nth(1)).toContainText("Teacher");
    await expect(posts(page).nth(2)).toContainText("Thanks, I wondered too.");
    await expect(posts(page).nth(0)).not.toContainText("Teacher");
    await expect(page.getByRole("button", { name: "Delete" })).toHaveCount(0);

    // An empty reply is refused; a real one appears last, stamped with the current time.
    await page.getByRole("button", { name: "Reply", exact: true }).click();
    await expect(page.locator(".error-text").filter({ hasText: "Enter a reply" })).toBeVisible();
    await page.getByLabel("Reply", { exact: true }).fill("Same here.");
    await page.getByRole("button", { name: "Reply", exact: true }).click();
    await expect(posts(page)).toHaveCount(4);
    const last = posts(page).nth(3);
    await expect(last).toContainText("Same here.");
    await expect(last).toContainText("Maya Okafor");
    const stamp = await last.locator("time").getAttribute("datetime");
    expect(Math.abs(Date.now() - new Date(stamp!).getTime())).toBeLessThan(90_000);
    const shown = (await last.locator("time").innerText()).match(/(\d\d):(\d\d)$/)!;
    const now = new Date();
    const diff = Math.abs(Number(shown[1]) * 60 + Number(shown[2]) - (now.getUTCHours() * 60 + now.getUTCMinutes()));
    expect(Math.min(diff, 1440 - diff)).toBeLessThanOrEqual(1);

    // A new thread appears first in the list.
    await page.getByRole("navigation", { name: "Course" }).getByRole("link", { name: "Discussions" }).click();
    await expect(rows(page).first()).toContainText("3 replies");
    await page.getByRole("link", { name: "New thread" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("New thread");
    await page.getByRole("button", { name: "Post" }).click();
    await expect(page.locator(".error-text").filter({ hasText: "Enter a title" })).toHaveText("Enter a title");
    await expect(page.getByLabel("Title")).toHaveAttribute("aria-describedby", /error/);
    await page.getByLabel("Title").fill("Lab partner?");
    await page.getByLabel("Message").fill("Anyone free on Thursday?");
    await page.getByRole("button", { name: "Post" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Discussions");
    await expect(rows(page)).toHaveCount(2);
    await expect(rows(page).first()).toContainText("Lab partner?");
    await expect(rows(page).first()).toContainText("by Maya Okafor");
    await expect(rows(page).first()).toContainText("0 replies");
  });

  test("@US-37 Ingrid removes a reply and a whole thread", async ({ page }) => {
    await open(page, "ingrid", "BIO101", "Discussions");
    await page.getByRole("link", { name: "Question about the lab report" }).click();
    const thread = page.url();
    await expect(posts(page)).toHaveCount(3);
    await expect(posts(page).nth(0).getByRole("button", { name: "Delete" })).toHaveCount(0);

    const maya = posts(page).filter({ hasText: "Thanks, I wondered too." });
    await maya.getByRole("button", { name: "Delete" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByRole("button", { name: "Cancel" })).toBeFocused();
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(maya).toBeVisible();
    await maya.getByRole("button", { name: "Delete" }).click();
    await dialog.getByRole("button", { name: "Delete" }).click();
    await expect(posts(page)).toHaveCount(3);
    await expect(posts(page).nth(2)).toHaveText(/This post was removed by a teacher/);
    await expect(page.getByText("Thanks, I wondered too.")).toHaveCount(0);

    // Liam sees the same, and cannot delete anything.
    await signIn(page, "liam");
    await page.goto(thread);
    await expect(posts(page).nth(2)).toContainText("This post was removed by a teacher");
    await expect(page.getByText("Thanks, I wondered too.")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Delete" })).toHaveCount(0);
    await page.getByRole("navigation", { name: "Course" }).getByRole("link", { name: "Discussions" }).click();
    await expect(rows(page).first()).toContainText("2 replies");

    // Delete the whole thread.
    await signIn(page, "ingrid");
    await page.goto(thread);
    await page.getByRole("button", { name: "Delete thread" }).click();
    await expect(dialog.getByRole("heading")).toContainText("Question about the lab report");
    await dialog.getByRole("button", { name: "Delete" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Discussions");
    await expect(page.getByText("Question about the lab report")).toHaveCount(0);
    await expect(page.getByText("No threads yet")).toBeVisible();
  });
});
