import { s as __toESM } from "../_runtime.mjs";
import { d as require_jsx_runtime, f as require_react } from "../_libs/@react-three/drei+[...].mjs";
import { _ as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { T as Eye } from "../_libs/lucide-react.mjs";
import { n as useAuth } from "./AuthProvider-BaHTDOle.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-DnuAWCUG.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Splash() {
	const navigate = useNavigate();
	const { user, loading } = useAuth();
	const [ready, setReady] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const t = setTimeout(() => setReady(true), 900);
		return () => clearTimeout(t);
	}, []);
	(0, import_react.useEffect)(() => {
		if (!ready || loading) return;
		const t = setTimeout(() => {
			navigate({
				to: user ? "/home" : "/welcome",
				replace: true
			});
		}, 300);
		return () => clearTimeout(t);
	}, [
		ready,
		loading,
		user,
		navigate
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex min-h-screen flex-col items-center justify-center gap-6 bg-background",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute inset-0 -z-10 rounded-full bg-primary/30 blur-3xl" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary to-primary/60 shadow-2xl",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, {
					className: "h-10 w-10 text-primary-foreground",
					strokeWidth: 2.4
				})
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "text-center",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-2xl font-semibold tracking-tight",
				children: "Rinja"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm text-muted-foreground",
				children: "Preparing your workspace..."
			})]
		})]
	});
}
//#endregion
export { Splash as component };
