/**
 * Service Worker - AP Moda Fitness PWA
 * Handles background push notifications, badge updates, and native mobile/desktop alerts
 */

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Escuta eventos de Push do sistema operacional
self.addEventListener('push', (event) => {
  let data = { 
    title: '🚨 NOVO PEDIDO RECEBIDO! - AP Moda Fitness', 
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
    icon: '/favicon-192x192.png',
    badge: '/favicon-96x96.png',
    vibrate: [300, 100, 300, 100, 300],
    tag: data.tag || `order-${Date.now()}`,
    renotify: true,
    requireInteraction: true,
    data: data
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Ação de clique na notificação: abre ou foca no app da AP Moda Fitness
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
        return self.clients.openWindow('/');
      }
    })
  );
});
