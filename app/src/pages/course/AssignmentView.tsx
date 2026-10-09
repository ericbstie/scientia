import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router";
import { useCourse, useDocTitle } from "../../App";
import { useAuth } from "../../lib/auth";
import { byLastName, fmtDateTime, lateBy, num, studentStatus, toLocalInput } from "../../lib/format";
import { db, MAX_UPLOAD_BYTES } from "../../lib/supabase";
import { useQuery } from "../../lib/useQuery";
import { Badge, Button, ButtonLink, Dialog, ErrorNote, ErrorSummary, Field, focusField, Loading, NotFound, PageHeader, Section, Select, StatusBadge, TextArea, useToast } from "../../ui";
import { Facts, FileLinks, acceptsLabel, lateWorkLabel, loadAssignment, loadExtensions, loadStudents, normSub, type Assignment, type FileRef, type Student, type Submission } from "./work/shared";

export function AssignmentView() {
  const { course, role } = useCourse();
  const { assignmentId } = useParams();
  const { data: a, error, loading, reload } = useQuery(() => loadAssignment(course.id, assignmentId!), [course.id, assignmentId]);
  if (loading && !a) return <div className="content"><Loading /></div>;
  if (error) return <div className="content"><ErrorNote error={error} /></div>;
  if (!a) return <NotFound />;
  return role === "teacher" ? <TeacherView a={a} reload={reload} /> : <StudentView a={a} />;
}

// ---------------------------------------------------------------------------

function TeacherView({ a, reload }: { a: Assignment; reload: () => void }) {
  const { course } = useCourse();
  useDocTitle(a.title);
  const base = `/courses/${course.id}`;
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const subs = useQuery(async () => {
    const { count, error } = await db().from("submissions").select("id", { count: "exact", head: true }).eq("assignment_id", a.id);
    if (error) throw new Error(error.message);
    return count ?? 0;
  }, [a.id, a.published]);

  async function setPublished(published: boolean) {
    setBusy(true);
    setErr(null);
    const { error } = await db().from("assignments").update({ published }).eq("id", a.id);
    setBusy(false);
    if (error) return setErr("Could not save. Check your connection and try again.");
    toast(published ? "Published" : "Unpublished");
    reload();
  }

  const hasSubs = (subs.data ?? 0) > 0;
  return (
    <div className="content">
      <PageHeader
        eyebrow={<Link to={`${base}/assignments`}>‹ Assignments</Link>}
        title={<>{a.title} {!a.published && <Badge>Draft</Badge>}</>}
      />
      <Facts items={[
        ["Due date", <time dateTime={a.due_at}>{fmtDateTime(a.due_at)}</time>],
        ["Points", `${num(a.points)} points`],
        ["How to hand in", acceptsLabel(a)],
        ["Late work", lateWorkLabel(a.allow_late)],
      ]} />
      <Section title="Instructions">
        <p className="prose">{a.description || "No instructions."}</p>
      </Section>
      {a.published && <MoreTime a={a} />}
      <ErrorNote error={err} />
      <div className="actions">
        <ButtonLink to={`${base}/assignments/${a.id}/edit`}>Edit</ButtonLink>
        {a.published ? (
          <>
            <Button disabled={busy || hasSubs} onClick={() => setPublished(false)}>Unpublish</Button>
            {hasSubs && <span className="muted">Cannot unpublish: students have submitted</span>}
          </>
        ) : (
          <Button variant="primary" disabled={busy} onClick={() => setPublished(true)}>Publish</Button>
        )}
        <Link to={`${base}/grading`}>Open grading queue</Link>
      </div>
    </div>
  );
}

/** Students given a later due date than everyone else on this assignment (US-45). */
function MoreTime({ a }: { a: Assignment }) {
  const { course } = useCourse();
  const toast = useToast();
  const [giving, setGiving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const { data, error, reload } = useQuery(async () => {
    const [students, extensions] = await Promise.all([loadStudents(course.id), loadExtensions(course.id, a.id)]);
    const name = new Map(students.map((s) => [s.user_id, s.full_name]));
    const given = extensions.flatMap((e) => (name.has(e.student_id) ? [{ ...e, full_name: name.get(e.student_id)! }] : []));
    return { students: students.sort(byLastName), given: given.sort(byLastName) };
  }, [course.id, a.id]);

  async function remove(studentId: string, name: string) {
    setErr(null);
    const { error } = await db().from("extensions").delete().eq("assignment_id", a.id).eq("student_id", studentId);
    if (error) return setErr("Could not remove the extra time. Check your connection and try again.");
    toast(`${name} is back to the usual due date`);
    reload();
  }

  return (
    <Section title="More time" action={<Button size="small" onClick={() => setGiving(true)} disabled={!data}>Give more time</Button>}>
      <ErrorNote error={error ?? err} />
      {data && (data.given.length === 0 ? <p className="muted">Everyone has the same due date.</p> : (
        <ul className="list">
          {data.given.map((e) => (
            <li key={e.student_id}>
              <div className="row">
                <div className="row-main">
                  <span className="row-title">{e.full_name}</span>
                  <div className="row-meta">Due <time dateTime={e.due_at}>{fmtDateTime(e.due_at)}</time></div>
                </div>
                <div className="row-side"><Button size="small" variant="ghost" aria-label={`Remove extra time for ${e.full_name}`} onClick={() => remove(e.student_id, e.full_name)}>Remove</Button></div>
              </div>
            </li>
          ))}
        </ul>
      ))}
      <Dialog open={giving} onClose={() => setGiving(false)} title="Give more time">
        {data && <MoreTimeForm a={a} students={data.students} onCancel={() => setGiving(false)} onDone={(msg) => { setGiving(false); toast(msg); reload(); }} />}
      </Dialog>
    </Section>
  );
}

function MoreTimeForm({ a, students, onCancel, onDone }: { a: Assignment; students: Student[]; onCancel: () => void; onDone: (message: string) => void }) {
  const [student, setStudent] = useState("");
  const [due, setDue] = useState(toLocalInput(new Date(new Date(a.due_at).getTime() + 7 * 86400000)));
  const [errors, setErrors] = useState<{ student?: string; due?: string }>({});
  const [fail, setFail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const errs: typeof errors = {};
    if (!student) errs.student = "Choose a student";
    if (!due) errs.due = "Enter a date and time";
    else if (new Date(due) <= new Date(a.due_at)) errs.due = `Choose a time after the usual due date, ${fmtDateTime(a.due_at)}`;
    setErrors(errs);
    setFail(null);
    if (Object.keys(errs).length) return focusField(errs.student ? "mt-student" : "mt-due");
    setBusy(true);
    const at = new Date(due).toISOString();
    const { error } = await db().from("extensions").upsert({ assignment_id: a.id, student_id: student, due_at: at });
    setBusy(false);
    if (error) return setFail("Could not save the extra time. Check your connection and try again.");
    onDone(`${students.find((s) => s.user_id === student)?.full_name} has until ${fmtDateTime(at)}`);
  }

  return (
    <form className="form" onSubmit={submit} noValidate>
      <ErrorNote error={fail} />
      <ErrorSummary errors={[errors.student && { id: "mt-student", message: errors.student }, errors.due && { id: "mt-due", message: errors.due }]} />
      <Select id="mt-student" label="Student" required value={student} onChange={(e) => setStudent(e.target.value)} error={errors.student}>
        <option value="">Choose a student</option>
        {students.map((s) => <option key={s.user_id} value={s.user_id}>{s.full_name}</option>)}
      </Select>
      <Field id="mt-due" label="New due date and time" required type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} error={errors.due} hint="Only this student sees the new date. Their work is late only after it." />
      <div className="actions">
        <Button type="submit" variant="primary" disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
        <Button onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------------------

type Mine = { sub: Submission | null; released: { score: number | null; feedback: string } | null; graded: boolean };

async function loadMine(a: Assignment, userId: string): Promise<Mine> {
  const [subRes, gradeRes] = await Promise.all([
    db().from("submissions").select("*").eq("assignment_id", a.id).eq("student_id", userId).maybeSingle(),
    db().from("grades").select("score, feedback, released").eq("assignment_id", a.id).eq("student_id", userId).maybeSingle(),
  ]);
  if (subRes.error) throw new Error(subRes.error.message);
  const sub = subRes.data ? normSub(subRes.data) : null;
  const g = gradeRes.data;
  const released = g?.released ? { score: g.score == null ? null : Number(g.score), feedback: g.feedback as string } : null;
  let graded = !!released;
  if (sub && !graded) {
    // Students cannot read unreleased grades; this only says whether one exists.
    const { data } = await db().rpc("grading_started", { a: a.id });
    graded = data === true;
  }
  return { sub, released, graded };
}

function StudentView({ a }: { a: Assignment }) {
  const { course } = useCourse();
  useDocTitle(a.title);
  const { profile } = useAuth();
  const base = `/courses/${course.id}`;
  const { data, error, loading, reload } = useQuery(() => loadMine(a, profile!.id), [a.id, profile?.id]);
  const [editing, setEditing] = useState(false);

  if (loading && !data) return <div className="content"><Loading /></div>;
  if (!data) return <div className="content"><ErrorNote error={error} /></div>;

  const { sub, released, graded } = data;
  const status = studentStatus(a, sub?.submitted_at, !!released);
  const pastDue = Date.now() > new Date(a.due_at).getTime();
  const closed = !a.allow_late && pastDue;
  const canEdit = !!sub && !graded && !closed;
  const late = sub && lateBy(a.due_at, sub.submitted_at);

  return (
    <div className="content">
      <PageHeader
        eyebrow={<Link to={`${base}/assignments`}>‹ Assignments</Link>}
        title={a.title}
      />
      <Facts items={[
        ["Status", <StatusBadge status={status} />],
        ["Due date", <><time dateTime={a.due_at}>{fmtDateTime(a.due_at)}</time>{pastDue && <> <Badge>Past due</Badge></>}</>],
        ["Points", `${num(a.points)} points`],
        ["How to hand in", acceptsLabel(a)],
        ["Late work", lateWorkLabel(a.allow_late)],
      ]} />
      <Section title="Instructions">
        <p className="prose">{a.description || "No instructions."}</p>
      </Section>
      <Section title="Your submission">
        {sub && !editing ? (
          <div className="card stack">
            <p>
              <strong>Submitted{late && ` ${late} late`}</strong>
              {" "}<time dateTime={sub.submitted_at}>{fmtDateTime(sub.submitted_at)}</time>
              {" "}<span className="muted">· Attempt {sub.attempt}</span>
            </p>
            {sub.body && <p className="prose">{sub.body}</p>}
            <FileLinks files={sub.files} />
            {graded && !released && <p className="muted">Your teacher has started grading this work</p>}
            {canEdit && <div><Button onClick={() => setEditing(true)}>Edit submission</Button></div>}
          </div>
        ) : closed && !sub ? (
          <p>Closed: this assignment stopped accepting work on <time dateTime={a.due_at}>{fmtDateTime(a.due_at)}</time></p>
        ) : (
          <SubmitForm
            a={a}
            userId={profile!.id}
            existing={sub}
            onCancel={sub ? () => setEditing(false) : undefined}
            onDone={() => { setEditing(false); reload(); }}
          />
        )}
      </Section>
      {released && (
        <Section title="Feedback">
          <div className="card stack">
            {released.score != null && <p><strong>{num(released.score)} / {num(a.points)}</strong></p>}
            {released.feedback && <p className="prose">{released.feedback}</p>}
          </div>
        </Section>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

function SubmitForm({ a, userId, existing, onCancel, onDone }: { a: Assignment; userId: string; existing: Submission | null; onCancel?: () => void; onDone: () => void }) {
  const toast = useToast();
  const [text, setText] = useState(existing?.body ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [textError, setTextError] = useState<string>();
  const [fileError, setFileError] = useState<string>();
  const [fail, setFail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [inputKey, setInputKey] = useState(0);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setFail(null);
    setTextError(undefined);
    setFileError(undefined);
    const hasText = a.accepts_text && text.trim() !== "";
    const hasFile = a.accepts_files && (!!file || (existing?.files.length ?? 0) > 0);
    if (file && file.size > MAX_UPLOAD_BYTES) {
      setFileError("This file is larger than the 10 MB limit");
      document.getElementById("sub-file")?.focus();
      return;
    }
    if (!hasText && !hasFile) {
      if (a.accepts_text && a.accepts_files) { setTextError("Enter your answer or attach a file before submitting"); document.getElementById("sub-text")?.focus(); }
      else if (a.accepts_text) { setTextError("Enter your answer before submitting"); document.getElementById("sub-text")?.focus(); }
      else { setFileError("Attach a file before submitting"); document.getElementById("sub-file")?.focus(); }
      return;
    }
    setBusy(true);
    try {
      let files: FileRef[] = a.accepts_files ? existing?.files ?? [] : [];
      if (file && a.accepts_files) {
        const safe = file.name.replace(/[^\w.\- ]+/g, "_");
        const path = `${a.id}/${userId}/${Date.now()}-${safe}`;
        const up = await db().storage.from("submissions").upload(path, file, { contentType: file.type || "application/octet-stream" });
        if (up.error) throw up.error;
        files = [{ path, name: file.name, size: file.size }];
      }
      const body = a.accepts_text ? text.trim() : "";
      const res = existing
        ? await db().from("submissions").update({ body, files }).eq("id", existing.id)
        : await db().from("submissions").insert({ assignment_id: a.id, body, files });
      if (res.error) throw res.error;
      toast("Submitted");
      setFile(null);
      setInputKey((k) => k + 1);
      onDone();
    } catch (err) {
      const msg = (err as Error)?.message ?? "";
      setFail(/closed|started grading/i.test(msg) ? msg : "Your work was not saved. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card form" onSubmit={submit} noValidate>
      <ErrorNote error={fail} />
      {Date.now() > new Date(a.due_at).getTime() && <p className="muted">The due date has passed. Your work will be marked late.</p>}
      {a.accepts_text && (
        <TextArea id="sub-text" label="Your answer" rows={8} value={text} onChange={(e) => setText(e.target.value)} error={textError} />
      )}
      {a.accepts_files && (
        <Field
          id="sub-file" key={inputKey} label="File" type="file"
          hint={`One file, up to 10 MB.${existing?.files.length ? ` Your current file is ${existing.files[0]!.name}; choosing a new file replaces it.` : ""}`}
          error={fileError} onChange={(e) => { setFile(e.target.files?.[0] ?? null); setFileError(undefined); }}
        />
      )}
      <div className="actions">
        <Button type="submit" variant="primary" disabled={busy}>Submit</Button>
        {onCancel && <Button onClick={onCancel}>Cancel</Button>}
      </div>
    </form>
  );
}
