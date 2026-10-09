import { useState, type FormEvent } from "react";
import { AdminNav } from "./AdminNav";
import { Button, ButtonLink, Dialog, Empty, ErrorNote, ErrorSummary, Field, focusField, Loading, PageHeader, Select, useTitle, useToast } from "../../ui";
import { db, must } from "../../lib/supabase";
import { useQuery } from "../../lib/useQuery";

type CourseRow = { id: string; code: string; title: string; enrollments: { role: string; profiles: { full_name: string } | null }[] };
type Teacher = { id: string; full_name: string };


export function AdminCourses() {
  const toast = useToast();
  useTitle("Courses");
  const [creating, setCreating] = useState(false);
  const { data, error, loading, reload } = useQuery(async () => {
    const courses = must(await db().from("courses").select("id, code, title, enrollments(role, profiles(full_name))").order("code")) as unknown as CourseRow[];
    const teachers = must(await db().from("profiles").select("id, full_name").eq("role", "teacher").order("full_name")) as Teacher[];
    return { courses, teachers };
  });

  const newButton = <Button variant="primary" onClick={() => setCreating(true)}>New course</Button>;
  return (
    <div className="content wide">
      <PageHeader title="Courses" subtitle="Open People on a course to add or remove its students." actions={data && data.courses.length > 0 ? newButton : undefined} />
      <AdminNav />
      <ErrorNote error={error} />
      {loading && !data ? <Loading /> : data && data.courses.length === 0 ? (
        <Empty title="No courses yet" action={newButton}>Create a course and choose its teacher.</Empty>
      ) : data && (
        <div className="table-wrap">
          <table>
            <caption className="visually-hidden">Courses</caption>
            <thead><tr><th scope="col">Code</th><th scope="col">Title</th><th scope="col">Teacher</th><th scope="col" className="num">Students</th><th scope="col">Actions</th></tr></thead>
            <tbody>
              {data.courses.map((c) => (
                <tr key={c.id}>
                  <th scope="row">{c.code}</th>
                  <td>{c.title}</td>
                  <td>{c.enrollments.filter((e) => e.role === "teacher").map((e) => e.profiles?.full_name).filter(Boolean).join(", ")}</td>
                  <td className="num">{c.enrollments.filter((e) => e.role === "student").length}</td>
                  <td><ButtonLink size="small" variant="ghost" to={`/courses/${c.id}/people`} aria-label={`People in ${c.code}`}>People</ButtonLink></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Dialog open={creating} onClose={() => setCreating(false)} title="New course">
        <NewCourseForm teachers={data?.teachers ?? []} codes={(data?.courses ?? []).map((c) => c.code.toLowerCase())} onCancel={() => setCreating(false)} onDone={(code) => { setCreating(false); toast(`${code} created`); reload(); }} />
      </Dialog>
    </div>
  );
}

function NewCourseForm({ teachers, codes, onCancel, onDone }: { teachers: Teacher[]; codes: string[]; onCancel: () => void; onDone: (code: string) => void }) {
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [teacher, setTeacher] = useState("");
  const [errors, setErrors] = useState<{ code?: string; title?: string; teacher?: string }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const noTeachers = teachers.length === 0;

  async function submit(e: FormEvent) {
    e.preventDefault();
    const errs: typeof errors = {};
    const c = code.trim();
    if (!c) errs.code = "Enter a course code";
    else if (codes.includes(c.toLowerCase())) errs.code = "A course with this code already exists";
    if (!title.trim()) errs.title = "Enter a title";
    if (!teacher) errs.teacher = "Choose a teacher";
    setErrors(errs);
    setFormError(null);
    if (Object.keys(errs).length) return focusField(errs.code ? "nc-code" : errs.title ? "nc-title" : "nc-teacher");
    setBusy(true);
    try {
      const { data: course, error } = await db().from("courses").insert({ code: c, title: title.trim() }).select("id").single();
      if (error) {
        if (error.code === "23505") {
          setErrors({ code: "A course with this code already exists" });
          return focusField("nc-code");
        }
        throw error;
      }
      const res = await db().from("enrollments").insert({ course_id: course.id, user_id: teacher, role: "teacher" });
      if (res.error) {
        await db().from("courses").delete().eq("id", course.id);
        throw res.error;
      }
      onDone(c);
    } catch {
      setFormError("Could not create the course. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="form" onSubmit={submit} noValidate>
      <ErrorNote error={formError} />
      <ErrorSummary errors={[errors.code && { id: "nc-code", message: errors.code }, errors.title && { id: "nc-title", message: errors.title }, errors.teacher && { id: "nc-teacher", message: errors.teacher }]} />
      <Field id="nc-code" label="Code" required value={code} error={errors.code} onChange={(e) => setCode(e.target.value)} autoComplete="off" />
      <Field id="nc-title" label="Title" required value={title} error={errors.title} onChange={(e) => setTitle(e.target.value)} autoComplete="off" />
      <Select id="nc-teacher" label="Teacher" required value={teacher} onChange={(e) => setTeacher(e.target.value)} error={errors.teacher} hint={noTeachers ? "No teachers yet. Add a teacher on the Users page first." : "Only accounts with the teacher role are listed."}>
        <option value="">Select a teacher</option>
        {teachers.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
      </Select>
      <div className="actions">
        <Button type="submit" variant="primary" disabled={busy || noTeachers}>{busy ? "Saving…" : "Save"}</Button>
        {noTeachers && <span className="muted">Save is unavailable until a teacher exists</span>}
        <Button onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
