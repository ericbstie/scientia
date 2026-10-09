// Resets the running stack to the documented demo state (used by e2e tests).
// Defaults match docker-compose.yml's local development values.
import { SQL } from "bun";

process.env.SERVICE_ROLE_KEY ??= "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3OTE1MDQwMDAsImV4cCI6MjEwNjg2NDAwMH0.s0rb0ojBrHRW8_8NpndT3SYhtCuLRit_WIAzuflYCeg";
const sql = new SQL(process.env.DATABASE_URL ?? "postgres://postgres:scientia-local-db-password@127.0.0.1:54322/postgres");
const { seed } = await import("./seed.ts");
await seed(sql);
await sql.close();
console.log("reset to demo data");
