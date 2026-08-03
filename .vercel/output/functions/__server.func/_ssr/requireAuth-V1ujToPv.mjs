import { j as redirect } from "../_libs/@tanstack/react-router+[...].mjs";
import { t as supabase } from "./supabase-Be2z7Atz.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/requireAuth-V1ujToPv.js
/** Redirect unauthenticated users to welcome. Use in route beforeLoad. */
async function requireAuth() {
	const { data: { session } } = await supabase.auth.getSession();
	if (!session) throw redirect({ to: "/welcome" });
	return session;
}
//#endregion
export { requireAuth as t };
