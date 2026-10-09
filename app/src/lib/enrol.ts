// Adding students to a course by email, one or many (US-35).
import { db } from "./supabase";

/** Addresses pasted as a list (commas, semicolons, spaces or new lines), each once. */
export function splitEmails(text: string) {
  return [...new Map(text.split(/[\s,;]+/).filter(Boolean).map((e) => [e.toLowerCase(), e])).values()];
}

export type EnrolProblem = { address: string; problem: string };

/** What stops each address from joining the course as a student; empty when all can. Adds nobody. */
export async function enrolProblems(courseId: string, addresses: string[]) {
  const { data, error } = await db().rpc("enrol_check", { c: courseId, addresses });
  if (error) throw error;
  return (data as { address: string; problem: string | null }[]).filter((r): r is EnrolProblem => r.problem !== null);
}

/** Adds each address as a student and returns who was added: a name for one, a count for several. */
export async function enrolAll(courseId: string, addresses: string[]) {
  let id = "";
  for (const address of addresses) {
    const { data, error } = await db().rpc("enrol_by_email", { c: courseId, address });
    if (error) throw error;
    id = data as string;
  }
  if (addresses.length > 1) return `${addresses.length} students`;
  const { data } = await db().from("profiles").select("full_name").eq("id", id).maybeSingle();
  return (data as { full_name: string } | null)?.full_name ?? "Student";
}
