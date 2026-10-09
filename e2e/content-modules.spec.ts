import type { Page } from "@playwright/test";
import { test, expect, reset, users, PASSWORD, type Who } from "./fixtures";

async function login(page: Page, who: Who) {
  await page.goto("/sign-in");
  await page.evaluate(() => localStorage.removeItem("scientia-auth"));
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(users[who].email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL((u) => !u.pathname.startsWith("/sign-in"));
  await expect(page.getByRole("banner")).toContainText(users[who].name);
}

async function courseBase(page: Page, code: string) {
  const id = await page.evaluate(async (c) => {
    const { anonKey } = await (await fetch("/config.json")).json();
    const s = JSON.parse(localStorage.getItem("scientia-auth")!);
    const r = await fetch(`/rest/v1/courses?select=id&code=eq.${c}`, { headers: { apikey: anonKey, authorization: `Bearer ${s.access_token}` } });
    return (await r.json())[0].id as string;
  }, code);
  return `/courses/${id}`;
}

async function openModules(page: Page, who: Who) {
  await login(page, who);
  await page.goto(await courseBase(page, "BIO101"));
  await page.getByRole("navigation", { name: "Course" }).getByRole("link", { name: "Modules" }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Modules");
  return page.url();
}

const moduleTitles = (page: Page) => page.getByRole("main").getByRole("heading", { level: 2 });
const region = (page: Page, name: string | RegExp) => page.getByRole("region", { name });

test.describe("Modules", () => {
  test.beforeEach(() => reset());

  test("@US-6 Maya browses modules and opens a page, a file and a link", async ({ page }) => {
    await openModules(page, "maya");
    await expect(moduleTitles(page)).toHaveText(["Week 1: Cells", "Week 2: Photosynthesis"]);
    await expect(page.getByText("Week 3: Genetics")).toHaveCount(0);
    await expect(region(page, "Week 1: Cells").getByRole("listitem")).toHaveText([/Welcome and syllabus/, /Cell structure \(PDF\)/, /Khan Academy: Cell biology/]);
    await expect(region(page, "Week 2: Photosynthesis").getByRole("listitem")).toHaveText([/Photosynthesis overview/, /Photosynthesis explained/]);
    await expect(page.getByRole("button", { name: /Add|Delete|Publish/ })).toHaveCount(0);

    // Link item: opens in a new tab, safely. The test does not follow it.
    const link = page.getByRole("link", { name: "Khan Academy: Cell biology" });
    await expect(link).toHaveAttribute("href", "https://www.khanacademy.org/science/biology/structure-of-a-cell");
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", /noopener/);

    // File item downloads under its own name.
    const [download] = await Promise.all([page.waitForEvent("download"), page.getByRole("link", { name: "Cell structure (PDF)" }).click()]);
    expect(download.suggestedFilename()).toBe("cell-structure.pdf");

    // Page item.
    await page.getByRole("link", { name: "Welcome and syllabus" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Welcome and syllabus");
    await expect(page.getByText("Hand in work on Scientia before 23:59 on the due date.")).toBeVisible();
    await expect(page.getByText("Office hours: Tuesdays 14:00–15:00, room B2.14.")).toBeVisible();
    await page.locator(".page-header").getByRole("link", { name: /Modules/ }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Modules");
  });

  test("@US-6 a draft page is not found for a student", async ({ page }) => {
    await login(page, "ingrid");
    const base = await courseBase(page, "BIO101");
    await page.goto(`${base}/modules`);
    await page.getByRole("link", { name: "Mendel and peas" }).click();
    const url = page.url();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Mendel and peas");
    await login(page, "maya");
    await page.goto(url);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Page not found");
  });

  test("@US-23 Ingrid creates and publishes modules; students see only published ones", async ({ page }) => {
    await openModules(page, "ingrid");
    await expect(moduleTitles(page)).toHaveText(["Week 1: Cells", "Week 2: Photosynthesis", "Week 3: Genetics"]);
    await expect(page.getByText("Draft", { exact: true })).toHaveCount(1);
    await expect(region(page, /Week 3: Genetics/)).toContainText("Draft");

    // An empty name is refused.
    await page.getByRole("button", { name: "Add module" }).first().click();
    const dialog = page.getByRole("dialog", { name: "Add module" });
    await dialog.getByRole("button", { name: "Add module" }).click();
    await expect(dialog.getByRole("alert")).toHaveText("Enter a module name");
    await expect(dialog.getByLabel("Name")).toHaveAttribute("aria-describedby", /error/);
    await expect(dialog.getByLabel("Name")).toBeFocused();
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(moduleTitles(page)).toHaveCount(3);

    await page.getByRole("button", { name: "Add module" }).first().click();
    await dialog.getByLabel("Name").fill("Week 4: Ecology");
    await dialog.getByRole("button", { name: "Add module" }).click();
    await expect(moduleTitles(page)).toHaveText(["Week 1: Cells", "Week 2: Photosynthesis", "Week 3: Genetics", /Week 4: Ecology/]);
    await expect(region(page, /Week 4: Ecology/)).toContainText("Draft");
    await expect(region(page, /Week 4: Ecology/)).toContainText("This module is empty.");

    // Maya sees neither draft.
    await openModules(page, "maya");
    await expect(moduleTitles(page)).toHaveText(["Week 1: Cells", "Week 2: Photosynthesis"]);

    // Publishing Week 3 shows it, and its page, to Maya; unpublishing hides it again.
    await openModules(page, "ingrid");
    await region(page, /Week 3: Genetics/).getByRole("button", { name: "Publish" }).click();
    await expect(region(page, /Week 3: Genetics/).getByRole("button", { name: "Unpublish" })).toBeVisible();
    await openModules(page, "maya");
    await expect(moduleTitles(page)).toHaveText(["Week 1: Cells", "Week 2: Photosynthesis", "Week 3: Genetics"]);
    await expect(region(page, "Week 3: Genetics")).toContainText("Mendel and peas");
    await openModules(page, "ingrid");
    await region(page, /Week 3: Genetics/).getByRole("button", { name: "Unpublish" }).click();
    await expect(region(page, /Week 3: Genetics/)).toContainText("Draft");
    await openModules(page, "maya");
    await expect(moduleTitles(page)).toHaveText(["Week 1: Cells", "Week 2: Photosynthesis"]);
  });

  test("@US-24 Ingrid adds a page, a file and a link, then deletes an item", async ({ page }) => {
    const modulesUrl = await openModules(page, "ingrid");
    await page.getByRole("button", { name: "Add module" }).first().click();
    await page.getByRole("dialog").getByLabel("Name").fill("Week 4: Ecology");
    await page.getByRole("dialog").getByRole("button", { name: "Add module" }).click();
    const week4 = region(page, /Week 4: Ecology/);
    await expect(week4).toBeVisible();

    // Page, with formatting.
    await week4.getByRole("link", { name: "Add page" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Add page");
    await page.getByLabel("Title").fill("Ecology intro");
    await page.getByLabel("Body").fill("Food **webs** link producers to consumers:\n- Producers\n- Consumers");
    await page.getByRole("button", { name: "Save page" }).click();
    await expect(page).toHaveURL(modulesUrl);
    await expect(week4.getByRole("link", { name: "Ecology intro" })).toBeVisible();

    // File.
    await week4.getByRole("button", { name: "Add file" }).click();
    await page.getByRole("dialog", { name: "Add file" }).getByLabel("File").setInputFiles("e2e/files/sample.pdf");
    await page.getByRole("dialog", { name: "Add file" }).getByRole("button", { name: "Add file" }).click();
    await expect(week4.getByRole("link", { name: "sample.pdf" })).toBeVisible();

    // Link: a bad address is refused.
    await week4.getByRole("button", { name: "Add link" }).click();
    const linkDialog = page.getByRole("dialog", { name: "Add link" });
    await linkDialog.getByLabel("Title").fill("Food webs");
    await linkDialog.getByLabel("URL").fill("not a url");
    await linkDialog.getByRole("button", { name: "Add link" }).click();
    await expect(linkDialog.getByRole("alert")).toHaveText("Enter a web address starting with http:// or https://");
    await expect(linkDialog.getByLabel("URL")).toHaveAttribute("aria-describedby", /error/);
    await linkDialog.getByLabel("URL").fill("https://example.org/food-webs");
    await linkDialog.getByRole("button", { name: "Add link" }).click();
    await expect(week4.getByRole("link", { name: "Food webs" })).toHaveAttribute("href", "https://example.org/food-webs");

    // Items are listed in the order they were added.
    await expect(week4.getByRole("listitem")).toHaveText([/Ecology intro/, /sample\.pdf/, /Food webs/]);

    // The page renders bold text and a bulleted list.
    await week4.getByRole("link", { name: "Ecology intro" }).click();
    await expect(page.getByRole("heading", { level: 1 })).toHaveText("Ecology intro");
    await expect(page.locator(".prose strong")).toHaveText("webs");
    await expect(page.locator(".prose ul > li")).toHaveText(["Producers", "Consumers"]);

    // Students see nothing until Week 4 is published; then Maya can download the file.
    await page.goto(modulesUrl);
    await region(page, /Week 4: Ecology/).getByRole("button", { name: "Publish" }).click();
    await expect(region(page, /Week 4: Ecology/).getByRole("button", { name: "Unpublish" })).toBeVisible();
    await openModules(page, "maya");
    const [download] = await Promise.all([page.waitForEvent("download"), region(page, "Week 4: Ecology").getByRole("link", { name: "sample.pdf" }).click()]);
    expect(download.suggestedFilename()).toBe("sample.pdf");

    // Delete asks first; cancelling keeps the item.
    await openModules(page, "ingrid");
    const item = region(page, /Week 4: Ecology/).getByRole("listitem").filter({ hasText: "Food webs" });
    await item.getByRole("button", { name: "Delete" }).click();
    const confirm = page.getByRole("dialog");
    await expect(confirm.getByRole("button", { name: "Cancel" })).toBeFocused();
    await confirm.getByRole("button", { name: "Cancel" }).click();
    await expect(item).toBeVisible();
    await item.getByRole("button", { name: "Delete" }).click();
    await confirm.getByRole("button", { name: "Delete" }).click();
    await expect(region(page, /Week 4: Ecology/).getByRole("listitem")).toHaveCount(2);
    await openModules(page, "maya");
    await expect(region(page, "Week 4: Ecology").getByRole("listitem")).toHaveText([/Ecology intro/, /sample\.pdf/]);
  });
});
