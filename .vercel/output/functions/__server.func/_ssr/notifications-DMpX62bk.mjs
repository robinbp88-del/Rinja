import { t as supabase } from "./supabase-Be2z7Atz.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/notifications-DMpX62bk.js
async function requireUser() {
	const { data: { user }, error } = await supabase.auth.getUser();
	if (error) throw error;
	if (!user) throw new Error("You must be signed in.");
	return user;
}
async function getNotifications() {
	const user = await requireUser();
	const { data, error } = await supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50);
	if (error) throw error;
	return data ?? [];
}
async function markAllNotificationsRead() {
	const user = await requireUser();
	const { error } = await supabase.from("notifications").update({ read: true }).eq("user_id", user.id).eq("read", false);
	if (error) throw error;
}
async function getUnreadNotificationCount() {
	const user = await requireUser();
	const { count, error } = await supabase.from("notifications").select("*", {
		count: "exact",
		head: true
	}).eq("user_id", user.id).eq("read", false);
	if (error) throw error;
	return count ?? 0;
}
async function createStartedNotification(input) {
	const user = await requireUser();
	const { error } = await supabase.from("notifications").insert({
		user_id: user.id,
		watch_id: input.watchId,
		title: "I'm watching",
		body: `👀 On it — ${input.label} · ${input.host}`,
		read: false
	});
	if (error) throw error;
}
//#endregion
export { markAllNotificationsRead as i, getNotifications as n, getUnreadNotificationCount as r, createStartedNotification as t };
