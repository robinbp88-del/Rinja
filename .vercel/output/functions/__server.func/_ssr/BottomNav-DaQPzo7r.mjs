import { d as require_jsx_runtime } from "../_libs/@react-three/drei+[...].mjs";
import { g as Link, l as useRouterState } from "../_libs/@tanstack/react-router+[...].mjs";
import { C as House, N as Bell, n as User, u as Search } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/BottomNav-DaQPzo7r.js
var import_jsx_runtime = require_jsx_runtime();
var tabs = [
	{
		to: "/home",
		icon: House,
		label: "Home"
	},
	{
		to: "/search",
		icon: Search,
		label: "Search"
	},
	{
		to: "/notifications",
		icon: Bell,
		label: "Alerts"
	},
	{
		to: "/profile",
		icon: User,
		label: "Profile"
	}
];
function BottomNav() {
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", {
		className: "fixed inset-x-0 bottom-0 z-40 mx-auto max-w-md screen-safe",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "mx-4 mb-3 rounded-full border border-border bg-card/80 px-2 py-2 backdrop-blur-xl",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
				className: "grid grid-cols-4",
				children: tabs.map(({ to, icon: Icon, label }) => {
					const active = pathname === to;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
						className: "flex justify-center",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
							to,
							className: `flex flex-col items-center gap-0.5 rounded-full px-4 py-1.5 text-[10px] transition ${active ? "text-primary" : "text-muted-foreground"}`,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: `h-5 w-5 ${active ? "stroke-[2.4]" : ""}` }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: label })]
						})
					}, to);
				})
			})
		})
	});
}
//#endregion
export { BottomNav as t };
