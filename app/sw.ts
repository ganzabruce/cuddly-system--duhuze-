/// <reference lib="webworker" />
import type {} from "@serwist/next/typings";
import { defaultCache } from "@serwist/next/worker";
import { CacheFirst, NetworkFirst, StaleWhileRevalidate, Serwist } from "serwist";

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: Array<{ url: string; revision: string | null }>;
};

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    {
      matcher: ({ url }) => url.pathname.startsWith("/_next/static/"),
      handler: new CacheFirst({ cacheName: "next-static" }),
    },
    {
      matcher: ({ url }) =>
        url.pathname.startsWith("/logos/") || url.pathname.startsWith("/images/"),
      handler: new CacheFirst({ cacheName: "static-images" }),
    },
    {
      matcher: ({ url }) =>
        url.pathname.startsWith("/_next/") && !url.pathname.startsWith("/_next/static/"),
      handler: new StaleWhileRevalidate({ cacheName: "next-chunks" }),
    },
    {
      matcher: ({ request }) => request.mode === "navigate",
      handler: new NetworkFirst({ cacheName: "pages", networkTimeoutSeconds: 5 }),
    },
    ...defaultCache,
  ],
  fallbacks: {
    entries: [
      {
        url: "/offline",
        matcher({ request }) {
          return request.mode === "navigate";
        },
      },
    ],
  },
});

serwist.addEventListeners();

self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json();
    event.waitUntil(
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: data.icon || "/logos/icon-192.png",
        badge: "/logos/icon-192.png",
        vibrate: [100, 50, 100],
        data: { dateOfArrival: Date.now(), primaryKey: "2" },
      } as NotificationOptions)
    );
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow(self.location.origin + "/app"));
});
