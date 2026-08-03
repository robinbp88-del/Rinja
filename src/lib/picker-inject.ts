/**
 * Injected into proxied pages via Function#toString().
 * Must stay self-contained — no imports/closures from the host bundle.
 */
export function pickerScript() {
  const w = window as Window & { __wpPickerInstalled?: boolean };
  if (w.__wpPickerInstalled) return;
  w.__wpPickerInstalled = true;

  let picking = false;

  const send = (type: string, payload?: unknown) => {
    try {
      parent.postMessage({ source: "watchpage-picker", type, payload }, "*");
    } catch {
      // ignore
    }
  };

  // Rewrite outbound link navigations to stay inside our proxy.
  const proxied = (href: string) => {
    try {
      const abs = new URL(href, document.baseURI).toString();
      if (!/^https?:/i.test(abs)) return null;
      return "/api/proxy?url=" + encodeURIComponent(abs);
    } catch {
      return null;
    }
  };

  let selected: Element | null = null;
  let overlay: HTMLDivElement | null = null;
  let label: HTMLDivElement | null = null;

  const ensureChrome = () => {
    if (!document.body) return;
    if (!overlay || !overlay.isConnected) {
      overlay = document.createElement("div");
      overlay.style.cssText =
        "position:fixed;pointer-events:none;z-index:2147483646;border:2px solid #4c9dff;background:rgba(76,157,255,.12);border-radius:6px;transition:all .06s ease;box-shadow:0 0 0 3px rgba(76,157,255,.25),0 0 24px rgba(76,157,255,.55);display:none";
      document.body.appendChild(overlay);
    }
    if (!label || !label.isConnected) {
      label = document.createElement("div");
      label.style.cssText =
        "position:fixed;z-index:2147483647;background:#0b0d12;color:#fff;font:600 11px/1 -apple-system,system-ui,sans-serif;padding:6px 8px;border-radius:6px;pointer-events:none;display:none;box-shadow:0 4px 16px rgba(0,0,0,.4)";
      document.body.appendChild(label);
    }
  };

  if (document.body) ensureChrome();
  else document.addEventListener("DOMContentLoaded", ensureChrome);

  // Sites often replace <body> after hydration — reattach picker chrome.
  const mo = new MutationObserver(() => {
    if (overlay && !overlay.isConnected) ensureChrome();
  });
  mo.observe(document.documentElement, { childList: true, subtree: true });

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

  const paint = (el: Element | null, kind: "hover" | "selected") => {
    ensureChrome();
    if (!overlay || !label) return;
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
    "click",
    (e) => {
      const t = e.target as Element | null;
      if (!t) return;

      // Picking takes priority — select the element in this same handler.
      if (picking) {
        if (isOurs(t)) return;
        e.preventDefault();
        e.stopPropagation();
        pick(t);
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
      ensureChrome();
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
    } else if (d.type === "reveal") {
      const selector = typeof d.selector === "string" ? d.selector : "";
      if (!selector) return;

      try {
        const target = document.querySelector(selector);
        if (!target) {
          send("reveal-missing", { selector });
          return;
        }

        selected = target;
        picking = false;

        target.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "center",
        });

        setTimeout(() => {
          paint(target, "selected");
          markEye(target);
          send("revealed", { selector });
        }, 350);
      } catch {
        send("reveal-missing", { selector });
      }
    }
  });

  send("ready", { url: location.href, title: document.title });
}

/** IIFE source injected into proxied HTML. */
export function getPickerInjectScript(): string {
  return `(${pickerScript.toString()})();`;
}
