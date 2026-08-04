import { createFileRoute } from "@tanstack/react-router";
import { runDueWatchChecks } from "../../lib/monitoring/engine";
import { safeEqualSecret } from "../../lib/proxy-ticket";

export const Route = createFileRoute("/api/check-watches")({
  server: {
    handlers: {
      POST: async ({ request }) => handleMonitor(request),
      GET: async () =>
        Response.json(
          { error: "Method not allowed. Use POST with Bearer auth." },
          { status: 405, headers: { allow: "POST", "cache-control": "no-store" } },
        ),
    },
  },
});

async function handleMonitor(request: Request) {
  const secret = process.env.MONITOR_CRON_SECRET;
  if (!secret) {
    console.error("Monitor refused: MONITOR_CRON_SECRET is not configured");
    return Response.json(
      { error: "Monitor is not configured" },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }

  const auth = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "")
    ?.trim();

  if (!safeEqualSecret(auth, secret)) {
    console.warn("Monitor unauthorized request");
    return Response.json(
      { error: "Unauthorized" },
      { status: 401, headers: { "cache-control": "no-store" } },
    );
  }

  try {
    // force=1 is for manual/local runs only — scheduled cron should omit it.
    const force = new URL(request.url).searchParams.get("force") === "1";
    const started = Date.now();
    const summary = await runDueWatchChecks(25, { force });
    const elapsedMs = Date.now() - started;

    console.info(
      JSON.stringify({
        event: "monitor_run",
        force,
        elapsedMs,
        checked: summary.checked,
        changed: summary.changed,
        errors: summary.errors,
        skipped: summary.skipped,
        baselines: summary.baselines,
        at: new Date().toISOString(),
      }),
    );

    return Response.json(
      { ok: true, force, elapsedMs, ...summary },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    console.error("Monitor run failed:", error);
    return Response.json(
      { error: "Monitor run failed" },
      { status: 500, headers: { "cache-control": "no-store" } },
    );
  }
}
