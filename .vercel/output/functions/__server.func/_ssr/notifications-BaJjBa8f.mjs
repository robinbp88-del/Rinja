import { s as __toESM } from "../_runtime.mjs";
import { d as require_jsx_runtime, f as require_react } from "../_libs/@react-three/drei+[...].mjs";
import { g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { i as markAllNotificationsRead, n as getNotifications } from "./notifications-DMpX62bk.mjs";
import { t as RinjaMascot } from "./RinjaMascot-D6qGKtAs.mjs";
import { n as useAuth } from "./AuthProvider-BaHTDOle.mjs";
import { t as BottomNav } from "./BottomNav-DaQPzo7r.mjs";
import { i as useQueryClient, n as useQuery } from "../_libs/tanstack__react-query.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/notifications-BaJjBa8f.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Notifications() {
	const { user } = useAuth();
	const queryClient = useQueryClient();
	const notifications = useQuery({
		queryKey: ["notifications", user?.id],
		queryFn: getNotifications,
		enabled: Boolean(user)
	}).data ?? [];
	const hasAlerts = notifications.length > 0;
	(0, import_react.useEffect)(() => {
		if (!user || notifications.length === 0) return;
		markAllNotificationsRead().then(() => {
			queryClient.invalidateQueries({ queryKey: ["notifications"] });
		}).catch(console.error);
	}, [
		user,
		notifications.length,
		queryClient
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen pb-32",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
				className: "flex items-baseline justify-between px-6 pt-12 screen-safe",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-[28px] font-semibold tracking-tight",
					children: "Alerts"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-4 flex flex-col items-center px-6 text-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RinjaMascot, {
					variant: hasAlerts ? "notify" : "relax",
					mood: hasAlerts ? "alert" : "sleepy",
					size: 180
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-[14px] font-medium animate-fade-in",
					children: hasAlerts ? "Something changed — take a look." : "Everything looks quiet."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-6 px-6",
				children: hasAlerts ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "space-y-2",
					children: notifications.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-2xl border border-border bg-card p-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm font-semibold",
									children: item.title
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "shrink-0 text-[10px] text-muted-foreground",
									children: new Date(item.created_at).toLocaleString([], {
										month: "short",
										day: "numeric",
										hour: "numeric",
										minute: "2-digit"
									})
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-1 text-xs text-muted-foreground",
								children: item.body
							}),
							item.watch_id && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
								to: "/watch/$id",
								params: { id: item.watch_id },
								className: "mt-3 inline-flex text-[11px] font-medium text-primary",
								children: "View watch →"
							})
						]
					}, item.id))
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-3xl border border-dashed border-border bg-card/40 p-6 text-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[14px] font-medium",
							children: "No alerts yet"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-[13px] leading-relaxed text-muted-foreground",
							children: "When something you watch changes, it shows up here. Start by adding a URL and highlighting a price or text."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/add",
							className: "mt-5 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground",
							children: "Add a watch"
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomNav, {})
		]
	});
}
//#endregion
export { Notifications as component };
