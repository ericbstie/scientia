import { useMemo, useState, type FormEvent } from "react";
import { Link, useParams } from "react-router";
import { useCourse, useDocTitle } from "../../App";
import { fmtDateTime, lateBy, num } from "../../lib/format";
import { db } from "../../lib/supabase";
import { useQuery } from "../../lib/useQuery";
import { Badge, Button, ErrorNote, Field, Loading, NotFound, PageHeader, Section, StatusBadge, TextArea, useToast } from "../../ui";
import { FileLinks, buildQueue, loadTeacherData, useUnsavedGuard } from "./work/shared";

export function GradingSubmission() {
  const { submissionId } = useParams();
  return <GradeOne key={submissionId} submissionId={submissionId!} />;
}

function GradeOne({ submissionId }: { submissionId: string }) {
  const { course } = useCourse();
  const base = `/courses/${course.id}`;
  const toast = useToast();
  const { data, error, loading, reload } = useQuery(() => loadTeacherData(course.id), [course.id]);

  const sub = data?.subs.find((s) => s.id === submissionId);
  const assignment = data?.assignments.find((a) => a.id === sub?.assignment_id);
  const student = data?.students.find((s) => s.user_id === sub?.student_id);
  const grade = data?.grades.find((g) => sub && g.assignment_id === sub.assignment_id && g.student_id === sub.student_id);

  useDocTitle(student && assignment ? `${student.full_name}: ${assignment.title}` : undefined);

  // Form state starts from the saved grade; `saved` is what the database holds now.
  const [score, setScore] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [saved, setSaved] = useState<{ score: string; feedback: string; released: boolean; exists: boolean } | null>(null);
  const [scoreError, setScoreError] = useState<string>();
  const [fail, setFail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (data && sub && saved === null) {
    const init = { score: grade?.score == null ? "" : String(grade.score), feedback: grade?.feedback ?? "", released: !!grade?.released, exists: !!grade };
    setSaved(init);
    setScore(init.score);
    setFeedback(init.feedback);
  }
  const dirty = !!saved && (score !== saved.score || feedback !== saved.feedback);
  const guard = useUnsavedGuard(dirty);

  const nextId = useMemo(
    () => (data ? buildQueue(data).find((r) => r.filter === "needs-grading" && r.submissionId !== submissionId)?.submissionId : undefined),
    [data, submissionId],
  );

  if (loading && !data) return <div className="content wide"><Loading /></div>;
  if (error) return <div className="content wide"><ErrorNote error={error} /></div>;
  if (!sub || !assignment || !student || saved === null) return <NotFound />;

  const state = !saved.exists ? "Needs grading" : saved.released ? "Released" : "Graded (not released)";
  const late = lateBy(assignment.due_at, sub.submitted_at);

  async function save(e: FormEvent | null, release: boolean) {
    e?.preventDefault();
    setFail(null);
    setScoreError(undefined);
    const raw = (score ?? "").trim();
    const n = Number(raw);
    if (raw === "") { setScoreError("Enter a score"); document.getElementById("g-score")?.focus(); return; }
    if (!Number.isFinite(n) || n < 0 || n > assignment!.points) {
      setScoreError(`Score must be between 0 and ${num(assignment!.points)}`);
      document.getElementById("g-score")?.focus();
      return;
    }
    setBusy(true);
    const released = release || saved!.released;
    const { error } = await db().from("grades").upsert(
      { assignment_id: sub!.assignment_id, student_id: sub!.student_id, score: n, feedback: feedback ?? "", released, graded_at: new Date().toISOString() },
      { onConflict: "assignment_id,student_id" },
    );
    setBusy(false);
    if (error) return setFail("Could not save. Check your connection and try again.");
    setSaved({ score: raw, feedback: feedback ?? "", released, exists: true });
    toast(release ? "Grade released" : "Saved");
    reload();
  }

  return (
    <div className="content wide">
      <PageHeader
        eyebrow={<Link to={`${base}/grading`}>‹ Grading</Link>}
        title={`${student.full_name}: ${assignment.title}`}
        subtitle={<>Status: <StatusBadge status={state} /></>}
      />
      <Section title="Submission">
        <div className="card stack">
          <p>
            Submitted <time dateTime={sub.submitted_at}>{fmtDateTime(sub.submitted_at)}</time>
            {" "}<span className="muted">· Attempt {sub.attempt}</span>
            {late && <> <Badge tone="warning">Late by {late}</Badge></>}
          </p>
          {sub.body ? <p className="prose">{sub.body}</p> : <p className="muted">No text.</p>}
          <FileLinks files={sub.files} />
        </div>
      </Section>
      <Section title="Grade">
        <ErrorNote error={fail} />
        <form className="card form" onSubmit={(e) => save(e, false)} noValidate>
          <Field
            id="g-score" label="Score" required type="number" step="any" inputMode="decimal" hint={`out of ${num(assignment.points)}`}
            value={score ?? ""} onChange={(e) => setScore(e.target.value)} error={scoreError}
          />
          <TextArea id="g-feedback" label="Feedback" rows={6} value={feedback ?? ""} onChange={(e) => setFeedback(e.target.value)} />
          <div className="actions">
            <Button type="submit" variant="primary" disabled={busy}>{saved.released ? "Save changes" : "Save"}</Button>
            <Button disabled={!nextId} onClick={() => nextId && guard.go(`${base}/grading/${nextId}`)}>Next to grade</Button>
            {!nextId && <span className="muted">Nothing else needs grading</span>}
            {saved.exists && !saved.released && <Button disabled={busy} onClick={() => save(null, true)}>Release</Button>}
          </div>
        </form>
      </Section>
      {guard.dialog}
    </div>
  );
}
