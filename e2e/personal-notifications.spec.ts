// Notifications list and bell (US-17) and who receives which notification (US-16).
import { test, expect, reset, signIn, client, type Who } from "./fixtures";
import type { Page } from "@playwright/test";

type Api = Awaited<ReturnType<typeof client>>;
const titlesOf = async (a: Api) => (await a.get("notifications?select=title&order=created_at.desc")).map((n: { title: string }) => n.title) as string[];

const bell = (page: Page) => page.getByRole("banner").getByRole("link", { name: /^Notifications/ });

test.describe("Notification list", () => {
  test.beforeEach(() => reset());

  test("@US-17 the bell shows the unread count and the list shows read state", async ({ page }) => {
    await signIn(page, "maya");
    await expect(page.getByTestId("unread-count")).toHaveText("2");
    await bell(page).click();
    await expect(page.getByRole("heading", { level: 1, name: "Notifications" })).toBeVisible();

    const rows = page.getByRole("listitem");
    await expect(rows).toHaveCount(3);
    const grade = rows.filter({ hasText: "Grade released: Lab report 1" });
    const marking = rows.filter({ hasText: "New announcement: Lab report 1 marking update" });
    const reading = rows.filter({ hasText: "New announcement: Reading list posted" });
    await expect(grade).toContainText("Unread");
    await expect(marking).toContainText("Unread");
    await expect(reading).not.toContainText("Unread");
    await expect(rows.last()).toContainText("New announcement: Lab report 1 marking update");
  });

  test("@US-17 opening a notification goes to its target and counts it as read", async ({ page }) => {
    await signIn(page, "maya");
    await bell(page).click();
    await page.getByRole("link", { name: "Grade released: Lab report 1" }).click();
    await expect(page).toHaveURL(/\/courses\/[0-9a-f-]+\/assignments\/[0-9a-f-]+$/);
    await expect(page.getByTestId("unread-count")).toHaveText("1");
    await page.goBack();
    await expect(page.getByRole("listitem").filter({ hasText: "Grade released: Lab report 1" })).not.toContainText("Unread");
  });

  test("@US-17 Mark all as read clears the count and keeps the list", async ({ page }) => {
    await signIn(page, "maya");
    await bell(page).click();
    await page.getByRole("button", { name: "Mark all as read" }).click();
    await expect(page.getByTestId("unread-count")).toHaveCount(0);
    await expect(page.getByRole("listitem")).toHaveCount(3);
    await expect(page.getByText("Unread", { exact: true })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Mark all as read" })).toHaveCount(0);
  });

  test("@US-17 an account without notifications sees an empty state", async ({ page }) => {
    await signIn(page, "liam");
    await expect(page.getByTestId("unread-count")).toHaveCount(0);
    await bell(page).click();
    await expect(page.getByText("No notifications")).toBeVisible();
    await expect(page.getByRole("button", { name: "Mark all as read" })).toHaveCount(0);
  });
});

test.describe("Who is notified", () => {
  test.beforeEach(() => reset());

  const students: Who[] = ["maya", "liam", "sofia", "noah"];

  test("@US-16 an announcement notifies each student once, even after an edit", async ({ request }) => {
    const ingrid = await client(request, "ingrid");
    const [bio] = await ingrid.get("courses?code=eq.BIO101&select=id");
    const [ann] = await ingrid.post("announcements", { course_id: bio.id, title: "Field trip", body: "Bring boots." });
    await ingrid.patch(`announcements?id=eq.${ann.id}`, { body: "Bring boots and water." });
    for (const who of students) {
      const titles = await titlesOf(await client(request, who));
      expect(titles.filter((t) => t === "New announcement: Field trip"), who).toHaveLength(1);
    }
    for (const who of ["priya", "ingrid"] as Who[]) expect(await titlesOf(await client(request, who)), who).toEqual([]);
  });

  test("@US-16 publishing an assignment and changing a due date each notify the students once", async ({ request }) => {
    const ingrid = await client(request, "ingrid");
    await ingrid.patch("assignments?title=eq.Final%20project", { published: true });
    const [journal] = await ingrid.get("assignments?title=eq.Field%20journal&select=due_at");
    await ingrid.patch("assignments?title=eq.Field%20journal", { due_at: new Date(new Date(journal.due_at).getTime() + 86400000).toISOString() });
    for (const who of students) {
      const titles = await titlesOf(await client(request, who));
      expect(titles.filter((t) => t === "New assignment: Final project"), who).toHaveLength(1);
      expect(titles.filter((t) => t === "Due date changed: Field journal"), who).toHaveLength(1);
    }
  });

  test("@US-16 releasing a grade notifies only that student", async ({ request }) => {
    const ingrid = await client(request, "ingrid");
    const [lab] = await ingrid.get("assignments?title=eq.Lab%20report%201&select=id");
    const liam = await client(request, "liam");
    const [me] = await liam.get("profiles?full_name=eq.Liam%20Hansen&select=id");
    await ingrid.patch(`grades?assignment_id=eq.${lab.id}&student_id=eq.${me.id}`, { released: true });
    expect((await titlesOf(liam)).filter((t) => t === "Grade released: Lab report 1")).toHaveLength(1);
    expect((await titlesOf(await client(request, "maya"))).filter((t) => t === "Grade released: Lab report 1")).toHaveLength(1);
  });

  test("@US-16 a reply notifies the thread author only", async ({ request }) => {
    const maya = await client(request, "maya");
    const [thread] = await maya.get("threads?title=eq.Question%20about%20the%20lab%20report&select=id,course_id");
    await maya.post("replies", { thread_id: thread.id, body: "One more thing." });
    await maya.post("threads", { course_id: thread.course_id, title: "Lab partner?", body: "Anyone want to pair up?" });
    expect((await titlesOf(await client(request, "liam"))).filter((t) => t === "New reply: Question about the lab report")).toHaveLength(1);
    for (const who of ["maya", "sofia", "noah", "priya", "ingrid"] as Who[]) {
      const titles = await titlesOf(await client(request, who));
      expect(titles.filter((t) => t.startsWith("New reply")), who).toEqual([]);
    }
    for (const who of ["maya", "liam", "sofia", "noah", "priya", "ingrid"] as Who[]) {
      expect((await titlesOf(await client(request, who))).filter((t) => t.includes("Lab partner?")), who).toEqual([]);
    }
  });
});
