import { mkdirSync, rmSync } from "node:fs";

export default async function globalSetup() {
  const base = process.env.BASE_URL ?? "http://localhost:3000";
  const res = await fetch(`${base}/healthz`).catch(() => null);
  if (!res?.ok) throw new Error(`Scientia is not running at ${base}. Start it with \`docker compose up\` (or \`mise run up\`).`);
  mkdirSync("e2e/.results", { recursive: true });
  rmSync("e2e/.results/a11y.jsonl", { force: true });
}
