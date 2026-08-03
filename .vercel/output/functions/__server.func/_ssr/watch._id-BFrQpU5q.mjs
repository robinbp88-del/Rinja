import { d as require_jsx_runtime } from "../_libs/@react-three/drei+[...].mjs";
import { _ as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { D as ExternalLink, L as ArrowLeft, N as Bell, P as BellOff, d as RefreshCw, f as Play, i as Trash2, k as Clock, p as Pause, w as Globe, y as LoaderCircle } from "../_libs/lucide-react.mjs";
import { a as setWatchNotify, n as deleteWatch, o as setWatchPaused, r as getWatchById } from "./watches-BS9NyyG4.mjs";
import { i as useQueryClient, n as useQuery, t as useMutation } from "../_libs/tanstack__react-query.mjs";
import { t as Route } from "./watch._id-BeJGBQNZ.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/watch._id-BFrQpU5q.js
var import_jsx_runtime = require_jsx_runtime();
var FREQ_LABEL = {
	"5m": "Every 5 minutes",
	"15m": "Every 15 minutes",
	"1h": "Every hour",
	"6h": "Every 6 hours",
	"1d": "Every day"
};
function WatchDetail() {
	const { id } = Route.useParams();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const watchQuery = useQuery({
		queryKey: ["watch", id],
		queryFn: () => getWatchById(id)
	});
	const pauseMutation = useMutation({
		mutationFn: ({ watchId, paused }) => setWatchPaused(watchId, paused),
		onSuccess: async (updatedWatch) => {
			queryClient.setQueryData(["watch", updatedWatch.id], updatedWatch);
			await queryClient.invalidateQueries({ queryKey: ["watches"] });
		}
	});
	const notifyMutation = useMutation({
		mutationFn: ({ watchId, notify }) => setWatchNotify(watchId, notify),
		onSuccess: async (updatedWatch) => {
			queryClient.setQueryData(["watch", updatedWatch.id], updatedWatch);
			await queryClient.invalidateQueries({ queryKey: ["watches"] });
		}
	});
	const deleteMutation = useMutation({
		mutationFn: (watchId) => deleteWatch(watchId),
		onSuccess: async () => {
			queryClient.removeQueries({ queryKey: ["watch", id] });
			await queryClient.invalidateQueries({ queryKey: ["watches"] });
			navigate({
				to: "/home",
				replace: true
			});
		}
	});
	if (watchQuery.isPending) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex min-h-screen items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2 text-sm text-muted-foreground",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }), "Loading watch…"]
		})
	});
	if (watchQuery.isError) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-screen flex-col items-center justify-center px-6 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm font-medium",
				children: "I couldn't load this watch."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-xs text-muted-foreground",
				children: watchQuery.error instanceof Error ? watchQuery.error.message : "Unknown error"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => watchQuery.refetch(),
				className: "mt-5 flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "h-4 w-4" }), "Try again"]
			})
		]
	});
	const watch = watchQuery.data;
	if (!watch) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-screen flex-col items-center justify-center px-6 text-center",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-sm text-muted-foreground",
			children: "This watch no longer exists."
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			onClick: () => navigate({ to: "/home" }),
			className: "mt-4 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground",
			children: "Home"
		})]
	});
	const frequency = FREQ_LABEL[watch.frequency ?? ""] ?? watch.frequency ?? "Not set";
	const currentValue = watch.current_value?.trim() || "No value yet";
	const alertsOn = watch.notify !== false;
	const handlePause = () => {
		if (pauseMutation.isPending) return;
		pauseMutation.mutate({
			watchId: watch.id,
			paused: !watch.paused
		});
	};
	const handleNotify = () => {
		if (notifyMutation.isPending) return;
		notifyMutation.mutate({
			watchId: watch.id,
			notify: !alertsOn
		});
	};
	const handleDelete = () => {
		if (deleteMutation.isPending) return;
		if (window.confirm("Delete this watch permanently?")) deleteMutation.mutate(watch.id);
	};
	const handleOpenWebsite = () => {
		navigate({
			to: "/highlight",
			search: {
				url: watch.url,
				selector: watch.selector ?? void 0,
				watchId: watch.id
			}
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen pb-16",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "flex items-center gap-3 px-4 pt-6 screen-safe",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => navigate({ to: "/home" }),
						"aria-label": "Back",
						className: "flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "h-4 w-4" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0 flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "truncate text-xs text-muted-foreground",
							children: watch.host ?? "Website"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "truncate text-sm font-medium",
							children: watch.label
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: `rounded-full px-3 py-1 text-[10px] uppercase tracking-widest ${watch.paused ? "bg-muted text-muted-foreground" : "bg-primary/15 text-primary"}`,
						children: watch.paused ? "Paused" : "Live"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8 px-6 text-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[11px] uppercase tracking-widest text-muted-foreground",
					children: "Current value"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 break-words text-4xl font-semibold tabular-nums tracking-tight",
					children: currentValue
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "mt-8 px-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoRow, {
							icon: Globe,
							label: "Website",
							value: watch.host ?? watch.url
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoRow, {
							icon: Clock,
							label: "Frequency",
							value: frequency
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoRow, {
							icon: alertsOn ? Bell : BellOff,
							label: "Alerts",
							value: alertsOn ? "On" : "Off"
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-6 px-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: handleNotify,
					disabled: notifyMutation.isPending,
					className: "mb-3 flex h-12 w-full items-center justify-center gap-2 rounded-full border border-border bg-card text-sm font-medium disabled:opacity-60",
					children: notifyMutation.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : alertsOn ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BellOff, { className: "h-4 w-4" }), "Turn alerts off"] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, { className: "h-4 w-4" }), "Turn alerts on"] })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: handleOpenWebsite,
					className: "flex h-13 w-full items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition active:scale-[0.98]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "h-4 w-4" }), "Open Website"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8 px-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "text-[11px] uppercase tracking-widest text-muted-foreground",
					children: "History"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-3 rounded-2xl border border-dashed border-border p-6 text-center",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: "History will appear here after the first change."
					})
				})]
			}),
			(pauseMutation.isError || deleteMutation.isError) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
				className: "mt-5 px-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-center text-sm text-destructive",
					children: "Something went wrong. Please try again."
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8 flex gap-2 px-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: handlePause,
					disabled: pauseMutation.isPending,
					className: "flex flex-1 items-center justify-center gap-2 rounded-full border border-border bg-card py-3 text-sm font-medium disabled:opacity-60",
					children: pauseMutation.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : watch.paused ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "h-4 w-4" }), "Resume"] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { className: "h-4 w-4" }), "Pause"] })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: handleDelete,
					disabled: deleteMutation.isPending,
					className: "flex flex-1 items-center justify-center gap-2 rounded-full border border-destructive/40 bg-destructive/10 py-3 text-sm font-medium text-destructive disabled:opacity-60",
					children: deleteMutation.isPending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "h-4 w-4" }), "Delete"] })
				})]
			})
		]
	});
}
function InfoRow({ icon: Icon, label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-3 px-4 py-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "h-4 w-4 shrink-0 text-muted-foreground" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "flex-1 text-sm text-muted-foreground",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "max-w-[55%] truncate text-right text-sm font-medium",
				children: value
			})
		]
	});
}
//#endregion
export { WatchDetail as component };
