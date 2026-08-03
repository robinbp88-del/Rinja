import { createServiceClient } from "./supabase.server";

type PushPayload = {
  title: string;
  body: string;
  url?: string;
};

type SubRow = {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
};

export async function sendPushToUser(
  userId: string,
  payload: PushPayload,
): Promise<{ sent: number; removed: number }> {
  const publicKey = process.env.VITE_VAPID_PUBLIC_KEY?.trim();
  const privateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  const subject =
    process.env.VAPID_SUBJECT?.trim() || "mailto:alerts@rinja.app";

  if (!publicKey || !privateKey) {
    console.warn("Push skipped: VITE_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY missing");
    return { sent: 0, removed: 0 };
  }

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", userId);

  if (error) {
    console.warn("Push load failed:", error.message);
    return { sent: 0, removed: 0 };
  }

  const rows = (data ?? []) as SubRow[];
  if (rows.length === 0) return { sent: 0, removed: 0 };

  const webpush = (await import("web-push")).default;
  webpush.setVapidDetails(subject, publicKey, privateKey);

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? "/notifications",
  });

  let sent = 0;
  let removed = 0;

  await Promise.all(
    rows.map(async (row) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: row.endpoint,
            keys: { p256dh: row.p256dh, auth: row.auth },
          },
          body,
          { TTL: 60 * 60 },
        );
        sent += 1;
        await supabase
          .from("push_subscriptions")
          .update({ last_seen_at: new Date().toISOString() })
          .eq("id", row.id);
      } catch (err: unknown) {
        const status =
          err && typeof err === "object" && "statusCode" in err
            ? Number((err as { statusCode: number }).statusCode)
            : 0;
        if (status === 404 || status === 410) {
          await supabase.from("push_subscriptions").delete().eq("id", row.id);
          removed += 1;
        } else {
          console.warn("Push send failed:", err);
        }
      }
    }),
  );

  return { sent, removed };
}
