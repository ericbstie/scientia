import { Link } from "react-router";
import { useAuth } from "../lib/auth";
import { db, must } from "../lib/supabase";
import { num, studentStatus } from "../lib/format";
import { useQuery } from "../lib/useQuery";
import { Due, Empty, ErrorNote, Loading, PageHeader, Section, StatusBadge, useTitle } from "../ui";
import { myCourses, publishedAssignments, type AssignmentLite, type CourseLite } from "./personal/data";

type Row = AssignmentLite & { code: string; status: ReturnType<typeof studentStatus> };
type Data = Awaited<ReturnType<typeof loadTeacher>> | Awaited<ReturnType<typeof loadStudent>>;
type TeacherCourse = { course: CourseLite; students: number; needGrading: number };

export function Dashboard() {
  const { profile } = useAuth();
  useTitle("Dashboard");
  const uid = profile!.id;
  const teacher = profile!.role === "teacher";
  const { data, error, loading } = useQuery<Data>(() => (teacher ? loadTeacher(uid) : loadStudent(uid)), [uid, teacher]);

  return (
    <div className="content">
      <PageHeader title="Dashboard" />
      <ErrorNote error={error} />
      {loading && !data ? <Loading /> : data && ("teacherCourses" in data ? <TeacherView courses={data.teacherCourses} /> : <StudentView {...data} />)}
    </div>
  );
}

async function loadStudent(uid: string) {
  const courses = await myCourses(uid);
  const assignments = await publishedAssignments(courses.map((c) => c.id));
  const subs = must(await db().from("submissions").select("assignment_id, submitted_at").eq("student_id", uid)) as { assignment_id: string; submitted_at: string }[];
  const grades = must(await db().from("grades").select("assignment_id").eq("student_id", uid).eq("released", true)) as { assignment_id: string }[];
  const submitted = new Map(subs.map((s) => [s.assignment_id, s.submitted_at]));
  const released = new Set(grades.map((g) => g.assignment_id));
  const code = new Map(courses.map((c) => [c.id, c.code]));
  const now = Date.now();
  const rows: Row[] = assignments.map((a) => ({ ...a, code: code.get(a.course_id) ?? "", status: studentStatus(a, submitted.get(a.id), released.has(a.id), now) }));
  const upcoming = rows.filter((r) => new Date(r.due_at).getTime() > now);
  const missing = rows.filter((r) => new Date(r.due_at).getTime() <= now && !submitted.has(r.id)).sort((a, b) => b.due_at.localeCompare(a.due_at));
  return { courses, upcoming, missing };
}

async function loadTeacher(uid: string) {
  const courses = (await myCourses(uid)).filter((c) => c.role === "teacher");
  const ids = courses.map((c) => c.id);
  const out: TeacherCourse[] = [];
  if (ids.length) {
    const enrol = must(await db().from("enrollments").select("course_id").in("course_id", ids).eq("role", "student")) as { course_id: string }[];
    const assignments = must(await db().from("assignments").select("id, course_id").in("course_id", ids)) as { id: string; course_id: string }[];
    const aids = assignments.map((a) => a.id);
    const subs = aids.length ? (must(await db().from("submissions").select("assignment_id, student_id").in("assignment_id", aids)) as { assignment_id: string; student_id: string }[]) : [];
    const graded = aids.length ? (must(await db().from("grades").select("assignment_id, student_id").in("assignment_id", aids).not("score", "is", null)) as { assignment_id: string; student_id: string }[]) : [];
    const gradedKeys = new Set(graded.map((g) => `${g.assignment_id}/${g.student_id}`));
    const courseOf = new Map(assignments.map((a) => [a.id, a.course_id]));
    for (const c of courses) {
      out.push({
        course: c,
        students: enrol.filter((e) => e.course_id === c.id).length,
        needGrading: subs.filter((s) => courseOf.get(s.assignment_id) === c.id && !gradedKeys.has(`${s.assignment_id}/${s.student_id}`)).length,
      });
    }
  }
  return { teacherCourses: out };
}

function StudentView({ courses, upcoming, missing }: { courses: CourseLite[]; upcoming: Row[]; missing: Row[] }) {
  if (!courses.length)
    return <Empty title="No courses yet">You are not enrolled in any course yet. Your teacher can add you by email, or ask an administrator.</Empty>;
  return (
    <>
      <Section title="Upcoming">
        {upcoming.length ? (
          <ul className="list">
            {upcoming.map((r) => (
              <li key={r.id} className="row">
                <div className="row-main">
                  <Link className="row-title" to={`/courses/${r.course_id}/assignments/${r.id}`}>{r.title}</Link>
                  <div className="row-meta">{r.code} · {num(r.points)} points</div>
                </div>
                <div className="row-side" style={{ whiteSpace: "normal" }}><Due at={r.due_at} /> <StatusBadge status={r.status} /></div>
              </li>
            ))}
          </ul>
        ) : (
          <Empty title="Nothing due">Nothing due. New assignments appear here when your teacher publishes them.</Empty>
        )}
      </Section>
      <Section title="Missing">
        {missing.length ? (
          <ul className="list">
            {missing.map((r) => (
              <li key={r.id} className="row">
                <div className="row-main">
                  <Link className="row-title" to={`/courses/${r.course_id}/assignments/${r.id}`}>{r.title}</Link>
                  <div className="row-meta">{r.code} · {num(r.points)} points</div>
                </div>
                <div className="row-side" style={{ whiteSpace: "normal" }}>
                  <Due at={r.due_at} />{" "}
                  {r.status === "Closed" ? <span className="muted">Closed, can no longer be handed in</span> : <Link to={`/courses/${r.course_id}/assignments/${r.id}`}>Submit late</Link>}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <Empty title="Nothing missing">Assignments you have not handed in appear here once they are past due.</Empty>
        )}
      </Section>
      <Section title="Your courses">
        <div className="grid">
          {courses.map((c) => (
            <Link key={c.id} to={`/courses/${c.id}`} className="card course-card">
              <div className="code">{c.code}</div>
              <div className="title">{c.title}</div>
            </Link>
          ))}
        </div>
      </Section>
    </>
  );
}

function TeacherView({ courses }: { courses: TeacherCourse[] }) {
  return (
    <Section title="Your courses">
      {courses.length ? (
        <div className="grid">
          {courses.map(({ course: c, students, needGrading }) => (
            <div key={c.id} className="card course-card">
              <div className="code">{c.code}</div>
              <div className="title"><Link to={`/courses/${c.id}`}>{c.title}</Link></div>
              <div className="muted small">{students} {students === 1 ? "student" : "students"}</div>
              <div className="small"><Link to={`/courses/${c.id}/grading?status=needs-grading`}>{needGrading} need grading</Link></div>
            </div>
          ))}
        </div>
      ) : (
        <Empty title="No courses yet">You don't teach any course yet. An administrator creates courses and assigns teachers.</Empty>
      )}
    </Section>
  );
}
