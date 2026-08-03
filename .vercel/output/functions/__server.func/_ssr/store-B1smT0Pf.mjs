import { s as __toESM } from "../_runtime.mjs";
import { d as require_jsx_runtime, f as require_react } from "../_libs/@react-three/drei+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/store-B1smT0Pf.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var KEY = "watchpage.state.v1";
var initial = {
	onboarded: false,
	user: null
};
var StoreContext = (0, import_react.createContext)(null);
function StoreProvider({ children }) {
	const [state, setState] = (0, import_react.useState)(initial);
	const [hydrated, setHydrated] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		try {
			const raw = typeof window !== "undefined" ? localStorage.getItem(KEY) : null;
			if (raw) {
				const parsed = JSON.parse(raw);
				setState({
					onboarded: parsed.onboarded ?? false,
					user: parsed.user ?? null
				});
			}
		} catch {}
		setHydrated(true);
	}, []);
	(0, import_react.useEffect)(() => {
		if (!hydrated) return;
		try {
			localStorage.setItem(KEY, JSON.stringify(state));
		} catch {}
	}, [state, hydrated]);
	const value = (0, import_react.useMemo)(() => ({
		...state,
		completeOnboarding: (user) => setState((s) => ({
			...s,
			onboarded: true,
			user
		})),
		setInterests: (interests) => setState((s) => ({
			...s,
			user: s.user ? {
				...s.user,
				interests
			} : s.user
		})),
		logout: () => setState(initial)
	}), [state]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StoreContext.Provider, {
		value,
		children
	});
}
function useStore() {
	const ctx = (0, import_react.useContext)(StoreContext);
	if (!ctx) throw new Error("useStore must be used inside StoreProvider");
	return ctx;
}
function hostFromUrl(url) {
	try {
		return new URL(url).host.replace(/^www\./, "");
	} catch {
		return url;
	}
}
//#endregion
export { hostFromUrl as n, useStore as r, StoreProvider as t };
