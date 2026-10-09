// Shared types, loaders and small components for assignments, submissions and grading.
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { db, isUuid, must } from "../../../lib/supabase";
import { Button, Dialog } from "../../../ui";

export type Assignment = {
  id: string; course_id: string; title: string; description: string; due_at: string; points: number;
  accepts_text: boolean; accepts_files: boolean; allow_late: boolean; published: boolean; created_at: string;
};
export type FileRef = { path: string; name: string; size: number };
export type Submission = { id: string; assignment_id: string; student_id: string; body: string; files: FileRef[]; attempt: number; submitted_at: string };
export type Grade = { assignment_id: string; student_id: string; score: number | null; feedback: string; released: boolean; graded_at: string };
export type Student = { user_id: string; full_name: string; email: string | null };

const normAssignment = ({ my_due_at, ...a }: any): Assignment => ({ ...a, due_at: my_due_at ?? a.due_at, points: Number(a.points) });
const normGrade = (g: any): Grade => ({ ...g, score: g.score == null ? null : Number(g.score) });

export function normSub(s: any): Submission {
  return { ...s, files: Array.isArray(s.files) ? s.files : [] };
}

const rowsOf = <T,>(res: { data: T[] | null; error: { message: string } | null }): T[] => must(res) ?? [];

export async function loadAssignment(courseId: string, id: string): Promise<Assignment | null> {
  if (!isUuid(id)) return null;
  const { data, error } = await db().from("assignments").select("*, my_due_at").eq("id", id).eq("course_id", courseId).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? normAssignment(data) : null;
}

export async function loadAssignments(courseId: string, publishedOnly: boolean): Promise<Assignment[]> {
  let q = db().from("assignments").select("*, my_due_at").eq("course_id", courseId).order("my_due_at", { ascending: true });
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
  const [assignments, students, subs, grades, extensions] = await Promise.all([
    loadAssignments(courseId, true),
    loadStudents(courseId),
    db().from("submissions").select("*, assignments!inner(course_id)").eq("assignments.course_id", courseId),
    db().from("grades").select("*, assignments!inner(course_id)").eq("assignments.course_id", courseId),
    loadExtensions(courseId),
  ]);
  const extended = new Map(extensions.map((e) => [key(e.assignment_id, e.student_id), e.due_at]));
  return {
    assignments,
    students,
    subs: rowsOf(subs).map(normSub),
    grades: rowsOf(grades).map(normGrade),
    /** The due date for one student: theirs if they were given more time, else the assignment's. */
    dueFor: (a: Assignment, studentId: string) => latest(a.due_at, extended.get(key(a.id, studentId))),
  };
}

export type Extension = { assignment_id: string; student_id: string; due_at: string };
export async function loadExtensions(courseId: string, assignmentId?: string): Promise<Extension[]> {
  let q = db().from("extensions").select("assignment_id, student_id, due_at, assignments!inner(course_id)").eq("assignments.course_id", courseId);
  if (assignmentId) q = q.eq("assignment_id", assignmentId);
  return rowsOf(await q);
}
const latest = (a: string, b: string | undefined) => (b && new Date(b) > new Date(a) ? b : a);
export type TeacherData = Awaited<ReturnType<typeof loadTeacherData>>;

export const key = (assignmentId: string, studentId: string) => `${assignmentId}:${studentId}`;

export function acceptsLabel(a: Pick<Assignment, "accepts_text" | "accepts_files">) {
  return a.accepts_files && a.accepts_text ? "Upload a file or type an answer" : a.accepts_files ? "Upload a file" : "Type an answer";
}

export const lateWorkLabel = (allowLate: boolean) => (allowLate ? "Accepted, marked late" : "Not accepted after the due date");

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
  }, [paths]);
  if (!files.length) return null;
  return (
    <ul className="plain-list">
      {files.map((f) => (
        <li key={f.path}>{urls[f.path] ? <a href={urls[f.path]} download={f.name} target="_blank" rel="noreferrer">{f.name}</a> : <span>{f.name}</span>}</li>
      ))}
    </ul>
  );
}

/** Facts list (definition list) used on assignment pages. */
export function Facts({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="defs section">
      {items.map(([k, v]) => (
        <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
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

/** Submissions waiting for a first grade: the count on the dashboard, the course home and the queue's first tab. */
export const needsGrading = (d: TeacherData) => buildQueue(d).filter((r) => r.filter === "needs-grading").length;

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
      assignmentId: a.id, assignment: a.title, due: d.dueFor(a, s.student_id), submittedAt: s.submitted_at, submissionId: s.id,
    });
  }
  const now = Date.now();
  for (const a of d.assignments) {
    for (const st of d.students) {
      const due = d.dueFor(a, st.user_id);
      if (submitted.has(key(a.id, st.user_id)) || new Date(due).getTime() >= now) continue;
      rows.push({ id: `m:${key(a.id, st.user_id)}`, filter: "missing", studentId: st.user_id, student: st.full_name, assignmentId: a.id, assignment: a.title, due });
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

