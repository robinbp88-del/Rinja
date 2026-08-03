import { createFileRoute } from "@tanstack/react-router";
import { runDueWatchChecks } from "../../lib/monitoring/engine";

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
    return Response.json(
      { error: "MONITOR_CRON_SECRET is not configured" },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }

  const auth = request.headers
    .get("authorization")
    ?.replace(/^Bearer\s+/i, "")
    ?.trim();

  if (!auth || auth !== secret) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401, headers: { "cache-control": "no-store" } },
    );
  }

  try {
    // force=1 is for manual/local runs only — scheduled cron should omit it.
    const force = new URL(request.url).searchParams.get("force") === "1";
    const summary = await runDueWatchChecks(25, { force });
    return Response.json(
      { ok: true, force, ...summary },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    console.error("Monitor run failed:", error);
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Monitor run failed",
      },
      { status: 500, headers: { "cache-control": "no-store" } },
    );
  }
}
