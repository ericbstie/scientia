import { Link } from "react-router";
import { useCourse, useDocTitle } from "../../App";
import { useAuth } from "../../lib/auth";
import { fmtDateTime, num, studentStatus } from "../../lib/format";
import { useQuery } from "../../lib/useQuery";
import { Badge, ButtonLink, Empty, ErrorNote, Loading, PageHeader, StatusBadge } from "../../ui";
import { loadAssignments, loadMyWork } from "./work/shared";

export function Assignments() {
  const { course, role } = useCourse();
  const { profile } = useAuth();
  const base = `/courses/${course.id}`;
  useDocTitle("Assignments");
  const { data, error, loading } = useQuery(async () => {
    if (role === "teacher") return { assignments: await loadAssignments(course.id, false), subs: new Map(), grades: new Map() };
    return loadMyWork(course.id, profile!.id);
  }, [course.id, role]);

  const newButton = role === "teacher" ? <ButtonLink to={`${base}/assignments/new`} variant="primary">New assignment</ButtonLink> : undefined;
  return (
    <div className="content">
      <PageHeader title="Assignments" actions={newButton} />
      <ErrorNote error={error} />
      {loading && !data ? <Loading /> : data && (
        data.assignments.length === 0 ? (
          role === "teacher"
            ? <Empty title="No assignments yet" action={newButton}>Students see an assignment as soon as you publish it.</Empty>
            : <Empty title="No assignments yet.">Your teacher's assignments appear here when they are published.</Empty>
        ) : (
          <ul className="list">
            {data.assignments.map((a) => {
              const sub = data.subs.get(a.id);
              const released = !!data.grades.get(a.id)?.released;
              return (
                <li key={a.id}>
                  <div className="row">
                    <div className="row-main">
                      <Link className="row-title" to={`${base}/assignments/${a.id}`}>{a.title}</Link>
                      <div className="row-meta">
                        Due <time dateTime={a.due_at}>{fmtDateTime(a.due_at)}</time> · {num(a.points)} points
                      </div>
                    </div>
                    <div className="row-side">
                      {role === "teacher"
                        ? (!a.published && <Badge>Draft</Badge>)
                        : <StatusBadge status={studentStatus(a, sub?.submitted_at, released)} />}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )
      )}
    </div>
  );
}
