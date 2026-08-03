import { s as __toESM } from "../_runtime.mjs";
import { d as require_jsx_runtime, f as require_react } from "../_libs/@react-three/drei+[...].mjs";
import { _ as useNavigate } from "../_libs/@tanstack/react-router+[...].mjs";
import { E as EyeOff, L as ArrowLeft, T as Eye, y as LoaderCircle } from "../_libs/lucide-react.mjs";
import { t as RinjaMascot } from "./RinjaMascot-D6qGKtAs.mjs";
import { r as signUp, t as signIn } from "./auth-DGmdbljS.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/login-CK00cMbR.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function Login() {
	const navigate = useNavigate();
	const [registerMode, setRegisterMode] = (0, import_react.useState)(false);
	const [name, setName] = (0, import_react.useState)("");
	const [email, setEmail] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [showPassword, setShowPassword] = (0, import_react.useState)(false);
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)("");
	async function submit() {
		try {
			setLoading(true);
			setError("");
			if (registerMode) await signUp(email, password, name);
			else await signIn(email, password);
			navigate({ to: "/home" });
		} catch (err) {
			setError(err instanceof Error ? err.message : "Something went wrong");
		} finally {
			setLoading(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative flex min-h-screen flex-col overflow-hidden px-6 pt-6 screen-safe",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"aria-hidden": true,
				className: "pointer-events-none absolute inset-0 -z-10",
				style: { background: "radial-gradient(ellipse 80% 50% at 50% -10%, oklch(0.45 0.18 295 / 0.45), transparent 70%), radial-gradient(ellipse 60% 40% at 80% 100%, oklch(0.35 0.12 260 / 0.25), transparent 60%)" }
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => navigate({ to: "/welcome" }),
				"aria-label": "Back",
				className: "mb-4 flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card/80 backdrop-blur",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "h-4 w-4" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-1 flex-col",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col items-center text-center",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RinjaMascot, {
								variant: registerMode ? "secure" : "hero",
								mood: registerMode ? "happy" : "curious",
								size: 128,
								priority: true
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 text-[11px] font-medium uppercase tracking-[0.2em] text-primary",
								children: "Rinja"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "mt-3 text-[28px] font-semibold tracking-tight",
								children: registerMode ? "Create your account" : "Welcome back"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "mt-2 max-w-xs text-[14px] text-muted-foreground",
								children: registerMode ? "Beta signup with email + password. Google comes later." : "Sign in with the email you used to create your account."
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-8 space-y-3",
						children: [
							registerMode && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "block",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mb-1.5 block px-1 text-[11px] uppercase tracking-widest text-muted-foreground",
									children: "Name"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									className: "h-12 w-full rounded-2xl border border-border bg-card/80 px-4 text-[15px] outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20",
									placeholder: "Your name",
									autoComplete: "name",
									value: name,
									onChange: (e) => setName(e.target.value)
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "block",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mb-1.5 block px-1 text-[11px] uppercase tracking-widest text-muted-foreground",
									children: "Email"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									className: "h-12 w-full rounded-2xl border border-border bg-card/80 px-4 text-[15px] outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20",
									placeholder: "you@email.com",
									type: "email",
									inputMode: "email",
									autoCapitalize: "off",
									autoCorrect: "off",
									autoComplete: "email",
									value: email,
									onChange: (e) => setEmail(e.target.value)
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "block",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "mb-1.5 block px-1 text-[11px] uppercase tracking-widest text-muted-foreground",
									children: "Password"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "relative",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										className: "h-12 w-full rounded-2xl border border-border bg-card/80 px-4 pr-12 text-[15px] outline-none transition focus:border-primary/50 focus:ring-2 focus:ring-primary/20",
										placeholder: "••••••••",
										type: showPassword ? "text" : "password",
										autoComplete: registerMode ? "new-password" : "current-password",
										value: password,
										onChange: (e) => setPassword(e.target.value),
										onKeyDown: (e) => {
											if (e.key === "Enter") {
												e.preventDefault();
												submit();
											}
										}
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										"aria-label": showPassword ? "Hide password" : "Show password",
										onClick: () => setShowPassword((v) => !v),
										className: "absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground transition hover:text-foreground",
										children: showPassword ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, { className: "h-4 w-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "h-4 w-4" })
									})]
								})]
							}),
							error && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-center text-[13px] text-destructive",
								children: error
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mt-auto flex flex-col gap-3 pb-8 pt-8",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => void submit(),
							disabled: loading || !email.trim() || !password.trim(),
							className: "flex h-13 items-center justify-center gap-2 rounded-full bg-primary text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition active:scale-[0.98] disabled:opacity-40",
							children: loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "h-4 w-4 animate-spin" }), "Please wait…"] }) : registerMode ? "Create account" : "Sign in"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => {
								setRegisterMode(!registerMode);
								setError("");
							},
							className: "h-11 text-[13px] text-muted-foreground transition hover:text-foreground",
							children: registerMode ? "Already have an account? Sign in" : "New here? Create an account"
						})]
					})
				]
			})
		]
	});
}
//#endregion
export { Login as component };
