// Browse Scientia the way a person would, for blind user tests (no code reading needed).
// Each call starts fresh: optionally signs in, runs the steps in order, then prints
// what is on screen as an accessibility outline (headings, links, buttons, fields, text).
// A dialog that opens before the last step (a confirmation, say) is printed when it opens,
// so a later step that clicks through it does not hide it.
//
//   bun run scripts/look.ts --as maya
//   bun run scripts/look.ts --as maya --step 'click link "Introduction to Biology"' --step 'click link "Assignments"'
//   bun run scripts/look.ts --as ingrid --step 'goto /calendar' --step 'fill "Email" with "x"' --step 'press Enter'
//
// Steps: goto <path> | click <role> "<name>" | fill "<label>" with "<text>" | press <key> | check "<label>" | select "<label>" option "<text>"
// People: maya, liam, sofia, noah, priya (students), ingrid (teacher), admin. Add --phone for a 390px screen.
import { chromium } from "@playwright/test";

const args = process.argv.slice(2);
const opt = (name: string) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : undefined; };
const steps: string[] = [];
args.forEach((a, i) => a === "--step" && steps.push(args[i + 1]!));
const who = opt("--as");
const base = process.env.BASE_URL ?? "http://localhost:3000";
const emails: Record<string, string> = {
  maya: "maya.okafor@scientia.test", liam: "liam.hansen@scientia.test", sofia: "sofia.reyes@scientia.test",
  noah: "noah.berg@scientia.test", priya: "priya.nair@scientia.test", ingrid: "ingrid.solberg@scientia.test", admin: "admin@scientia.test",
};

const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM_PATH });
const page = await browser.newPage({ viewport: args.includes("--phone") ? { width: 390, height: 844 } : { width: 1280, height: 900 }, locale: "en-GB", timezoneId: "UTC" });
try {
  await page.goto(base + "/sign-in");
  if (who) {
    await page.getByLabel("Email").fill(emails[who] ?? who);
    await page.getByLabel("Password").fill("Demo-pass-123");
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL((u) => !u.pathname.startsWith("/sign-in"), { timeout: 10000 });
  }
  for (const [i, step] of steps.entries()) {
    let m: RegExpMatchArray | null;
    if ((m = step.match(/^goto (\S+)/))) await page.goto(base + m[1]);
    else if ((m = step.match(/^click (\w+) "(.+)"$/))) {
      const exact = page.getByRole(m[1] as "link", { name: m[2], exact: true });
      await ((await exact.count()) ? exact : page.getByRole(m[1] as "link", { name: m[2] })).first().click({ timeout: 5000 });
    }
    else if ((m = step.match(/^fill "(.+)" with "(.*)"$/))) await page.getByLabel(m[1]!, { exact: true }).first().fill(m[2]!);
    else if ((m = step.match(/^press (\S+)/))) await page.keyboard.press(m[1]!);
    else if ((m = step.match(/^check "(.+)"$/))) await page.getByLabel(m[1]!, { exact: true }).first().check();
    else if ((m = step.match(/^select "(.+)" option "(.+)"$/))) await page.getByLabel(m[1]!, { exact: true }).first().selectOption({ label: m[2]! });
    else throw new Error(`Unknown step: ${step}`);
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(300);
    const dialog = page.locator("dialog[open]").first();
    if (i < steps.length - 1 && (await dialog.count())) console.log(`After "${step}" a dialog opened:\n${await dialog.ariaSnapshot()}\n`);
  }
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(400);
  console.log(`Page title: ${await page.title()}\nAddress: ${new URL(page.url()).pathname}\n`);
  console.log(await page.locator("body").ariaSnapshot());
} catch (e) {
  console.log(`That did not work: ${(e as Error).message.split("\n")[0]}`);
  console.log(`Address: ${new URL(page.url()).pathname}\n`);
  console.log(await page.locator("body").ariaSnapshot().catch(() => ""));
} finally {
  await browser.close();
}
