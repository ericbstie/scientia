import { db, must } from "../../lib/supabase";

export type CourseLite = { id: string; code: string; title: string; role: "teacher" | "student" };
export type AssignmentLite = { id: string; course_id: string; title: string; due_at: string; points: number | string; allow_late: boolean };

/** Courses the user is enrolled in (any role), ordered by code. */
export async function myCourses(userId: string): Promise<CourseLite[]> {
  const rows = must(await db().from("enrollments").select("role, courses(id, code, title)").eq("user_id", userId)) as unknown as { role: "teacher" | "student"; courses: { id: string; code: string; title: string } | null }[];
  return rows.filter((r) => r.courses).map((r) => ({ ...r.courses!, role: r.role })).sort((a, b) => a.code.localeCompare(b.code));
}

/** Published assignments of the given courses, soonest first. */
export async function publishedAssignments(courseIds: string[]): Promise<AssignmentLite[]> {
  if (!courseIds.length) return [];
  return must(await db().from("assignments").select("id, course_id, title, due_at, points, allow_late").in("course_id", courseIds).eq("published", true).order("due_at")) as AssignmentLite[];
}
