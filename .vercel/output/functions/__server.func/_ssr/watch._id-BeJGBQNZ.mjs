import { m as createFileRoute, p as lazyRouteComponent } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as requireAuth } from "./requireAuth-V1ujToPv.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/watch._id-BeJGBQNZ.js
var $$splitComponentImporter = () => import("./watch._id-BFrQpU5q.mjs");
var Route = createFileRoute("/watch/$id")({
	beforeLoad: requireAuth,
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
