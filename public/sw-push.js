// Custom service worker — handles push notifications on top of Vite PWA's generated SW
// This file is registered via vite-plugin-pwa's `strategies: 'injectManifest'` or as additional SW code

self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: "LiveWithMS 🧡", body: event.data.text(), url: "/today" };
  }

  const options = {
    body: data.body || "Time to log your symptoms!",
    icon: data.icon || "/pwa-192.png",
    badge: data.badge || "/pwa-192.png",
    tag: "daily-reminder",
    renotify: true,
    requireInteraction: false,
    data: { url: data.url || "/today" },
    actions: [
      { action: "log", title: "Log now 📋" },
      { action: "dismiss", title: "Later" },
    ],
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "LiveWithMS 🧡", options)
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const url = event.notification.data?.url || "/today";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
