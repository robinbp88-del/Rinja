import { d as require_jsx_runtime } from "../_libs/@react-three/drei+[...].mjs";
import { _ as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { R as Apple, _ as Mail } from "../_libs/lucide-react.mjs";
import { t as RinjaMascot } from "./RinjaMascot-D6qGKtAs.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/welcome-BgiN2htp.js
var import_jsx_runtime = require_jsx_runtime();
function Welcome() {
	const navigate = useNavigate();
	const goLogin = () => {
		navigate({ to: "/login" });
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative flex min-h-screen flex-col justify-between overflow-hidden px-6 pt-12 screen-safe",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"aria-hidden": true,
				className: "pointer-events-none absolute inset-0 -z-10",
				style: { background: "radial-gradient(ellipse 90% 55% at 50% -5%, oklch(0.48 0.2 295 / 0.5), transparent 65%), radial-gradient(ellipse 50% 35% at 10% 90%, oklch(0.32 0.1 260 / 0.3), transparent 55%)" }
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col items-center text-center pt-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RinjaMascot, {
						variant: "hero",
						mood: "curious",
						size: 168,
						className: "mb-8",
						priority: true
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] font-medium uppercase tracking-[0.22em] text-primary",
						children: "Rinja"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
						className: "mt-3 text-[38px] font-semibold leading-[1.08] tracking-tight",
						children: [
							"Never miss",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
							"what matters."
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-5 max-w-xs text-[16px] leading-snug text-muted-foreground",
						children: [
							"Watch any webpage.",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
							"Get notified when it changes."
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
						className: "mt-6 w-full max-w-xs space-y-2 text-left text-[13px] text-muted-foreground",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex gap-3 rounded-2xl border border-border/70 bg-card/50 px-3.5 py-2.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-semibold text-primary",
									children: "1"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Paste a webpage URL" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex gap-3 rounded-2xl border border-border/70 bg-card/50 px-3.5 py-2.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-semibold text-primary",
									children: "2"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Tap what you want me to watch" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex gap-3 rounded-2xl border border-border/70 bg-card/50 px-3.5 py-2.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-semibold text-primary",
									children: "3"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Get an alert when it changes" })]
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-3 pb-10",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: goLogin,
						className: "flex h-13 items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/30 transition active:scale-[0.97]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Mail, { className: "h-4 w-4" }), "Continue with email"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-center text-[12px] text-muted-foreground",
						children: [
							"Beta: use ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-foreground",
								children: "email + password"
							}),
							". Google / Apple come later."
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						disabled: true,
						"aria-disabled": "true",
						className: "flex h-13 items-center justify-center gap-3 rounded-full border border-border bg-card/40 text-sm font-semibold text-muted-foreground opacity-60",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(GoogleG, {}), " Google — coming soon"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						disabled: true,
						"aria-disabled": "true",
						className: "flex h-13 items-center justify-center gap-2 rounded-full border border-border bg-card/40 text-sm font-semibold text-muted-foreground opacity-60",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Apple, { className: "h-5 w-5" }), " Apple — coming soon"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-center text-[11px] text-muted-foreground",
						children: "By continuing you agree to our Terms and Privacy Policy."
					})
				]
			})
		]
	});
}
function GoogleG() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		viewBox: "0 0 48 48",
		className: "h-5 w-5 opacity-70",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				fill: "#EA4335",
				d: "M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				fill: "#4285F4",
				d: "M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				fill: "#FBBC05",
				d: "M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
				fill: "#34A853",
				d: "M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
			})
		]
	});
}
//#endregion
export { Welcome as component };
