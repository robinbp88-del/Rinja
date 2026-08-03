import { s as __toESM } from "../_runtime.mjs";
import { d as require_jsx_runtime, f as require_react } from "../_libs/@react-three/drei+[...].mjs";
import { _ as useNavigate, g as Link } from "../_libs/@tanstack/react-router+[...].mjs";
import { F as ArrowUp, N as Bell, d as RefreshCw, j as ChevronRight, y as LoaderCircle } from "../_libs/lucide-react.mjs";
import { i as getWatches } from "./watches-BS9NyyG4.mjs";
import { r as getUnreadNotificationCount } from "./notifications-DMpX62bk.mjs";
import { n as binoculars_default, t as RinjaMascot } from "./RinjaMascot-D6qGKtAs.mjs";
import { n as useAuth } from "./AuthProvider-BaHTDOle.mjs";
import { t as BottomNav } from "./BottomNav-DaQPzo7r.mjs";
import { n as useQuery } from "../_libs/tanstack__react-query.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/home-Cnju1kqY.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var SUGGESTIONS = [
	{
		label: "Amazon",
		url: "https://www.amazon.com/"
	},
	{
		label: "Finn.no",
		url: "https://www.finn.no/"
	},
	{
		label: "Ticketmaster",
		url: "https://www.ticketmaster.com/"
	},
	{
		label: "Apple",
		url: "https://www.apple.com/"
	},
	{
		label: "Nike",
		url: "https://www.nike.com/"
	},
	{
		label: "Steam",
		url: "https://store.steampowered.com/"
	},
	{
		label: "Booking",
		url: "https://www.booking.com/"
	},
	{
		label: "eBay",
		url: "https://www.ebay.com/"
	}
];
function timeAgo(value) {
	if (!value) return "not checked yet";
	const timestamp = typeof value === "number" ? value : new Date(value).getTime();
	if (Number.isNaN(timestamp)) return "recently";
	const seconds = Math.max(1, Math.floor((Date.now() - timestamp) / 1e3));
	if (seconds < 60) return `${seconds}s ago`;
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
	const days = Math.floor(hours / 24);
	return `${days} day${days === 1 ? "" : "s"} ago`;
}
function Home() {
	const navigate = useNavigate();
	const { user: authUser } = useAuth();
	const [query, setQuery] = (0, import_react.useState)("");
	const watchesQuery = useQuery({
		queryKey: ["watches", authUser?.id],
		queryFn: getWatches,
		enabled: Boolean(authUser)
	});
	const alertsQuery = useQuery({
		queryKey: [
			"notifications",
			"unread",
			authUser?.id
		],
		queryFn: getUnreadNotificationCount,
		enabled: Boolean(authUser),
		refetchInterval: 6e4
	});
	const watches = watchesQuery.data ?? [];
	const unreadAlerts = alertsQuery.data ?? 0;
	const profileInitial = (authUser?.user_metadata?.name ?? authUser?.email?.split("@")[0] ?? "You").charAt(0).toUpperCase();
	const submit = () => {
		const value = query.trim();
		if (!value) return;
		if (/^https?:\/\//i.test(value)) {
			navigate({
				to: "/add",
				search: { url: value }
			});
			return;
		}
		navigate({
			to: "/search",
			search: { q: value }
		});
	};
	const hasQuery = query.trim().length > 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen pb-32",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex items-start justify-between px-6 pt-16 screen-safe",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RinjaMascot, {
					variant: "guard",
					mood: "curious",
					size: 220,
					priority: true,
					className: "-ml-2 -mt-2 shrink-0"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
					to: "/profile",
					"aria-label": "Profile",
					className: "flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-sm font-semibold text-primary",
					children: profileInitial
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-10 px-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-[36px] font-semibold leading-[1.1] tracking-tight",
					children: "What should I keep an eye on?"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 text-[14px] leading-snug text-muted-foreground",
					children: "1) Paste a URL · 2) Tap what matters · 3) I’ll alert you on change"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8 px-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3 rounded-full border border-border bg-card py-2 pl-5 pr-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "text",
							value: query,
							onChange: (event) => setQuery(event.target.value),
							onKeyDown: (event) => {
								if (event.key === "Enter") {
									event.preventDefault();
									submit();
								}
							},
							placeholder: "Paste a webpage URL...",
							className: "min-w-0 flex-1 bg-transparent text-[16px] outline-none placeholder:text-muted-foreground"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: submit,
							"aria-label": "Send",
							disabled: !hasQuery,
							className: `flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all duration-300 active:scale-95 ${hasQuery ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`,
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUp, {
								className: "h-4 w-4",
								strokeWidth: 2.6
							})
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-4 text-[12px] text-muted-foreground",
						children: "Popular sites people watch for updates"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-3 flex flex-wrap gap-2.5",
						children: SUGGESTIONS.map((suggestion) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => navigate({
								to: "/add",
								search: { url: suggestion.url }
							}),
							className: "rounded-full border border-border bg-card px-4 py-2 text-[13px] text-muted-foreground transition hover:border-primary/40 hover:text-primary",
							children: suggestion.label
						}, suggestion.url))
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-14 px-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
						className: "text-[17px] font-semibold tracking-tight",
						children: ["Watching for you", watches.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "ml-2 text-[13px] font-medium text-muted-foreground",
							children: watches.length
						}) : null]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link, {
							to: "/add",
							className: "rounded-full px-3 py-1.5 text-[12px] font-medium text-primary",
							children: "Add"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => watchesQuery.refetch(),
							disabled: watchesQuery.isFetching,
							"aria-label": "Refresh watches",
							className: "flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition hover:bg-card hover:text-primary disabled:opacity-50",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: `h-4 w-4 ${watchesQuery.isFetching ? "animate-spin" : ""}` })
						})]
					})]
				}), watchesQuery.isLoading ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6 flex min-h-36 items-center justify-center rounded-3xl border border-border bg-card/40",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 text-sm text-muted-foreground",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }), "Loading watches…"]
					})
				}) : watchesQuery.isError ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 rounded-3xl border border-destructive/40 bg-destructive/10 p-6 text-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-medium",
						children: "I couldn't load your watches."
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => watchesQuery.refetch(),
						className: "mt-4 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground",
						children: "Try again"
					})]
				}) : watches.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-6 rounded-3xl border border-dashed border-border bg-card/40 p-8 text-center",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: binoculars_default,
							alt: "",
							width: 80,
							height: 80,
							loading: "lazy",
							className: "mx-auto h-20 w-20 opacity-90"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-4 text-[15px] font-medium",
							children: "Nothing on my list yet."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-2 text-[13px] leading-relaxed text-muted-foreground",
							children: "Paste a URL above, open the page, tap the price or text you care about — then I’ll watch it for you."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => navigate({ to: "/add" }),
							className: "mt-5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground",
							children: "Add your first watch"
						})
					]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-6 space-y-3",
					children: watches.map((watch) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
						to: "/watch/$id",
						params: { id: watch.id },
						className: "flex items-center gap-4 rounded-3xl border border-border bg-card p-4 transition active:scale-[0.99]",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-[13px] font-semibold text-primary",
								children: (watch.host ?? "WE").slice(0, 2).toUpperCase()
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0 flex-1",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "truncate text-[15px] font-semibold",
										children: watch.label
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "mt-0.5 truncate text-[12px] text-muted-foreground",
										children: watch.paused ? "Paused" : watch.current_value?.trim() || "Watching"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "mt-0.5 truncate text-[11px] text-muted-foreground",
										children: [
											"Checked",
											" ",
											timeAgo(watch.last_checked ?? watch.created_at)
										]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "h-4 w-4 shrink-0 text-muted-foreground" })
						]
					}, watch.id))
				})]
			}),
			unreadAlerts > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "mt-8 px-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link, {
					to: "/notifications",
					className: "flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/10 p-3.5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, { className: "h-4 w-4 text-primary" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flex-1 text-[13px] font-medium",
							children: [
								"You have ",
								unreadAlerts,
								" new alert",
								unreadAlerts === 1 ? "" : "s"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "h-4 w-4 text-primary" })
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomNav, {})
		]
	});
}
//#endregion
export { Home as component };
