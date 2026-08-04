import { createFileRoute } from "@tanstack/react-router";
import {
  assertSafeOutboundUrl,
  DEFAULT_MAX_BYTES,
  fetchSafeOutbound,
  readResponseTextLimited,
} from "../../lib/outbound-url";
import { getPickerInjectScript } from "../../lib/picker-inject";
import { PROXY_COOKIE, verifyProxyTicket } from "../../lib/proxy-ticket";

function readCookie(request: Request, name: string): string | null {
  const raw = request.headers.get("cookie");
  if (!raw) return null;
  for (const part of raw.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

function authorizeProxy(request: Request): Response | null {
  const u = new URL(request.url);
  const ticket =
    u.searchParams.get("t") ?? u.searchParams.get("ticket") ?? readCookie(request, PROXY_COOKIE);

  const verified = verifyProxyTicket(ticket);
  if (!verified.ok) {
    console.warn("Proxy denied: missing or invalid ticket");
    return new Response("Sign in required to preview pages.", {
      status: 401,
      headers: { "cache-control": "no-store" },
    });
  }
  return null;
}

function proxyAuthCookie(ticket: string): string {
  const secure =
    process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production"
      ? "; Secure"
      : "";
  return `${PROXY_COOKIE}=${encodeURIComponent(ticket)}; Path=/api/proxy; Max-Age=900; SameSite=Lax; HttpOnly${secure}`;
}

export const Route = createFileRoute("/api/proxy")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const denied = authorizeProxy(request);
        if (denied) return denied;

        const u = new URL(request.url);
        const target = u.searchParams.get("url");
        if (!target || !/^https?:\/\//i.test(target)) {
          return new Response("Missing or invalid url", { status: 400 });
        }

        const ticket =
          u.searchParams.get("t") ??
          u.searchParams.get("ticket") ??
          readCookie(request, PROXY_COOKIE) ??
          "";

        try {
          await assertSafeOutboundUrl(target);
        } catch (e) {
          const message = e instanceof Error ? e.message : "URL not allowed";
          // Keep SSRF messages generic for clients.
          console.warn("Proxy blocked URL:", message);
          return new Response("That URL isn’t allowed.", { status: 400 });
        }

        let upstream: Response;
        let finalUrl: string;
        try {
          const fetched = await fetchSafeOutbound(target, { retries: 1 });
          upstream = fetched.response;
          finalUrl = fetched.finalUrl;
        } catch (error) {
          console.warn("Proxy upstream failed:", error);
          return new Response(
            `<!doctype html><meta charset="utf-8"><body style="font:14px system-ui;color:#eee;background:#0b0d12;padding:24px">Couldn't reach that page.</body>`,
            {
              status: 502,
              headers: {
                "content-type": "text/html; charset=utf-8",
                "set-cookie": proxyAuthCookie(ticket),
              },
            },
          );
        }

        const ctype = upstream.headers.get("content-type") ?? "";
        const authHeaders = {
          "set-cookie": proxyAuthCookie(ticket),
          "cache-control": "no-store",
        };

        // Non-HTML → stream through, strip frame blockers.
        if (!ctype.includes("text/html")) {
          const declared = Number(upstream.headers.get("content-length") ?? NaN);
          if (Number.isFinite(declared) && declared > DEFAULT_MAX_BYTES) {
            return new Response("Response too large", {
              status: 413,
              headers: authHeaders,
            });
          }
          const headers = new Headers(upstream.headers);
          headers.delete("x-frame-options");
          headers.delete("content-security-policy");
          headers.delete("content-security-policy-report-only");
          headers.set("set-cookie", proxyAuthCookie(ticket));
          headers.set("cache-control", "no-store");
          return new Response(upstream.body, {
            status: upstream.status,
            headers,
          });
        }

        let html: string;
        try {
          // Static snapshot for preview — SPA scripts break inside /api/proxy
          // (wrong location/path) and replace the page with an error after ~1s.
          html = softenProxiedHtml(await readResponseTextLimited(upstream));
        } catch (e) {
          console.warn("Proxy read failed:", e);
          const message =
            e instanceof Error && e.message === "Response too large"
              ? "Page is too large to preview"
              : "Couldn't read that page.";
          return new Response(message, {
            status: 413,
            headers: authHeaders,
          });
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
              "frame-ancestors 'self'; base-uri *; object-src 'none'; script-src 'unsafe-inline' 'self'",
            "set-cookie": proxyAuthCookie(ticket),
          },
        });
      },
    },
  },
});

/**
 * Preview is a static snapshot: keep markup/text for highlighting, drop site
 * scripts that assume they own window.location (Next.js etc. flash then crash).
 */
function softenProxiedHtml(html: string): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<script\b[^>]*\/?>/gi, "")
    .replace(/<link\b[^>]*\bas=["']script["'][^>]*>/gi, "")
    .replace(/\s(href|src|xlink:href)\s*=\s*("|')\s*javascript:[^"']*\2/gi, " $1=$2#$2")
    .replace(/<(object|embed)\b[^>]*>/gi, "");
}

function escapeAttr(s: string) {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}
