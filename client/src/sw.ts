/// <reference lib="webworker" />
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";

declare let self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

type PushData = {
  title?: string;
  body?: string;
  url?: string;
  tag?: string;
};

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data: PushData = {};
  try {
    data = event.data.json() as PushData;
  } catch {
    data = { title: "GNOSIS AI", body: event.data.text() };
  }

  event.waitUntil(
    self.registration.showNotification(data.title || "GNOSIS AI", {
      body: data.body || "",
      icon: "/icons/icon-192.png",
      badge: "/icons/badge-72.png",
      tag: data.tag,
      data: { url: data.url || "/dashboard" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = new URL(
    (event.notification.data?.url as string) || "/dashboard",
    self.location.origin
  ).href;

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then(async (windowClients) => {
        for (const client of windowClients) {
          if (!client.url.startsWith(self.location.origin)) continue;

          if ("navigate" in client) {
            const navigated = await (client as WindowClient & {
              navigate?: (url: string) => Promise<WindowClient>;
            }).navigate?.(targetUrl);
            if (navigated && "focus" in navigated) {
              return navigated.focus();
            }
          }

          if ("focus" in client) {
            await client.focus();
            client.postMessage({ type: "NAVIGATE", url: targetUrl });
            return;
          }
        }

        return self.clients.openWindow(targetUrl);
      })
  );
});
