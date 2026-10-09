// Shared types, loaders and small components for assignments, submissions and grading.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { db, must } from "../../../lib/supabase";
import { Button, Dialog } from "../../../ui";

export type Assignment = {
  id: string; course_id: string; title: string; description: string; due_at: string; points: number;
  accepts_text: boolean; accepts_files: boolean; allow_late: boolean; published: boolean; created_at: string;
};
export type FileRef = { path: string; name: string; size: number };
export type Submission = { id: string; assignment_id: string; student_id: string; body: string; files: FileRef[]; attempt: number; submitted_at: string };
export type Grade = { assignment_id: string; student_id: string; score: number | null; feedback: string; released: boolean; graded_at: string };
export type Student = { user_id: string; full_name: string; email: string | null };

export const MAX_FILE_BYTES = 10 * 1024 * 1024;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const normAssignment = (a: any): Assignment => ({ ...a, points: Number(a.points) });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const normGrade = (g: any): Grade => ({ ...g, score: g.score == null ? null : Number(g.score) });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function normSub(s: any): Submission {
  return { ...s, files: Array.isArray(s.files) ? s.files : [] };
}

const rowsOf = <T,>(res: { data: T[] | null; error: { message: string } | null }): T[] => must(res) ?? [];

export async function loadAssignment(courseId: string, id: string): Promise<Assignment | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { data, error } = await db().from("assignments").select("*").eq("id", id).eq("course_id", courseId).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? normAssignment(data) : null;
}

export async function loadAssignments(courseId: string, publishedOnly: boolean): Promise<Assignment[]> {
  let q = db().from("assignments").select("*").eq("course_id", courseId).order("due_at", { ascending: true });
  if (publishedOnly) q = q.eq("published", true);
  return rowsOf(await q).map(normAssignment);
}

/** A student's own submissions and (released) grades in one course. */
export async function loadMyWork(courseId: string, userId: string) {
  const [assignments, subs, grades] = await Promise.all([
    loadAssignments(courseId, true),
    db().from("submissions").select("*, assignments!inner(course_id)").eq("assignments.course_id", courseId).eq("student_id", userId),
    db().from("grades").select("*, assignments!inner(course_id)").eq("assignments.course_id", courseId).eq("student_id", userId),
  ]);
  return {
    assignments,
    subs: new Map(rowsOf(subs).map((s) => [s.assignment_id as string, normSub(s)])),
    grades: new Map(rowsOf(grades).map((g) => [g.assignment_id as string, normGrade(g)])),
  };
}

export async function loadStudents(courseId: string): Promise<Student[]> {
  const [people, enrol] = await Promise.all([
    db().rpc("course_people", { c: courseId }),
    db().from("enrollments").select("user_id, created_at").eq("course_id", courseId),
  ]);
  const order = new Map(rowsOf(enrol).map((e) => [e.user_id as string, e.created_at as string]));
  return (rowsOf(people) as { user_id: string; full_name: string; email: string | null; role: string }[])
    .filter((p) => p.role === "student")
    .sort((a, b) => (order.get(a.user_id) ?? "").localeCompare(order.get(b.user_id) ?? ""));
}

/** Everything the teacher screens need for one course. */
export async function loadTeacherData(courseId: string) {
  const [assignments, students, subs, grades] = await Promise.all([
    loadAssignments(courseId, true),
    loadStudents(courseId),
    db().from("submissions").select("*, assignments!inner(course_id)").eq("assignments.course_id", courseId),
    db().from("grades").select("*, assignments!inner(course_id)").eq("assignments.course_id", courseId),
  ]);
  return {
    assignments,
    students,
    subs: rowsOf(subs).map(normSub),
    grades: rowsOf(grades).map(normGrade),
  };
}
export type TeacherData = Awaited<ReturnType<typeof loadTeacherData>>;

export const key = (assignmentId: string, studentId: string) => `${assignmentId}:${studentId}`;

export const lastName = (full: string) => full.trim().split(/\s+/).slice(-1)[0] ?? "";
export const firstName = (full: string) => full.trim().split(/\s+/).slice(0, -1).join(" ");

/** "Late by 1 day", "Late by 3 hours"; null when on time. */
export function lateByLabel(dueAt: string, submittedAt: string) {
  const ms = new Date(submittedAt).getTime() - new Date(dueAt).getTime();
  if (ms <= 0) return null;
  const days = Math.round(ms / 86400000);
  if (days >= 1) return `Late by ${days} day${days === 1 ? "" : "s"}`;
  const hours = Math.max(1, Math.round(ms / 3600000));
  return `Late by ${hours} hour${hours === 1 ? "" : "s"}`;
}

/** One decimal, always: 72.0, 87.3 */
export const pct1 = (score: number, points: number) => (points > 0 ? (Math.round((score / points) * 1000) / 10).toFixed(1) : "0.0");

const pad = (n: number) => String(n).padStart(2, "0");
/** Value for <input type="datetime-local"> in the viewer's time zone. */
export const toLocalInput = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

export function acceptsLabel(a: Pick<Assignment, "accepts_text" | "accepts_files">) {
  return a.accepts_files && a.accepts_text ? "File upload and text entry" : a.accepts_files ? "File upload" : "Text entry";
}

/** Links to files in the private submissions bucket, via short-lived signed URLs. */
export function FileLinks({ files }: { files: FileRef[] }) {
  const [urls, setUrls] = useState<Record<string, string>>({});
  const paths = files.map((f) => f.path).join("|");
  useEffect(() => {
    let live = true;
    if (!files.length) return;
    db().storage.from("submissions").createSignedUrls(files.map((f) => f.path), 3600).then(({ data }) => {
      if (live && data) setUrls(Object.fromEntries(data.filter((d) => d.signedUrl).map((d) => [d.path ?? "", d.signedUrl as string])));
    });
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paths]);
  if (!files.length) return null;
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
      {files.map((f) => (
        <li key={f.path}>{urls[f.path] ? <a href={urls[f.path]} download={f.name} target="_blank" rel="noreferrer">{f.name}</a> : <span>{f.name}</span>}</li>
      ))}
    </ul>
  );
}

/** Facts list (definition list) used on assignment pages. */
export function Facts({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl style={{ display: "grid", gridTemplateColumns: "max-content 1fr", gap: "var(--s1) var(--s4)", margin: "0 0 var(--s6)" }}>
      {items.map(([k, v]) => (
        <div key={k} style={{ display: "contents" }}><dt className="muted">{k}</dt><dd style={{ margin: 0 }}>{v}</dd></div>
      ))}
    </dl>
  );
}

/**
 * Asks before leaving a page with unsaved changes. The router is not a data router, so this
 * intercepts in-app link clicks itself. `go(path)` is the guarded way to navigate from code.
 */
export function useUnsavedGuard(dirty: boolean) {
  const navigate = useNavigate();
  const [pending, setPending] = useState<string | null>(null);
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!dirtyRef.current || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href);
      if (url.origin !== location.origin) return;
      if (url.pathname + url.search === location.pathname + location.search) return;
      e.preventDefault();
      e.stopPropagation();
      setPending(url.pathname + url.search + url.hash);
    }
    function onUnload(e: BeforeUnloadEvent) {
      if (dirtyRef.current) { e.preventDefault(); e.returnValue = ""; }
    }
    document.addEventListener("click", onClick, true);
    window.addEventListener("beforeunload", onUnload);
    return () => { document.removeEventListener("click", onClick, true); window.removeEventListener("beforeunload", onUnload); };
  }, []);

  const go = (path: string) => (dirtyRef.current ? setPending(path) : navigate(path));
  const dialog = (
    <Dialog open={pending !== null} onClose={() => setPending(null)} title="Discard unsaved changes?">
      <p>Your score and feedback have not been saved.</p>
      <div className="actions">
        <Button onClick={() => setPending(null)}>Stay on this page</Button>
        <Button variant="danger" onClick={() => { const p = pending!; dirtyRef.current = false; setPending(null); navigate(p); }}>Discard changes</Button>
      </div>
    </Dialog>
  );
  return { go, dialog };
}

export type Filter = "needs-grading" | "graded" | "released" | "missing";
export type QueueRow = {
  id: string; filter: Filter; studentId: string; student: string; assignmentId: string; assignment: string;
  due: string; submittedAt?: string; submissionId?: string;
};

/** Queue rows per filter, in the order the stories ask for. */
export function buildQueue(d: TeacherData): QueueRow[] {
  const name = new Map(d.students.map((s) => [s.user_id, s.full_name]));
  const asg = new Map(d.assignments.map((a) => [a.id, a]));
  const grade = new Map(d.grades.map((g) => [key(g.assignment_id, g.student_id), g]));
  const rows: QueueRow[] = [];
  const submitted = new Set<string>();
  for (const s of d.subs) {
    const a = asg.get(s.assignment_id);
    const who = name.get(s.student_id);
    if (!a || !who) continue;
    submitted.add(key(s.assignment_id, s.student_id));
    const g = grade.get(key(s.assignment_id, s.student_id));
    rows.push({
      id: s.id, filter: !g ? "needs-grading" : g.released ? "released" : "graded", studentId: s.student_id, student: who,
      assignmentId: a.id, assignment: a.title, due: a.due_at, submittedAt: s.submitted_at, submissionId: s.id,
    });
  }
  const now = Date.now();
  for (const a of d.assignments) {
    if (new Date(a.due_at).getTime() >= now) continue;
    for (const st of d.students) {
      if (submitted.has(key(a.id, st.user_id))) continue;
      rows.push({ id: `m:${key(a.id, st.user_id)}`, filter: "missing", studentId: st.user_id, student: st.full_name, assignmentId: a.id, assignment: a.title, due: a.due_at });
    }
  }
  const order = new Map(d.students.map((s, i) => [s.user_id, i]));
  const byStudent = (x: QueueRow, y: QueueRow) => (order.get(x.studentId) ?? 0) - (order.get(y.studentId) ?? 0);
  const dueDiff = (x: QueueRow, y: QueueRow) => new Date(x.due).getTime() - new Date(y.due).getTime();
  const submittedDiff = (x: QueueRow, y: QueueRow) => new Date(x.submittedAt ?? 0).getTime() - new Date(y.submittedAt ?? 0).getTime();
  return rows.sort((x, y) =>
    x.filter === "missing" && y.filter === "missing"
      ? -dueDiff(x, y) || byStudent(x, y) // most recent missing work first
      : dueDiff(x, y) || submittedDiff(x, y) || byStudent(x, y));
}

