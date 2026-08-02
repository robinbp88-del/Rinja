import { createFileRoute } from "@tanstack/react-router";
import { runDueWatchChecks } from "../../lib/monitoring/engine";

export const Route = createFileRoute("/api/check-watches")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const secret = process.env.MONITOR_CRON_SECRET;
        if (!secret) {
          return Response.json(
            { error: "MONITOR_CRON_SECRET is not configured" },
            { status: 503 },
          );
        }

        const auth =
          request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ??
          new URL(request.url).searchParams.get("secret");

        if (auth !== secret) {
          return Response.json({ error: "Unauthorized" }, { status: 401 });
        }

        try {
          const force =
            new URL(request.url).searchParams.get("force") === "1";
          const summary = await runDueWatchChecks(25, { force });
          return Response.json({ ok: true, force, ...summary });
        } catch (error) {
          console.error("Monitor run failed:", error);
          return Response.json(
            {
              error:
                error instanceof Error
                  ? error.message
                  : "Monitor run failed",
            },
            { status: 500 },
          );
        }
      },
    },
  },
});
