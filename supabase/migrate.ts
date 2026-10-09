// Applies supabase/migrations/*.sql in filename order (each once, in a
// transaction), then seeds demo data when SEED_DEMO=true and not yet seeded.
import { SQL } from "bun";
import { readdirSync } from "node:fs";
import { join } from "node:path";

const sql = new SQL(process.env.DATABASE_URL ?? "postgres://postgres:postgres@localhost:5432/postgres");
const dir = join(import.meta.dir, "migrations");

await sql`create schema if not exists app_private`;
await sql`create table if not exists app_private.migrations (name text primary key, applied_at timestamptz not null default now())`;

const done = new Set((await sql`select name from app_private.migrations`).map((r: { name: string }) => r.name));
for (const file of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) {
  if (done.has(file)) continue;
  const text = await Bun.file(join(dir, file)).text();
  await sql.begin(async (tx) => {
    await tx.unsafe(text);
    await tx`insert into app_private.migrations (name) values (${file})`;
  });
  console.log(`applied ${file}`);
}
// Ask PostgREST to reload its schema cache.
await sql`notify pgrst, 'reload schema'`;

if (process.env.SEED_DEMO !== "false" && !done.has("seed") ) {
  const [{ n }] = await sql`select count(*)::int as n from app_private.migrations where name = 'seed'`;
  if (n === 0) {
    const { seed } = await import("./seed.ts");
    await seed(sql);
    await sql`insert into app_private.migrations (name) values ('seed')`;
    console.log("seeded demo data");
  }
}
await sql.close();
