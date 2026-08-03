//#region node_modules/.nitro/vite/services/ssr/assets/__23tanstack-start-server-fn-resolver-DYdVsXgR.js
var manifest = { "a6345930b5e805ea3a6ea018619298134b5fe1b7d3830cb11ef5819f4bdcfc2a": {
	functionName: "intelligentSearch_createServerFn_handler",
	importer: () => import("./_ssr/search.functions-DLyivlMH.mjs")
} };
async function getServerFnById(id, access) {
	const serverFnInfo = manifest[id];
	if (!serverFnInfo) throw new Error("Server function info not found for " + id);
	const fnModule = serverFnInfo.module ?? await serverFnInfo.importer();
	if (!fnModule) throw new Error("Server function module not resolved for " + id);
	const action = fnModule[serverFnInfo.functionName];
	if (!action) throw new Error("Server function module export not resolved for serverFn ID: " + id);
	return action;
}
//#endregion
export { getServerFnById as t };
