// Stories US-27 to US-31 and US-45: creating and changing assignments, the grading queue, grading and releasing, and more time for one student.
import { test, expect, reset, signIn, signOut, api, openCourse } from "./fixtures";
import type { Page } from "@playwright/test";

let T = Date.now();

const DAY = 86400000;
const dueAt = (n: number) => {
  const d = new Date(T + n * DAY);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59));
};
const fmt = (d: Date) => {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "UTC" }).formatToParts(d).map((x) => [x.type, x.value]));
  const year = d.getUTCFullYear() === new Date().getUTCFullYear() ? "" : ` ${p.year}`;
  return `${p.weekday} ${p.day} ${p.month}${year}, ${p.hour}:${p.minute}`;
};
/** Value for a datetime-local input: 23:59 on the UTC date n days after T. */
const inputAt = (n: number) => dueAt(n).toISOString().slice(0, 16);

const row = (page: Page, text: string) => page.getByRole("listitem").filter({ hasText: text });
const courseNav = (page: Page, name: string) => page.getByRole("navigation", { name: "Course" }).getByRole("link", { name });

test.beforeEach(() => {
  T = Date.now();
  reset();
});

test.describe("Creating and changing assignments", () => {
  test("@US-27 the new assignment form has exactly the specified controls", async ({ page }) => {
    await signIn(page, "ingrid");
    await openCourse(page, "BIO101", "/assignments");
    await page.getByRole("link", { name: "New assignment" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("New assignment");
    const form = page.locator("main form");
    await expect(form.getByLabel("Title")).toBeVisible();
    await expect(form.getByLabel("Instructions")).toBeVisible();
    await expect(form.getByLabel("Due date and time")).toBeVisible();
    await expect(form.getByLabel("Points")).toBeVisible();
    await expect(form.getByRole("checkbox", { name: "Uploading a file" })).toBeVisible();
    await expect(form.getByRole("checkbox", { name: "Typing an answer" })).toBeVisible();
    await expect(form.getByRole("checkbox", { name: "Accept work after the due date (marked late)" })).toBeVisible();
    await expect(form.getByRole("button")).toHaveText(["Save and publish", "Save as draft"]);
    await expect(form.locator("input, textarea, select")).toHaveCount(7);
  });

  test("@US-27 a draft is hidden from students", async ({ page }) => {
    await signIn(page, "ingrid");
    await openCourse(page, "BIO101", "/assignments/new");
    await page.getByLabel("Title").fill("Reading quiz");
    await page.getByLabel("Due date and time").fill(inputAt(10));
    await page.getByLabel("Points").fill("20");
    await page.getByRole("checkbox", { name: "Uploading a file" }).uncheck();
    await page.getByRole("checkbox", { name: "Typing an answer" }).check();
    await page.getByRole("button", { name: "Save as draft" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Reading quiz");
    await expect(page.getByText("Draft", { exact: true })).toBeVisible();

    await signOut(page);
    await signIn(page, "maya");
    await openCourse(page, "BIO101", "/assignments");
    await expect(page.getByText("Safety acknowledgement")).toBeVisible();
    await expect(page.getByText("Reading quiz")).toHaveCount(0);
  });

  test("@US-27 a published assignment shows up for students in due-date order", async ({ page }) => {
    await signIn(page, "ingrid");
    await openCourse(page, "BIO101", "/assignments/new");
    await page.getByLabel("Title").fill("Reading quiz");
    await page.getByLabel("Due date and time").fill(inputAt(10));
    await page.getByLabel("Points").fill("20");
    await page.getByRole("checkbox", { name: "Uploading a file" }).uncheck();
    await page.getByRole("button", { name: "Save and publish" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Reading quiz");

    await signOut(page);
    await signIn(page, "maya");
    await openCourse(page, "BIO101", "/assignments");
    await expect(row(page, "Reading quiz")).toHaveCount(1);
    const titles = await page.locator(".row-title").allTextContents();
    expect(titles.indexOf("Reading quiz")).toBeGreaterThan(titles.indexOf("Photosynthesis worksheet"));
    expect(titles.indexOf("Reading quiz")).toBe(titles.indexOf("Field journal") - 1);
    await expect(row(page, "Reading quiz")).toContainText("20 points");
    await expect(row(page, "Reading quiz")).toContainText(fmt(dueAt(10)));
  });

  test("@US-27 an invalid form shows linked errors and creates nothing", async ({ page }) => {
    await signIn(page, "ingrid");
    await openCourse(page, "BIO101", "/assignments/new");
    await page.getByLabel("Points").fill("0");
    await page.getByRole("checkbox", { name: "Uploading a file" }).uncheck();
    await page.getByRole("checkbox", { name: "Typing an answer" }).uncheck();
    await page.getByRole("button", { name: "Save and publish" }).click();
    await expect(page.locator(".error-text", { hasText: "Enter a title" })).toBeVisible();
    await expect(page.locator(".error-text", { hasText: "Enter points greater than 0" })).toBeVisible();
    await expect(page.locator(".error-text", { hasText: "Choose at least one way to submit" })).toBeVisible();
    await expect(page.getByLabel("Title")).toHaveAttribute("aria-describedby", /error/);
    await expect(page.getByLabel("Points")).toHaveAttribute("aria-describedby", /error/);
    await expect(page.getByRole("group", { name: "Students hand in by" })).toHaveAttribute("aria-describedby", /error/);
    await expect(page.getByLabel("Title")).toBeFocused();

    await courseNav(page, "Assignments").click();
    await expect(row(page, "Safety acknowledgement")).toHaveCount(1);
    await expect(page.locator(".row-title")).toHaveCount(5); // the four published and the draft Final project
  });

  test("@US-28 changing a due date reaches students", async ({ page }) => {
    await signIn(page, "ingrid");
    await openCourse(page, "BIO101", "/assignments");
    await page.getByRole("link", { name: "Field journal" }).click();
    await page.getByRole("link", { name: "Edit" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Edit assignment");
    await page.getByLabel("Due date and time").fill(inputAt(14));
    await page.getByRole("button", { name: "Save" }).click();
    await expect(page.getByText(fmt(dueAt(14)))).toBeVisible();

    await signOut(page);
    await signIn(page, "maya");
    await openCourse(page, "BIO101", "/assignments");
    await expect(row(page, "Field journal")).toContainText(fmt(dueAt(14)));
    const notes = (await api(page, "/rest/v1/notifications?select=title")).data as { title: string }[];
    expect(notes.map((n) => n.title)).toContain("Due date changed: Field journal");
  });

  test("@US-28 publish a draft and unpublish an assignment nobody has submitted to", async ({ page }) => {
    await signIn(page, "ingrid");
    await openCourse(page, "BIO101", "/assignments");
    await page.getByRole("link", { name: "Final project" }).click();
    await expect(page.getByText("Draft", { exact: true })).toBeVisible();
    await page.getByRole("button", { name: "Publish" }).click();
    await expect(page.getByRole("button", { name: "Unpublish" })).toBeVisible();
    await expect(page.getByText("Draft", { exact: true })).toHaveCount(0);

    await courseNav(page, "Assignments").click();
    await page.getByRole("link", { name: "Field journal" }).click();
    await page.getByRole("button", { name: "Unpublish" }).click();
    await expect(page.getByText("Draft", { exact: true })).toBeVisible();

    await signOut(page);
    await signIn(page, "maya");
    await openCourse(page, "BIO101", "/assignments");
    await expect(page.getByRole("link", { name: "Final project" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Field journal" })).toHaveCount(0);
  });

  test("@US-28 an assignment with submissions cannot be unpublished", async ({ page }) => {
    await signIn(page, "ingrid");
    await openCourse(page, "BIO101", "/assignments");
    await page.getByRole("link", { name: "Photosynthesis worksheet" }).click();
    await expect(page.getByRole("button", { name: "Unpublish" })).toBeDisabled();
    await expect(page.getByText("Cannot unpublish: students have submitted")).toBeVisible();
    await expect(page.getByRole("link", { name: "Open grading queue" })).toBeVisible();
  });
});

test.describe("Grading queue, grading and releasing", () => {
  test("@US-29 the queue defaults to Needs grading, ordered by due date", async ({ page }) => {
    await signIn(page, "ingrid");
    await openCourse(page, "BIO101", "/grading");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Grading");
    const items = page.locator("main ul.list > li");
    await expect(items).toHaveCount(2);
    await expect(items.nth(0)).toContainText("Sofia Reyes");
    await expect(items.nth(0)).toContainText("Lab report 1");
    await expect(items.nth(0)).toContainText("Late by 1 day");
    await expect(items.nth(1)).toContainText("Liam Hansen");
    await expect(items.nth(1)).toContainText("Photosynthesis worksheet");
    const filter = page.getByRole("navigation", { name: "Filter" });
    await expect(filter.getByRole("link", { name: /Needs grading/ })).toHaveAttribute("aria-current", "page");
  });

  test("@US-29 filters show graded, released and missing work", async ({ page }) => {
    await signIn(page, "ingrid");
    await openCourse(page, "BIO101", "/grading");
    const filter = page.getByRole("navigation", { name: "Filter" });
    const items = page.locator("main ul.list > li");

    await filter.getByRole("link", { name: /Graded, not released/ }).click();
    await expect(items).toHaveCount(1);
    await expect(items.first()).toContainText("Liam Hansen");
    await expect(items.first()).toContainText("Lab report 1");

    await filter.getByRole("link", { name: /Released/ }).click();
    await expect(items).toHaveCount(2);
    await expect(items.nth(0)).toContainText("Maya Okafor");
    await expect(items.nth(0)).toContainText("Safety acknowledgement");
    await expect(items.nth(1)).toContainText("Maya Okafor");
    await expect(items.nth(1)).toContainText("Lab report 1");

    await filter.getByRole("link", { name: /Missing/ }).click();
    await expect(items).toHaveCount(4);
    const text = (await items.allTextContents()).join("\n");
    for (const [who, what] of [["Noah Berg", "Lab report 1"], ["Liam Hansen", "Safety acknowledgement"], ["Sofia Reyes", "Safety acknowledgement"], ["Noah Berg", "Safety acknowledgement"]]) {
      expect(await items.filter({ hasText: who! }).filter({ hasText: what! }).count()).toBe(1);
    }
    expect(text).not.toContain("Maya");
    await expect(items.first().getByRole("link")).toHaveCount(0);
  });

  test("@US-29 a queue row opens that submission's grading view", async ({ page }) => {
    await signIn(page, "ingrid");
    await openCourse(page, "BIO101", "/grading");
    await row(page, "Sofia Reyes").getByRole("link", { name: "Sofia Reyes" }).click();
    await expect(page).toHaveURL(/\/grading\/[0-9a-f-]{36}$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Sofia Reyes: Lab report 1");
  });

  test("@US-30 grade a submission with a score and feedback", async ({ page }) => {
    await signIn(page, "ingrid");
    await openCourse(page, "BIO101", "/grading");
    await page.getByRole("link", { name: "Sofia Reyes" }).click();
    await expect(page.getByText("Sorry this is late. Report text: cells observed under 400x magnification.")).toBeVisible();
    await expect(page.getByText("out of 100")).toBeVisible();
    await expect(page.getByLabel("Score")).toBeVisible();
    await expect(page.getByLabel("Feedback")).toBeVisible();

    await page.getByLabel("Score").fill("78");
    await page.getByLabel("Feedback").fill("Good analysis, cite your sources");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.locator(".page-header .subtitle")).toContainText("Graded (not released)");

    await page.getByRole("link", { name: "‹ Grading" }).click();
    await page.getByRole("navigation", { name: "Filter" }).getByRole("link", { name: /Graded, not released/ }).click();
    await expect(row(page, "Sofia Reyes")).toContainText("Graded (not released)");

    await signOut(page);
    await signIn(page, "sofia");
    await openCourse(page, "BIO101", "/grades");
    await expect(page.getByRole("row", { name: /Lab report 1/ })).toContainText("Awaiting grade");
    await expect(page.getByText("78")).toHaveCount(0);
  });

  test("@US-30 an out-of-range or empty score is refused", async ({ page }) => {
    await signIn(page, "ingrid");
    await openCourse(page, "BIO101", "/grading");
    await page.getByRole("link", { name: "Sofia Reyes" }).click();
    await page.getByLabel("Score").fill("101");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByText("Score must be between 0 and 100")).toBeVisible();
    await expect(page.getByLabel("Score")).toHaveAttribute("aria-describedby", /error/);
    await page.getByLabel("Score").fill("");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByText("Enter a score")).toBeVisible();
    await expect(page.locator(".page-header .subtitle")).toContainText("Needs grading");
    await page.getByRole("navigation", { name: "Course" }).getByRole("link", { name: "Grading" }).click();
    await expect(page.getByRole("navigation", { name: "Filter" }).getByRole("link", { name: /Needs grading \(2\)/ })).toBeVisible();
  });

  test("@US-30 Next to grade moves on to the next submission", async ({ page }) => {
    await signIn(page, "ingrid");
    await openCourse(page, "BIO101", "/grading");
    await page.getByRole("link", { name: "Sofia Reyes" }).click();
    await page.getByLabel("Score").fill("78");
    await page.getByLabel("Feedback").fill("Good analysis, cite your sources");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.locator(".page-header .subtitle")).toContainText("Graded (not released)");
    await page.getByRole("button", { name: "Next to grade" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Liam Hansen: Photosynthesis worksheet");
    await page.getByLabel("Score").fill("40");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.locator(".page-header .subtitle")).toContainText("Graded (not released)");
    await expect(page.getByRole("button", { name: "Next to grade" })).toBeDisabled();
    await expect(page.getByText("Nothing else needs grading")).toBeVisible();
  });

  test("@US-30 leaving with unsaved changes asks first", async ({ page }) => {
    await signIn(page, "ingrid");
    await openCourse(page, "BIO101", "/grading");
    await page.getByRole("link", { name: "Sofia Reyes" }).click();
    const url = page.url();
    await page.getByLabel("Score").fill("80");
    await courseNav(page, "Grading").click();
    const dialog = page.getByRole("dialog", { name: "Discard unsaved changes?" });
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Stay on this page" }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByLabel("Score")).toHaveValue("80");
    expect(page.url()).toBe(url);

    await courseNav(page, "Grading").click();
    await page.getByRole("dialog", { name: "Discard unsaved changes?" }).getByRole("button", { name: "Discard changes" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Grading");
  });

  test("@US-31 release one grade from its queue row", async ({ page }) => {
    await signIn(page, "ingrid");
    await openCourse(page, "BIO101", "/grading?status=graded");
    await row(page, "Liam Hansen").getByRole("button", { name: "Release" }).click();
    await expect(row(page, "Liam Hansen")).toHaveCount(0);
    await page.getByRole("navigation", { name: "Filter" }).getByRole("link", { name: /Released/ }).click();
    await expect(row(page, "Liam Hansen")).toContainText("Released");
    await expect(page.getByRole("button", { name: /Release all graded/ })).toHaveCount(0);

    await signOut(page);
    await signIn(page, "liam");
    await openCourse(page, "BIO101", "/grades");
    await expect(page.getByRole("row", { name: /Lab report 1/ })).toContainText("72 / 100");
    await page.getByRole("link", { name: "Lab report 1" }).click();
    await expect(page.getByText("Good observations; the conclusion needs evidence from your data.")).toBeVisible();
  });

  test("@US-31 release all graded work after confirming the count", async ({ page }) => {
    await signIn(page, "ingrid");
    await openCourse(page, "BIO101", "/grading");
    await page.getByRole("link", { name: "Sofia Reyes" }).click();
    await page.getByLabel("Score").fill("78");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.locator(".page-header .subtitle")).toContainText("Graded (not released)");
    await page.getByRole("button", { name: "Next to grade" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Liam Hansen: Photosynthesis worksheet");
    await page.getByLabel("Score").fill("40");
    await page.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.locator(".page-header .subtitle")).toContainText("Graded (not released)");
    await courseNav(page, "Grading").click();

    await page.getByRole("button", { name: "Release all graded to students (3)" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toContainText("Release 3 grades?");
    await expect(dialog).toContainText("Students will see their scores and feedback.");
    await dialog.getByRole("button", { name: "Release", exact: true }).click();
    await expect(page.getByRole("button", { name: /Release all graded/ })).toHaveCount(0);
    await page.getByRole("navigation", { name: "Filter" }).getByRole("link", { name: /Released/ }).click();
    await expect(page.locator("main ul.list > li")).toHaveCount(5);
    await expect(page.locator("main ul.list > li").filter({ hasText: "Released" })).toHaveCount(5);
  });

  test("@US-31 withdraw a released grade", async ({ page }) => {
    await signIn(page, "ingrid");
    await openCourse(page, "BIO101", "/grading?status=released");
    await row(page, "Lab report 1").getByRole("button", { name: "Withdraw" }).click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await dialog.getByRole("button", { name: "Withdraw" }).click();
    await expect(row(page, "Lab report 1")).toHaveCount(0);
    await page.getByRole("navigation", { name: "Filter" }).getByRole("link", { name: /Graded, not released/ }).click();
    await expect(row(page, "Maya Okafor")).toContainText("Lab report 1");

    await signOut(page);
    await signIn(page, "maya");
    await openCourse(page, "BIO101", "/grades");
    await expect(page.getByRole("row", { name: /Lab report 1/ })).toContainText("Awaiting grade");
  });
});

test.describe("More time for one student", () => {
  const giveMoreTime = async (page: Page, title: string, student: string, n: number) => {
    await openCourse(page, "BIO101", "/assignments");
    await page.getByRole("link", { name: title, exact: true }).click();
    await page.getByRole("button", { name: "Give more time" }).click();
    const dialog = page.getByRole("dialog", { name: "Give more time" });
    await dialog.getByLabel("Student").selectOption({ label: student });
    await dialog.getByLabel("New due date and time").fill(inputAt(n));
    await dialog.getByRole("button", { name: "Save" }).click();
    return dialog;
  };

  test("@US-45 more time for Sofia lifts her Late flag until it is removed", async ({ page }) => {
    await signIn(page, "ingrid");
    const dialog = await giveMoreTime(page, "Lab report 1", "Sofia Reyes", -8);
    await expect(dialog.getByText("Choose a time after the usual due date")).toBeVisible();
    await dialog.getByLabel("New due date and time").fill(inputAt(-5));
    await dialog.getByRole("button", { name: "Save" }).click();
    await expect(page.getByRole("status").filter({ hasText: `Sofia Reyes has until ${fmt(dueAt(-5))}` })).toBeVisible();
    const more = page.getByRole("region", { name: "More time" });
    await expect(more.getByRole("listitem")).toHaveCount(1);
    await expect(more.getByRole("listitem")).toContainText("Sofia Reyes");
    await expect(more.getByRole("listitem")).toContainText(fmt(dueAt(-5)));
    const assignment = page.url();

    await page.getByRole("link", { name: "Open grading queue" }).click();
    await expect(row(page, "Sofia Reyes")).toContainText("Lab report 1");
    await expect(row(page, "Sofia Reyes")).not.toContainText("Late");

    await page.goto(assignment);
    await more.getByRole("button", { name: "Remove extra time for Sofia Reyes" }).click();
    await expect(more).toContainText("Everyone has the same due date.");
    await page.getByRole("link", { name: "Open grading queue" }).click();
    await expect(row(page, "Sofia Reyes")).toContainText("Late by 1 day");
  });

  test("@US-45 Noah gets more time on a closed assignment and hands it in", async ({ page }) => {
    await signIn(page, "ingrid");
    await giveMoreTime(page, "Safety acknowledgement", "Noah Berg", 3);
    await expect(page.getByRole("status").filter({ hasText: "Noah Berg has until" })).toBeVisible();

    await signIn(page, "noah");
    const upcoming = page.getByRole("region", { name: "Upcoming" });
    await expect(upcoming.getByRole("listitem").filter({ hasText: "Safety acknowledgement" })).toContainText(fmt(dueAt(3)));
    await expect(page.getByRole("region", { name: "Missing" })).not.toContainText("Safety acknowledgement");
    const notes = (await api(page, "/rest/v1/notifications?select=title")).data as { title: string }[];
    expect(notes.map((n) => n.title)).toContain("Due date changed: Safety acknowledgement");

    await upcoming.getByRole("link", { name: "Safety acknowledgement" }).click();
    await page.getByRole("textbox", { name: "Your answer" }).fill("I have read the safety rules");
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.locator("dt", { hasText: /^Status$/ }).locator("xpath=following-sibling::dd[1]")).toContainText("Submitted");
  });

  test("@US-45 students cannot give themselves more time", async ({ page }) => {
    await signIn(page, "maya");
    const [lab] = (await api(page, "/rest/v1/assignments?select=id&title=eq.Lab report 1")).data;
    const me = await page.evaluate(() => JSON.parse(localStorage.getItem("scientia-auth")!).user.id as string);
    const res = await api(page, "/rest/v1/extensions", { method: "POST", body: { assignment_id: lab.id, student_id: me, due_at: dueAt(30).toISOString() } });
    expect(res.status).toBe(403);
    expect((await api(page, "/rest/v1/extensions?select=due_at")).data).toEqual([]);
  });
});
