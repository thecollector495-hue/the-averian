
// This is the service worker file for handling push notifications.

// Listen for push events from the server
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {
    title: 'The Avarian',
    body: 'You have a new notification!',
  };

  const options = {
    body: data.body,
    icon: '/icon-192.png', // An icon for the notification
    badge: '/badge-72.png', // A small badge icon
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});


// Listen for messages from the client (e.g., to show a test notification)
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'show-test-notification') {
        const testNotificationData = {
            title: 'Test Notification',
            body: 'If you can see this, notifications are working!',
        };
        const options = {
            body: testNotificationData.body,
            icon: '/icon-192.png',
            badge: '/badge-72.png',
        };
        self.registration.showNotification(testNotificationData.title, options);
    }
});


// Optional: Listen for notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  // This example focuses the browser on the app's tab if it's already open.
  event.waitUntil(
    self.clients
      .matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      .then((clientList) => {
        if (clientList.length > 0) {
          let client = clientList[0];
          for (let i = 0; i < clientList.length; i++) {
            if (clientList[i].focused) {
              client = clientList[i];
            }
          }
          return client.focus();
        }
        return self.clients.openWindow('/');
      })
  );
});
