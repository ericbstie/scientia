// Prints an anon key and a service_role key signed with JWT_SECRET (HS256).
// Usage: JWT_SECRET=... bun run scripts/gen-keys.ts
import { createHmac } from "node:crypto";

const secret = process.env.JWT_SECRET;
if (!secret || secret.length < 32) throw new Error("JWT_SECRET must be at least 32 characters");
const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
const sign = (role: string) => {
  const body = `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ role, iss: "supabase", iat: 1791504000, exp: 2106864000 })}`;
  return `${body}.${createHmac("sha256", secret).update(body).digest("base64url")}`;
};
console.log(`ANON_KEY=${sign("anon")}\nSERVICE_ROLE_KEY=${sign("service_role")}`);
