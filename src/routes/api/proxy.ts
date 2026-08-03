import { createFileRoute } from "@tanstack/react-router";
import {
  assertSafeOutboundUrl,
  DEFAULT_MAX_BYTES,
  fetchSafeOutbound,
  readResponseTextLimited,
} from "../../lib/outbound-url";
import { getPickerInjectScript } from "../../lib/picker-inject";

export const Route = createFileRoute("/api/proxy")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const u = new URL(request.url);
        const target = u.searchParams.get("url");
        if (!target || !/^https?:\/\//i.test(target)) {
          return new Response("Missing or invalid url", { status: 400 });
        }

        try {
          await assertSafeOutboundUrl(target);
        } catch (e) {
          return new Response(
            e instanceof Error ? e.message : "URL not allowed",
            { status: 400 },
          );
        }

        let upstream: Response;
        let finalUrl: string;
        try {
          const fetched = await fetchSafeOutbound(target);
          upstream = fetched.response;
          finalUrl = fetched.finalUrl;
        } catch {
          return new Response(
            `<!doctype html><meta charset="utf-8"><body style="font:14px system-ui;color:#eee;background:#0b0d12;padding:24px">Couldn't reach that page.</body>`,
            {
              status: 502,
              headers: { "content-type": "text/html; charset=utf-8" },
            },
          );
        }

        const ctype = upstream.headers.get("content-type") ?? "";

        // Non-HTML → stream through, strip frame blockers.
        if (!ctype.includes("text/html")) {
          const declared = Number(
            upstream.headers.get("content-length") ?? NaN,
          );
          if (Number.isFinite(declared) && declared > DEFAULT_MAX_BYTES) {
            return new Response("Response too large", { status: 413 });
          }
          const headers = new Headers(upstream.headers);
          headers.delete("x-frame-options");
          headers.delete("content-security-policy");
          headers.delete("content-security-policy-report-only");
          return new Response(upstream.body, {
            status: upstream.status,
            headers,
          });
        }

        let html: string;
        try {
          // Light sanitize only — full script stripping breaks most real sites.
          html = softenProxiedHtml(await readResponseTextLimited(upstream));
        } catch (e) {
          const message =
            e instanceof Error && e.message === "Response too large"
              ? "Page is too large to preview"
              : "Couldn't read that page.";
          return new Response(message, { status: 413 });
        }

        // Strip meta CSP / X-Frame-Options inside the doc.
        html = html.replace(
          /<meta[^>]+http-equiv=["']?(content-security-policy|x-frame-options)["']?[^>]*>/gi,
          "",
        );
        // Remove <base> so our injected one wins.
        html = html.replace(/<base\b[^>]*>/gi, "");

        const injectedHead = `<base href="${escapeAttr(finalUrl)}">`;
        const injectedBody = `<script>${getPickerInjectScript()}<\/script>`;

        if (/<head[^>]*>/i.test(html)) {
          html = html.replace(/<head([^>]*)>/i, `<head$1>${injectedHead}`);
        } else {
          html = `<head>${injectedHead}</head>` + html;
        }
        if (/<\/body>/i.test(html)) {
          html = html.replace(/<\/body>/i, `${injectedBody}</body>`);
        } else {
          html = html + injectedBody;
        }

        return new Response(html, {
          status: 200,
          headers: {
            "content-type": "text/html; charset=utf-8",
            "cache-control": "no-store",
            "x-frame-options": "SAMEORIGIN",
            "content-security-policy":
              "frame-ancestors 'self'; base-uri *; object-src 'none'",
          },
        });
      },
    },
  },
});

/** Soften only the riskiest bits; keep scripts so pages can render. */
function softenProxiedHtml(html: string): string {
  return html
    .replace(
      /\s(href|src|xlink:href)\s*=\s*("|')\s*javascript:[^"']*\2/gi,
      " $1=$2#$2",
    )
    .replace(/<(object|embed)\b[^>]*>/gi, "");
}

function escapeAttr(s: string) {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}
