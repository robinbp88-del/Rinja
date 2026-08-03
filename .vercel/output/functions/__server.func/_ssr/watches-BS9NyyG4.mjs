import { t as supabase } from "./supabase-Be2z7Atz.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/watches-BS9NyyG4.js
async function requireUser() {
	const { data: { user }, error } = await supabase.auth.getUser();
	if (error) throw error;
	if (!user) throw new Error("You must be signed in.");
	return user;
}
async function createWatch(input) {
	const user = await requireUser();
	const { data, error } = await supabase.from("watches").insert({
		user_id: user.id,
		url: input.url,
		host: input.host,
		title: input.title,
		label: input.label,
		current_value: input.currentValue,
		selector: input.selector,
		element_text: input.elementText,
		element_tag: input.elementTag,
		element_html: input.elementHtml,
		mode: input.mode,
		frequency: input.frequency,
		notify: input.notify ?? true,
		paused: false
	}).select().single();
	if (error) throw error;
	return data;
}
async function getWatches() {
	const user = await requireUser();
	const { data, error } = await supabase.from("watches").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
	if (error) throw error;
	return data ?? [];
}
async function getWatchById(id) {
	const user = await requireUser();
	const { data, error } = await supabase.from("watches").select("*").eq("id", id).eq("user_id", user.id).maybeSingle();
	if (error) {
		console.error("Failed to load watch:", error);
		throw error;
	}
	return data;
}
async function updateWatchSelection(id, input) {
	const user = await requireUser();
	const { data, error } = await supabase.from("watches").update({
		label: input.label,
		current_value: input.currentValue,
		selector: input.selector,
		element_text: input.elementText,
		element_tag: input.elementTag,
		element_html: input.elementHtml,
		mode: input.mode,
		...typeof input.notify === "boolean" ? { notify: input.notify } : {},
		updated_at: (/* @__PURE__ */ new Date()).toISOString()
	}).eq("id", id).eq("user_id", user.id).select().single();
	if (error) throw error;
	return data;
}
async function setWatchNotify(id, notify) {
	const user = await requireUser();
	const { data, error } = await supabase.from("watches").update({
		notify,
		updated_at: (/* @__PURE__ */ new Date()).toISOString()
	}).eq("id", id).eq("user_id", user.id).select().single();
	if (error) throw error;
	return data;
}
async function setWatchPaused(id, paused) {
	const user = await requireUser();
	const { data, error } = await supabase.from("watches").update({
		paused,
		updated_at: (/* @__PURE__ */ new Date()).toISOString()
	}).eq("id", id).eq("user_id", user.id).select().single();
	if (error) throw error;
	return data;
}
async function deleteWatch(id) {
	const user = await requireUser();
	const { error } = await supabase.from("watches").delete().eq("id", id).eq("user_id", user.id);
	if (error) throw error;
}
//#endregion
export { setWatchNotify as a, getWatches as i, deleteWatch as n, setWatchPaused as o, getWatchById as r, updateWatchSelection as s, createWatch as t };
