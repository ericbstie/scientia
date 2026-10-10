import { Table } from "@digdir/designsystemet-react";
import { useState, type FormEvent } from "react";
import { Button, ButtonLink, Dialog, Empty, ErrorNote, ErrorSummary, Field, focusField, Loading, PageHeader, Select, useTitle, useToast } from "../../ui";
import { db, must } from "../../lib/supabase";
import { useQuery } from "../../lib/useQuery";

type CourseRow = { id: string; code: string; title: string; enrollments: { role: string; user_id: string; profiles: { full_name: string } | null }[] };
type Teacher = { id: string; full_name: string };
const teacherOf = (c: CourseRow) => c.enrollments.find((e) => e.role === "teacher")?.user_id ?? "";

export function AdminCourses() {
  const toast = useToast();
  useTitle("Courses");
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<CourseRow | null>(null);
  const { data, error, loading, reload } = useQuery(async () => {
    const courses = must(await db().from("courses").select("id, code, title, enrollments(role, user_id, profiles(full_name))").order("code")) as unknown as CourseRow[];
    const teachers = must(await db().from("profiles").select("id, full_name").eq("role", "teacher").order("full_name")) as Teacher[];
    return { courses, teachers };
  });

  return (
    <div className="content wide">
      <PageHeader title="Courses" subtitle="Open People on a course to add or remove its students." actions={<Button variant="primary" onClick={() => setCreating(true)}>New course</Button>} />
      <ErrorNote error={error} />
      {loading && !data ? <Loading /> : data && data.courses.length === 0 ? (
        <Empty title="No courses yet">Create a course and choose its teacher.</Empty>
      ) : data && (
        <div className="table-wrap">
          <Table data-color="neutral" data-size="sm" className="stack-rows">
            <caption className="ds-sr-only">Courses</caption>
            <thead><tr><th scope="col">Code</th><th scope="col">Title</th><th scope="col">Teacher</th><th scope="col" className="num">Students</th><th scope="col">Actions</th></tr></thead>
            <tbody data-color="accent">
              {data.courses.map((c) => (
                <tr key={c.id}>
                  <th scope="row">{c.code}</th>
                  <td data-label="Title">{c.title}</td>
                  <td data-label="Teacher">{c.enrollments.filter((e) => e.role === "teacher").map((e) => e.profiles?.full_name).filter(Boolean).join(", ")}</td>
                  <td className="num" data-label="Students">{c.enrollments.filter((e) => e.role === "student").length}</td>
                  <td data-label="Actions">
                    <div className="actions">
                      <Button variant="tertiary" aria-label={`Edit ${c.code}`} onClick={() => setEditing(c)}>Edit</Button>
                      <ButtonLink variant="tertiary" to={`/courses/${c.id}/people`} aria-label={`People in ${c.code}`}>People</ButtonLink>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
      <Dialog open={creating} onClose={() => setCreating(false)} title="New course">
        <CourseForm teachers={data?.teachers ?? []} codes={(data?.courses ?? []).map((c) => c.code.toLowerCase())} onCancel={() => setCreating(false)} onDone={(code) => { setCreating(false); toast(`${code} created`); reload(); }} />
      </Dialog>
      <Dialog open={!!editing} onClose={() => setEditing(null)} title={editing ? `Edit ${editing.code}` : "Edit course"}>
        {editing && (
          <CourseForm
            course={editing}
            teachers={data?.teachers ?? []}
            codes={(data?.courses ?? []).filter((c) => c.id !== editing.id).map((c) => c.code.toLowerCase())}
            onCancel={() => setEditing(null)}
            onDone={(code) => { setEditing(null); toast(`${code} saved`); reload(); }}
          />
        )}
      </Dialog>
    </div>
  );
}

/** Creates a course, or with `course` changes its code, title and teacher (students stay enrolled). */
function CourseForm({ course, teachers, codes, onCancel, onDone }: { course?: CourseRow; teachers: Teacher[]; codes: string[]; onCancel: () => void; onDone: (code: string) => void }) {
  const [code, setCode] = useState(course?.code ?? "");
  const [title, setTitle] = useState(course?.title ?? "");
  const [teacher, setTeacher] = useState(course ? teacherOf(course) : "");
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
      const fields = { code: c, title: title.trim() };
      const { data: saved, error } = await (course ? db().from("courses").update(fields).eq("id", course.id) : db().from("courses").insert(fields)).select("id").single();
      if (error) {
        if (error.code === "23505") {
          setErrors({ code: "A course with this code already exists" });
          return focusField("nc-code");
        }
        throw error;
      }
      if (course) {
        if (teacher !== teacherOf(course)) {
          const moved = must(await db().from("enrollments").update({ user_id: teacher }).eq("course_id", course.id).eq("role", "teacher").select("user_id"));
          if (!moved?.length) must(await db().from("enrollments").insert({ course_id: course.id, user_id: teacher, role: "teacher" }));
        }
      } else {
        const res = await db().from("enrollments").insert({ course_id: saved.id, user_id: teacher, role: "teacher" });
        if (res.error) {
          await db().from("courses").delete().eq("id", saved.id);
          throw res.error;
        }
      }
      onDone(c);
    } catch {
      setFormError(course ? "Could not save the course. Check your connection and try again." : "Could not create the course. Check your connection and try again.");
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
      <Select id="nc-teacher" label="Teacher" required value={teacher} onChange={(e) => setTeacher(e.target.value)} error={errors.teacher} hint={noTeachers ? "No teachers yet. Add a teacher on the Users page first." : "Only teachers are listed. If the teacher is missing, create their account on the Users page first."}>
        <option value="">Choose a teacher</option>
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
