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
function fmtTime(d: string | Date) {
  const p = parts(new Date(d), { hour: "2-digit", minute: "2-digit" });
  return `${p.hour}:${p.minute}`;
}
export const fmtDateTime = (d: string | Date) => `${fmtDate(d)}, ${fmtTime(d)}`;

/** Days as a calendar counts them, so they agree with the date beside them: "tomorrow", "in 2 days",
 *  "14 days ago"; on the same day, hours or minutes: "in 5 hours". */
export function relative(d: string | Date, now = Date.now()) {
  const date = new Date(d), today = new Date(now);
  const day = (x: Date) => Date.UTC(x.getFullYear(), x.getMonth(), x.getDate());
  const days = Math.round((day(date) - day(today)) / 86400000);
  const rtf = new Intl.RelativeTimeFormat("en-GB", { numeric: "auto" });
  if (days) return rtf.format(days, "day");
  const diff = date.getTime() - now;
  return Math.abs(diff) >= 3600000 ? rtf.format(Math.round(diff / 3600000), "hour") : rtf.format(Math.round(diff / 60000), "minute");
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

/** How late a submission was ("1 day", "3 hours"), or null when it was on time. */
export function lateBy(dueAt: string, submittedAt: string) {
  const ms = new Date(submittedAt).getTime() - new Date(dueAt).getTime();
  if (ms <= 0) return null;
  const days = Math.round(ms / 86400000);
  if (days >= 1) return `${days} day${days === 1 ? "" : "s"}`;
  const hours = Math.max(1, Math.round(ms / 3600000));
  return `${hours} hour${hours === 1 ? "" : "s"}`;
}

/** Percentage with one decimal, always: "72.0", "87.3". */
export const pct = (score: number, points: number) => (points > 0 ? (Math.round((score / points) * 1000) / 10).toFixed(1) : "0.0");
export const num = (n: number | string | null | undefined) => (n == null ? "–" : Number(n).toLocaleString(undefined, { maximumFractionDigits: 2 }));

const words = (name: string) => name.trim().split(/\s+/).filter(Boolean);
/** "Dr. Ingrid Solberg" → "IS" (the last two words, so titles are skipped). */
export const initials = (name: string) => words(name).slice(-2).map((w) => w[0]!.toUpperCase()).join("");
export const lastName = (name: string) => words(name).at(-1) ?? "";
export const firstName = (name: string) => words(name).slice(0, -1).join(" ");
/** Sorts people by last name, then full name. */
export const byLastName = <T extends { full_name: string }>(a: T, b: T) =>
  lastName(a.full_name).localeCompare(lastName(b.full_name)) || a.full_name.localeCompare(b.full_name);

const pad = (n: number) => String(n).padStart(2, "0");
/** "2026-10-09" in the viewer's time zone. */
const dayKey = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
/** Value for <input type="datetime-local"> in the viewer's time zone. */
export const toLocalInput = (d: Date) => `${dayKey(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
