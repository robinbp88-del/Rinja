import { m as createFileRoute, p as lazyRouteComponent } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as requireAuth } from "./requireAuth-V1ujToPv.mjs";
import { n as object, r as string } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/add-CnRB3I2m.js
var $$splitComponentImporter = () => import("./add-DQBlR5Id.mjs");
var searchSchema = object({ url: string().optional() });
var Route = createFileRoute("/add")({
	beforeLoad: requireAuth,
	validateSearch: (s) => searchSchema.parse(s),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
