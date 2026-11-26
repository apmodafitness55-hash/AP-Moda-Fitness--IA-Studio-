/**
 * Push & Notification Click Handlers imported by VitePWA Workbox Service Worker
 */

self.addEventListener('push', (event) => {
  let data = {
    title: '🚨 NOVO PEDIDO RECEBIDO! - AP2 Moda Fitness',
    body: 'Uma nova venda acabou de ser realizada na loja virtual! Toque para ver os detalhes e preparar o envio.'
  };

  try {
    if (event.data) {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    }
  } catch (e) {
    if (event.data) {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: '/pwa-192x192.png',
    badge: '/favicon-96x96.png',
    vibrate: [300, 100, 300, 100, 300],
    tag: data.tag || `order-${Date.now()}`,
    renotify: true,
    requireInteraction: true,
    data
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/painel');
      }
    })
  );
});
