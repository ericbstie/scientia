import type { ReactNode } from "react";
import { Link } from "react-router";
import { useCourse } from "../../App";
import { num } from "../../lib/format";
import { useQuery } from "../../lib/useQuery";
import { Button, Empty, ErrorNote, Loading, PageHeader, Section } from "../../ui";
import { useDocTitle } from "./content/util";
import { firstName, key, lastName, lateByLabel, loadTeacherData, pct1, type TeacherData } from "./work/shared";

type Row = { id: string; first: string; last: string; email: string; total: string };

function sortedStudents(d: TeacherData) {
  return [...d.students].sort((a, b) => lastName(a.full_name).localeCompare(lastName(b.full_name)) || a.full_name.localeCompare(b.full_name));
}

/** Total percent of graded work (drafts included in the teacher view), one decimal, or "" when nothing is graded. */
function totalFor(d: TeacherData, studentId: string) {
  let got = 0, of = 0;
  for (const g of d.grades) {
    if (g.student_id !== studentId || g.score == null) continue;
    const a = d.assignments.find((x) => x.id === g.assignment_id);
    if (!a) continue;
    got += g.score;
    of += a.points;
  }
  return of > 0 ? pct1(got, of) : "";
}

function csvCell(v: string) {
  return /[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

function buildCsv(d: TeacherData) {
  const header = ["Last name", "First name", "Email", ...d.assignments.map((a) => `${a.title} (${num(a.points)})`), "Total %"];
  const lines = sortedStudents(d).map((s) => {
    const cells = d.assignments.map((a) => {
      const g = d.grades.find((x) => x.assignment_id === a.id && x.student_id === s.user_id);
      return g?.score == null ? "" : String(g.score);
    });
    return [lastName(s.full_name), firstName(s.full_name), s.email ?? "", ...cells, totalFor(d, s.user_id)];
  });
  return [header, ...lines].map((r) => r.map(csvCell).join(",")).join("\r\n") + "\r\n";
}

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function Gradebook() {
  const { course } = useCourse();
  const base = `/courses/${course.id}`;
  useDocTitle("Gradebook");
  const { data, error, loading } = useQuery(() => loadTeacherData(course.id), [course.id]);
  const students = data ? sortedStudents(data) : [];
  const rows: Row[] = students.map((s) => ({ id: s.user_id, first: firstName(s.full_name), last: lastName(s.full_name), email: s.email ?? "", total: data ? totalFor(data, s.user_id) : "" }));
  const now = Date.now();

  return (
    <div className="content wide">
      <PageHeader
        title="Gradebook"
        eyebrow={course.code}
        actions={data && students.length > 0 ? <Button onClick={() => download(`${course.code.toLowerCase()}-gradebook.csv`, buildCsv(data))}>Export CSV</Button> : undefined}
      />
      <ErrorNote error={error} />
      {loading && !data ? <Loading /> : data && (
        students.length === 0 ? (
          <Empty title="No students yet">Add students on the People page.</Empty>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <caption className="visually-hidden">Gradebook for {course.title}</caption>
                <thead>
                  <tr>
                    <th scope="col" style={{ position: "sticky", left: 0, zIndex: 2 }}>Student</th>
                    {data.assignments.map((a) => <th key={a.id} scope="col" className="num">{a.title} ({num(a.points)})</th>)}
                    <th scope="col" className="num">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s, i) => (
                    <tr key={s.user_id}>
                      <th scope="row" style={{ position: "sticky", left: 0, zIndex: 1 }}>{s.full_name}</th>
                      {data.assignments.map((a) => {
                        const sub = data.subs.find((x) => x.assignment_id === a.id && x.student_id === s.user_id);
                        const g = data.grades.find((x) => x.assignment_id === a.id && x.student_id === s.user_id);
                        const link = (content: ReactNode, text: string) => (
                          <Link to={`${base}/grading/${sub!.id}`} aria-label={`${s.full_name}, ${a.title}: ${text}`} style={{ display: "block", margin: "calc(-1 * var(--s2)) calc(-1 * var(--s3))", padding: "var(--s2) var(--s3)" }}>{content}</Link>
                        );
                        let cell: ReactNode;
                        if (g?.score != null && sub) cell = link(<>{num(g.score)} <span className="muted">{g.released ? "Released" : "Not released"}</span></>, `${num(g.score)} ${g.released ? "Released" : "Not released"}`);
                        else if (sub) { const t = lateByLabel(a.due_at, sub.submitted_at) ? "Late, needs grading" : "Needs grading"; cell = link(t, t); }
                        else if (new Date(a.due_at).getTime() < now) cell = "Missing";
                        else cell = "–";
                        return <td key={a.id} className="num">{cell}</td>;
                      })}
                      <td className="num">{rows[i]!.total ? `${rows[i]!.total}%` : "–"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Section title="Legend">
              <dl style={{ display: "grid", gridTemplateColumns: "max-content 1fr", gap: "var(--s1) var(--s4)", margin: 0 }}>
                <dt>Not released</dt><dd style={{ margin: 0 }}>Graded, but the student cannot see it yet. Counted in the total shown here.</dd>
                <dt>Released</dt><dd style={{ margin: 0 }}>The student can see the score and feedback.</dd>
                <dt>Missing</dt><dd style={{ margin: 0 }}>Past the due date and nothing was submitted. Not counted as zero.</dd>
                <dt>Late</dt><dd style={{ margin: 0 }}>Submitted after the due date.</dd>
                <dt>Needs grading</dt><dd style={{ margin: 0 }}>Submitted, with no score yet. Not counted in the total.</dd>
              </dl>
            </Section>
          </>
        )
      )}
    </div>
  );
}
