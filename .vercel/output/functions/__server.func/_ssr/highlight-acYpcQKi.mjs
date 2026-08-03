import { m as createFileRoute, p as lazyRouteComponent } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as requireAuth } from "./requireAuth-V1ujToPv.mjs";
import { n as object, r as string } from "../_libs/zod.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/highlight-acYpcQKi.js
var $$splitComponentImporter = () => import("./highlight-Coo25HVL.mjs");
var searchSchema = object({
	url: string().url(),
	selector: string().optional(),
	watchId: string().optional()
});
var Route = createFileRoute("/highlight")({
	beforeLoad: requireAuth,
	validateSearch: (search) => searchSchema.parse(search),
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
//#endregion
export { Route as t };
