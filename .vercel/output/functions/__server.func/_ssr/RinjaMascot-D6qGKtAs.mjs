import { s as __toESM } from "../_runtime.mjs";
import { d as require_jsx_runtime, f as require_react } from "../_libs/@react-three/drei+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/rinja-DQgoCHQf.js
var rinja_default = "/assets/rinja-BB-VYooE.png";
//#endregion
//#region node_modules/.nitro/vite/services/ssr/assets/RinjaMascot-D6qGKtAs.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var rinja_guard_default = "/assets/rinja-guard-BWTwYZcZ.png";
var binoculars_default = "/assets/binoculars-UxsgRVqj.png";
var rinja_laptop_default = "/assets/rinja-laptop-BCSoGkOA.png";
var rinja_notify_default = "/assets/rinja-notify-BDQWcJwD.png";
var rinja_secure_default = "/assets/rinja-secure-BXuSrn2-.png";
var rinja_relax_default = "/assets/rinja-relax-3_JbZbCa.png";
var DEFAULT_MOOD = {
	idle: "curious",
	hero: "curious",
	guard: "neutral",
	binoculars: "curious",
	laptop: "thinking",
	notify: "alert",
	secure: "happy",
	relax: "sleepy"
};
var MOOD_GLOW = {
	neutral: "radial-gradient(circle at 50% 55%, oklch(0.58 0.24 295 / 0.55) 0%, transparent 65%)",
	happy: "radial-gradient(circle at 50% 55%, oklch(0.72 0.18 145 / 0.5) 0%, transparent 68%)",
	curious: "radial-gradient(circle at 50% 55%, oklch(0.62 0.22 250 / 0.55) 0%, transparent 65%)",
	alert: "radial-gradient(circle at 50% 55%, oklch(0.68 0.22 45 / 0.55) 0%, transparent 65%)",
	sleepy: "radial-gradient(circle at 50% 55%, oklch(0.45 0.08 285 / 0.45) 0%, transparent 65%)",
	excited: "radial-gradient(circle at 50% 55%, oklch(0.65 0.28 320 / 0.65) 0%, transparent 68%)",
	thinking: "radial-gradient(circle at 50% 55%, oklch(0.55 0.2 280 / 0.55) 0%, transparent 65%)"
};
var MOOD_ANIM = {
	neutral: "rinja-float",
	happy: "rinja-happy",
	curious: "rinja-curious",
	alert: "rinja-alert",
	sleepy: "rinja-sleepy",
	excited: "rinja-excited",
	thinking: "rinja-thinking"
};
var RinjaCanvas = (0, import_react.lazy)(() => import("./RinjaCanvas-CfkXwiWP.mjs"));
function assetFor(variant) {
	switch (variant) {
		case "guard": return rinja_guard_default;
		case "binoculars": return binoculars_default;
		case "laptop": return rinja_laptop_default;
		case "notify": return rinja_notify_default;
		case "secure": return rinja_secure_default;
		case "relax": return rinja_relax_default;
		default: return rinja_default;
	}
}
function FallbackImage({ variant, size, priority, mood }) {
	const [blink, setBlink] = (0, import_react.useState)(false);
	const [react, setReact] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		const blinkTimer = setInterval(() => {
			setBlink(true);
			setTimeout(() => setBlink(false), 120);
		}, 3200 + Math.random() * 2200);
		const reactTimer = setInterval(() => {
			if (mood === "sleepy") return;
			setReact(true);
			setTimeout(() => setReact(false), 900);
		}, 7e3 + Math.random() * 4e3);
		return () => {
			clearInterval(blinkTimer);
			clearInterval(reactTimer);
		};
	}, [mood]);
	const animName = (0, import_react.useMemo)(() => {
		if (react && mood === "excited") return "rinja-excited-pop";
		if (react && mood === "happy") return "rinja-wave";
		return MOOD_ANIM[mood];
	}, [react, mood]);
	const animDuration = mood === "sleepy" ? "4.8s" : mood === "alert" ? "1.8s" : "3.4s";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative inline-flex items-center justify-center",
		style: {
			width: size,
			height: size
		},
		"aria-hidden": true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute inset-0 rounded-full",
			style: {
				background: MOOD_GLOW[mood],
				animation: mood === "sleepy" ? "rinja-glow-slow 5.5s ease-in-out infinite" : "rinja-glow 3.2s ease-in-out infinite, rinja-breathe 4.2s ease-in-out infinite",
				filter: "blur(5px)"
			}
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
			src: assetFor(variant),
			alt: "",
			width: size,
			height: size,
			...priority ? {} : { loading: "lazy" },
			className: "relative select-none object-contain",
			style: {
				width: size,
				height: size,
				transform: blink ? "scaleY(0.96)" : void 0,
				transition: "transform 80ms ease-out",
				animation: `${animName} ${animDuration} ease-in-out infinite`,
				transformOrigin: "50% 70%",
				filter: mood === "sleepy" ? "brightness(0.94) saturate(0.9)" : "drop-shadow(0 14px 24px oklch(0.25 0.12 295 / 0.45))"
			},
			draggable: false
		})]
	});
}
var CanvasErrorCatch = class extends import_react.Component {
	state = { hasError: false };
	static getDerivedStateFromError() {
		return { hasError: true };
	}
	componentDidCatch() {
		this.props.onError();
	}
	render() {
		if (this.state.hasError) return null;
		return this.props.children;
	}
};
/**
* Uses remeshed GLB when available; PNG pose fallback per screen / on error.
* Pose-specific PNGs still used for binoculars/laptop/notify/etc when flat,
* or as loading fallback for 3D.
*/
function RinjaMascot({ variant = "idle", mood, size = 176, className = "", priority = false, flat = false }) {
	const resolvedMood = mood ?? DEFAULT_MOOD[variant];
	const [mounted, setMounted] = (0, import_react.useState)(false);
	const [failed, setFailed] = (0, import_react.useState)(false);
	const preferFlat = flat || variant === "binoculars" || variant === "laptop" || variant === "notify" || variant === "relax" || variant === "secure" || variant === "guard";
	(0, import_react.useEffect)(() => {
		setMounted(true);
	}, []);
	if (!mounted || failed || preferFlat) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FallbackImage, {
			variant,
			size,
			priority,
			mood: resolvedMood
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: `relative inline-flex items-center justify-center ${className}`,
		style: {
			width: size,
			height: size
		},
		"aria-hidden": true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "pointer-events-none absolute inset-0 rounded-full",
			style: {
				background: MOOD_GLOW[resolvedMood],
				filter: "blur(10px)",
				animation: "rinja-glow 3.2s ease-in-out infinite"
			}
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_react.Suspense, {
			fallback: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FallbackImage, {
				variant,
				size,
				priority,
				mood: resolvedMood
			}),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CanvasErrorCatch, {
				onError: () => setFailed(true),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RinjaCanvas, {
					mood: resolvedMood,
					size
				})
			})
		})]
	});
}
//#endregion
export { binoculars_default as n, RinjaMascot as t };
