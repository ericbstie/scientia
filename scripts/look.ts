// Browse Scientia the way a person would, for blind user tests (no code reading needed).
// Each call starts fresh: optionally signs in, runs the steps in order, then prints
// what is on screen as an accessibility outline (headings, links, buttons, fields, text).
// A dialog that opens before the last step (a confirmation, say) is printed when it opens,
// so a later step that clicks through it does not hide it. While a dialog is open the page
// behind it cannot be used, as a screen reader reports it: steps act inside the dialog and the
// outline shows only the dialog.
//
//   bun run scripts/look.ts --as maya
//   bun run scripts/look.ts --as maya --step 'click link "Introduction to Biology"' --step 'click link "Assignments"'
//   bun run scripts/look.ts --as ingrid --step 'goto /calendar' --step 'fill "Email" with "x"' --step 'press Enter'
//
// Steps: goto <path> | click <role> "<name>" [in "<text>"] | fill "<label>" with "<text>" | press <key> | check "<label>" | select "<label>" option "<text>"
// `click` takes the role the outline shows (link, button, menuitem, tab...); if nothing with that role has
// the name, it clicks whatever else on screen does. When more than one thing matches, nothing is clicked:
// it lists them, and `click <role> "<name>" in "<text>"` picks the one whose line (list row, table row)
// holds that text. Fields are found by their label, or else a label that contains the text. Date and
// time fields take the date as a person types it ("23 Oct 2026 23:59", "23/10/2026 11:59 pm",
// "Fri 23 Oct, 23:59"); a missing year is this year.
// People: maya, liam, sofia, noah, priya (students), ingrid (teacher), admin. Add --phone for a 390px screen.
import { chromium, type Locator, type Page } from "@playwright/test";

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
page.setDefaultTimeout(5000);
const dialog = page.locator("dialog:modal");
// A date field holds an ISO value but shows it as the locale writes it, so the outline does too.
const shown = (outline: string) => outline.replace(/^(\s*- textbox "[^"]*": )(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}:\d{2}))?$/gm, (_, field, y, mo, d, hm) => `${field}${d}/${mo}/${y}${hm ? `, ${hm}` : ""}`);
const outline = async () => shown((await dialog.count())
  ? `A dialog is open. The page behind it cannot be used until it closes.\n${await dialog.ariaSnapshot()}`
  : await page.locator("body").ariaSnapshot());
/** The one element to click: the named role first, then any other clickable role with that name, narrowed
 *  to the line holding `within`. Waits up to 5 s for it to appear; refuses to guess between several. */
async function clickable(on: Page | Locator, role: string, name: string, within?: string) {
  const roles = [role, ...["link", "button", "menuitem", "tab", "option", "checkbox", "radio"].filter((x) => x !== role)];
  // The text of the element's line: its list or table row, else the section, form or dialog around it.
  const line = (el: Element) => ((el.closest("li, tr") ?? el.closest("section, header, form, dialog, main") ?? el).textContent ?? "").replace(/\s+/g, " ").trim();
  for (const until = Date.now() + 5000; Date.now() < until; await page.waitForTimeout(200))
    for (const r of roles)
      for (const exact of [true, false]) {
        const found: { el: Locator; text: string }[] = [];
        for (const el of await on.getByRole(r as "link", { name, exact }).all()) {
          const text = await el.evaluate(line);
          if (!within || text.toLowerCase().includes(within.toLowerCase())) found.push({ el, text });
        }
        if (found.length === 1) return found[0]!.el;
        if (found.length > 1)
          throw new Error(`${found.length} things called "${name}"${within ? ` in "${within}"` : ""} can be clicked, so nothing was clicked. Their lines read:\n${found.map((f, i) => `  ${i + 1}. ${f.text.slice(0, 100)}`).join("\n")}\nPick one with: click ${r} "${name}" in "<other text on its line>"`);
      }
  throw new Error(`nothing on screen called "${name}"${within ? ` in a line with "${within}"` : ""} can be clicked`);
}

/** The field with this label, or else the first whose label contains it. */
async function labelled(on: Page | Locator, label: string) {
  const exact = on.getByLabel(label, { exact: true });
  return ((await exact.count()) ? exact : on.getByLabel(label)).first();
}

/** The ISO value a date, time or date-time field holds, from a date as a person types it. */
function typedDate(type: string, text: string) {
  const t = text.trim().toLowerCase();
  if (/^\d{4}-\d{2}-\d{2}(t\d{2}:\d{2})?$|^\d{2}:\d{2}$/.test(t)) return t.toUpperCase();
  const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
  const time = t.match(/(\d{1,2}):(\d{2})\s*(?:([ap])\.?m\.?)?/) ?? t.match(/(\d{1,2})\.(\d{2})\s*([ap])\.?m\.?/);
  const rest = time ? t.replace(time[0], " ") : t;
  const year = (y?: string) => (!y ? new Date().getFullYear() : y.length === 2 ? 2000 + Number(y) : Number(y));
  let d = 0, mo = 0, y = 0, x: RegExpMatchArray | null;
  if ((x = rest.match(/(\d{4})-(\d{1,2})-(\d{1,2})/))) [y, mo, d] = [Number(x[1]), Number(x[2]), Number(x[3])];
  else if ((x = rest.match(/(\d{1,2})[/.-](\d{1,2})(?:[/.-](\d{2,4}))?/))) [d, mo, y] = [Number(x[1]), Number(x[2]), year(x[3])];
  else if ((x = rest.match(/(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]{3})[a-z]*\.?,?(?:\s+(\d{4}))?/))) [d, mo, y] = [Number(x[1]), months.indexOf(x[2]!) + 1, year(x[3])];
  else if ((x = rest.match(/([a-z]{3})[a-z]*\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?(?:\s+(\d{4}))?/))) [mo, d, y] = [months.indexOf(x[1]!) + 1, Number(x[2]), year(x[3])];
  const day = new Date(Date.UTC(y, mo - 1, d));
  const hour = time ? (Number(time[1]) % (time[3] ? 12 : 24)) + (time[3] === "p" ? 12 : 0) : -1;
  const pad = (n: number) => String(n).padStart(2, "0");
  const date = day.getUTCDate() === d && day.getUTCMonth() === mo - 1 ? `${y}-${pad(mo)}-${pad(d)}` : null;
  const clock = hour >= 0 && hour < 24 && Number(time![2]) < 60 ? `${pad(hour)}:${time![2]}` : null;
  const value = type === "date" ? date : type === "time" ? clock : date && clock && `${date}T${clock}`;
  if (!value) throw new Error(`"${text}" is not a ${type === "date" ? "date" : type === "time" ? "time" : "date and time"} this field can take, for example "23 Oct 2026${type === "date" ? "" : " 23:59"}"`);
  return value;
}

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
    const on = (await dialog.count()) ? dialog : page;
    if ((m = step.match(/^goto (\S+)/))) await page.goto(base + m[1]);
    else if ((m = step.match(/^click (\w+) "(.+?)"(?: in "(.+)")?$/))) await (await clickable(on, m[1]!, m[2]!, m[3])).click();
    else if ((m = step.match(/^fill "(.+)" with "(.*)"$/))) {
      const field = await labelled(on, m[1]!);
      const type = (await field.getAttribute("type")) ?? "";
      await field.fill(["date", "time", "datetime-local"].includes(type) ? typedDate(type, m[2]!) : m[2]!);
    }
    else if ((m = step.match(/^press (\S+)/))) await page.keyboard.press(m[1]!);
    else if ((m = step.match(/^check "(.+)"$/))) await (await labelled(on, m[1]!)).check();
    else if ((m = step.match(/^select "(.+)" option "(.+)"$/))) await (await labelled(on, m[1]!)).selectOption({ label: m[2]! });
    else throw new Error(`Unknown step: ${step}`);
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(300);
    if (i < steps.length - 1 && (await dialog.count())) console.log(`After "${step}" this dialog is open:\n${shown(await dialog.ariaSnapshot())}\n`);
  }
  await page.waitForLoadState("networkidle").catch(() => {});
  await page.waitForTimeout(400);
  console.log(`Page title: ${await page.title()}\nAddress: ${new URL(page.url()).pathname}\n`);
  console.log(await outline());
} catch (e) {
  console.log(`That did not work: ${(e as Error).message.split("\n")[0]}`);
  console.log(`Address: ${new URL(page.url()).pathname}\n`);
  console.log(await outline().catch(() => ""));
} finally {
  await browser.close();
}
