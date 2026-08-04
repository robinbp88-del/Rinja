/* Rinja PWA service worker — shell cache + Web Push + app icon badge */
const CACHE = "rinja-shell-v3";
const PRECACHE = ["/", "/home", "/manifest.webmanifest", "/icons/icon-192.png"];

async function applyAppBadge(count) {
  const n = Math.max(0, Number(count) || 0);
  try {
    if (n > 0 && self.navigator?.setAppBadge) {
      await self.navigator.setAppBadge(n);
    } else if (n <= 0 && self.navigator?.clearAppBadge) {
      await self.navigator.clearAppBadge();
    }
  } catch {
    // Badging API unavailable on this device.
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("message", (event) => {
  const data = event.data;
  if (!data || typeof data !== "object") return;
  if (data.type === "SET_BADGE") {
    event.waitUntil(applyAppBadge(data.count));
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          void caches.open(CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches.match(request).then((hit) => hit || caches.match("/home")),
        ),
    );
  }
});

self.addEventListener("push", (event) => {
  let data = {
    title: "Rinja",
    body: "Something changed on a watch.",
    url: "/notifications",
    unread: 1,
  };

  try {
    if (event.data) {
      data = { ...data, ...event.data.json() };
    }
  } catch {
    try {
      const text = event.data?.text();
      if (text) data.body = text;
    } catch {
      // keep defaults
    }
  }

  const unread =
    typeof data.unread === "number" && data.unread > 0 ? data.unread : 1;

  event.waitUntil(
    Promise.all([
      self.registration.showNotification(data.title || "Rinja", {
        body: data.body,
        icon: "/icons/icon-192.png",
        badge: "/icons/icon-192.png",
        tag: "rinja-alert",
        renotify: true,
        data: { url: data.url || "/notifications" },
        vibrate: [120, 60, 120],
      }),
      applyAppBadge(unread),
    ]),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.url || "/notifications";
  const absolute = new URL(target, self.location.origin).href;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clients) => {
        for (const client of clients) {
          if ("focus" in client) {
            void client.navigate?.(absolute);
            return client.focus();
          }
        }
        if (self.clients.openWindow) {
          return self.clients.openWindow(absolute);
        }
        return undefined;
      }),
  );
});
