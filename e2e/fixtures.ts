// Shared e2e helpers. Every spec imports { test, expect } from here.
//  - reset(): restores the documented demo data (docs/stories/README.md). Call it
//    in beforeEach of any spec that changes data.
//  - signIn(page, who): signs in through the real form.
//  - scan(page): axe accessibility scan of the current page (also runs
//    automatically at the end of every test). Results feed `mise run metrics`.
import { test as base, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { appendFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

export const PASSWORD = "Demo-pass-123";
export const users = {
  admin: { email: "admin@scientia.test", name: "Alex Admin" },
  ingrid: { email: "ingrid.solberg@scientia.test", name: "Dr. Ingrid Solberg" },
  maya: { email: "maya.okafor@scientia.test", name: "Maya Okafor" },
  liam: { email: "liam.hansen@scientia.test", name: "Liam Hansen" },
  sofia: { email: "sofia.reyes@scientia.test", name: "Sofia Reyes" },
  noah: { email: "noah.berg@scientia.test", name: "Noah Berg" },
  priya: { email: "priya.nair@scientia.test", name: "Priya Nair" },
} as const;
export type Who = keyof typeof users;

export function reset() {
  execFileSync("bun", ["run", "supabase/reset.ts"], { stdio: "pipe" });
}

export async function signIn(page: Page, who: Who, password = PASSWORD) {
  await page.goto("/sign-in");
  await page.getByLabel("Email").fill(users[who].email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
  await expect(page.getByRole("main")).toBeVisible();
  await page.waitForURL((url) => !url.pathname.startsWith("/sign-in"));
}

export async function signOut(page: Page) {
  await page.getByRole("button", { name: /account menu/i }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await page.waitForURL(/\/sign-in/);
}

export async function scan(page: Page) {
  if (page.isClosed() || !page.url().startsWith("http")) return;
  await page.waitForLoadState("networkidle").catch(() => {});
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  const line = {
    url: page.url(),
    test: base.info().title,
    violations: results.violations.map((v) => ({ id: v.id, impact: v.impact ?? "minor", nodes: v.nodes.length, help: v.help, targets: v.nodes.slice(0, 3).map((n) => n.target.join(" ")) })),
  };
  appendFileSync("e2e/.results/a11y.jsonl", JSON.stringify(line) + "\n");
  return line.violations;
}

export const test = base.extend<{ autoScan: void }>({
  autoScan: [
    async ({ page }, use) => {
      await use();
      if (base.info().status === "passed") await scan(page);
    },
    { auto: true },
  ],
});

export { expect };
