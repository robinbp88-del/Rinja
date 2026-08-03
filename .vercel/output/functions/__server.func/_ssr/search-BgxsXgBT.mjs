import { s as __toESM } from "../_runtime.mjs";
import { d as require_jsx_runtime, f as require_react } from "../_libs/@react-three/drei+[...].mjs";
import { O as isRedirect, _ as useNavigate, v as useRouter } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as object, r as string } from "../_libs/zod.mjs";
import { D as ExternalLink, L as ArrowLeft, T as Eye, u as Search } from "../_libs/lucide-react.mjs";
import { t as RinjaMascot } from "./RinjaMascot-D6qGKtAs.mjs";
import { t as BottomNav } from "./BottomNav-DaQPzo7r.mjs";
import { t as Route } from "./search-ikZiTKg_.mjs";
import { t as getServerFnById } from "../__23tanstack-start-server-fn-resolver-DYdVsXgR.mjs";
import { c as createServerFn, i as TSS_SERVER_FUNCTION } from "./createServerFn-CIHAFgYl.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/search-BgxsXgBT.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function useServerFn(serverFn) {
	const router = useRouter();
	return import_react.useCallback(async (...args) => {
		try {
			const res = await serverFn(...args);
			if (isRedirect(res)) throw res;
			return res;
		} catch (err) {
			if (isRedirect(err)) {
				err.options._fromLocation = router.stores.location.get();
				return router.navigate(router.resolveRedirect(err).options);
			}
			throw err;
		}
	}, [router, serverFn]);
}
function isUrl(input) {
	const s = input.trim();
	if (/^https?:\/\//i.test(s)) return true;
	return /^[a-z0-9-]+(\.[a-z]{2,})+(\/|$)/i.test(s);
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var InputSchema = object({ query: string().min(1).max(300) });
var intelligentSearch = createServerFn({ method: "POST" }).inputValidator((input) => InputSchema.parse(input)).handler(createSsrRpc("a6345930b5e805ea3a6ea018619298134b5fe1b7d3830cb11ef5819f4bdcfc2a"));
var INTENT_LABEL = {
	product: "Products",
	house: "Homes",
	job: "Jobs",
	ticket: "Tickets",
	travel: "Trips",
	price: "Prices",
	availability: "Availability",
	general: "Results"
};
function availabilityText(r) {
	switch (r.availability) {
		case "in_stock": return {
			label: "In stock",
			tone: "ok"
		};
		case "limited": return {
			label: r.meta ?? "Limited",
			tone: "warn"
		};
		case "out_of_stock": return {
			label: "Out of stock",
			tone: "out"
		};
		default: return r.meta ? {
			label: r.meta,
			tone: "ok"
		} : null;
	}
}
function ResultCard({ r, onTrack }) {
	const avail = availabilityText(r);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-3xl border border-border bg-card p-4 transition-all duration-500",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-start gap-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-primary/15 text-[13px] font-semibold text-primary",
					children: r.image ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: r.image,
						alt: "",
						className: "h-full w-full object-cover"
					}) : r.source.slice(0, 2).toUpperCase()
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0 flex-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "truncate text-[15px] font-semibold",
							children: r.title
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "mt-0.5 truncate text-[12px] text-muted-foreground",
							children: [r.source, r.country ? ` · ${r.country}` : ""]
						}),
						avail && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: `mt-1 text-[11px] font-medium uppercase tracking-widest ${avail.tone === "ok" ? "text-primary" : avail.tone === "warn" ? "text-amber-400" : "text-muted-foreground"}`,
							children: avail.label
						})
					]
				}),
				r.price && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: `text-right text-[18px] font-semibold tabular-nums ${r.availability === "out_of_stock" ? "text-muted-foreground line-through" : ""}`,
					children: r.price
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mt-4 flex items-center gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
				href: r.url,
				target: "_blank",
				rel: "noopener noreferrer",
				className: "flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-border bg-card text-sm font-semibold transition active:scale-[0.98] hover:border-primary/40",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "h-4 w-4" }), " Open"]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				onClick: onTrack,
				className: "relative flex h-11 flex-1 items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground transition-all duration-300 active:scale-[0.98]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, {
					className: "h-4 w-4",
					strokeWidth: 2.6
				}), " Track"]
			})]
		})]
	});
}
var THINKING_STEPS = [
	"Looking around…",
	"Checking prices…",
	"Comparing stores…",
	"Almost there…"
];
function LoadingState() {
	const [step, setStep] = (0, import_react.useState)(0);
	(0, import_react.useEffect)(() => {
		const id = setInterval(() => {
			setStep((s) => (s + 1) % THINKING_STEPS.length);
		}, 1400);
		return () => clearInterval(id);
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-16 flex flex-col items-center px-6 text-center",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"aria-hidden": true,
				className: "relative h-6 w-[220px]",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "absolute top-1/2 left-1/2 h-2 w-2 -translate-y-1/2 rounded-full bg-primary",
					style: {
						boxShadow: "0 0 12px 4px oklch(0.58 0.24 295 / 0.65)",
						animation: "rinja-dot 2.4s ease-in-out infinite"
					}
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RinjaMascot, {
				variant: "binoculars",
				mood: "curious",
				size: 168,
				className: "-mt-2"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-6 min-h-[22px] text-[15px] font-medium animate-fade-in",
				children: THINKING_STEPS[step]
			}, step)
		]
	});
}
function SearchPage() {
	const { q: initialQ } = Route.useSearch();
	const navigate = useNavigate();
	const search = useServerFn(intelligentSearch);
	const [q, setQ] = (0, import_react.useState)(initialQ ?? "");
	const [submittedQ, setSubmittedQ] = (0, import_react.useState)(initialQ ?? "");
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const [response, setResponse] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		const query = submittedQ.trim();
		if (!query) {
			setResponse(null);
			return;
		}
		if (isUrl(query)) {
			navigate({
				to: "/add",
				search: { url: query }
			});
			return;
		}
		let cancelled = false;
		setLoading(true);
		setError(null);
		setResponse(null);
		search({ data: { query } }).then((res) => {
			if (cancelled) return;
			setResponse(res);
		}).catch((err) => {
			if (cancelled) return;
			const msg = err instanceof Error ? err.message : "Something went wrong.";
			setError(msg);
		}).finally(() => {
			if (!cancelled) setLoading(false);
		});
		return () => {
			cancelled = true;
		};
	}, [
		submittedQ,
		navigate,
		search
	]);
	const submit = () => setSubmittedQ(q);
	const track = (r) => {
		if (typeof navigator !== "undefined" && "vibrate" in navigator) try {
			navigator.vibrate?.(12);
		} catch {}
		navigate({
			to: "/highlight",
			search: { url: r.url }
		});
	};
	const heading = response ? INTENT_LABEL[response.intent] ?? "Results" : "Search";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen pb-32",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "px-6 pt-10 screen-safe",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => navigate({ to: "/home" }),
						"aria-label": "Back",
						className: "flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "h-4 w-4" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "text-[26px] font-semibold tracking-tight",
						children: heading
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5 flex items-center gap-2 rounded-full border border-border bg-card px-4 py-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "h-4 w-4 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: q,
						onChange: (e) => setQ(e.target.value),
						onKeyDown: (e) => {
							if (e.key === "Enter") {
								e.preventDefault();
								submit();
							}
						},
						placeholder: "Search or paste a webpage URL…",
						className: "flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
					})]
				})]
			}),
			loading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoadingState, {}),
			!loading && error && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-16 px-6 text-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[15px] font-semibold",
					children: "Rinja hit a snag."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-[13px] text-muted-foreground",
					children: error
				})]
			}),
			!loading && !error && response && response.results.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-8 px-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[15px] font-medium",
					children: "I found these."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mt-4 space-y-3",
					children: response.results.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ResultCard, {
						r,
						onTrack: () => track(r)
					}, r.id))
				})]
			}),
			!loading && response && response.results.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-16 px-6 text-center",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[17px] font-semibold",
						children: "I couldn't find anything yet."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-2 text-[13px] text-muted-foreground",
						children: "Try one of these instead."
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-6 flex flex-wrap justify-center gap-2.5",
						children: response.suggestions.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => {
								setQ(s);
								setSubmittedQ(s);
							},
							className: "rounded-full border border-border bg-card px-4 py-2 text-[13px] text-muted-foreground transition hover:border-primary/40 hover:text-primary",
							children: s
						}, s))
					})
				]
			}),
			!loading && !response && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
				className: "mt-10 flex flex-col items-center px-6 text-center",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RinjaMascot, {
					variant: "laptop",
					mood: "thinking",
					size: 200
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-4 text-sm text-muted-foreground",
					children: "What should I keep an eye on?"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BottomNav, {})
		]
	});
}
//#endregion
export { SearchPage as component };
