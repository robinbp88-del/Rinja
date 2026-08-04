/** Home-screen app icon badge.
 *
 * Desktop (Chrome/Edge installed PWA): Badging API (setAppBadge).
 * Android: OS badges from unread notifications — we keep a tagged
 * notification while unread > 0 so the home-screen icon shows a mark.
 * iOS installed PWA: Badging API when notification permission is granted.
 */

export function badgeSupported(): boolean {
  return typeof navigator !== "undefined" && typeof navigator.setAppBadge === "function";
}

async function syncAndroidNotificationBadge(count: number): Promise<void> {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator) || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  try {
    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.getNotifications({ tag: "rinja-unread-badge" });

    if (count <= 0) {
      for (const n of existing) n.close();
      return;
    }

    await reg.showNotification(count === 1 ? "Rinja · 1 alert" : `Rinja · ${count} alerts`, {
      tag: "rinja-unread-badge",
      body: "Open Alerts to take a look.",
      icon: "/icons/icon-192.png",
      badge: "/icons/icon-192.png",
      silent: true,
      data: { url: "/notifications" },
      // Chromium: keep badge quiet when count updates.
      renotify: false,
    } as NotificationOptions);
  } catch {
    // ignore
  }
}

export async function syncAppBadge(count: number): Promise<void> {
  const n = Math.max(0, Math.floor(count));

  if (badgeSupported()) {
    try {
      if (n > 0) {
        await navigator.setAppBadge(n);
      } else if (typeof navigator.clearAppBadge === "function") {
        await navigator.clearAppBadge();
      } else {
        await navigator.setAppBadge(0);
      }
    } catch {
      // Unsupported / permission quirks.
    }
  }

  // Keep SW badge state in sync where Badging API works in the worker.
  try {
    const reg = await navigator.serviceWorker?.ready;
    reg?.active?.postMessage({ type: "SET_BADGE", count: n });
  } catch {
    // ignore
  }

  // Android home-screen badge = unread notification indicator.
  await syncAndroidNotificationBadge(n);
}

export async function clearAppBadge(): Promise<void> {
  await syncAppBadge(0);
}
