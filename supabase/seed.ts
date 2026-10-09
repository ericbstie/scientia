// Demo data described in docs/stories/README.md. Re-runnable: it resets all
// course data and demo accounts to the documented state relative to "now".
//   docker compose: run by supabase/migrate.ts on first start
//   e2e:            `bun run supabase/reset.ts` (see e2e/fixtures.ts)
import type { SQL } from "bun";

export const DEMO_PASSWORD = "Demo-pass-123";

const people = {
  admin: { email: "admin@scientia.test", name: "Alex Admin", admin: true },
  ingrid: { email: "ingrid.solberg@scientia.test", name: "Dr. Ingrid Solberg" },
  maya: { email: "maya.okafor@scientia.test", name: "Maya Okafor" },
  liam: { email: "liam.hansen@scientia.test", name: "Liam Hansen" },
  sofia: { email: "sofia.reyes@scientia.test", name: "Sofia Reyes" },
  noah: { email: "noah.berg@scientia.test", name: "Noah Berg" },
  priya: { email: "priya.nair@scientia.test", name: "Priya Nair" },
} as const;
type Person = keyof typeof people;

const authUrl = process.env.AUTH_URL ?? "http://localhost:3000/auth/v1";
const storageUrl = process.env.STORAGE_URL ?? "http://localhost:3000/storage/v1";
const serviceKey = process.env.SERVICE_ROLE_KEY ?? "";
const svc = { authorization: `Bearer ${serviceKey}`, apikey: serviceKey };

async function api(url: string, init: RequestInit) {
  const res = await fetch(url, { ...init, headers: { ...svc, "content-type": "application/json", ...(init.headers ?? {}) } });
  if (!res.ok) throw new Error(`${init.method} ${url} → ${res.status} ${await res.text()}`);
  return res.json();
}

async function upload(bucket: string, path: string, body: Uint8Array<ArrayBuffer>, type: string) {
  const res = await fetch(`${storageUrl}/object/${bucket}/${path}`, {
    method: "POST",
    headers: { ...svc, "content-type": type, "x-upsert": "true" },
    body,
  });
  if (!res.ok) throw new Error(`upload ${bucket}/${path} → ${res.status} ${await res.text()}`);
}

/** A tiny valid one-page PDF with a line of text. */
export function pdf(text: string): Uint8Array<ArrayBuffer> {
  const content = `BT /F1 18 Tf 72 720 Td (${text.replace(/[()\\]/g, "")}) Tj ET`;
  const objs = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${content.length} >>\nstream\n${content}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let out = "%PDF-1.4\n";
  const offsets: number[] = [];
  objs.forEach((o, i) => { offsets.push(out.length); out += `${i + 1} 0 obj\n${o}\nendobj\n`; });
  const xref = out.length;
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offsets.map((o) => `${String(o).padStart(10, "0")} 00000 n \n`).join("")}`;
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return new TextEncoder().encode(out) as Uint8Array<ArrayBuffer>;
}

/** Day offset from today at 23:59 UTC (assignment due times), or a time offset in days from now. */
const dueDay = (days: number) => {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + days);
  d.setUTCHours(23, 59, 0, 0);
  return d.toISOString();
};
const ago = (days: number) => new Date(Date.now() - days * 86400000).toISOString();

async function ensureUsers(sql: SQL): Promise<Record<Person, string>> {
  const emails = Object.values(people).map((p) => p.email);
  // Remove accounts created by tests or by hand so the seed state is exact.
  await sql`delete from auth.users where email not in ${sql(emails)}`;
  const existing: { id: string; email: string }[] = await sql`select id, email from auth.users`;
  const ids = {} as Record<Person, string>;
  for (const [key, p] of Object.entries(people) as [Person, (typeof people)[Person]][]) {
    const found = existing.find((u) => u.email === p.email);
    if (found) {
      await api(`${authUrl}/admin/users/${found.id}`, {
        method: "PUT",
        body: JSON.stringify({ password: DEMO_PASSWORD, ban_duration: "none", user_metadata: { full_name: p.name } }),
      });
      ids[key] = found.id;
    } else {
      const u = await api(`${authUrl}/admin/users`, {
        method: "POST",
        body: JSON.stringify({ email: p.email, password: DEMO_PASSWORD, email_confirm: true, user_metadata: { full_name: p.name } }),
      });
      ids[key] = u.id;
    }
    await sql`update public.profiles set full_name = ${p.name}, is_admin = ${"admin" in p}, deactivated = false where id = ${ids[key]}`;
  }
  return ids;
}

export async function seed(sql: SQL) {
  const u = await ensureUsers(sql);
  const files: [bucket: string, path: string, body: Uint8Array<ArrayBuffer>][] = [];

  await sql.begin(async (tx) => {
    // Seed exactly the documented state: no triggers (notifications, guards) while inserting.
    await tx`set local session_replication_role = replica`;
    await tx`truncate public.courses, public.notifications, public.notification_prefs cascade`;

    const [bio] = await tx`insert into public.courses (code, title, term, description) values
      ('BIO101', 'Introduction to Biology', 'Autumn 2026', 'Cells, energy and inheritance: the foundations of modern biology.') returning id`;
    const [his] = await tx`insert into public.courses (code, title, term, description) values
      ('HIS201', 'Modern European History', 'Autumn 2026', 'Revolutions, nations and empires in Europe from 1789 to 1918.') returning id`;

    const enrol = (c: string, p: Person, role: "teacher" | "student") => tx`insert into public.enrollments (course_id, user_id, role) values (${c}, ${u[p]}, ${role})`;
    await enrol(bio.id, "ingrid", "teacher");
    for (const p of ["maya", "liam", "sofia", "noah"] as const) await enrol(bio.id, p, "student");
    await enrol(his.id, "ingrid", "teacher");
    for (const p of ["maya", "liam"] as const) await enrol(his.id, p, "student");

    const mod = async (c: string, title: string, position: number, published = true) =>
      (await tx`insert into public.modules (course_id, title, position, published) values (${c}, ${title}, ${position}, ${published}) returning id`)[0].id as string;
    const mat = (c: string, m: string, position: number, kind: string, title: string, extra: { body?: string; url?: string; file_path?: string; file_name?: string } = {}) =>
      tx`insert into public.materials (course_id, module_id, position, kind, title, body, url, file_path, file_name)
         values (${c}, ${m}, ${position}, ${kind}, ${title}, ${extra.body ?? ""}, ${extra.url ?? null}, ${extra.file_path ?? null}, ${extra.file_name ?? null})`;

    const w1 = await mod(bio.id, "Week 1: Cells", 0);
    await mat(bio.id, w1, 0, "page", "Welcome and syllabus", { body: "Welcome to BIO101!\n\nEach week has a short reading, a lab and one assignment. Hand in work on Scientia before 23:59 on the due date.\n\nOffice hours: Tuesdays 14:00–15:00, room B2.14." });
    await mat(bio.id, w1, 1, "file", "Cell structure (PDF)", { file_path: `${bio.id}/cell-structure.pdf`, file_name: "cell-structure.pdf" });
    await mat(bio.id, w1, 2, "link", "Khan Academy: Cell biology", { url: "https://www.khanacademy.org/science/biology/structure-of-a-cell" });
    const w2 = await mod(bio.id, "Week 2: Photosynthesis", 1);
    await mat(bio.id, w2, 0, "page", "Photosynthesis overview", { body: "Photosynthesis turns light energy into chemical energy.\n\nLight reactions happen in the thylakoid membranes; the Calvin cycle happens in the stroma." });
    await mat(bio.id, w2, 1, "link", "Photosynthesis explained", { url: "https://en.wikipedia.org/wiki/Photosynthesis" });
    const w3 = await mod(bio.id, "Week 3: Genetics", 2, false);
    await mat(bio.id, w3, 0, "page", "Mendel and peas", { body: "Gregor Mendel's experiments with pea plants revealed the basic rules of inheritance." });
    const h1 = await mod(his.id, "Unit 1: The 1848 revolutions", 0);
    await mat(his.id, h1, 0, "page", "Reading list", { body: "1. Mike Rapport, 1848: Year of Revolution\n2. Jonathan Sperber, The European Revolutions, 1848–1851" });

    const ann = async (c: string, title: string, body: string, days: number, pinned = false) =>
      (await tx`insert into public.announcements (course_id, author_id, title, body, pinned, created_at) values (${c}, ${u.ingrid}, ${title}, ${body}, ${pinned}, ${ago(days)}) returning id`)[0].id as string;
    await ann(bio.id, "Welcome to BIO101", "Welcome! Start with the syllabus in Week 1. Labs begin next week.", 21, true);
    const labAnn = await ann(bio.id, "Lab report 1 marking update", "Lab reports are being marked this week. Released grades show up under Grades.", 3);
    const readAnn = await ann(his.id, "Reading list posted", "The reading list for Unit 1 is now in Modules.", 2);

    const asg = async (c: string, title: string, days: number, points: number, accepts: "text" | "file" | "both", allowLate: boolean, published: boolean, module: string | null, description: string) =>
      (await tx`insert into public.assignments (course_id, module_id, title, description, due_at, points, accepts_text, accepts_files, allow_late, published, created_at)
        values (${c}, ${module}, ${title}, ${description}, ${dueDay(days)}, ${points}, ${accepts !== "file"}, ${accepts !== "text"}, ${allowLate}, ${published}, ${ago(30)}) returning id`)[0].id as string;
    const safety = await asg(bio.id, "Safety acknowledgement", -14, 10, "text", false, true, w1, "Confirm that you have read the lab safety rules by typing \"I have read the safety rules\".");
    const lab1 = await asg(bio.id, "Lab report 1", -7, 100, "both", true, true, w1, "Write up the cell observation lab: aim, methods, results (with a labelled table) and conclusion. Max 4 pages.");
    const worksheet = await asg(bio.id, "Photosynthesis worksheet", 2, 50, "text", true, true, w2, "Answer the five questions in the Week 2 overview in your own words.");
    await asg(bio.id, "Field journal", 21, 100, "file", true, true, null, "Keep a two-week field journal of plant life near you. Upload it as one PDF.");
    await asg(bio.id, "Final project", 60, 100, "both", true, false, null, "A short research project on a topic of your choice. Details to follow.");
    await asg(his.id, "Essay: the 1848 revolutions", 5, 100, "both", true, true, h1, "1500 words: why did the 1848 revolutions fail?");
    await asg(his.id, "Source analysis", 30, 50, "both", true, true, h1, "Analyse one primary source from the reading list.");

    const lab1Due = new Date(dueDay(-7)).getTime();
    const sub = (a: string, p: Person, body: string, at: string, files: object[] = []) =>
      tx`insert into public.submissions (assignment_id, student_id, body, files, submitted_at) values (${a}, ${u[p]}, ${body}, ${JSON.stringify(files)}::jsonb, ${at})`;
    const grade = (a: string, p: Person, score: number, feedback: string, released: boolean, at: string) =>
      tx`insert into public.grades (assignment_id, student_id, score, feedback, released, graded_by, graded_at) values (${a}, ${u[p]}, ${score}, ${feedback}, ${released}, ${u.ingrid}, ${at})`;

    await sub(safety, "maya", "I have read the safety rules", ago(16));
    await grade(safety, "maya", 10, "Thanks!", true, ago(13));
    const mayaFile = `${lab1}/${u.maya}/lab-report-1.pdf`;
    await sub(lab1, "maya", "My lab report is attached.", new Date(lab1Due - 86400000).toISOString(), [{ path: mayaFile, name: "lab-report-1.pdf", size: 1024 }]);
    await grade(lab1, "maya", 86, "Clear methods section. Add units to Table 2 and cite the microscope model.", true, ago(2));
    await sub(lab1, "liam", "Observations: onion cells showed clear cell walls and nuclei. Conclusion: plant cells have rigid walls.", new Date(lab1Due - 3600000).toISOString());
    await grade(lab1, "liam", 72, "Good observations; the conclusion needs evidence from your data.", false, ago(2));
    await sub(lab1, "sofia", "Sorry this is late. Report text: cells observed under 400x magnification.", new Date(lab1Due + 86400000).toISOString());
    await sub(worksheet, "liam", "Light reactions occur in the thylakoid membrane.", ago(1));

    const [thread] = await tx`insert into public.threads (course_id, author_id, title, body, created_at) values
      (${bio.id}, ${u.liam}, 'Question about the lab report', 'Should the methods section list the microscope model?', ${ago(5)}) returning id`;
    await tx`insert into public.replies (thread_id, author_id, body, created_at) values
      (${thread.id}, ${u.ingrid}, 'Yes, please include it.', ${ago(4.9)}),
      (${thread.id}, ${u.maya}, 'Thanks, I wondered too.', ${ago(4.8)})`;

    await tx`insert into public.notifications (user_id, course_id, kind, title, link, read_at, created_at) values
      (${u.maya}, ${his.id}, 'announcement', 'New announcement: Reading list posted', ${`/courses/${his.id}/announcements#${readAnn}`}, ${ago(1.9)}, ${ago(2)}),
      (${u.maya}, ${bio.id}, 'announcement', 'New announcement: Lab report 1 marking update', ${`/courses/${bio.id}/announcements#${labAnn}`}, null, ${ago(3)}),
      (${u.maya}, ${bio.id}, 'grade', 'Grade released: Lab report 1', ${`/courses/${bio.id}/assignments/${lab1}`}, null, ${ago(2)})`;

    // Files are uploaded after commit through the storage API.
    files.push(
      ["materials", `${bio.id}/cell-structure.pdf`, pdf("Cell structure: membrane, nucleus, mitochondria")],
      ["submissions", mayaFile, pdf("Lab report 1 by Maya Okafor")],
    );
  });

  for (const [bucket, path, body] of files) await upload(bucket, path, body, "application/pdf");
  await sql`notify pgrst, 'reload schema'`;
}
