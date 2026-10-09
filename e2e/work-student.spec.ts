// Stories US-8 to US-13: assignments, submitting, deadlines, grades and feedback (student side).
import { test, expect, reset, signIn, signOut, api, openCourse } from "./fixtures";
import type { Page } from "@playwright/test";

let T = Date.now();

const DAY = 86400000;
/** The Status value in the facts list of an assignment page. */
const assignmentStatus = (page: Page) => page.locator("dt", { hasText: /^Status$/ }).locator("xpath=following-sibling::dd[1]");
/** 23:59 UTC on the UTC date that is n days after T. */
const dueAt = (n: number) => {
  const d = new Date(T + n * DAY);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59));
};
/** `ddd D MMM, HH:mm` in en-GB (the browser runs in UTC); the year is added when it is not the current one. */
const fmt = (d: Date) => {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hourCycle: "h23", timeZone: "UTC" }).formatToParts(d).map((x) => [x.type, x.value]));
  const year = d.getUTCFullYear() === new Date().getUTCFullYear() ? "" : ` ${p.year}`;
  return `${p.weekday} ${p.day} ${p.month}${year}, ${p.hour}:${p.minute}`;
};

/** Local copy: the shared signOut waits for /signin but the route is /sign-in. */
/** Calls the data API as the signed-in user. */
/** Reaches a course without the dashboard: looks the id up through the data API. */
async function openAssignment(page: Page, title: string, code = "BIO101") {
  await openCourse(page, code, "/assignments");
  await page.getByRole("link", { name: title, exact: true }).click();
  await expect(page.getByRole("heading", { level: 1 })).toContainText(title);
}

const row = (page: Page, title: string) => page.getByRole("listitem").filter({ hasText: title });

test.beforeEach(() => {
  T = Date.now();
  reset();
});

test.describe("Assignments and submitting", () => {
  test("@US-8 student sees published assignments with due date, points and status", async ({ page }) => {
    await signIn(page, "maya");
    await openCourse(page, "BIO101", "/assignments");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Assignments");
    for (const t of ["Safety acknowledgement", "Lab report 1", "Photosynthesis worksheet", "Field journal"]) {
      await expect(row(page, t)).toHaveCount(1);
    }
    await expect(page.getByText("Final project")).toHaveCount(0);
    await expect(row(page, "Safety acknowledgement")).toContainText(fmt(dueAt(-14)));
    await expect(row(page, "Safety acknowledgement")).toContainText("10 points");
    await expect(row(page, "Photosynthesis worksheet")).toContainText(fmt(dueAt(2)));
    await expect(row(page, "Photosynthesis worksheet")).toContainText("50 points");
    await expect(row(page, "Safety acknowledgement")).toContainText("Graded");
    await expect(row(page, "Lab report 1")).toContainText("Graded");
    await expect(row(page, "Photosynthesis worksheet")).toContainText("Not submitted");
    await expect(row(page, "Field journal")).toContainText("Not submitted");
  });

  test("@US-8 assignment page shows instructions, points, due date and the right fields", async ({ page }) => {
    await signIn(page, "maya");
    await openAssignment(page, "Photosynthesis worksheet");
    await expect(page.getByText("Read the Photosynthesis overview (Modules, Week 2), then explain in your own words where the light reactions and the Calvin cycle happen.")).toBeVisible();
    await expect(page.getByText("50 points")).toBeVisible();
    await expect(page.getByText(fmt(dueAt(2)))).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Your answer" })).toBeVisible();
    await expect(page.locator('input[type="file"]')).toHaveCount(0);

    await openAssignment(page, "Field journal");
    await expect(page.locator('input[type="file"]')).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Your answer" })).toHaveCount(0);
  });

  test("@US-8 a draft grade does not make the status Graded", async ({ page }) => {
    await signIn(page, "liam");
    await openCourse(page, "BIO101", "/assignments");
    await expect(row(page, "Lab report 1")).toContainText("Submitted");
    await expect(row(page, "Lab report 1")).not.toContainText("Graded");
  });

  test("@US-9 submit text in two clicks and see it with the time", async ({ page }) => {
    await signIn(page, "maya");
    await openCourse(page, "BIO101", "/assignments");
    await page.getByRole("link", { name: "Photosynthesis worksheet" }).click(); // click 1
    await page.getByRole("textbox", { name: "Your answer" }).fill("Chlorophyll absorbs light.");
    await page.getByRole("button", { name: "Submit" }).click(); // click 2
    await expect(assignmentStatus(page)).toContainText("Submitted");
    await expect(page.getByText("Chlorophyll absorbs light.")).toBeVisible();
    const when = await page.locator("main time[datetime]").filter({ hasText: /\d{2}:\d{2}/ }).last().getAttribute("datetime");
    expect(Math.abs(new Date(when!).getTime() - Date.now())).toBeLessThan(2 * 60000);
  });

  test("@US-9 empty text shows an error linked to the field and nothing is submitted", async ({ page }) => {
    await signIn(page, "maya");
    await openAssignment(page, "Photosynthesis worksheet");
    await page.getByRole("button", { name: "Submit" }).click();
    const field = page.getByRole("textbox", { name: "Your answer" });
    await expect(page.getByText("Enter your answer before submitting")).toBeVisible();
    await expect(field).toHaveAttribute("aria-describedby", /error/);
    await expect(field).toBeFocused();
    const r = await api(page, "/rest/v1/submissions?select=id,assignments!inner(title)&assignments.title=eq.Photosynthesis worksheet");
    expect(r.data).toEqual([]);
  });

  test("@US-9 attach a file and submit", async ({ page }) => {
    await signIn(page, "maya");
    await openAssignment(page, "Essay: the 1848 revolutions", "HIS201");
    await page.getByLabel("File").setInputFiles("e2e/files/sample.pdf");
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(assignmentStatus(page)).toContainText("Submitted");
    const link = page.getByRole("link", { name: "sample.pdf" });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", /.+/);
  });

  test("@US-9 a file over 10 MB is refused with a clear message", async ({ page }) => {
    await signIn(page, "maya");
    await openAssignment(page, "Essay: the 1848 revolutions", "HIS201");
    await page.getByLabel("File").setInputFiles("e2e/files/too-large.bin");
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.getByText("This file is larger than the 10 MB limit")).toBeVisible();
    await expect(page.getByRole("button", { name: "Submit" })).toBeVisible();
    await expect(assignmentStatus(page)).not.toContainText("Submitted");
    const r = await api(page, "/rest/v1/submissions?select=id,assignments!inner(title)&assignments.title=eq.Essay: the 1848 revolutions");
    expect(r.data).toEqual([]);
  });

  test("@US-9 a failed request keeps the typed text and says so", async ({ page }) => {
    await signIn(page, "maya");
    await openAssignment(page, "Photosynthesis worksheet");
    await page.route("**/rest/v1/submissions*", (route) => route.abort());
    const field = page.getByRole("textbox", { name: "Your answer" });
    await field.fill("Chlorophyll absorbs light.");
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(page.getByRole("alert").filter({ hasText: "Your work was not saved. Try again." })).toBeVisible();
    await expect(field).toHaveValue("Chlorophyll absorbs light.");
  });

  test("@US-10 resubmit while grading has not started", async ({ page }) => {
    await signIn(page, "liam");
    await openAssignment(page, "Photosynthesis worksheet");
    await expect(page.getByText("Light reactions occur in the thylakoid membrane.")).toBeVisible();
    await page.getByRole("button", { name: "Edit submission" }).click();
    const text = "Light reactions occur in the thylakoid membrane; the Calvin cycle is in the stroma.";
    await page.getByRole("textbox", { name: "Your answer" }).fill(text);
    await page.getByRole("button", { name: "Submit" }).click();
    await page.reload();
    await expect(page.getByText(text)).toBeVisible();
    await expect(page.getByText("Attempt 2")).toBeVisible();

    await signOut(page);
    await signIn(page, "ingrid");
    await openCourse(page, "BIO101", "/grading");
    await page.getByRole("link", { name: "Liam Hansen" }).click();
    await expect(page.getByText(text)).toBeVisible();
    await expect(page.getByText("Light reactions occur in the thylakoid membrane.", { exact: true })).toHaveCount(0);
  });

  test("@US-10 no editing once grading has started", async ({ page }) => {
    await signIn(page, "liam");
    await openAssignment(page, "Lab report 1");
    await expect(page.getByText("Your teacher has started grading this work")).toBeVisible();
    await expect(page.getByRole("button", { name: "Edit submission" })).toHaveCount(0);
    await signOut(page);
    await signIn(page, "maya");
    await openAssignment(page, "Lab report 1");
    await expect(page.getByText("86 / 100")).toBeVisible();
    await expect(page.getByRole("button", { name: "Edit submission" })).toHaveCount(0);
    await expect(page.getByText("Your teacher has started grading this work")).toHaveCount(0);
  });

  test("@US-11 late work is accepted and marked Late", async ({ page }) => {
    await signIn(page, "noah");
    await openAssignment(page, "Lab report 1");
    await expect(page.getByText("Past due")).toBeVisible();
    await page.getByRole("textbox", { name: "Your answer" }).fill("Late but complete.");
    await page.getByRole("button", { name: "Submit" }).click();
    await expect(assignmentStatus(page)).toContainText("Late");
    const when = await page.locator("main time[datetime]").last().getAttribute("datetime");
    expect(new Date(when!).getTime()).toBeGreaterThan(dueAt(-7).getTime());
    expect(Math.abs(new Date(when!).getTime() - Date.now())).toBeLessThan(2 * 60000);
  });

  test("@US-11 a late submission says how late it is", async ({ page }) => {
    await signIn(page, "sofia");
    await openAssignment(page, "Lab report 1");
    await expect(assignmentStatus(page)).toContainText("Late");
    await expect(page.getByText("Submitted 1 day late")).toBeVisible();
  });

  test("@US-11 a closed assignment explains itself and refuses submissions", async ({ page }) => {
    await signIn(page, "liam");
    await openAssignment(page, "Safety acknowledgement");
    await expect(page.getByText(`Closed: this assignment stopped accepting work on ${fmt(dueAt(-14))}`)).toBeVisible();
    await expect(page.getByRole("button", { name: "Submit" })).toHaveCount(0);
    await expect(page.getByRole("textbox")).toHaveCount(0);

    const ids = (await api(page, "/rest/v1/assignments?select=id&title=eq.Safety acknowledgement")).data;
    const me = await page.evaluate(() => JSON.parse(localStorage.getItem("scientia-auth")!).user.id as string);
    const res = await api(page, "/rest/v1/submissions", { method: "POST", body: { assignment_id: ids[0].id, student_id: me, body: "Too late" } });
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
    expect(res.text.toLowerCase()).toContain("closed");
    const after = await api(page, `/rest/v1/submissions?assignment_id=eq.${ids[0].id}&student_id=eq.${me}`);
    expect(after.data).toEqual([]);
  });
});

test.describe("Grades and feedback", () => {
  test("@US-12 grades page lists released scores and never a zero", async ({ page }) => {
    await signIn(page, "maya");
    await openCourse(page, "BIO101", "/grades");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Grades");
    await expect(page.getByRole("row")).toHaveCount(5); // header + four assignments
    await expect(page.getByRole("row", { name: /Safety acknowledgement/ })).toContainText("10 / 10");
    await expect(page.getByRole("row", { name: /Lab report 1/ })).toContainText("86 / 100");
    await expect(page.getByRole("row", { name: /Photosynthesis worksheet/ })).toContainText("Not submitted");
    await expect(page.getByRole("row", { name: /Field journal/ })).toContainText("Not submitted");
    await expect(page.getByRole("row", { name: /Photosynthesis worksheet|Field journal/ }).first()).not.toContainText(/(^|\s)0(\s|$)/);
    await expect(page.getByText("87.3% (96 of 110 points graded so far)")).toBeVisible();
  });

  test("@US-12 grades that are not released stay hidden", async ({ page }) => {
    await signIn(page, "liam");
    await openCourse(page, "BIO101", "/grades");
    await expect(page.getByRole("row", { name: /Lab report 1/ })).toContainText("Awaiting grade");
    await expect(page.getByRole("row", { name: /Photosynthesis worksheet/ })).toContainText("Awaiting grade");
    await expect(page.getByRole("row", { name: /Safety acknowledgement/ })).toContainText("Missing");
    await expect(page.getByText("72")).toHaveCount(0);
    await expect(page.getByText("Total: none yet. Your total appears when your teacher releases a grade.")).toBeVisible();
  });

  test("@US-13 student reads score, feedback and own work", async ({ page }) => {
    await signIn(page, "maya");
    await openCourse(page, "BIO101", "/grades");
    await page.getByRole("link", { name: "Lab report 1" }).click();
    await expect(page.getByText("86 / 100")).toBeVisible();
    await expect(page.getByText("Clear methods section. Add units to Table 2 and cite the microscope model.")).toBeVisible();
    await expect(page.getByText("My lab report is attached.")).toBeVisible();
    await expect(page.getByRole("link", { name: "lab-report-1.pdf" })).toBeVisible();
  });

  test("@US-13 an unreleased grade is not shown to the student", async ({ page }) => {
    await signIn(page, "liam");
    await openAssignment(page, "Lab report 1");
    await expect(page.getByText(/Observations: onion cells showed clear cell walls/)).toBeVisible();
    await expect(page.getByText("72")).toHaveCount(0);
    await expect(page.getByText("Good observations")).toHaveCount(0);
  });

  test("@US-13 another student's work and grade cannot be read through the data API", async ({ page }) => {
    await signIn(page, "maya");
    const id = await openCourse(page, "BIO101");
    const people = (await api(page, "/rest/v1/rpc/course_people", { method: "POST", body: { c: id } })).data as { user_id: string; full_name: string }[];
    const liam = people.find((p) => p.full_name === "Liam Hansen")!.user_id;
    const subs = await api(page, `/rest/v1/submissions?student_id=eq.${liam}`);
    const grades = await api(page, `/rest/v1/grades?student_id=eq.${liam}`);
    expect(subs.data).toEqual([]);
    expect(grades.data).toEqual([]);
    expect(subs.text + grades.text).not.toContain("onion cells");
    expect(subs.text + grades.text).not.toContain("Good observations");
  });
});
