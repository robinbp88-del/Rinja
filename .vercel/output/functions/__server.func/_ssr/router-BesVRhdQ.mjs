import { s as __toESM } from "../_runtime.mjs";
import { d as require_jsx_runtime, f as require_react } from "../_libs/@react-three/drei+[...].mjs";
import { c as HeadContent, d as createRouter, f as Outlet, g as Link, h as createRootRouteWithContext, m as createFileRoute, p as lazyRouteComponent, s as Scripts, v as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as createClient } from "../_libs/supabase__supabase-js.mjs";
import { t as requireAuth } from "./requireAuth-V1ujToPv.mjs";
import { t as Route$11 } from "./add-CnRB3I2m.mjs";
import { t as StoreProvider } from "./store-B1smT0Pf.mjs";
import { t as Route$12 } from "./highlight-acYpcQKi.mjs";
import { t as AuthProvider } from "./AuthProvider-BaHTDOle.mjs";
import { t as QueryClient } from "../_libs/tanstack__query-core.mjs";
import { r as QueryClientProvider } from "../_libs/tanstack__react-query.mjs";
import { t as Toaster } from "../_libs/sonner.mjs";
import { t as Route$13 } from "./search-ikZiTKg_.mjs";
import { t as Route$14 } from "./watch._id-BeJGBQNZ.mjs";
import { t as parseHTML } from "../_libs/linkedom.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/router-BesVRhdQ.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var styles_default = "/assets/styles-CCW0rqWY.css";
function reportLovableError(error, context = {}) {
	if (typeof window === "undefined") return;
	window.__lovableEvents?.captureException?.(error, {
		source: "react_error_boundary",
		route: window.location.pathname,
		...context
	}, {
		mechanism: "react_error_boundary",
		handled: false,
		severity: "error"
	});
}
function NotFoundComponent() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-6",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-sm text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-6xl font-semibold tracking-tight",
					children: "404"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-sm text-muted-foreground",
					children: "This page doesn't exist."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/",
					className: "mt-6 inline-flex items-center justify-center rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground",
					children: "Go home"
				})
			]
		})
	});
}
function ErrorComponent({ error, reset }) {
	const router = useRouter();
	(0, import_react.useEffect)(() => {
		reportLovableError(error, { boundary: "tanstack_root_error_component" });
	}, [error]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center bg-background px-6",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-sm text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-semibold",
					children: "Something went wrong"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "Try again or head back home."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 flex justify-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => {
							router.invalidate();
							reset();
						},
						className: "rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground",
						children: "Try again"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
						href: "/",
						className: "rounded-full border border-border px-5 py-2.5 text-sm font-medium",
						children: "Home"
					})]
				})
			]
		})
	});
}
var Route$10 = createRootRouteWithContext()({
	head: () => ({
		meta: [
			{ charSet: "utf-8" },
			{
				name: "viewport",
				content: "width=device-width, initial-scale=1, viewport-fit=cover"
			},
			{
				name: "theme-color",
				content: "#0b0d12"
			},
			{ title: "WatchPage — Never miss what matters" },
			{
				name: "description",
				content: "Monitor any part of any webpage. Get notified the moment it changes."
			},
			{
				property: "og:title",
				content: "WatchPage — Never miss what matters"
			},
			{
				property: "og:description",
				content: "Mark anything. Know instantly."
			},
			{
				property: "og:type",
				content: "website"
			},
			{
				name: "twitter:card",
				content: "summary_large_image"
			}
		],
		links: [
			{
				rel: "stylesheet",
				href: styles_default
			},
			{
				rel: "preconnect",
				href: "https://fonts.googleapis.com"
			},
			{
				rel: "preconnect",
				href: "https://fonts.gstatic.com",
				crossOrigin: "anonymous"
			},
			{
				rel: "stylesheet",
				href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
			},
			{
				rel: "icon",
				href: "/favicon.ico",
				type: "image/x-icon"
			}
		]
	}),
	shellComponent: RootShell,
	component: RootComponent,
	notFoundComponent: NotFoundComponent,
	errorComponent: ErrorComponent
});
function RootShell({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("html", {
		lang: "en",
		className: "dark",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("head", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HeadContent, {}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("body", { children: [children, /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scripts, {})] })]
	});
}
function RootComponent() {
	const { queryClient } = Route$10.useRouteContext();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(QueryClientProvider, {
		client: queryClient,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreProvider, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(AuthProvider, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mx-auto max-w-md min-h-screen bg-background",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Outlet, {})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
			theme: "dark",
			position: "top-center",
			richColors: true
		})] }) })
	});
}
var $$splitComponentImporter$7 = () => import("./welcome-BgiN2htp.mjs");
var Route$9 = createFileRoute("/welcome")({ component: lazyRouteComponent($$splitComponentImporter$7, "component") });
var $$splitComponentImporter$6 = () => import("./profile-CuiQClQU.mjs");
var Route$8 = createFileRoute("/profile")({
	beforeLoad: requireAuth,
	component: lazyRouteComponent($$splitComponentImporter$6, "component")
});
var $$splitComponentImporter$5 = () => import("./premium-BbEDh6wu.mjs");
var Route$7 = createFileRoute("/premium")({
	beforeLoad: requireAuth,
	component: lazyRouteComponent($$splitComponentImporter$5, "component")
});
var $$splitComponentImporter$4 = () => import("./notifications-BaJjBa8f.mjs");
var Route$6 = createFileRoute("/notifications")({
	beforeLoad: requireAuth,
	component: lazyRouteComponent($$splitComponentImporter$4, "component")
});
var $$splitComponentImporter$3 = () => import("./login-CK00cMbR.mjs");
var Route$5 = createFileRoute("/login")({ component: lazyRouteComponent($$splitComponentImporter$3, "component") });
var $$splitComponentImporter$2 = () => import("./interests-C8W-VPcc.mjs");
var Route$4 = createFileRoute("/interests")({
	beforeLoad: requireAuth,
	component: lazyRouteComponent($$splitComponentImporter$2, "component")
});
var $$splitComponentImporter$1 = () => import("./home-Cnju1kqY.mjs");
var Route$3 = createFileRoute("/home")({
	beforeLoad: requireAuth,
	component: lazyRouteComponent($$splitComponentImporter$1, "component")
});
var $$splitComponentImporter = () => import("./routes-DnuAWCUG.mjs");
var Route$2 = createFileRoute("/")({ component: lazyRouteComponent($$splitComponentImporter, "component") });
var Route$1 = createFileRoute("/api/proxy")({ server: { handlers: { GET: async ({ request }) => {
	const target = new URL(request.url).searchParams.get("url");
	if (!target || !/^https?:\/\//i.test(target)) return new Response("Missing or invalid url", { status: 400 });
	let upstream;
	try {
		upstream = await fetch(target, {
			redirect: "follow",
			headers: {
				"user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
				accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
				"accept-language": "en-US,en;q=0.9"
			}
		});
	} catch (e) {
		return new Response(`<!doctype html><meta charset="utf-8"><body style="font:14px system-ui;color:#eee;background:#0b0d12;padding:24px">Couldn't reach that page.</body>`, {
			status: 502,
			headers: { "content-type": "text/html; charset=utf-8" }
		});
	}
	const ctype = upstream.headers.get("content-type") ?? "";
	const finalUrl = upstream.url || target;
	if (!ctype.includes("text/html")) {
		const headers = new Headers(upstream.headers);
		headers.delete("x-frame-options");
		headers.delete("content-security-policy");
		headers.delete("content-security-policy-report-only");
		return new Response(upstream.body, {
			status: upstream.status,
			headers
		});
	}
	let html = await upstream.text();
	html = html.replace(/<meta[^>]+http-equiv=["']?(content-security-policy|x-frame-options)["']?[^>]*>/gi, "");
	html = html.replace(/<base\b[^>]*>/gi, "");
	const injectedHead = `<base href="${escapeAttr(finalUrl)}">`;
	const injectedBody = `<script>(${pickerScript.toString()})();<\/script>`;
	if (/<head[^>]*>/i.test(html)) html = html.replace(/<head([^>]*)>/i, `<head$1>${injectedHead}`);
	else html = `<head>${injectedHead}</head>` + html;
	if (/<\/body>/i.test(html)) html = html.replace(/<\/body>/i, `${injectedBody}</body>`);
	else html = html + injectedBody;
	return new Response(html, {
		status: 200,
		headers: {
			"content-type": "text/html; charset=utf-8",
			"cache-control": "no-store",
			"x-frame-options": "SAMEORIGIN"
		}
	});
} } } });
function escapeAttr(s) {
	return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}
function pickerScript() {
	const w = window;
	if (w.__wpPickerInstalled) return;
	w.__wpPickerInstalled = true;
	let picking = false;
	const send = (type, payload) => {
		try {
			parent.postMessage({
				source: "watchpage-picker",
				type,
				payload
			}, "*");
		} catch {}
	};
	const proxied = (href) => {
		try {
			const abs = new URL(href, location.href).toString();
			if (!/^https?:/i.test(abs)) return null;
			return "/api/proxy?url=" + encodeURIComponent(abs);
		} catch {
			return null;
		}
	};
	document.addEventListener("click", (e) => {
		const t = e.target;
		if (!t) return;
		if (picking) {
			e.preventDefault();
			e.stopPropagation();
			return;
		}
		const a = t.closest && t.closest("a");
		if (!a || !a.href) return;
		const p = proxied(a.getAttribute("href") || a.href);
		if (!p) return;
		e.preventDefault();
		e.stopPropagation();
		location.href = p;
	}, true);
	document.addEventListener("submit", (e) => {
		if (picking) {
			e.preventDefault();
			e.stopPropagation();
		}
	}, true);
	const overlay = document.createElement("div");
	overlay.style.cssText = "position:fixed;pointer-events:none;z-index:2147483646;border:2px solid #4c9dff;background:rgba(76,157,255,.12);border-radius:6px;transition:all .06s ease;box-shadow:0 0 0 3px rgba(76,157,255,.25),0 0 24px rgba(76,157,255,.55);display:none";
	const label = document.createElement("div");
	label.style.cssText = "position:fixed;z-index:2147483647;background:#0b0d12;color:#fff;font:600 11px/1 -apple-system,system-ui,sans-serif;padding:6px 8px;border-radius:6px;pointer-events:none;display:none;box-shadow:0 4px 16px rgba(0,0,0,.4)";
	const install = () => {
		if (!document.body) return;
		document.body.appendChild(overlay);
		document.body.appendChild(label);
	};
	if (document.body) install();
	else document.addEventListener("DOMContentLoaded", install);
	let selected = null;
	const cssPath = (el) => {
		if (!(el instanceof Element)) return "";
		const parts = [];
		let node = el;
		while (node && node.nodeType === 1 && node !== document.documentElement) {
			if (node.id) {
				parts.unshift(`#${CSS.escape(node.id)}`);
				break;
			}
			const parentEl = node.parentElement;
			if (!parentEl) {
				parts.unshift(node.tagName.toLowerCase());
				break;
			}
			const cur = node;
			const sameTag = Array.from(parentEl.children).filter((c) => c.tagName === cur.tagName);
			const idx = sameTag.indexOf(cur) + 1;
			parts.unshift(sameTag.length > 1 ? `${cur.tagName.toLowerCase()}:nth-of-type(${idx})` : cur.tagName.toLowerCase());
			node = parentEl;
		}
		return parts.join(" > ");
	};
	const trim = (s, n = 140) => {
		const t = (s || "").replace(/\s+/g, " ").trim();
		return t.length > n ? t.slice(0, n - 1) + "…" : t;
	};
	const paint = (el, kind) => {
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
		overlay.style.background = kind === "selected" ? "rgba(168,85,247,.14)" : "rgba(196,181,253,.10)";
		overlay.style.boxShadow = kind === "selected" ? "0 0 0 3px rgba(168,85,247,.28),0 0 24px rgba(168,85,247,.55)" : "0 0 0 3px rgba(168,85,247,.18),0 0 20px rgba(168,85,247,.35)";
		label.style.display = "block";
		label.style.left = Math.max(6, r.left) + "px";
		label.style.top = Math.max(6, r.top - 22) + "px";
		label.textContent = el.tagName.toLowerCase();
	};
	const isOurs = (el) => !!el && (el === overlay || el === label);
	document.addEventListener("mouseover", (e) => {
		if (!picking) return;
		const t = e.target;
		if (!t || isOurs(t)) return;
		if (selected) return;
		paint(t, "hover");
	}, true);
	document.addEventListener("mouseout", () => {
		if (!picking) return;
		if (!selected) paint(null, "hover");
	}, true);
	const pick = (el) => {
		selected = el;
		paint(el, "selected");
		send("selected", {
			selector: cssPath(el),
			tag: el.tagName.toLowerCase(),
			text: trim(el.innerText || el.textContent || ""),
			html: trim(el.outerHTML || "", 400)
		});
	};
	const onPick = (e) => {
		if (!picking) return;
		const t = e.target;
		if (!t || isOurs(t)) return;
		e.preventDefault();
		e.stopPropagation();
		pick(t);
	};
	document.addEventListener("click", onPick, true);
	document.addEventListener("touchend", (e) => {
		if (!picking) return;
		const t = e.target;
		if (!t || isOurs(t)) return;
		e.preventDefault();
		pick(t);
	}, {
		capture: true,
		passive: false
	});
	const reflow = () => selected && paint(selected, "selected");
	addEventListener("scroll", reflow, true);
	addEventListener("resize", reflow);
	const markEye = (el) => {
		el.getBoundingClientRect();
		const badge = document.createElement("div");
		badge.className = "__wp_eye__";
		badge.style.cssText = "position:fixed;z-index:2147483645;width:22px;height:22px;border-radius:999px;background:linear-gradient(135deg,#a855f7,#7c3aed);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 14px rgba(124,58,237,.55),0 0 0 2px rgba(255,255,255,.9);pointer-events:none;animation:__wp_pop .4s ease-out";
		badge.innerHTML = "<svg width=\"12\" height=\"12\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"white\" stroke-width=\"2.6\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z\"/><circle cx=\"12\" cy=\"12\" r=\"3\"/></svg>";
		const place = () => {
			const rr = el.getBoundingClientRect();
			badge.style.left = Math.max(2, rr.right - 11) + "px";
			badge.style.top = Math.max(2, rr.top - 11) + "px";
		};
		place();
		document.body.appendChild(badge);
		const style = document.createElement("style");
		style.textContent = "@keyframes __wp_pop{0%{transform:scale(.2);opacity:0}70%{transform:scale(1.15)}100%{transform:scale(1);opacity:1}}";
		document.head.appendChild(style);
		addEventListener("scroll", place, true);
		addEventListener("resize", place);
	};
	window.addEventListener("message", (ev) => {
		const d = ev.data;
		if (!d || d.source !== "watchpage-host") return;
		if (d.type === "enable") picking = true;
		else if (d.type === "disable") {
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
					inline: "center"
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
	send("ready", {
		url: location.href,
		title: document.title
	});
}
function createServiceClient() {
	const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
	const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
	if (!url || !key) throw new Error("Missing SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY for server operations.");
	return createClient(url, key, { auth: {
		persistSession: false,
		autoRefreshToken: false
	} });
}
function normalizeText(value) {
	return (value ?? "").replace(/\s+/g, " ").trim().toLowerCase();
}
function extractPriceNumber(value) {
	if (!value) return null;
	const match = value.replace(/\s/g, "").match(/[\d,.]+/);
	if (!match) return null;
	const raw = match[0].replace(/,/g, "");
	const num = parseFloat(raw);
	return Number.isNaN(num) ? null : num.toFixed(2);
}
function stockBucket(value) {
	const text = normalizeText(value);
	if (!text) return "unknown";
	if (/(out of stock|sold out|utsolgt|unavailable|not available)/i.test(text)) return "out";
	if (/(in stock|available|på lager|add to cart|buy now)/i.test(text)) return "in";
	return text;
}
function valuesEqual(previous, next, mode) {
	const prev = previous ?? "";
	const curr = next ?? "";
	if (!curr && !prev) return true;
	switch (mode) {
		case "price": {
			const a = extractPriceNumber(prev);
			const b = extractPriceNumber(curr);
			if (a && b) return a === b;
			return normalizeText(prev) === normalizeText(curr);
		}
		case "stock": return stockBucket(prev) === stockBucket(curr);
		case "image": return normalizeText(prev) === normalizeText(curr);
		case "text": return normalizeText(prev) === normalizeText(curr);
		default: return normalizeText(prev) === normalizeText(curr);
	}
}
function changeSummary(mode, oldValue, newValue) {
	return {
		title: mode === "price" ? "Price changed" : "Something changed",
		body: mode === "price" ? `${oldValue ?? "—"} → ${newValue}` : `Was "${oldValue ?? "—"}", now "${newValue}"`
	};
}
function extractValue(html, selector, fallbackText) {
	const { document } = parseHTML(html);
	if (selector?.trim()) try {
		const el = document.querySelector(selector.trim());
		if (el) {
			const text = (el.textContent ?? "").replace(/\s+/g, " ").trim();
			if (text) return text.slice(0, 500);
			if (el.tagName === "IMG") return el.src || null;
			const img = el.querySelector("img");
			if (img?.src) return img.src;
		}
	} catch {}
	if (fallbackText?.trim()) {
		const needle = fallbackText.trim().slice(0, 120);
		if (html.replace(/\s+/g, " ").includes(needle)) return needle;
	}
	return null;
}
async function fetchPageHtml(url) {
	const response = await fetch(url, {
		redirect: "follow",
		headers: {
			"user-agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
			accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
			"accept-language": "en-US,en;q=0.9"
		}
	});
	if (!response.ok) throw new Error(`Failed to fetch ${url}: HTTP ${response.status}`);
	const contentType = response.headers.get("content-type") ?? "";
	if (!contentType.includes("text/html")) throw new Error(`Unsupported content type for ${url}: ${contentType}`);
	return response.text();
}
var FREQ_MS = {
	"5m": 300 * 1e3,
	"15m": 900 * 1e3,
	"1h": 3600 * 1e3,
	"6h": 360 * 60 * 1e3,
	"1d": 1440 * 60 * 1e3
};
function frequencyMs(frequency) {
	return FREQ_MS[frequency ?? "15m"] ?? FREQ_MS["15m"];
}
function isWatchDue(lastChecked, createdAt, frequency, now = Date.now()) {
	const interval = frequencyMs(frequency);
	const last = new Date(lastChecked ?? createdAt).getTime();
	if (Number.isNaN(last)) return true;
	return now - last >= interval;
}
async function checkWatch(watch) {
	if (watch.paused) return {
		watchId: watch.id,
		status: "skipped",
		reason: "paused"
	};
	if (!watch.selector?.trim() && !watch.element_text?.trim()) return {
		watchId: watch.id,
		status: "skipped",
		reason: "no selector"
	};
	try {
		const extracted = extractValue(await fetchPageHtml(watch.url), watch.selector, watch.element_text);
		const now = (/* @__PURE__ */ new Date()).toISOString();
		const supabase = createServiceClient();
		if (!extracted) {
			await supabase.from("watches").update({
				last_checked: now,
				updated_at: now
			}).eq("id", watch.id);
			return {
				watchId: watch.id,
				status: "error",
				message: "Element not found on page"
			};
		}
		if (!!valuesEqual(watch.current_value, extracted, watch.mode)) {
			await supabase.from("watches").update({
				last_checked: now,
				updated_at: now
			}).eq("id", watch.id);
			return {
				watchId: watch.id,
				status: "unchanged"
			};
		}
		const { title, body } = changeSummary(watch.mode, watch.current_value, extracted);
		await supabase.from("watches").update({
			current_value: extracted,
			last_checked: now,
			updated_at: now
		}).eq("id", watch.id);
		if (watch.notify !== false) await supabase.from("notifications").insert({
			user_id: watch.user_id,
			watch_id: watch.id,
			title: `${title} · ${watch.label}`,
			body,
			old_value: watch.current_value,
			new_value: extracted,
			read: false
		});
		return {
			watchId: watch.id,
			status: "changed",
			oldValue: watch.current_value,
			newValue: extracted
		};
	} catch (error) {
		return {
			watchId: watch.id,
			status: "error",
			message: error instanceof Error ? error.message : "Check failed"
		};
	}
}
async function runDueWatchChecks(limit = 25, options) {
	const { data, error } = await createServiceClient().from("watches").select("*").eq("paused", false).order("last_checked", {
		ascending: true,
		nullsFirst: true
	}).limit(100);
	if (error) throw error;
	const due = (data ?? []).filter((w) => options?.force ? true : isWatchDue(w.last_checked, w.created_at, w.frequency)).slice(0, limit);
	const results = [];
	for (const watch of due) results.push(await checkWatch(watch));
	return {
		checked: due.length,
		changed: results.filter((r) => r.status === "changed").length,
		errors: results.filter((r) => r.status === "error").length,
		skipped: results.filter((r) => r.status === "skipped").length,
		results
	};
}
var Route = createFileRoute("/api/check-watches")({ server: { handlers: { GET: async ({ request }) => {
	const secret = process.env.MONITOR_CRON_SECRET;
	if (!secret) return Response.json({ error: "MONITOR_CRON_SECRET is not configured" }, { status: 503 });
	if ((request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? new URL(request.url).searchParams.get("secret")) !== secret) return Response.json({ error: "Unauthorized" }, { status: 401 });
	try {
		const force = new URL(request.url).searchParams.get("force") === "1";
		const summary = await runDueWatchChecks(25, { force });
		return Response.json({
			ok: true,
			force,
			...summary
		});
	} catch (error) {
		console.error("Monitor run failed:", error);
		return Response.json({ error: error instanceof Error ? error.message : "Monitor run failed" }, { status: 500 });
	}
} } } });
var WelcomeRoute = Route$9.update({
	id: "/welcome",
	path: "/welcome",
	getParentRoute: () => Route$10
});
var SearchRoute = Route$13.update({
	id: "/search",
	path: "/search",
	getParentRoute: () => Route$10
});
var ProfileRoute = Route$8.update({
	id: "/profile",
	path: "/profile",
	getParentRoute: () => Route$10
});
var PremiumRoute = Route$7.update({
	id: "/premium",
	path: "/premium",
	getParentRoute: () => Route$10
});
var NotificationsRoute = Route$6.update({
	id: "/notifications",
	path: "/notifications",
	getParentRoute: () => Route$10
});
var LoginRoute = Route$5.update({
	id: "/login",
	path: "/login",
	getParentRoute: () => Route$10
});
var InterestsRoute = Route$4.update({
	id: "/interests",
	path: "/interests",
	getParentRoute: () => Route$10
});
var HomeRoute = Route$3.update({
	id: "/home",
	path: "/home",
	getParentRoute: () => Route$10
});
var HighlightRoute = Route$12.update({
	id: "/highlight",
	path: "/highlight",
	getParentRoute: () => Route$10
});
var AddRoute = Route$11.update({
	id: "/add",
	path: "/add",
	getParentRoute: () => Route$10
});
var IndexRoute = Route$2.update({
	id: "/",
	path: "/",
	getParentRoute: () => Route$10
});
var WatchIdRoute = Route$14.update({
	id: "/watch/$id",
	path: "/watch/$id",
	getParentRoute: () => Route$10
});
var ApiProxyRoute = Route$1.update({
	id: "/api/proxy",
	path: "/api/proxy",
	getParentRoute: () => Route$10
});
var rootRouteChildren = {
	IndexRoute,
	AddRoute,
	HighlightRoute,
	HomeRoute,
	InterestsRoute,
	LoginRoute,
	NotificationsRoute,
	PremiumRoute,
	ProfileRoute,
	SearchRoute,
	WelcomeRoute,
	ApiCheckWatchesRoute: Route.update({
		id: "/api/check-watches",
		path: "/api/check-watches",
		getParentRoute: () => Route$10
	}),
	ApiProxyRoute,
	WatchIdRoute
};
var routeTree = Route$10._addFileChildren(rootRouteChildren)._addFileTypes();
var getRouter = () => {
	return createRouter({
		routeTree,
		context: { queryClient: new QueryClient() },
		scrollRestoration: true,
		defaultPreloadStaleTime: 0
	});
};
//#endregion
export { getRouter };
