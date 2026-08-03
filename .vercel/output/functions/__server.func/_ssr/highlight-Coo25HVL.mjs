import { s as __toESM } from "../_runtime.mjs";
import { d as require_jsx_runtime, f as require_react } from "../_libs/@react-three/drei+[...].mjs";
import { _ as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { L as ArrowLeft, M as Check, N as Bell, P as BellOff, S as Image, a as Tag, g as MousePointerClick, h as Package, l as Settings2, o as Sparkles, r as Type, t as X, y as LoaderCircle } from "../_libs/lucide-react.mjs";
import { n as hostFromUrl } from "./store-B1smT0Pf.mjs";
import { t as Route } from "./highlight-acYpcQKi.mjs";
import { r as getWatchById, s as updateWatchSelection, t as createWatch } from "./watches-BS9NyyG4.mjs";
import { t as createStartedNotification } from "./notifications-DMpX62bk.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/highlight-Coo25HVL.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Highlight() {
	const { url, selector: searchSelector, watchId } = Route.useSearch();
	const navigate = useNavigate();
	const iframeRef = (0, import_react.useRef)(null);
	const [ready, setReady] = (0, import_react.useState)(false);
	const [pageTitle, setPageTitle] = (0, import_react.useState)("");
	const [selection, setSelection] = (0, import_react.useState)(null);
	const [picking, setPicking] = (0, import_react.useState)(false);
	const [mode, setMode] = (0, import_react.useState)("any");
	const [notify, setNotify] = (0, import_react.useState)(true);
	const [saveState, setSaveState] = (0, import_react.useState)("idle");
	const [resolvedSelector, setResolvedSelector] = (0, import_react.useState)(searchSelector ?? "");
	const host = hostFromUrl(url);
	(0, import_react.useEffect)(() => {
		if (searchSelector) {
			setResolvedSelector(searchSelector);
			return;
		}
		if (!watchId) {
			setResolvedSelector("");
			return;
		}
		let cancelled = false;
		getWatchById(watchId).then((watch) => {
			if (cancelled) return;
			setResolvedSelector(watch?.selector?.trim() ?? "");
		}).catch((error) => {
			console.error("Could not load saved selector:", error);
		});
		return () => {
			cancelled = true;
		};
	}, [searchSelector, watchId]);
	(0, import_react.useEffect)(() => {
		const onMessage = (event) => {
			const data = event.data;
			if (!data || data.source !== "watchpage-picker") return;
			if (data.type === "ready") {
				setReady(true);
				if (data.payload?.title) setPageTitle(data.payload.title);
				return;
			}
			if (data.type === "selected") {
				const selected = data.payload;
				setSelection(selected);
				setSaveState("idle");
				setMode(defaultModeFor(detectKind(selected)));
				if (navigator.vibrate) navigator.vibrate(8);
				return;
			}
			if (data.type === "revealed") {
				console.info("Saved element revealed:", data.payload?.selector);
				return;
			}
			if (data.type === "reveal-missing") console.warn("Saved element could not be found:", data.payload?.selector);
		};
		window.addEventListener("message", onMessage);
		return () => {
			window.removeEventListener("message", onMessage);
		};
	}, []);
	(0, import_react.useEffect)(() => {
		if (!ready || !resolvedSelector || !iframeRef.current?.contentWindow) return;
		const reveal = () => {
			iframeRef.current?.contentWindow?.postMessage({
				source: "watchpage-host",
				type: "reveal",
				selector: resolvedSelector
			}, "*");
		};
		const timers = [
			window.setTimeout(reveal, 400),
			window.setTimeout(reveal, 1200),
			window.setTimeout(reveal, 2500)
		];
		return () => {
			timers.forEach((timer) => window.clearTimeout(timer));
		};
	}, [ready, resolvedSelector]);
	const post = (type, extra) => {
		iframeRef.current?.contentWindow?.postMessage({
			source: "watchpage-host",
			type,
			...extra
		}, "*");
	};
	const enablePicking = () => {
		setPicking(true);
		post("enable");
		if (navigator.vibrate) navigator.vibrate(6);
	};
	const exitPicking = () => {
		setPicking(false);
		setSelection(null);
		setSaveState("idle");
		post("disable");
	};
	const dismissSheet = () => {
		setSelection(null);
		setSaveState("idle");
		post("clear");
	};
	const kind = detectKind(selection);
	const options = (0, import_react.useMemo)(() => optionsFor(kind), [kind]);
	const save = async () => {
		if (!selection || saveState !== "idle") return;
		setSaveState("saving");
		const label = labelFor(kind, mode, selection.text);
		const value = selection.text || selection.html.slice(0, 80);
		try {
			if (watchId) await updateWatchSelection(watchId, {
				label,
				currentValue: value,
				selector: selection.selector,
				elementText: selection.text,
				elementTag: selection.tag,
				elementHtml: selection.html,
				mode,
				notify
			});
			else {
				const created = await createWatch({
					url,
					host,
					title: pageTitle || host,
					label,
					currentValue: value,
					selector: selection.selector,
					elementText: selection.text,
					elementTag: selection.tag,
					elementHtml: selection.html,
					mode,
					frequency: "15m",
					notify
				});
				if (notify) await createStartedNotification({
					watchId: created.id,
					label,
					host
				});
			}
			if (navigator.vibrate) navigator.vibrate(10);
			setSaveState("done");
			post("mark");
			window.setTimeout(() => {
				setSelection(null);
				setSaveState("idle");
				setPicking(false);
				if (watchId) navigate({
					to: "/watch/$id",
					params: { id: watchId }
				});
				else navigate({ to: "/home" });
			}, 850);
		} catch (error) {
			console.error("Could not save watch:", error);
			setSaveState("idle");
			const message = error instanceof Error ? error.message : "Could not save the watch.";
			window.alert(message);
		}
	};
	const handleBack = () => {
		if (watchId) {
			navigate({
				to: "/watch/$id",
				params: { id: watchId }
			});
			return;
		}
		navigate({
			to: "/add",
			search: { url }
		});
	};
	const src = `/api/proxy?url=${encodeURIComponent(url)}`;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative flex min-h-screen flex-col bg-background",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-xl screen-safe",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2 px-3 py-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: handleBack,
							"aria-label": "Back",
							className: "flex h-9 w-9 items-center justify-center rounded-full bg-card",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "h-4 w-4" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex-1 truncate rounded-full bg-card px-4 py-2 text-center text-xs text-muted-foreground",
							children: host
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							"aria-label": "Close",
							onClick: () => navigate({ to: "/home" }),
							className: "flex h-9 w-9 items-center justify-center rounded-full bg-card",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "h-4 w-4" })
						})
					]
				}), picking && !selection && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "border-t border-border/50 bg-primary/10 px-4 py-2 text-center text-[11px] font-medium uppercase tracking-widest text-primary",
					children: "Tap anything on the page"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative flex-1",
				children: [!ready && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background/80 backdrop-blur-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-6 w-6 animate-spin text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-muted-foreground",
						children: [
							"Loading ",
							host,
							"…"
						]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("iframe", {
					ref: iframeRef,
					src,
					title: `Preview of ${host}`,
					sandbox: "allow-same-origin allow-scripts allow-forms allow-popups",
					className: "h-[calc(100vh-64px)] w-full border-0 bg-white"
				})]
			}),
			!picking && !selection && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-md justify-end px-4 pb-5 screen-safe",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: enablePicking,
					className: "pointer-events-auto flex h-14 items-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-2xl shadow-primary/40 glow-ring transition active:scale-95",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MousePointerClick, {
						className: "h-5 w-5",
						strokeWidth: 2.6
					}), watchId ? "Change selection" : "Highlight"]
				})
			}),
			picking && !selection && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pointer-events-none fixed inset-x-0 bottom-0 z-40 mx-auto flex max-w-md justify-center px-4 pb-5 screen-safe",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: exitPicking,
					className: "pointer-events-auto flex h-12 items-center gap-2 rounded-full border border-border bg-card px-6 text-sm font-semibold shadow-xl transition active:scale-95",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "h-4 w-4" }), "Done"]
				})
			}),
			selection && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-fade-in",
				onClick: saveState === "idle" ? dismissSheet : void 0
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md px-3 pb-3 screen-safe",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-[28px] border border-border bg-card/98 p-5 shadow-2xl backdrop-blur-2xl animate-scale-in",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: "/assets/rinja-BB-VYooE.png",
								alt: "",
								className: "h-14 w-14 flex-shrink-0 object-contain"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex-1 pt-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[11px] uppercase tracking-widest text-primary",
									children: kindLabel(kind)
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
									className: "mt-1 text-[19px] font-semibold leading-snug tracking-tight",
									children: watchId ? "Update what I should watch?" : "Should I keep an eye on this?"
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-4 rounded-2xl border border-border/60 bg-background/60 px-4 py-3",
							children: kind === "image" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImagePreview, { html: selection.html }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "truncate text-[15px] font-medium",
								children: selection.text?.trim() || /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted-foreground",
									children: selection.tag
								})
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-4 flex flex-wrap gap-2",
							children: options.map((option) => {
								const active = mode === option.value;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									disabled: saveState !== "idle",
									onClick: () => setMode(option.value),
									className: `flex h-10 items-center gap-1.5 rounded-full border px-3.5 text-[13px] font-medium transition ${active ? "border-primary bg-primary/15 text-primary" : "border-border bg-background/40 text-foreground/80 hover:bg-background/70"}`,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(option.icon, {
										className: "h-3.5 w-3.5",
										strokeWidth: 2.4
									}), option.label]
								}, option.value);
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							disabled: saveState !== "idle",
							onClick: () => setNotify((value) => !value),
							className: `mt-4 flex h-12 w-full items-center gap-3 rounded-2xl border px-4 text-left transition ${notify ? "border-primary/40 bg-primary/10" : "border-border bg-background/40"}`,
							children: [notify ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bell, { className: "h-4 w-4 shrink-0 text-primary" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BellOff, { className: "h-4 w-4 shrink-0 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block text-[13px] font-medium",
									children: notify ? "Alerts on" : "Alerts off"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "block text-[11px] text-muted-foreground",
									children: notify ? "I'll notify you when this changes" : "I'll watch quietly — no alerts"
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: save,
							disabled: saveState !== "idle",
							className: `mt-5 flex h-[52px] w-full items-center justify-center gap-2 rounded-full text-sm font-semibold transition active:scale-[0.98] ${saveState === "done" ? "bg-primary/20 text-primary" : "bg-primary text-primary-foreground shadow-lg shadow-primary/30"}`,
							children: [
								saveState === "idle" && (watchId ? "Update watch" : "Yes"),
								saveState === "saving" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }), watchId ? "Updating…" : "Watching…"] }),
								saveState === "done" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
									className: "h-4 w-4",
									strokeWidth: 3
								}), watchId ? "Updated" : "I'm watching"] })
							]
						})
					]
				})
			})] })
		]
	});
}
function ImagePreview({ html }) {
	const src = html.match(/<img[^>]+src=["']([^"']+)["']/i)?.[1];
	if (!src) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
		className: "text-[13px] text-muted-foreground",
		children: "Image element"
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			src,
			alt: "",
			className: "h-14 w-14 rounded-xl border border-border/60 object-cover",
			onError: (event) => {
				event.currentTarget.style.display = "none";
			}
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "truncate text-[13px] text-muted-foreground",
			children: "Image"
		})]
	});
}
function detectKind(selection) {
	if (!selection) return "text";
	if (selection.tag === "img" || /<img\b/i.test(selection.html)) return "image";
	const text = selection.text.trim();
	if (!text) return "text";
	if (/([$€£¥₹]|\bkr\b|\bNOK\b|\bUSD\b|\bEUR\b|\bGBP\b)\s?\d/i.test(text)) return "price";
	if (/^\s*[$€£¥₹]?\s?\d{1,3}([.,\s]\d{3})*([.,]\d{1,2})?\s?(kr|NOK|USD|EUR|GBP|\$|€|£)?\s*$/i.test(text)) return "price";
	if (/(in stock|out of stock|sold out|available|unavailable|på lager|utsolgt)/i.test(text)) return "stock";
	if (/\b(\d{1,2}[./-]\d{1,2}(?:[./-]\d{2,4})?)\b/.test(text)) return "date";
	if (/\b(mon|tue|wed|thu|fri|sat|sun|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i.test(text)) return "date";
	return "text";
}
function kindLabel(kind) {
	if (kind === "price") return "Price detected";
	if (kind === "stock") return "Stock detected";
	if (kind === "date") return "Date detected";
	if (kind === "image") return "Image detected";
	return "Element selected";
}
function defaultModeFor(kind) {
	if (kind === "price") return "price";
	if (kind === "stock") return "stock";
	if (kind === "image") return "image";
	return "any";
}
function optionsFor(kind) {
	const options = [];
	if (kind === "price") options.push({
		value: "price",
		label: "Price",
		icon: Tag
	});
	else if (kind === "stock") options.push({
		value: "stock",
		label: "Stock",
		icon: Package
	});
	else if (kind === "image") options.push({
		value: "image",
		label: "Image",
		icon: Image
	});
	else options.push({
		value: "text",
		label: "Text",
		icon: Type
	});
	options.push({
		value: "any",
		label: "Any change",
		icon: Sparkles
	});
	options.push({
		value: "custom",
		label: "Custom…",
		icon: Settings2
	});
	return options;
}
function labelFor(kind, mode, text) {
	const trimmed = text.trim().slice(0, 40);
	if (mode === "price") return `Price · ${trimmed}`;
	if (mode === "stock") return "Stock availability";
	if (mode === "image") return "Image";
	if (mode === "text") return trimmed || "Text element";
	if (mode === "custom") return trimmed || `${kind} element`;
	return trimmed || "Any change";
}
//#endregion
export { Highlight as component };
