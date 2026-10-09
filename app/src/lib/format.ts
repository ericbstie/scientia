// Dates follow docs/design/ui-guidelines.md: "Fri 17 Oct, 23:59"; the year only when not the current year.
function parts(d: Date, opts: Intl.DateTimeFormatOptions) {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-GB", { ...opts, hourCycle: "h23" }).formatToParts(d).map((x) => [x.type, x.value]));
  return p as Record<string, string>;
}
export function fmtDate(d: string | Date) {
  const date = new Date(d);
  const p = parts(date, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  const year = date.getFullYear() === new Date().getFullYear() ? "" : ` ${p.year}`;
  return `${p.weekday} ${p.day} ${p.month}${year}`;
}
export function fmtTime(d: string | Date) {
  const p = parts(new Date(d), { hour: "2-digit", minute: "2-digit" });
  return `${p.hour}:${p.minute}`;
}
export const fmtDateTime = (d: string | Date) => `${fmtDate(d)}, ${fmtTime(d)}`;

/** "in 3 days", "2 hours ago" */
export function relative(d: string | Date, now = Date.now()) {
  const diff = new Date(d).getTime() - now;
  const abs = Math.abs(diff);
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  const units: [Intl.RelativeTimeFormatUnit, number][] = [["day", 86400000], ["hour", 3600000], ["minute", 60000]];
  for (const [unit, ms] of units) if (abs >= ms || unit === "minute") return rtf.format(Math.round(diff / ms), unit);
  return "";
}

export type StudentStatus = "Not submitted" | "Submitted" | "Late" | "Missing" | "Closed" | "Graded";

/** The one status vocabulary for a student's view of an assignment (ui-guidelines.md). */
export function studentStatus(a: { due_at: string; allow_late: boolean }, submittedAt?: string | null, gradeReleased?: boolean, now = Date.now()): StudentStatus {
  if (gradeReleased) return "Graded";
  const due = new Date(a.due_at).getTime();
  if (submittedAt) return new Date(submittedAt).getTime() > due ? "Late" : "Submitted";
  if (now <= due) return "Not submitted";
  return a.allow_late ? "Missing" : "Closed";
}

/** "1 day late", "3 hours late" */
export function lateBy(dueAt: string, submittedAt: string) {
  const ms = new Date(submittedAt).getTime() - new Date(dueAt).getTime();
  const days = Math.round(ms / 86400000);
  if (days >= 1) return `${days} day${days === 1 ? "" : "s"} late`;
  const hours = Math.max(1, Math.round(ms / 3600000));
  return `${hours} hour${hours === 1 ? "" : "s"} late`;
}

export const pct = (score: number, points: number) => (points > 0 ? Math.round((score / points) * 1000) / 10 : 0);
export const num = (n: number | string | null | undefined) => (n == null ? "–" : Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 }));

export function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((s) => s[0]!.toUpperCase()).join("");
}
