import { s as __toESM } from "../_runtime.mjs";
import { d as require_jsx_runtime, f as require_react } from "../_libs/@react-three/drei+[...].mjs";
import { _ as useNavigate, g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { O as Crown, c as Settings, j as ChevronRight, m as Palette, s as Shield, v as LogOut, x as LifeBuoy, y as LoaderCircle } from "../_libs/lucide-react.mjs";
import { r as useStore } from "./store-B1smT0Pf.mjs";
import { i as getWatches } from "./watches-BS9NyyG4.mjs";
import { n as useAuth } from "./AuthProvider-BaHTDOle.mjs";
import { t as BottomNav } from "./BottomNav-DaQPzo7r.mjs";
import { i as useQueryClient, n as useQuery } from "../_libs/tanstack__react-query.mjs";
import { n as signOut } from "./auth-DGmdbljS.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/profile-CuiQClQU.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Profile() {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const { user: authUser } = useAuth();
	const { logout: clearLocalStore } = useStore();
	const watchCount = useQuery({
		queryKey: ["watches", authUser?.id],
		queryFn: getWatches,
		enabled: Boolean(authUser)
	}).data?.length ?? 0;
	const [loggingOut, setLoggingOut] = (0, import_react.useState)(false);
	const [logoutError, setLogoutError] = (0, import_react.useState)("");
	const displayName = authUser?.user_metadata?.name ?? authUser?.email?.split("@")[0] ?? "You";
	const email = authUser?.email ?? "Signed in";
	async function handleLogout() {
		if (loggingOut) return;
		try {
			setLoggingOut(true);
			setLogoutError("");
			await signOut();
			clearLocalStore();
			queryClient.clear();
			navigate({
				to: "/welcome",
				replace: true
			});
		} catch (error) {
			console.error("Logout failed:", error);
			setLogoutError(error instanceof Error ? error.message : "Could not log out. Please try again.");
		} finally {
			setLoggingOut(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen pb-32",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", {
				className: "px-6 pt-12 screen-safe",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-[28px] font-semibold tracking-tight",
					children: "Profile"
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "mt-6 px-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-4 rounded-2xl border border-border bg-card p-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/50 text-lg font-semibold text-primary-foreground",
							children: displayName.charAt(0).toUpperCase()
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "truncate text-sm font-medium",
								children: displayName
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "truncate text-xs text-muted-foreground",
								children: email
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "rounded-full bg-primary/15 px-3 py-1 text-[10px] font-medium uppercase tracking-wider text-primary",
							children: [watchCount, " watching"]
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "mt-6 px-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/premium",
					className: "flex items-center gap-3 rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/20 to-transparent p-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Crown, { className: "h-5 w-5" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-semibold",
								children: "Try Rinja Premium"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted-foreground",
								children: "Unlimited watches. 7-day free trial."
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "h-4 w-4 text-muted-foreground" })
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "mt-6 px-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Group, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						icon: Palette,
						label: "Theme",
						hint: "Dark"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						icon: Settings,
						label: "Settings"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						icon: LifeBuoy,
						label: "Support"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Row, {
						icon: Shield,
						label: "Privacy"
					})
				] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-6 px-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: handleLogout,
					disabled: loggingOut,
					className: "flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card p-4 text-sm font-medium text-destructive transition active:scale-[0.99] disabled:opacity-60",
					children: loggingOut ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }), "Logging out…"] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "h-4 w-4" }), "Log out"] })
				}), logoutError && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-center text-xs text-destructive",
					children: logoutError
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomNav, {})
		]
	});
}
function Group({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card",
		children
	});
}
function Row({ icon: Icon, label, hint }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		className: "flex w-full items-center gap-3 px-4 py-4 text-left transition active:bg-accent",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "h-4 w-4 text-muted-foreground" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "flex-1 text-sm",
				children: label
			}),
			hint && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-xs text-muted-foreground",
				children: hint
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "h-4 w-4 text-muted-foreground" })
		]
	});
}
//#endregion
export { Profile as component };
