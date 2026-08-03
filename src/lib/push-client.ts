import { requireUser } from "./auth";
import { supabase } from "./supabase";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export function pushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "Notification" in window &&
    "serviceWorker" in navigator &&
    "PushManager" in window
  );
}

export async function getPushPermission(): Promise<NotificationPermission | "unsupported"> {
  if (!pushSupported()) return "unsupported";
  return Notification.permission;
}

export async function enablePushNotifications(): Promise<{
  ok: boolean;
  error?: string;
}> {
  if (!pushSupported()) {
    return {
      ok: false,
      error:
        "Push needs an installed app (Add to Home Screen) on a supported browser.",
    };
  }

  const publicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY?.trim();
  if (!publicKey) {
    return { ok: false, error: "Push is not configured on the server yet." };
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { ok: false, error: "Notification permission was denied." };
  }

  const reg = await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  const subscription =
    existing ??
    (await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
    }));

  const json = subscription.toJSON();
  const endpoint = json.endpoint;
  const p256dh = json.keys?.p256dh;
  const auth = json.keys?.auth;
  if (!endpoint || !p256dh || !auth) {
    return { ok: false, error: "Could not read push subscription keys." };
  }

  const user = await requireUser();
  const { error } = await supabase.from("push_subscriptions").upsert(
    {
      user_id: user.id,
      endpoint,
      p256dh,
      auth,
      user_agent:
        typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 240) : null,
      last_seen_at: new Date().toISOString(),
    },
    { onConflict: "endpoint" },
  );

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function disablePushNotifications(): Promise<{
  ok: boolean;
  error?: string;
}> {
  if (!pushSupported()) return { ok: true };

  try {
    const reg = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.getSubscription();
    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();
      const user = await requireUser();
      await supabase
        .from("push_subscriptions")
        .delete()
        .eq("user_id", user.id)
        .eq("endpoint", endpoint);
    }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not disable push",
    };
  }

  return { ok: true };
}

export async function hasActivePushSubscription(): Promise<boolean> {
  if (!pushSupported()) return false;
  if (Notification.permission !== "granted") return false;
  try {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    return Boolean(sub);
  } catch {
    return false;
  }
}
