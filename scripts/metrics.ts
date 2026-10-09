// Collects Scientia quality metrics, appends them to metrics/history.jsonl and
// prints a comparison with the previous run and with metrics/targets.json.
// Anything that cannot be measured yet is recorded as null.
import { existsSync, readFileSync, readdirSync, appendFileSync, statSync } from "node:fs";
import { join } from "node:path";
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

// e2e results (Playwright JSON reporter)
const report = read(p("e2e/.results/report.json"));
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
const a11y = read(p("e2e/.results/a11y.json"));
if (a11y) {
  const scans: { url: string; violations: { id: string; impact: string; nodes: number }[] }[] = JSON.parse(a11y);
  m["a11y.pages_scanned"] = new Set(scans.map((s) => s.url)).size;
  const serious = new Set<string>();
  for (const s of scans)
    for (const v of s.violations)
      if (v.impact === "serious" || v.impact === "critical") serious.add(`${new URL(s.url).pathname}|${v.id}`);
  m["a11y.serious"] = serious.size;
} else {
  m["a11y.pages_scanned"] = m["a11y.serious"] = null;
}

// Bundle size
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

// Process health
const briefs = walk(p("docs/process/briefs"), ".md").filter((f) => !f.endsWith("TEMPLATE.md"));
m["process.briefs"] = briefs.length;
m["process.briefs_with_criteria_pct"] = briefs.length
  ? Math.round((briefs.filter((f) => /##\s*Acceptance criteria[\s\S]*?- \[/.test(readFileSync(f, "utf8"))).length / briefs.length) * 1000) / 10
  : null;
try {
  const log = await Bun.$`git -C ${root} log --format=%H -1 --grep=^retro(`.text();
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
