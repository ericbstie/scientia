import { Link } from "react-router";
import { useCourse, useDocTitle } from "../../App";
import { useAuth } from "../../lib/auth";
import { fmtDate, studentStatus } from "../../lib/format";
import { db, must } from "../../lib/supabase";
import { useQuery } from "../../lib/useQuery";
import { Badge, ButtonLink, Due, ErrorNote, Loading, PageHeader, Section, StatusBadge, Empty } from "../../ui";
import { loadTeacherData, needsGrading } from "./work/shared";

type Asg = { id: string; title: string; due_at: string; allow_late: boolean; published: boolean };
type Ann = { id: string; title: string; created_at: string; pinned?: boolean };

export function CourseHome() {
  const { course, role } = useCourse();
  useDocTitle(course.title);
  return role === "teacher" ? <TeacherHome /> : <StudentHome />;
}

function StudentHome() {
  const { course } = useCourse();
  const { profile } = useAuth();
  const base = `/courses/${course.id}`;
  const q = useQuery(async () => {
    const now = new Date().toISOString();
    const [anns, reads, upcoming] = await Promise.all([
      db().from("announcements").select("id, title, created_at, pinned").eq("course_id", course.id).order("pinned", { ascending: false }).order("created_at", { ascending: false }).limit(3),
      db().from("announcement_reads").select("announcement_id").eq("user_id", profile!.id),
      db().from("assignments").select("id, title, due_at:my_due_at, allow_late, published").eq("course_id", course.id).gte("my_due_at", now).order("my_due_at").limit(2),
    ]);
    const next = must(upcoming) as Asg[];
    const ids = next.map((a) => a.id);
    const [subs, grades] = ids.length
      ? await Promise.all([
          db().from("submissions").select("assignment_id, submitted_at").eq("student_id", profile!.id).in("assignment_id", ids),
          db().from("grades").select("assignment_id, released").eq("student_id", profile!.id).in("assignment_id", ids),
        ])
      : [{ data: [], error: null }, { data: [], error: null }];
    return {
      anns: must(anns) as Ann[],
      read: new Set((must(reads) as { announcement_id: string }[]).map((r) => r.announcement_id)),
      next,
      submitted: new Map((must(subs) as { assignment_id: string; submitted_at: string }[]).map((s) => [s.assignment_id, s.submitted_at])),
      released: new Set((must(grades) as { assignment_id: string; released: boolean }[]).filter((g) => g.released).map((g) => g.assignment_id)),
    };
  }, [course.id]);

  return (
    <div className="content">
      <PageHeader title={course.title} subtitle={course.description || undefined} />
      <ErrorNote error={q.error} />
      {q.loading && !q.data ? <Loading /> : q.data && (
        <>
          {q.data.anns.length > 0 && (
            <Section title="Announcements" action={<Link to={`${base}/announcements`}>All announcements</Link>}>
              <ul className="list">
                {q.data.anns.map((a) => (
                  <li key={a.id}>
                    <div className="row">
                      <div className="row-main">
                        <Link className="row-title" to={`${base}/announcements/${a.id}`}>{a.title}</Link>
                        <div className="row-meta"><time dateTime={a.created_at}>{fmtDate(a.created_at)}</time></div>
                      </div>
                      <div className="row-side">
                        {a.pinned && <Badge>Pinned</Badge>}
                        {!q.data!.read.has(a.id) && <Badge tone="accent">Unread</Badge>}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </Section>
          )}
          <Section title="Next due">
            {q.data.next.length === 0 ? (
              <Empty title="Nothing due in this course" />
            ) : (
              <ul className="list">
                {q.data.next.map((a) => (
                  <li key={a.id}>
                    <div className="row">
                      <div className="row-main">
                        <Link className="row-title" to={`${base}/assignments/${a.id}`}>{a.title}</Link>
                        <div className="row-meta">Due <Due at={a.due_at} /></div>
                      </div>
                      <div className="row-side"><StatusBadge status={studentStatus(a, q.data!.submitted.get(a.id), q.data!.released.has(a.id))} /></div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </>
      )}
    </div>
  );
}

function TeacherHome() {
  const { course } = useCourse();
  const base = `/courses/${course.id}`;
  const q = useQuery(async () => {
    const now = new Date().toISOString();
    const [anns, asgs, work] = await Promise.all([
      db().from("announcements").select("id, title, created_at").eq("course_id", course.id).order("created_at", { ascending: false }).limit(3),
      db().from("assignments").select("id, title, due_at:my_due_at, allow_late, published").eq("course_id", course.id).gte("my_due_at", now).order("my_due_at").limit(3),
      loadTeacherData(course.id),
    ]);
    return { anns: must(anns) as Ann[], asgs: must(asgs) as Asg[], needs: needsGrading(work) };
  }, [course.id]);

  return (
    <div className="content">
      <PageHeader title={course.title} subtitle={course.description || undefined} />
      <ErrorNote error={q.error} />
      {q.loading && !q.data ? <Loading /> : q.data && (
        <>
          <ul className="list spaced">
            <li>
              <div className="row">
                <div className="row-main">
                  <Link className="row-title" to={`${base}/grading`}>{q.data.needs} need grading</Link>
                  <div className="row-meta">Open the grading queue</div>
                </div>
              </div>
            </li>
          </ul>
          <Section title="Announcements" action={<ButtonLink to={`${base}/announcements/new`}>New announcement</ButtonLink>}>
            {q.data.anns.length === 0 ? (
              <Empty title="No announcements yet">Post one to tell your students what is happening.</Empty>
            ) : (
              <ul className="list">
                {q.data.anns.map((a) => (
                  <li key={a.id}>
                    <div className="row">
                      <div className="row-main">
                        <Link className="row-title" to={`${base}/announcements/${a.id}`}>{a.title}</Link>
                        <div className="row-meta"><time dateTime={a.created_at}>{fmtDate(a.created_at)}</time></div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>
          <Section title="Assignments" action={<ButtonLink to={`${base}/assignments/new`}>New assignment</ButtonLink>}>
            {q.data.asgs.length === 0 ? (
              <Empty title="Nothing due in this course" />
            ) : (
              <ul className="list">
                {q.data.asgs.map((a) => (
                  <li key={a.id}>
                    <div className="row">
                      <div className="row-main">
                        <Link className="row-title" to={`${base}/assignments/${a.id}`}>{a.title}</Link>
                        <div className="row-meta">Due <Due at={a.due_at} /></div>
                      </div>
                      <div className="row-side">{!a.published && <Badge>Draft</Badge>}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </>
      )}
    </div>
  );
}
