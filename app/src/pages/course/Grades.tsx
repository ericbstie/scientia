import { Paragraph, Table } from "@digdir/designsystemet-react";
import { useCourse, useDocTitle } from "../../App";
import { useAuth } from "../../lib/auth";
import { fmtDateTime, num, pct, studentStatus } from "../../lib/format";
import { useQuery } from "../../lib/useQuery";
import { Empty, ErrorNote, Loading, PageHeader, StatusBadge, TextLink } from "../../ui";
import { loadMyWork } from "./work/shared";

export function Grades() {
  const { course } = useCourse();
  const { profile } = useAuth();
  const base = `/courses/${course.id}`;
  useDocTitle("Grades");
  const { data, error, loading } = useQuery(() => loadMyWork(course.id, profile!.id), [course.id, profile?.id]);

  const scored = data ? data.assignments.filter((a) => data.grades.get(a.id)?.released && data.grades.get(a.id)?.score != null) : [];
  const got = scored.reduce((s, a) => s + data!.grades.get(a.id)!.score!, 0);
  const of = scored.reduce((s, a) => s + a.points, 0);

  return (
    <div className="content">
      <PageHeader title="Grades" />
      <ErrorNote error={error} />
      {loading && !data ? <Loading /> : data && (
        data.assignments.length === 0 ? (
          <Empty title="No grades yet">Grades appear here once your teacher publishes assignments.</Empty>
        ) : (
          <>
            {scored.length === 0 && <Paragraph><strong>Nothing graded yet. Grades appear here when your teacher releases them.</strong></Paragraph>}
            <div className="table-wrap fit">
              <Table data-color="neutral" data-size="sm">
                <caption className="ds-sr-only">Your grades in {course.title}</caption>
                <thead>
                  <tr><th scope="col">Assignment</th><th scope="col">Status</th><th scope="col" className="num">Score</th></tr>
                </thead>
                <tbody data-color="accent">
                  {data.assignments.map((a) => {
                    const sub = data.subs.get(a.id);
                    const g = data.grades.get(a.id);
                    const released = !!g?.released && g.score != null;
                    const score = released ? `${num(g!.score)} / ${num(a.points)}` : sub ? "Awaiting grade" : "";
                    return (
                      <tr key={a.id}>
                        <th scope="row"><TextLink className="row-title" to={`${base}/assignments/${a.id}`}>{a.title}</TextLink><div className="row-meta">Due {fmtDateTime(a.due_at)}</div>{released && g!.feedback && <div className="row-meta wrap">Feedback: {g!.feedback}</div>}</th>
                        <td><StatusBadge status={studentStatus(a, sub?.submitted_at, released)} /></td>
                        <td className="num">{score}</td>
                      </tr>
                    );
                  })}
                </tbody>
                {scored.length > 0 && (
                  <tfoot>
                    <tr>
                      <th scope="row">Total<div className="row-meta">{scored.length} of {data.assignments.length} assignments graded so far</div></th>
                      <td />
                      <td className="num"><strong>{num(got)} / {num(of)}</strong><div className="row-meta">{pct(got, of)}%</div></td>
                    </tr>
                  </tfoot>
                )}
              </Table>
            </div>
          </>
        )
      )}
    </div>
  );
}
