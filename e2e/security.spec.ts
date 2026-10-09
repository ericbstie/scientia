// Story US-43: security regression tests. Each test sends the request a logged-in
// user (or an anonymous visitor) would send to the data API, and checks that the
// server refuses it or that the stored result is what the policy allows. Fixes
// are in supabase/migrations/0007_security_hardening.sql and app/server.ts.
// Write checks run a positive control first, so a refusal is only accepted when
// the same request shape is known to succeed.
import { test, expect, reset, token, users, type Who } from "./fixtures";
import type { APIRequestContext } from "@playwright/test";

test.beforeEach(() => reset());

type Client = { id: string; headers: Record<string, string> };

/** Encodes `?key=value&...` for PostgREST; values keep their operator, e.g. `eq.Mendel and peas`. */
const qs = (params: Record<string, string>) =>
  "?" + Object.entries(params).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");

async function anonKey(request: APIRequestContext) {
  return (await (await request.get("/config.json")).json()).anonKey as string;
}

async function login(request: APIRequestContext, who: Who): Promise<Client> {
  const t = await token(request, who);
  expect(t.ok, `sign in as ${who}`).toBeTruthy();
  return t;
}

async function select(request: APIRequestContext, c: Client, table: string, params: Record<string, string>) {
  const res = await request.get(`/rest/v1/${table}${qs(params)}`, { headers: c.headers });
  expect(res.ok(), `read ${table}${qs(params)}`).toBeTruthy();
  return (await res.json()) as Record<string, any>[];
}

async function courseId(request: APIRequestContext, c: Client) {
  const [course] = await select(request, c, "courses", { code: "eq.BIO101", select: "id" });
  return course.id as string;
}

async function assignmentId(request: APIRequestContext, c: Client, course: string, title: string) {
  const [a] = await select(request, c, "assignments", { course_id: `eq.${course}`, title: `eq.${title}`, select: "id" });
  return a.id as string;
}

async function moduleId(request: APIRequestContext, c: Client, course: string, title: string) {
  const [m] = await select(request, c, "modules", { course_id: `eq.${course}`, title: `eq.${title}`, select: "id" });
  return m.id as string;
}

test("@US-43 security: public signup is disabled", async ({ request }) => {
  const res = await request.post("/auth/v1/signup", {
    headers: { apikey: await anonKey(request) },
    data: { email: "intruder@example.com", password: "Intruder-pass-1", data: { role: "admin" } },
  });
  expect(res.ok(), `signup returned ${res.status()}`).toBeFalsy();
});

test("@US-43 security: GoTrue admin routes return 404 without the service key", async ({ request }) => {
  const apikey = await anonKey(request);
  const anon = await request.get("/auth/v1/admin/users", { headers: { apikey } });
  expect(anon.status()).toBe(404);

  const maya = await login(request, "maya");
  const signedIn = await request.get("/auth/v1/admin/users", { headers: { apikey, authorization: maya.headers.authorization } });
  expect(signedIn.status()).toBe(404);
});

test("@US-43 security: a student cannot read materials of an unpublished module", async ({ request }) => {
  const maya = await login(request, "maya");
  const ingrid = await login(request, "ingrid");
  const query = { title: "eq.Mendel and peas", select: "id,title" };

  expect(await select(request, maya, "materials", query)).toEqual([]);
  expect(await select(request, ingrid, "materials", query)).toHaveLength(1);
});

test("@US-43 security: a javascript: material link is rejected on insert", async ({ request }) => {
  const ingrid = await login(request, "ingrid");
  const bio = await courseId(request, ingrid);
  const week1 = await moduleId(request, ingrid, bio, "Week 1: Cells");
  const material = (url: string, title: string) => ({ course_id: bio, module_id: week1, position: 9, kind: "link", title, url });

  // Positive control: the same request with an https link is accepted.
  const control = await request.post("/rest/v1/materials", { headers: ingrid.headers, data: material("https://example.com/ok", "Control link") });
  expect(control.status()).toBe(201);

  const unsafe = await request.post("/rest/v1/materials", { headers: ingrid.headers, data: material("javascript:alert(document.cookie)", "Unsafe link") });
  expect(unsafe.ok(), `javascript: insert returned ${unsafe.status()}`).toBeFalsy();
  expect(await select(request, ingrid, "materials", { title: "eq.Unsafe link", select: "id" })).toEqual([]);
});

test("@US-43 security: a student cannot restore a reply a teacher removed", async ({ request }) => {
  const liam = await login(request, "liam");
  const ingrid = await login(request, "ingrid");
  const bio = await courseId(request, ingrid);
  const [thread] = await select(request, liam, "threads", { course_id: `eq.${bio}`, title: "eq.Question about the lab report", select: "id" });

  const created = await request.post("/rest/v1/replies", { headers: liam.headers, data: { thread_id: thread.id, body: "A reply the teacher will remove" } });
  expect(created.ok()).toBeTruthy();
  const [reply] = (await created.json()) as { id: string }[];

  const removed = await request.patch(`/rest/v1/replies?id=eq.${reply.id}`, { headers: ingrid.headers, data: { removed: true } });
  expect(removed.ok(), `teacher removal returned ${removed.status()}`).toBeTruthy();

  const restored = await request.patch(`/rest/v1/replies?id=eq.${reply.id}`, { headers: liam.headers, data: { removed: false } });
  expect(restored.ok(), `author restore returned ${restored.status()}`).toBeFalsy();
  expect(await select(request, ingrid, "replies", { id: `eq.${reply.id}`, select: "removed" })).toEqual([{ removed: true }]);
});

test("@US-43 security: a teacher cannot enrol someone as a teacher", async ({ request }) => {
  const ingrid = await login(request, "ingrid");
  const priya = await login(request, "priya");
  const bio = await courseId(request, ingrid);

  const teacher = await request.post("/rest/v1/enrollments", { headers: ingrid.headers, data: { course_id: bio, user_id: priya.id, role: "teacher" } });
  expect(teacher.ok(), `teacher enrolment returned ${teacher.status()}`).toBeFalsy();
  expect(await select(request, ingrid, "enrollments", { course_id: `eq.${bio}`, user_id: `eq.${priya.id}`, role: "eq.teacher", select: "role" })).toEqual([]);

  // Positive control: the same request as a student enrolment succeeds.
  const student = await request.post("/rest/v1/enrollments", { headers: ingrid.headers, data: { course_id: bio, user_id: priya.id, role: "student" } });
  expect(student.status()).toBe(201);
});

test("@US-43 security: a teacher cannot grade a student who is not enrolled", async ({ request }) => {
  const ingrid = await login(request, "ingrid");
  const maya = await login(request, "maya");
  const priya = await login(request, "priya");
  const bio = await courseId(request, ingrid);
  const lab1 = await assignmentId(request, ingrid, bio, "Lab report 1");
  const worksheet = await assignmentId(request, ingrid, bio, "Photosynthesis worksheet");
  const grade = (assignment: string, student: string, score: number) => ({
    assignment_id: assignment, student_id: student, score, feedback: "Forged", released: false, graded_by: ingrid.id,
  });

  // Positive control: grading an enrolled student who has no grade yet succeeds.
  const control = await request.post("/rest/v1/grades", { headers: ingrid.headers, data: grade(worksheet, maya.id, 40) });
  expect(control.status()).toBe(201);

  const forged = await request.post("/rest/v1/grades", { headers: ingrid.headers, data: grade(lab1, priya.id, 50) });
  expect(forged.ok(), `grade for non-member returned ${forged.status()}`).toBeFalsy();
  expect(await select(request, ingrid, "grades", { student_id: `eq.${priya.id}`, select: "student_id" })).toEqual([]);
});

test("@US-43 security: an announcement cannot be posted under another author", async ({ request }) => {
  const ingrid = await login(request, "ingrid");
  const liam = await login(request, "liam");
  const bio = await courseId(request, ingrid);
  const announcement = (author: string, title: string) => ({ course_id: bio, author_id: author, title, body: "Test body" });

  // Positive control: the teacher posting as herself succeeds.
  const control = await request.post("/rest/v1/announcements", { headers: ingrid.headers, data: announcement(ingrid.id, "Control notice") });
  expect(control.status()).toBe(201);

  const spoofed = await request.post("/rest/v1/announcements", { headers: ingrid.headers, data: announcement(liam.id, "Spoofed notice") });
  expect(spoofed.ok(), `spoofed announcement returned ${spoofed.status()}`).toBeFalsy();
  expect(await select(request, ingrid, "announcements", { title: "eq.Spoofed notice", select: "id" })).toEqual([]);
});

test("@US-43 security: the server sets submitted_at and attempt on a new submission", async ({ request }) => {
  const maya = await login(request, "maya");
  const bio = await courseId(request, maya);
  const worksheet = await assignmentId(request, maya, bio, "Photosynthesis worksheet");

  const res = await request.post("/rest/v1/submissions", {
    headers: maya.headers,
    data: { assignment_id: worksheet, student_id: maya.id, body: "Backdated answer", submitted_at: "2000-01-01T00:00:00Z" },
  });
  expect(res.ok(), `submission returned ${res.status()}`).toBeTruthy();
  const [row] = (await res.json()) as { submitted_at: string; attempt: number }[];
  expect(Math.abs(Date.now() - Date.parse(row.submitted_at))).toBeLessThan(5 * 60_000);
  expect(row.attempt).toBe(1);
});

test("@US-43 security: storage responses carry a sandbox content-security-policy", async ({ request }) => {
  const maya = await login(request, "maya");
  const bio = await courseId(request, maya);
  const res = await request.get(`/storage/v1/object/materials/${bio}/cell-structure.pdf`, { headers: maya.headers });
  expect(res.ok(), `storage read returned ${res.status()}`).toBeTruthy();
  expect(res.headers()["content-security-policy"]).toContain("sandbox");
});

test("@US-43 security: app pages cannot be framed and only run their own scripts", async ({ request }) => {
  for (const path of ["/", "/sign-in", "/courses/00000000-0000-0000-0000-000000000000/grading"]) {
    const res = await request.get(path);
    expect(res.headers()["content-type"], path).toContain("text/html");
    expect(res.headers()["x-frame-options"], path).toBe("DENY");
    expect(res.headers()["content-security-policy"], path).toContain("frame-ancestors 'none'");
    expect(res.headers()["content-security-policy"], path).toContain("script-src 'self'");
  }
});

test("@US-43 security: every API response carries x-content-type-options nosniff", async ({ request }) => {
  const apikey = await anonKey(request);
  const maya = await login(request, "maya");
  const bio = await courseId(request, maya);
  const responses = [
    await request.get("/rest/v1/courses?select=id", { headers: maya.headers }),
    await request.get("/rest/v1/materials?select=id&limit=1", { headers: { apikey } }),
    await request.post("/auth/v1/token?grant_type=password", { headers: { apikey }, data: { email: users.maya.email, password: "wrong-pass-1" } }),
    await request.get("/auth/v1/admin/users", { headers: { apikey } }),
    await request.get(`/storage/v1/object/materials/${bio}/cell-structure.pdf`, { headers: maya.headers }),
  ];
  for (const r of responses) {
    expect(r.headers()["x-content-type-options"], `${r.url()} (${r.status()})`).toBe("nosniff");
  }
});
