import { useState, type FormEvent } from "react";
import { useCourse } from "../../App";
import { db, must } from "../../lib/supabase";
import { useQuery } from "../../lib/useQuery";
import { Avatar, Badge, Button, Confirm, Dialog, Empty, ErrorNote, Field, Loading, PageHeader, Section, useToast } from "../../ui";
import { focusField, focusHeading, lastName, useDocTitle } from "./content/util";

type Person = { user_id: string; full_name: string; email: string | null; role: "teacher" | "student" };

export function People() {
  const { course, role } = useCourse();
  const teacher = role === "teacher";
  const toast = useToast();
  useDocTitle("People");
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<Person | null>(null);
  const [busy, setBusy] = useState(false);
  const [fail, setFail] = useState<Error | null>(null);

  const q = useQuery(async () => must(await db().rpc("course_people", { c: course.id })) as Person[], [course.id]);

  async function remove() {
    if (!removing) return;
    setBusy(true);
    setFail(null);
    try {
      must(await db().from("enrollments").delete().eq("course_id", course.id).eq("user_id", removing.user_id).select("user_id"));
      setRemoving(null);
      toast(`${removing.full_name} removed`);
      await q.reload();
      focusHeading();
    } catch (e) { setFail(new Error("Could not remove the student. Check your connection and try again.")); setRemoving(null); console.error(e); }
    setBusy(false);
  }

  const people = q.data ?? [];
  const teachers = people.filter((p) => p.role === "teacher").sort((a, b) => a.full_name.localeCompare(b.full_name));
  const students = people.filter((p) => p.role === "student").sort((a, b) => lastName(a.full_name).localeCompare(lastName(b.full_name)) || a.full_name.localeCompare(b.full_name));

  return (
    <div className="content">
      <PageHeader title="People" actions={teacher && <Button variant="primary" onClick={() => setAdding(true)}>Add student</Button>} />
      <ErrorNote error={q.error ?? fail} />
      {q.loading && !q.data ? <Loading /> : (
        <>
          <Section title="Teachers">
            <ul className="list">
              {teachers.map((p) => (
                <li key={p.user_id}>
                  <div className="row">
                    <Avatar name={p.full_name} />
                    <div className="row-main">
                      <span className="row-title">{p.full_name}</span>
                      {teacher && p.email && <div className="row-meta">{p.email}</div>}
                    </div>
                    <div className="row-side"><Badge>Teacher</Badge></div>
                  </div>
                </li>
              ))}
            </ul>
          </Section>
          <Section title={`${students.length} ${students.length === 1 ? "student" : "students"}`}>
            {students.length === 0 ? (
              <Empty title="No students yet." action={teacher && <Button onClick={() => setAdding(true)}>Add student</Button>} />
            ) : (
              <ul className="list">
                {students.map((p) => (
                  <li key={p.user_id}>
                    <div className="row">
                      <Avatar name={p.full_name} />
                      <div className="row-main">
                        <span className="row-title">{p.full_name}</span>
                        {teacher && p.email && <div className="row-meta">{p.email}</div>}
                      </div>
                      {teacher && <div className="row-side"><Button size="small" variant="danger" className="ghost" onClick={() => setRemoving(p)}>Remove</Button></div>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </>
      )}
      <Dialog open={adding} onClose={() => setAdding(false)} title="Add student">
        <AddForm onCancel={() => setAdding(false)} onDone={(name) => { setAdding(false); toast(`${name} added`); q.reload(); }} />
      </Dialog>
      <Confirm
        open={!!removing}
        title={`Remove ${removing?.full_name ?? ""} from ${course.code}?`}
        confirmLabel="Remove"
        onConfirm={remove}
        onCancel={() => setRemoving(null)}
        busy={busy}
      >
        They will lose access to the course and disappear from the Gradebook and the Grading queue. Their work is kept if you add them again.
      </Confirm>
    </div>
  );
}

function AddForm({ onCancel, onDone }: { onCancel: () => void; onDone: (name: string) => void }) {
  const { course } = useCourse();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) { setError("Enter an email address"); focusField("person-email"); return; }
    setError(undefined);
    setBusy(true);
    const { data: id, error: err } = await db().rpc("enrol_by_email", { c: course.id, address: email });
    if (err) {
      setError(/^(No Scientia|Only |.* is already)/.test(err.message) ? err.message : "Could not add the student. Check your connection and try again.");
      focusField("person-email");
      setBusy(false);
      return;
    }
    const { data } = await db().from("profiles").select("full_name").eq("id", id as string).maybeSingle();
    setBusy(false);
    onDone((data as { full_name: string } | null)?.full_name ?? "Student");
  }

  return (
    <form className="form" onSubmit={submit} noValidate>
      <Field id="person-email" type="email" label="Email" value={email} onChange={(e) => setEmail(e.target.value)} error={error} hint="The student needs an existing Scientia account." />
      <div className="actions">
        <Button variant="primary" type="submit" disabled={busy}>Add student</Button>
        <Button onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
}
