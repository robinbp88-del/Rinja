import { s as __toESM } from "../_runtime.mjs";
import { d as require_jsx_runtime, f as require_react } from "../_libs/@react-three/drei+[...].mjs";
import { _ as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as Route } from "./add-CnRB3I2m.mjs";
import { A as ClipboardPaste, L as ArrowLeft, b as Link2 } from "../_libs/lucide-react.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/add-DQBlR5Id.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function AddWatch() {
	const navigate = useNavigate();
	const { url: initialUrl } = Route.useSearch();
	const [url, setUrl] = (0, import_react.useState)(initialUrl ?? "");
	const isValid = /^https?:\/\/.+\..+/i.test(url.trim());
	const open = () => {
		if (!isValid) return;
		navigate({
			to: "/highlight",
			search: { url: url.trim() }
		});
	};
	const paste = async () => {
		try {
			const text = await navigator.clipboard.readText();
			if (text) setUrl(text.trim());
		} catch {}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-screen flex-col px-6 pt-6 screen-safe",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				onClick: () => navigate({ to: "/home" }),
				"aria-label": "Back",
				className: "mb-6 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "h-4 w-4" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-[28px] font-semibold tracking-tight",
				children: "Add a watch"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-2 text-sm text-muted-foreground",
				children: "Paste any URL. Next you’ll tap the price, stock text, or element I should watch — then I’ll alert you when it changes."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-8 flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link2, { className: "h-4 w-4 text-muted-foreground" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: url,
						onChange: (e) => setUrl(e.target.value),
						placeholder: "https://",
						autoFocus: true,
						inputMode: "url",
						autoCapitalize: "off",
						autoCorrect: "off",
						className: "flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: paste,
						className: "text-xs text-primary",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClipboardPaste, { className: "h-4 w-4" })
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-auto flex flex-col gap-2 pb-8",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: open,
					disabled: !isValid,
					className: "flex h-12 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground transition active:scale-[0.98] disabled:opacity-40",
					children: "Open page"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-center text-[11px] text-muted-foreground",
					children: "Shared from another app? WatchPage will open here automatically on native."
				})]
			})
		]
	});
}
//#endregion
export { AddWatch as component };
