import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router";
import { useCourse, useDocTitle } from "../../App";
import { fmtDateTime, toLocalInput } from "../../lib/format";
import { db } from "../../lib/supabase";
import { useQuery } from "../../lib/useQuery";
import { Fieldset, FieldsetLegend, ValidationMessage } from "@digdir/designsystemet-react";
import { Button, ButtonLink, Checkbox, ErrorNote, ErrorSummary, Field, Loading, NotFound, PageHeader, Panel, TextArea, useToast } from "../../ui";
import { loadAssignment } from "./work/shared";

type Errors = { title?: string; due?: string; points?: string; accepts?: string };

export function AssignmentForm() {
  const { course } = useCourse();
  const { assignmentId } = useParams();
  const editing = !!assignmentId;
  const base = `/courses/${course.id}`;
  const navigate = useNavigate();
  const toast = useToast();

  useDocTitle(editing ? "Edit assignment" : "New assignment");
  const existing = useQuery(async () => (editing ? loadAssignment(course.id, assignmentId!) : null), [course.id, assignmentId]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [due, setDue] = useState("");
  const [points, setPoints] = useState("100");
  const [files, setFiles] = useState(true);
  const [text, setText] = useState(true);
  const [late, setLate] = useState(true);
  const [errors, setErrors] = useState<Errors>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const a = existing.data;
    if (!a) return;
    setTitle(a.title); setDescription(a.description); setDue(toLocalInput(new Date(a.due_at)));
    setPoints(String(a.points)); setFiles(a.accepts_files); setText(a.accepts_text); setLate(a.allow_late);
  }, [existing.data]);

  async function save(e: FormEvent | null, publish: boolean | null) {
    e?.preventDefault();
    const errs: Errors = {};
    if (!title.trim()) errs.title = "Enter a title";
    if (!due || isNaN(new Date(due).getTime())) errs.due = "Choose a due date and time";
    if (!(Number(points) > 0)) errs.points = "Enter points greater than 0";
    if (!files && !text) errs.accepts = "Choose at least one way to submit";
    setErrors(errs);
    setSaveError(null);
    const keys = Object.keys(errs) as (keyof Errors)[];
    if (keys.length) {
      const ids = { title: "a-title", due: "a-due", points: "a-points", accepts: "a-accepts" };
      const el = document.getElementById(ids[keys[0]!]); (el?.matches("fieldset") ? el.querySelector("input") : el)?.focus();
      return;
    }
    setBusy(true);
    const row = {
      title: title.trim(), description, due_at: new Date(due).toISOString(), points: Number(points),
      accepts_files: files, accepts_text: text, allow_late: late,
      ...(publish === null ? {} : { published: publish }),
    };
    const res = editing
      ? await db().from("assignments").update(row).eq("id", assignmentId!).select("id").single()
      : await db().from("assignments").insert({ ...row, course_id: course.id }).select("id").single();
    setBusy(false);
    if (res.error || !res.data) return setSaveError("Could not save. Check your connection and try again.");
    toast(editing ? "Saved" : publish ? "Assignment published" : "Draft saved");
    navigate(`${base}/assignments/${res.data.id}`);
  }

  if (editing && existing.loading && !existing.data) return <div className="content"><Loading /></div>;
  if (editing && !existing.error && !existing.data) return <NotFound />;

  return (
    <div className="content">
      <PageHeader
        back={{ to: `${base}/assignments`, label: "Assignments" }}
        title={editing ? "Edit assignment" : "New assignment"}
      />
      <ErrorNote error={existing.error} />
      <ErrorSummary errors={[errors.title && { id: "a-title", message: errors.title }, errors.due && { id: "a-due", message: errors.due }, errors.points && { id: "a-points", message: errors.points }, errors.accepts && { id: "a-accepts", message: errors.accepts }]} />
      <ErrorNote error={saveError} />
      <Panel><form className="form" ref={formRef} onSubmit={(e) => save(e, editing ? null : true)} noValidate>
        <Field id="a-title" label="Title" required value={title} onChange={(e) => setTitle(e.target.value)} error={errors.title} autoComplete="off" />
        <TextArea id="a-instructions" label="Instructions" optional rows={6} value={description} onChange={(e) => setDescription(e.target.value)} />
        <div className="field-row">
          <Field id="a-due" label="Due date and time" required type="datetime-local" value={due} onChange={(e) => setDue(e.target.value)} error={errors.due} hint={due && !isNaN(new Date(due).getTime()) ? `Students see ${fmtDateTime(new Date(due))}` : undefined} />
          <Field id="a-points" label="Points" required type="number" min="0" step="any" inputMode="decimal" value={points} onChange={(e) => setPoints(e.target.value)} error={errors.points} />
        </div>
        <Fieldset id="a-accepts" aria-describedby={errors.accepts ? "a-accepts-error" : undefined}>
          <FieldsetLegend>Students hand in by</FieldsetLegend>
          <Checkbox label="Uploading a file" checked={files} onChange={(e) => setFiles(e.target.checked)} />
          <Checkbox label="Typing an answer" checked={text} onChange={(e) => setText(e.target.checked)} />
          {errors.accepts && <ValidationMessage id="a-accepts-error">{errors.accepts}</ValidationMessage>}
        </Fieldset>
        <Checkbox label="Accept work after the due date (marked late)" checked={late} onChange={(e) => setLate(e.target.checked)} />
        <div className="actions">
          {editing ? (
            <Button type="submit" variant="primary" disabled={busy}>Save</Button>
          ) : (
            <>
              <Button type="submit" variant="primary" disabled={busy}>Save and publish</Button>
              <Button disabled={busy} onClick={() => save(null, false)}>Save as draft</Button>
            </>
          )}
          <ButtonLink to={editing ? `${base}/assignments/${assignmentId}` : `${base}/assignments`}>Cancel</ButtonLink>
        </div>
      </form></Panel>
    </div>
  );
}
