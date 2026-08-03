import { s as __toESM } from "../_runtime.mjs";
import { a as Center, c as Canvas, d as require_jsx_runtime, f as require_react, i as Bounds, l as useFrame, n as Environment, o as useGLTF, r as Float, s as PresentationControls, t as ContactShadows } from "../_libs/@react-three/drei+[...].mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/RinjaCanvas-CfkXwiWP.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
var MODEL_URL = "/rinja.glb";
function moodMotion(mood, t) {
	switch (mood) {
		case "alert": return {
			y: Math.sin(t * 3.8) * .03,
			rotY: Math.sin(t * 2.6) * .12,
			rotX: Math.sin(t * 4.2) * .04
		};
		case "curious": return {
			y: Math.sin(t * 1.3) * .045,
			rotY: Math.sin(t * .95) * .28,
			rotX: Math.sin(t * .7) * .06
		};
		case "happy":
		case "excited": return {
			y: Math.abs(Math.sin(t * 2.4)) * .08,
			rotY: Math.sin(t * 1.8) * .16,
			rotX: Math.sin(t * 2.6) * .05
		};
		case "sleepy": return {
			y: Math.sin(t * .6) * .015,
			rotY: Math.sin(t * .35) * .06,
			rotX: .1 + Math.sin(t * .45) * .02
		};
		case "thinking": return {
			y: Math.sin(t * 1) * .03,
			rotY: -.2 + Math.sin(t * .55) * .08,
			rotX: .06
		};
		default: return {
			y: Math.sin(t * 1.15) * .04,
			rotY: Math.sin(t * .85) * .18,
			rotX: Math.sin(t * .65) * .04
		};
	}
}
function RinjaModel({ mood }) {
	const group = (0, import_react.useRef)(null);
	const { scene } = useGLTF(MODEL_URL);
	const cloned = (0, import_react.useMemo)(() => scene.clone(true), [scene]);
	useFrame(({ clock }) => {
		if (!group.current) return;
		const m = moodMotion(mood, clock.getElapsedTime());
		group.current.position.y = m.y;
		group.current.rotation.y = m.rotY;
		group.current.rotation.x = m.rotX;
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("group", {
		ref: group,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Center, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("primitive", { object: cloned }) })
	});
}
useGLTF.preload(MODEL_URL);
function RinjaCanvas({ mood, size }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		style: {
			width: size,
			height: size
		},
		className: "relative",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Canvas, {
			dpr: [1, 1.5],
			camera: {
				position: [
					0,
					.2,
					2.6
				],
				fov: 30,
				near: .1,
				far: 50
			},
			gl: {
				antialias: true,
				alpha: true,
				powerPreference: "high-performance"
			},
			style: { background: "transparent" },
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("ambientLight", { intensity: .65 }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("directionalLight", {
					position: [
						2.5,
						3.5,
						2
					],
					intensity: 1.4,
					color: "#efe6ff"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("pointLight", {
					position: [
						-2,
						1.2,
						1.5
					],
					intensity: 1,
					color: "#a855f7"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("spotLight", {
					position: [
						0,
						2.8,
						2.2
					],
					angle: .4,
					penumbra: .7,
					intensity: 1.1,
					color: "#c4b5fd"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_react.Suspense, {
					fallback: null,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PresentationControls, {
							global: false,
							cursor: true,
							snap: true,
							speed: 1.1,
							zoom: 1,
							polar: [-.2, .3],
							azimuth: [-.65, .65],
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Float, {
								speed: mood === "sleepy" ? .7 : 1.4,
								rotationIntensity: .12,
								floatIntensity: mood === "alert" ? 1 : .55,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Bounds, {
									fit: true,
									clip: true,
									observe: true,
									margin: 1.25,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RinjaModel, { mood })
								})
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ContactShadows, {
							position: [
								0,
								-.95,
								0
							],
							opacity: .4,
							scale: 3.4,
							blur: 2.8,
							far: 2.8,
							color: "#241035"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Environment, {
							preset: "city",
							environmentIntensity: .28
						})
					]
				})
			]
		})
	});
}
//#endregion
export { RinjaCanvas as default };
