import type { ReactNode } from "react";
import { useAuth } from "../lib/auth";
import { db, must } from "../lib/supabase";
import { num, studentStatus } from "../lib/format";
import { useQuery } from "../lib/useQuery";
import { Card, CardBlock, Heading, Paragraph, Tag } from "@digdir/designsystemet-react";
import { Due, Empty, ErrorNote, List, Loading, PageHeader, Row, Section, StatusBadge, TextLink, useTitle } from "../ui";
import { myCourses, publishedAssignments, type AssignmentLite, type CourseLite } from "./personal/data";
import { loadTeacherData, needsGrading } from "./course/work/shared";

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
  const teacherCourses: TeacherCourse[] = await Promise.all(courses.map(async (course) => {
    const d = await loadTeacherData(course.id);
    return { course, students: d.students.length, needGrading: needsGrading(d) };
  }));
  return { teacherCourses };
}

function StudentView({ courses, upcoming, missing }: { courses: CourseLite[]; upcoming: Row[]; missing: Row[] }) {
  if (!courses.length)
    return <Empty title="No courses yet">Your teacher can add you to a course. If you expect to see one, ask an administrator.</Empty>;
  return (
    <>
      <Section title="Upcoming">
        {upcoming.length ? (
          <List>
            {upcoming.map((r, i) => (
              <Row key={r.id} tint={i === 0}>
                <div className="row-main">
                  <TextLink className="row-title" to={`/courses/${r.course_id}/assignments/${r.id}`}>{r.title}</TextLink>
                  <div className="row-meta">{r.code} · {num(r.points)} points</div>
                </div>
                <div className="row-side"><Due at={r.due_at} /> <StatusBadge status={r.status} /></div>
              </Row>
            ))}
          </List>
        ) : (
          <Empty title="Nothing due">New assignments appear here when your teacher publishes them.</Empty>
        )}
      </Section>
      <Section title="Missing">
        {missing.length ? (
          <List>
            {missing.map((r) => (
              <Row key={r.id}>
                <div className="row-main">
                  <TextLink className="row-title" to={`/courses/${r.course_id}/assignments/${r.id}`}>{r.title}</TextLink>
                  <div className="row-meta">{r.code} · {num(r.points)} points</div>
                </div>
                <div className="row-side">
                  <Due at={r.due_at} /> <StatusBadge status={r.status} />
                  {r.status !== "Closed" && <> <TextLink to={`/courses/${r.course_id}/assignments/${r.id}`}>Submit</TextLink></>}
                </div>
              </Row>
            ))}
          </List>
        ) : (
          <Empty title="Nothing missing">Assignments you have not handed in appear here once their due date has passed.</Empty>
        )}
      </Section>
      <Section title="Your courses">
        <div className="grid">
          {courses.map((c) => <CourseCard key={c.id} course={c} />)}
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
            <CourseCard key={c.id} course={c} meta={`${students} ${students === 1 ? "student" : "students"}`}>
              <CardBlock className="tint">
                <Paragraph><TextLink to={`/courses/${c.id}/grading?status=needs-grading`}><span className="figure">{needGrading}</span> need grading</TextLink></Paragraph>
              </CardBlock>
            </CourseCard>
          ))}
        </div>
      ) : (
        <Empty title="No courses yet">An administrator creates courses and assigns teachers.</Empty>
      )}
    </Section>
  );
}

/** A course on the Dashboard: a tinted card. Its title links to the course, so the system's
 *  Card makes the whole card open it and shows the title as a linked card heading. */
function CourseCard({ course: c, meta, children }: { course: { id: string; code: string; title: string }; meta?: string; children?: ReactNode }) {
  return (
    <Card data-color="accent" data-variant="tinted" className="course-card">
      <CardBlock>
        <Tag data-size="sm" data-variant="outline">{c.code}</Tag>
        <Heading level={3} data-size="2xs"><TextLink to={`/courses/${c.id}`}>{c.title}</TextLink></Heading>
        {meta && <Paragraph className="muted small">{meta}</Paragraph>}
      </CardBlock>
      {children}
    </Card>
  );
}
