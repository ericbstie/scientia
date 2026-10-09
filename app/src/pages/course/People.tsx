import { useState, type FormEvent } from "react";
import { Paragraph } from "@digdir/designsystemet-react";
import { useCourse, useDocTitle } from "../../App";
import { db, must } from "../../lib/supabase";
import { useQuery } from "../../lib/useQuery";
import { Avatar, Badge, Button, Confirm, Dialog, Empty, ErrorNote, focusField, focusHeading, List, Loading, PageHeader, Row, Section, TextArea, TextLink, useToast } from "../../ui";
import { enrolAll, enrolProblems, splitEmails, type EnrolProblem } from "../../lib/enrol";
import { byLastName } from "../../lib/format";

type Person = { user_id: string; full_name: string; email: string | null; role: "teacher" | "student" };

export function People() {
  const { course, role } = useCourse();
  const teacher = role === "teacher";
  const toast = useToast();
  useDocTitle("People");
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<Person | null>(null);
  const [busy, setBusy] = useState(false);
  const [fail, setFail] = useState<string | null>(null);

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
    } catch (e) { setFail("Could not remove the student. Check your connection and try again."); setRemoving(null); console.error(e); }
    setBusy(false);
  }

  const people = q.data ?? [];
  const teachers = people.filter((p) => p.role === "teacher").sort((a, b) => a.full_name.localeCompare(b.full_name));
  const students = people.filter((p) => p.role === "student").sort(byLastName);

  return (
    <div className="content">
      <PageHeader title="People" actions={teacher && <Button variant="primary" onClick={() => setAdding(true)}>Add student</Button>} />
      <ErrorNote error={q.error ?? fail} />
      {q.loading && !q.data ? <Loading /> : (
        <>
          <Section title="Teachers">
            {teachers.length === 0 ? <Empty title="No teachers yet" /> : <List>
              {teachers.map((p) => (
                <Row key={p.user_id}>
                  <Avatar name={p.full_name} />
                  <div className="row-main">
                    <span className="row-title">{p.full_name}</span>
                    {teacher && p.email && <div className="row-meta">{p.email}</div>}
                  </div>
                  <div className="row-side"><Badge>Teacher</Badge></div>
                </Row>
              ))}
            </List>}
          </Section>
          <Section title={`${students.length} ${students.length === 1 ? "student" : "students"}`}>
            {students.length === 0 ? (
              <Empty title="No students yet" action={teacher && <Button onClick={() => setAdding(true)}>Add student</Button>} />
            ) : (
              <List>
                {students.map((p) => (
                  <Row key={p.user_id}>
                    <Avatar name={p.full_name} />
                    <div className="row-main">
                      <span className="row-title">{p.full_name}</span>
                      {teacher && p.email && <div className="row-meta">{p.email}</div>}
                    </div>
                    {teacher && <div className="row-side"><Button variant="tertiary" data-color="danger" aria-label={`Remove ${p.full_name}`} onClick={() => setRemoving(p)}>Remove</Button></div>}
                  </Row>
                ))}
              </List>
            )}
          </Section>
        </>
      )}
      <Dialog open={adding} onClose={() => setAdding(false)} title="Add student">
        <AddForm onClose={() => setAdding(false)} onAdded={(who) => { toast(`${who} added`); q.reload(); }} />
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

/** Adds one student, or several pasted from a list. The whole list is checked first: if any
 *  address can't be added, nothing is, every problem is listed, and the rest can be added on request. */
function AddForm({ onClose, onAdded }: { onClose: () => void; onAdded: (who: string) => void }) {
  const { course } = useCourse();
  const [emails, setEmails] = useState("");
  const [error, setError] = useState<string>();
  const [problems, setProblems] = useState<EnrolProblem[]>([]);
  const [others, setOthers] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const failed = "Could not add the students. Check your connection and try again.";
  const listed = (ps: EnrolProblem[]) => ps.map((p) => `${p.address}: ${p.problem}`).join(" ");

  async function submit(e: FormEvent) {
    e.preventDefault();
    const list = splitEmails(emails);
    setOthers([]);
    if (!list.length) { setError("Enter an email address"); focusField("person-email"); return; }
    setError(undefined);
    setBusy(true);
    try {
      const found = await enrolProblems(course.id, list);
      if (!found.length) {
        onAdded(await enrolAll(course.id, list));
        return onClose();
      }
      setProblems(found);
      setOthers(list.filter((a) => !found.some((p) => p.address === a)));
      setError(list.length === 1 ? found[0]!.problem : `Nothing was added. ${listed(found)}`);
      focusField("person-email");
    } catch { setError(failed); }
    setBusy(false);
  }

  async function addOthers() {
    setBusy(true);
    try {
      onAdded(await enrolAll(course.id, others));
      setEmails(problems.map((p) => p.address).join("\n"));
      setOthers([]);
      setError(listed(problems));
    } catch { setError(failed); }
    setBusy(false);
  }

  return (
    <form className="form" onSubmit={submit} noValidate>
      <TextArea
        id="person-email"
        label="Email"
        required
        rows={3}
        inputMode="email"
        value={emails}
        onChange={(e) => setEmails(e.target.value)}
        onKeyDown={(e) => {
          // Enter adds, as in every other form; Shift+Enter starts a new line for a list.
          if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); if (!busy) e.currentTarget.form?.requestSubmit(); }
        }}
        error={error}
        hint="One address, or several on separate lines (Shift+Enter for a new line). Each person needs an existing Scientia account."
      />
      {error?.includes("the Users page") && <Paragraph><TextLink to="/admin/users">Open Users</TextLink></Paragraph>}
      <div className="actions">
        <Button variant="primary" type="submit" disabled={busy}>Add student</Button>
        {others.length > 0 && <Button disabled={busy} onClick={addOthers}>Add the other {others.length}</Button>}
        <Button onClick={onClose}>Cancel</Button>
      </div>
    </form>
  );
}
