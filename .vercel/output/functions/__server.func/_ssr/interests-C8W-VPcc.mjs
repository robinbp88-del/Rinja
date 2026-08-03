import { s as __toESM } from "../_runtime.mjs";
import { d as require_jsx_runtime, f as require_react } from "../_libs/@react-three/drei+[...].mjs";
import { _ as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { I as ArrowRight } from "../_libs/lucide-react.mjs";
import { r as useStore } from "./store-B1smT0Pf.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/interests-C8W-VPcc.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var OPTIONS = [
	"Shopping",
	"Sneakers",
	"Crypto",
	"Stocks",
	"Gaming",
	"Travel",
	"News",
	"Tickets",
	"Technology"
];
function Interests() {
	const navigate = useNavigate();
	const { setInterests } = useStore();
	const [picked, setPicked] = (0, import_react.useState)([]);
	const toggle = (o) => setPicked((p) => p.includes(o) ? p.filter((x) => x !== o) : [...p, o]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-screen flex-col px-6 pt-16 screen-safe",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs font-medium uppercase tracking-widest text-muted-foreground",
					children: "Step 2 of 2"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "mt-2 text-3xl font-semibold tracking-tight",
					children: "What do you care about?"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-sm text-muted-foreground",
					children: "We'll tailor recommendations. Skip anytime."
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-8 flex flex-wrap gap-2",
				children: OPTIONS.map((o) => {
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => toggle(o),
						className: `rounded-full border px-4 py-2.5 text-sm font-medium transition active:scale-95 ${picked.includes(o) ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-foreground hover:border-muted-foreground/40"}`,
						children: o
					}, o);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-auto flex flex-col gap-2 pb-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => {
						setInterests(picked);
						navigate({ to: "/home" });
					},
					className: "flex h-12 items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground transition active:scale-[0.98]",
					children: ["Continue ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "h-4 w-4" })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => {
						setInterests([]);
						navigate({ to: "/home" });
					},
					className: "h-11 text-sm text-muted-foreground",
					children: "Skip"
				})]
			})
		]
	});
}
//#endregion
export { Interests as component };
