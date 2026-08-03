/**
 * Local helper: force-run monitoring against a running app.
 * Usage:
 *   npm run monitor:once
 *   npm run monitor:once -- http://localhost:8081
 *
 * Always uses ?force=1 (checks all non-paused watches). Production cron must not.
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const base = process.argv[2] ?? "http://localhost:8080";
const envPath = resolve(process.cwd(), ".env.local");
const envText = readFileSync(envPath, "utf8");
const secret = envText
  .split(/\r?\n/)
  .find((line) => line.startsWith("MONITOR_CRON_SECRET="))
  ?.slice("MONITOR_CRON_SECRET=".length)
  ?.trim();

if (!secret) {
  console.error("MONITOR_CRON_SECRET missing in .env.local");
  process.exit(1);
}

const url = `${base.replace(/\/$/, "")}/api/check-watches?force=1`;
const res = await fetch(url, {
  method: "POST",
  headers: {
    Authorization: `Bearer ${secret}`,
    "Cache-Control": "no-store",
    Accept: "application/json",
  },
});
const body = await res.text();

console.log(`status ${res.status}`);
console.log(body);

if (!res.ok) process.exit(1);
