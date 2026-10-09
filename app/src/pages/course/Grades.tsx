import { Link } from "react-router";
import { useCourse, useDocTitle } from "../../App";
import { useAuth } from "../../lib/auth";
import { fmtDateTime, num, pct, studentStatus } from "../../lib/format";
import { useQuery } from "../../lib/useQuery";
import { Empty, ErrorNote, Loading, PageHeader, StatusBadge } from "../../ui";
import { loadMyWork } from "./work/shared";

export function Grades() {
  const { course } = useCourse();
  const { profile } = useAuth();
  const base = `/courses/${course.id}`;
  useDocTitle("Grades");
  const { data, error, loading } = useQuery(() => loadMyWork(course.id, profile!.id), [course.id, profile?.id]);

  let total = "Total: none yet. Your total appears when your teacher releases a grade.";
  if (data) {
    const scored = data.assignments.filter((a) => data.grades.get(a.id)?.released && data.grades.get(a.id)?.score != null);
    if (scored.length) {
      const got = scored.reduce((s, a) => s + data.grades.get(a.id)!.score!, 0);
      const of = scored.reduce((s, a) => s + a.points, 0);
      total = `Total: ${pct(got, of)}% (${num(got)} of ${num(of)} points graded so far)`;
    }
  }

  return (
    <div className="content">
      <PageHeader title="Grades" />
      <ErrorNote error={error} />
      {loading && !data ? <Loading /> : data && (
        data.assignments.length === 0 ? (
          <Empty title="No grades yet">Grades appear here once your teacher publishes assignments.</Empty>
        ) : (
          <>
            <p><strong>{total}</strong></p>
            <div className="table-wrap fit">
              <table>
                <caption className="visually-hidden">Your grades in {course.title}</caption>
                <thead>
                  <tr><th scope="col">Assignment</th><th scope="col">Status</th><th scope="col" className="num">Score</th></tr>
                </thead>
                <tbody>
                  {data.assignments.map((a) => {
                    const sub = data.subs.get(a.id);
                    const g = data.grades.get(a.id);
                    const released = !!g?.released && g.score != null;
                    const pastDue = Date.now() > new Date(a.due_at).getTime();
                    const score = released ? `${num(g!.score)} / ${num(a.points)}` : sub ? "Awaiting grade" : pastDue ? "Missing" : "Not submitted";
                    return (
                      <tr key={a.id}>
                        <th scope="row"><Link className="row-title" to={`${base}/assignments/${a.id}`}>{a.title}</Link><div className="row-meta">Due {fmtDateTime(a.due_at)}</div>{released && g!.feedback && <div className="row-meta wrap">Feedback: {g!.feedback}</div>}</th>
                        <td><StatusBadge status={studentStatus(a, sub?.submitted_at, released)} /></td>
                        <td className="num">{score}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )
      )}
    </div>
  );
}
