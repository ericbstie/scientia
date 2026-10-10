// Collects Scientia quality metrics, appends them to metrics/history.jsonl and
// prints a comparison with the previous run and with metrics/targets.json.
// Anything that cannot be measured yet is recorded as null.
import { existsSync, readFileSync, readdirSync, appendFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { gzipSync } from "node:zlib";

const root = join(import.meta.dir, "..");
const p = (...s: string[]) => join(root, ...s);
const read = (f: string) => (existsSync(f) ? readFileSync(f, "utf8") : null);

function walk(dir: string, ext: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) return walk(full, ext);
    return full.endsWith(ext) ? [full] : [];
  });
}

const m: Record<string, number | string | null> = { at: new Date().toISOString() };
try {
  m.commit = (await Bun.$`git -C ${root} rev-parse --short HEAD`.text()).trim();
} catch {
  m.commit = null;
}

// Stories and coverage
const storyIds = new Set<string>();
for (const f of walk(p("docs/stories"), ".md")) {
  for (const match of readFileSync(f, "utf8").matchAll(/^#{2,4}\s+(US-\d+)\b/gm)) storyIds.add(match[1]);
}
const covered = new Set<string>();
for (const f of walk(p("e2e"), ".spec.ts")) {
  for (const match of readFileSync(f, "utf8").matchAll(/@(US-\d+)\b/g)) covered.add(match[1]);
}
m["stories.total"] = storyIds.size;
m["stories.covered_pct"] = storyIds.size
  ? Math.round(([...storyIds].filter((id) => covered.has(id)).length / storyIds.size) * 1000) / 10
  : null;

// e2e results (Playwright JSON reporter). A run with `--reporter=<other>` leaves an
// old report.json behind while it rewrites a11y.jsonl: treat that report as stale.
const reportFile = p("e2e/.results/report.json");
const a11yFile = p("e2e/.results/a11y.jsonl");
const stale = existsSync(reportFile) && existsSync(a11yFile) && statSync(reportFile).mtimeMs < statSync(a11yFile).mtimeMs;
if (stale) console.warn("e2e/.results/report.json is older than the last a11y scan (run the suite with the default reporters); e2e.* recorded as null");
const report = stale ? null : read(reportFile);
if (report) {
  const r = JSON.parse(report);
  const s = r.stats ?? {};
  const total = (s.expected ?? 0) + (s.unexpected ?? 0) + (s.flaky ?? 0);
  m["e2e.total"] = total;
  m["e2e.pass_rate"] = total ? Math.round((((s.expected ?? 0) + (s.flaky ?? 0)) / total) * 1000) / 10 : null;
  m["e2e.flaky"] = s.flaky ?? 0;
  m["e2e.duration_s"] = s.duration ? Math.round(s.duration / 100) / 10 : null;
} else {
  m["e2e.total"] = m["e2e.pass_rate"] = m["e2e.flaky"] = m["e2e.duration_s"] = null;
}

// Accessibility (written by e2e/fixtures.ts)
const a11yRaw = read(a11yFile);
const a11y = a11yRaw && `[${a11yRaw.trim().split("\n").filter(Boolean).join(",")}]`;
if (a11y) {
  const scans: { url: string; violations: { id: string; impact: string; nodes: number }[]; overflow?: string | null }[] = JSON.parse(a11y);
  m["a11y.pages_scanned"] = new Set(scans.map((s) => s.url)).size;
  const serious = new Set<string>();
  for (const s of scans)
    for (const v of s.violations)
      if (v.impact === "serious" || v.impact === "critical") serious.add(`${new URL(s.url).pathname}|${v.id}`);
  m["a11y.serious"] = serious.size;
  const wide = new Map(scans.filter((s) => s.overflow).map((s) => [new URL(s.url).pathname, s.overflow]));
  m["design.phone_overflow"] = wide.size;
  for (const [path, why] of wide) console.warn(`scrolls sideways at 390px: ${path}: ${why}`);
} else {
  m["a11y.pages_scanned"] = m["a11y.serious"] = m["design.phone_overflow"] = null;
}

// Bundle size, of a fresh production build on the locked, patched dependencies (a dist/ or
// node_modules/ left from an older checkout measured the bundle before the patch: 238 KB, not 206).
await Bun.$`bun install --frozen-lockfile && bun run scripts/build.ts`.cwd(root).quiet();
const js = walk(p("dist"), ".js");
m["bundle.js_kb_gz"] = js.length
  ? Math.round(js.reduce((n, f) => n + gzipSync(readFileSync(f)).length, 0) / 102.4) / 10
  : null;

// UX click budget: rows like "| task | 2 |" in the "Click budget" table of docs/design/ia.md
const ia = read(p("docs/design/ia.md"));
if (ia && ia.includes("Click budget")) {
  const section = ia.split(/#+\s*Click budget/i)[1]?.split(/\n#+\s/)[0] ?? "";
  const clicks = [...section.matchAll(/^\|[^|\n]+\|\s*(\d+)\s*\|/gm)].map((x) => Number(x[1]));
  m["ux.max_clicks_to_core_task"] = clicks.length ? Math.max(...clicks) : null;
} else m["ux.max_clicks_to_core_task"] = null;

// Copy leaks: terms that must never appear in interface code (see ui-guidelines.md "Copy")
const forbidden = /\b(blackboard|canvas lms|instructure|moodle|google classroom|brightspace|itslearning|competitor|design[- ]focused|focused on design|minimal(ist)? ui|intuitive|user stor(y|ies)|milestone)\b/gi;
let leaks = 0;
for (const f of [...walk(p("app/src"), ".tsx"), ...walk(p("app/src"), ".ts"), p("app/index.html")]) {
  // Strings and JSX text only: drop comment lines.
  const code = readFileSync(f, "utf8").split("\n").filter((l) => !/^\s*(\/\/|\*|\/\*)/.test(l)).join("\n");
  leaks += (code.match(forbidden) ?? []).length;
}
m["copy.leaks"] = leaks;

// Design consistency (docs/design/brand.md rules 1 and 2): the look comes from Designsystemet and its generated
// theme; our stylesheet only lays pages out, and does it with the system's tokens.
const sheet = (read(p("app/src/styles.css")) ?? "").replace(/\/\*[\s\S]*?\*\//g, "");
const pages = [...walk(p("app/src"), ".tsx")].map((f) => readFileSync(f, "utf8"));
m["design.inline_styles"] = pages.reduce((n, code) => n + (code.match(/style=\{\{|<style[ >]/g) ?? []).length, 0);
m["design.font_sizes"] = new Set([...sheet.matchAll(/font-size:\s*([^;}]+)/g)].map((x) => x[1]!.trim())).size;
// Colour literals are allowed only where tokens are declared (the :root blocks).
const outsideTokens = sheet.replace(/:root\s*\{[^}]*\}/g, "");
m["design.literal_colors"] =
  (outsideTokens.match(/#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/gi) ?? []).length + pages.reduce((n, code) => n + (code.match(/#[0-9a-f]{6}\b|rgba?\(/gi) ?? []).length, 0);
// Overrides of the system: !important, a --ds-* token assigned here, a selector on a component's own ds- class.
m["design.overrides"] = (sheet.match(/!important|--ds-[\w-]+\s*:|\.ds-[\w-]+|\[class[*^$~|]?=["']?ds-/g) ?? []).length;
// Type, shape and depth are tokens: a px/rem/em size (or a numeric weight) in these properties, outside var(), counts.
m["design.literal_sizes"] = [...sheet.matchAll(/(?:font-size|line-height|border-radius|box-shadow|font-weight)\s*:\s*([^;}]+)/g)].filter(
  (x) => /\d(?:px|rem|em)\b|^\s*\d{3}\s*$/.test(x[1]!.replace(/var\([^)]*\)/g, "")),
).length;
m["design.custom_css_lines"] = sheet.split("\n").filter((l) => l.trim()).length;

// Blind user tests: first-pass "| Scenario | Result | ... |" table of the newest full pass among
// docs/process/reviews/m<n>[-<label>]-user-test.md: highest milestone, then the file added last.
// A full pass covers the seven scenarios the user-test skill lists; a round of fewer (round 7 ran
// five) does not move the number. Result cells start with Done, Partly or Failed.
const FULL_PASS = 7;
const milestone = (f: string) => Number(f.match(/\/m(\d+)[^/]*-user-test\.md$/)?.[1] ?? 0);
const added = async (f: string) => Number((await Bun.$`git -C ${root} log --diff-filter=A --format=%ct -1 -- ${f}`.nothrow().text()).trim()) || Infinity;
const firstPass = (f: string) => {
  const table = readFileSync(f, "utf8").split(/^\|\s*Scenario\s*\|\s*Result\s*\|.*$/m)[1]?.split(/\n\s*\n/)[0] ?? "";
  return [...table.matchAll(/^\|[^|\n]+\|\s*\**(Done|Partly|Failed)\b/gim)].map((x) => x[1]!.toLowerCase());
};
const userTests = await Promise.all(walk(p("docs/process/reviews"), "-user-test.md").map(async (f) => ({ f, results: firstPass(f), key: [milestone(f), await added(f)] })));
const pass = userTests.filter((u) => u.results.length >= FULL_PASS).sort((a, b) => a.key[0]! - b.key[0]! || a.key[1]! - b.key[1]!).at(-1);
const results = pass?.results ?? [];
m["ux.blind_tasks_done_pct"] = results.length
  ? Math.round((results.filter((r) => r === "done").length / results.length) * 1000) / 10
  : null;
// Round files quote this line rather than carrying an old number forward.
if (pass) console.log(`ux.blind_tasks_done_pct is read from ${relative(root, pass.f)}`);

// Process health
const briefs = walk(p("docs/process/briefs"), ".md").filter((f) => !f.endsWith("TEMPLATE.md"));
m["process.briefs"] = briefs.length;
m["process.briefs_with_criteria_pct"] = briefs.length
  ? Math.round((briefs.filter((f) => /##\s*Acceptance criteria[\s\S]*?- \[/.test(readFileSync(f, "utf8"))).length / briefs.length) * 1000) / 10
  : null;
try {
  const log = await Bun.$`git -C ${root} log --format=%H -1 ${"--grep=^retro("}`.text(); // interpolated: a bare "(" is shell syntax to Bun
  const sha = log.trim();
  if (sha) {
    const files = (await Bun.$`git -C ${root} show --name-only --format= ${sha}`.text()).split("\n");
    m["process.retro_changes"] = files.filter((f) =>
      /^(docs\/process\/|\.claude\/|scripts\/metrics\.ts|metrics\/targets\.json)/.test(f),
    ).length;
  } else m["process.retro_changes"] = null;
} catch {
  m["process.retro_changes"] = null;
}

// Compare
const historyFile = p("metrics/history.jsonl");
const history = (read(historyFile) ?? "").split("\n").filter(Boolean).map((l) => JSON.parse(l));
const prev = history.at(-1) ?? {};
const targets: Record<string, { min?: number; max?: number }> = JSON.parse(read(p("metrics/targets.json")) ?? "{}");

const rows = Object.keys(m)
  .filter((k) => k.includes("."))
  .map((k) => {
    const t = targets[k];
    const v = m[k];
    let status = "";
    if (t && typeof v === "number") status = (t.min !== undefined && v < t.min) || (t.max !== undefined && v > t.max) ? "MISS" : "ok";
    else if (t) status = "n/a";
    const target = t ? (t.min !== undefined ? `≥ ${t.min}` : `≤ ${t.max}`) : "";
    return { metric: k, previous: prev[k] ?? "", current: v ?? "null", target, status };
  });
console.table(rows);

if (!process.argv.includes("--dry")) appendFileSync(historyFile, JSON.stringify(m) + "\n");
if (process.argv.includes("--strict") && rows.some((r) => r.status === "MISS")) process.exit(1);
