import { createFileRoute } from "@tanstack/react-router";
import { runDailyDigests } from "../../lib/digest";

export const Route = createFileRoute("/api/send-digests")({
  server: {
    handlers: {
      POST: async ({ request }) => handleDigest(request),
      GET: async () =>
        Response.json(
          { error: "Method not allowed. Use POST with Bearer auth." },
          { status: 405, headers: { allow: "POST", "cache-control": "no-store" } },
        ),
    },
  },
});

async function handleDigest(request: Request) {
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
    const summary = await runDailyDigests();
    return Response.json(
      { ok: true, ...summary },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    console.error("Digest run failed:", error);
    return Response.json(
      {
        error:
          error instanceof Error ? error.message : "Digest run failed",
      },
      { status: 500, headers: { "cache-control": "no-store" } },
    );
  }
}
