// Tickd Service Worker - Push Notification Scheduler

const NOTIF_CHECK_INTERVAL = 60 * 1000; // check every minute

self.addEventListener('install', e => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

// Listen for messages from the page
self.addEventListener('message', event => {
  const { type, time, enabled } = event.data || {};
  if (type === 'SCHEDULE_NOTIF') {
    if (enabled && time) {
      self.registration.active && startScheduler(time);
    }
  }
});

// Check periodically if it's time to notify
let schedulerInterval = null;

function startScheduler(notifTime) {
  if (schedulerInterval) clearInterval(schedulerInterval);
  schedulerInterval = setInterval(() => {
    const now = new Date();
    const [h, m] = notifTime.split(':').map(Number);
    if (now.getHours() === h && now.getMinutes() === m) {
      showHabitReminder();
    }
  }, NOTIF_CHECK_INTERVAL);
}

function showHabitReminder() {
  self.registration.showNotification('Tickd Reminder 🔥', {
    body: "Don't forget to check off your habits today!",
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'tickd-daily-reminder',
    renotify: false,
    requireInteraction: false,
    actions: [{ action: 'open', title: 'Open Tickd' }],
  });
}

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      if (clients.length > 0) return clients[0].focus();
      return self.clients.openWindow('/');
    })
  );
});

// Push event (for server-sent pushes if implemented later)
self.addEventListener('push', event => {
  const data = event.data?.json() || { title: 'Tickd', body: 'Time to check your habits!' };
  event.waitUntil(
    self.registration.showNotification(data.title || 'Tickd 🔥', {
      body: data.body,
      icon: '/favicon.ico',
      tag: 'tickd-push',
    })
  );
});
