import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/proxy")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const u = new URL(request.url);
        const target = u.searchParams.get("url");
        if (!target || !/^https?:\/\//i.test(target)) {
          return new Response("Missing or invalid url", { status: 400 });
        }

        let upstream: Response;
        try {
          upstream = await fetch(target, {
            redirect: "follow",
            headers: {
              "user-agent":
                "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
              accept:
                "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
              "accept-language": "en-US,en;q=0.9",
            },
          });
        } catch (e) {
          return new Response(
            `<!doctype html><meta charset="utf-8"><body style="font:14px system-ui;color:#eee;background:#0b0d12;padding:24px">Couldn't reach that page.</body>`,
            { status: 502, headers: { "content-type": "text/html; charset=utf-8" } },
          );
        }

        const ctype = upstream.headers.get("content-type") ?? "";
        const finalUrl = upstream.url || target;

        // Non-HTML → stream through, strip frame blockers.
        if (!ctype.includes("text/html")) {
          const headers = new Headers(upstream.headers);
          headers.delete("x-frame-options");
          headers.delete("content-security-policy");
          headers.delete("content-security-policy-report-only");
          return new Response(upstream.body, {
            status: upstream.status,
            headers,
          });
        }

        let html = await upstream.text();

        // Strip meta CSP / X-Frame-Options inside the doc.
        html = html.replace(
          /<meta[^>]+http-equiv=["']?(content-security-policy|x-frame-options)["']?[^>]*>/gi,
          "",
        );
        // Remove <base> so our injected one wins.
        html = html.replace(/<base\b[^>]*>/gi, "");

        const injectedHead = `<base href="${escapeAttr(finalUrl)}">`;
        const injectedBody = `<script>(${pickerScript.toString()})();<\/script>`;

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
          },
        });
      },
    },
  },
});

function escapeAttr(s: string) {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}

// Runs inside the proxied page. Kept self-contained; no outer refs.
function pickerScript() {
  const w = window as any;
  if (w.__wpPickerInstalled) return;
  w.__wpPickerInstalled = true;

  let picking = false;

  const send = (type: string, payload?: any) => {
    try {
      parent.postMessage({ source: "watchpage-picker", type, payload }, "*");
    } catch {}
  };

  // Rewrite outbound link navigations to stay inside our proxy so the
  // in-app browser keeps working like a normal browser.
  const proxied = (href: string) => {
    try {
      const abs = new URL(href, location.href).toString();
      if (!/^https?:/i.test(abs)) return null;
      return "/api/proxy?url=" + encodeURIComponent(abs);
    } catch {
      return null;
    }
  };

  document.addEventListener(
    "click",
    (e) => {
      const t = e.target as Element | null;
      if (!t) return;
      // In picking mode, block everything and let the picker handler run.
      if (picking) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      const a = (t.closest && t.closest("a")) as HTMLAnchorElement | null;
      if (!a || !a.href) return;
      const p = proxied(a.getAttribute("href") || a.href);
      if (!p) return;
      e.preventDefault();
      e.stopPropagation();
      location.href = p;
    },
    true,
  );

  document.addEventListener(
    "submit",
    (e) => {
      if (picking) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    true,
  );

  const overlay = document.createElement("div");
  overlay.style.cssText =
    "position:fixed;pointer-events:none;z-index:2147483646;border:2px solid #4c9dff;background:rgba(76,157,255,.12);border-radius:6px;transition:all .06s ease;box-shadow:0 0 0 3px rgba(76,157,255,.25),0 0 24px rgba(76,157,255,.55);display:none";
  const label = document.createElement("div");
  label.style.cssText =
    "position:fixed;z-index:2147483647;background:#0b0d12;color:#fff;font:600 11px/1 -apple-system,system-ui,sans-serif;padding:6px 8px;border-radius:6px;pointer-events:none;display:none;box-shadow:0 4px 16px rgba(0,0,0,.4)";
  const install = () => {
    if (!document.body) return;
    document.body.appendChild(overlay);
    document.body.appendChild(label);
  };
  if (document.body) install();
  else document.addEventListener("DOMContentLoaded", install);

  let selected: Element | null = null;

  const cssPath = (el: Element): string => {
    if (!(el instanceof Element)) return "";
    const parts: string[] = [];
    let node: Element | null = el;
    while (node && node.nodeType === 1 && node !== document.documentElement) {
      if (node.id) {
        parts.unshift(`#${CSS.escape(node.id)}`);
        break;
      }
      const parentEl: Element | null = node.parentElement;
      if (!parentEl) {
        parts.unshift(node.tagName.toLowerCase());
        break;
      }
      const cur: Element = node;
      const sameTag = Array.from(parentEl.children).filter(
        (c: Element) => c.tagName === cur.tagName,
      );
      const idx = sameTag.indexOf(cur) + 1;
      parts.unshift(
        sameTag.length > 1
          ? `${cur.tagName.toLowerCase()}:nth-of-type(${idx})`
          : cur.tagName.toLowerCase(),
      );
      node = parentEl;
    }
    return parts.join(" > ");
  };

  const trim = (s: string, n = 140) => {
    const t = (s || "").replace(/\s+/g, " ").trim();
    return t.length > n ? t.slice(0, n - 1) + "…" : t;
  };

  const paint = (el: Element | null, kind: "hover" | "selected") => {
    if (!el || !document.body) {
      overlay.style.display = "none";
      label.style.display = "none";
      return;
    }
    const r = el.getBoundingClientRect();
    overlay.style.display = "block";
    overlay.style.left = r.left + "px";
    overlay.style.top = r.top + "px";
    overlay.style.width = r.width + "px";
    overlay.style.height = r.height + "px";
    overlay.style.borderColor = kind === "selected" ? "#a855f7" : "#c4b5fd";
    overlay.style.background =
      kind === "selected" ? "rgba(168,85,247,.14)" : "rgba(196,181,253,.10)";
    overlay.style.boxShadow =
      kind === "selected"
        ? "0 0 0 3px rgba(168,85,247,.28),0 0 24px rgba(168,85,247,.55)"
        : "0 0 0 3px rgba(168,85,247,.18),0 0 20px rgba(168,85,247,.35)";
    label.style.display = "block";
    label.style.left = Math.max(6, r.left) + "px";
    label.style.top = Math.max(6, r.top - 22) + "px";
    label.textContent = el.tagName.toLowerCase();
  };

  const isOurs = (el: Element | null) =>
    !!el && (el === overlay || el === label);

  document.addEventListener(
    "mouseover",
    (e) => {
      if (!picking) return;
      const t = e.target as Element | null;
      if (!t || isOurs(t)) return;
      if (selected) return;
      paint(t, "hover");
    },
    true,
  );

  document.addEventListener(
    "mouseout",
    () => {
      if (!picking) return;
      if (!selected) paint(null, "hover");
    },
    true,
  );

  const pick = (el: Element) => {
    selected = el;
    paint(el, "selected");
    send("selected", {
      selector: cssPath(el),
      tag: el.tagName.toLowerCase(),
      text: trim((el as HTMLElement).innerText || el.textContent || ""),
      html: trim(el.outerHTML || "", 400),
    });
  };

  const onPick = (e: Event) => {
    if (!picking) return;
    const t = e.target as Element | null;
    if (!t || isOurs(t)) return;
    e.preventDefault();
    e.stopPropagation();
    pick(t);
  };
  document.addEventListener("click", onPick, true);
  document.addEventListener(
    "touchend",
    (e) => {
      if (!picking) return;
      const t = e.target as Element | null;
      if (!t || isOurs(t)) return;
      e.preventDefault();
      pick(t);
    },
    { capture: true, passive: false },
  );

  const reflow = () => selected && paint(selected, "selected");
  addEventListener("scroll", reflow, true);
  addEventListener("resize", reflow);

  const markEye = (el: Element) => {
    const r = el.getBoundingClientRect();
    const badge = document.createElement("div");
    badge.className = "__wp_eye__";
    badge.style.cssText =
      "position:fixed;z-index:2147483645;width:22px;height:22px;border-radius:999px;background:linear-gradient(135deg,#a855f7,#7c3aed);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(124,58,237,.55),0 0 0 2px rgba(255,255,255,.9);pointer-events:none;animation:__wp_pop .4s ease-out";
    badge.innerHTML =
      '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z"/><circle cx="12" cy="12" r="3"/></svg>';
    const place = () => {
      const rr = el.getBoundingClientRect();
      badge.style.left = Math.max(2, rr.right - 11) + "px";
      badge.style.top = Math.max(2, rr.top - 11) + "px";
    };
    place();
    document.body.appendChild(badge);
    const style = document.createElement("style");
    style.textContent =
      "@keyframes __wp_pop{0%{transform:scale(.2);opacity:0}70%{transform:scale(1.15)}100%{transform:scale(1);opacity:1}}";
    document.head.appendChild(style);
    addEventListener("scroll", place, true);
    addEventListener("resize", place);
  };

  window.addEventListener("message", (ev) => {
    const d = ev.data;
    if (!d || d.source !== "watchpage-host") return;
    if (d.type === "enable") {
      picking = true;
    } else if (d.type === "disable") {
      picking = false;
      selected = null;
      paint(null, "hover");
    } else if (d.type === "clear") {
      selected = null;
      paint(null, "hover");
    } else if (d.type === "mark") {
      const target = selected;
      selected = null;
      picking = false;
      paint(null, "hover");
      if (target) markEye(target);
    }
  });

  send("ready", { url: location.href, title: document.title });
}
