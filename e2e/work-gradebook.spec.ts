// Stories US-32 and US-33: the teacher's gradebook and its CSV export.
import { test, expect, reset, signIn, users, type Who } from "./fixtures";
import { readFileSync } from "node:fs";
import type { Page } from "@playwright/test";

async function login(page: Page, who: Who) {
  await signIn(page, who);
  await expect(page.getByRole("banner")).toContainText(users[who].name);
}

async function api(page: Page, path: string) {
  return page.evaluate(async (path) => {
    const token = JSON.parse(localStorage.getItem("scientia-auth")!).access_token;
    const cfg = await (await fetch("/config.json")).json();
    const res = await fetch(path, { headers: { apikey: cfg.anonKey, authorization: `Bearer ${token}` } });
    return { status: res.status, text: await res.text() };
  }, path);
}

async function openCourse(page: Page, code: string, path = "") {
  const id = JSON.parse((await api(page, `/rest/v1/courses?select=id&code=eq.${code}`)).text)[0].id as string;
  await page.goto(`/courses/${id}${path}`);
  await expect(page.getByRole("navigation", { name: "Course" })).toBeVisible();
  return id;
}

test.beforeEach(() => reset());

test.describe("Gradebook", () => {
  test("@US-32 rows and columns follow the specification", async ({ page }) => {
    await login(page, "ingrid");
    await openCourse(page, "BIO101", "/gradebook");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Gradebook");
    const rows = page.locator("main tbody tr");
    await expect(rows).toHaveCount(4);
    const names = await rows.locator("th").allTextContents();
    expect(names).toEqual(["Noah Berg", "Liam Hansen", "Maya Okafor", "Sofia Reyes"]);
    const headers = (await page.locator("main thead th").allTextContents()).map((t) => t.trim());
    expect(headers.slice(1)).toEqual(["Safety acknowledgement (10)", "Lab report 1 (100)", "Photosynthesis worksheet (50)", "Field journal (100)", "Total"]);
  });

  test("@US-32 cells show scores, drafts, late and missing work, and totals skip missing", async ({ page }) => {
    await login(page, "ingrid");
    await openCourse(page, "BIO101", "/gradebook");
    const cell = (student: string, col: number) => page.locator("main tbody tr").filter({ has: page.getByRole("rowheader", { name: student }) }).locator("td").nth(col);
    await expect(cell("Maya Okafor", 0)).toContainText("10");
    await expect(cell("Maya Okafor", 1)).toContainText("86");
    await expect(cell("Liam Hansen", 1)).toContainText("72");
    await expect(cell("Liam Hansen", 1)).toContainText("Not released");
    await expect(cell("Sofia Reyes", 1)).toContainText("Late, needs grading");
    await expect(cell("Noah Berg", 1)).toContainText("Missing");
    await expect(cell("Maya Okafor", 4)).toHaveText("87.3%");
    await expect(cell("Liam Hansen", 4)).toHaveText("72.0%");
    await expect(cell("Sofia Reyes", 4)).toHaveText("–");
    await expect(cell("Noah Berg", 4)).toHaveText("–");

    const legend = page.getByRole("region", { name: "Legend" });
    for (const term of ["Not released", "Released", "Missing", "Late", "Needs grading"]) await expect(legend.getByText(term, { exact: true })).toBeVisible();
  });

  test("@US-32 a cell opens that submission's grading view", async ({ page }) => {
    await login(page, "ingrid");
    await openCourse(page, "BIO101", "/gradebook");
    await page.locator("main tbody tr").filter({ has: page.getByRole("rowheader", { name: "Liam Hansen" }) }).locator("td").nth(1).getByRole("link").click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Liam Hansen: Lab report 1");
  });

  test("@US-33 export the gradebook as CSV", async ({ page }) => {
    await login(page, "ingrid");
    await openCourse(page, "BIO101", "/gradebook");
    const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("button", { name: "Export CSV" }).click()]);
    expect(download.suggestedFilename()).toBe("bio101-gradebook.csv");
    const csv = readFileSync(await download.path(), "utf8").trim().split(/\r?\n/);
    expect(csv[0]).toBe("Last name,First name,Email,Safety acknowledgement (10),Lab report 1 (100),Photosynthesis worksheet (50),Field journal (100),Total %");
    expect(csv).toHaveLength(5);
    expect(csv.slice(1).map((l) => l.split(",")[0])).toEqual(["Berg", "Hansen", "Okafor", "Reyes"]);
    expect(csv).toContain("Okafor,Maya,maya.okafor@scientia.test,10,86,,,87.3");
    expect(csv).toContain("Hansen,Liam,liam.hansen@scientia.test,,72,,,72.0");
  });

  test("@US-33 students have no export and only see their own released grades", async ({ page }) => {
    await login(page, "maya");
    const id = await openCourse(page, "BIO101");
    for (const path of ["", "/modules", "/assignments", "/announcements", "/discussions", "/grades", "/people", "/gradebook", "/grading"]) {
      await page.goto(`/courses/${id}${path}`);
      await expect(page.getByRole("main")).toBeVisible();
      await expect(page.getByRole("button", { name: "Export CSV" })).toHaveCount(0);
      await expect(page.getByRole("link", { name: "Export CSV" })).toHaveCount(0);
    }
    const me = await page.evaluate(() => JSON.parse(localStorage.getItem("scientia-auth")!).user.id as string);
    const res = await api(page, "/rest/v1/grades");
    const rows = JSON.parse(res.text) as { student_id: string; released: boolean }[];
    expect(rows).toHaveLength(2);
    expect(rows.every((r) => r.student_id === me && r.released)).toBe(true);
    expect(res.text).not.toContain("Good observations");
  });
});
