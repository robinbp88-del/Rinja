import { t as supabase } from "./supabase-Be2z7Atz.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/auth-DGmdbljS.js
async function signUp(email, password, name) {
	const { data, error } = await supabase.auth.signUp({
		email,
		password,
		options: { data: { name } }
	});
	if (error) throw error;
	return data;
}
async function signIn(email, password) {
	const { data, error } = await supabase.auth.signInWithPassword({
		email,
		password
	});
	if (error) throw error;
	return data;
}
async function signOut() {
	const { error } = await supabase.auth.signOut();
	if (error) throw error;
}
//#endregion
export { signOut as n, signUp as r, signIn as t };
