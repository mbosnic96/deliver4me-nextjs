self.addEventListener('push', function(event) {
  if (!event.data) return;

  let notificationData;
  try {
    notificationData = event.data.json();
  } catch (err) {
    notificationData = {
      message: 'Imate novu obavijest',
      link: '/notifications'
    };
  }

  const options = {
    body: notificationData.message,
    icon: '/logo.png',
    badge: '/logo.png',
    tag: notificationData._id || 'obavijest',
    data: {
      url: notificationData.link || '/notifications',
      _id: notificationData._id
    },
    actions: [
      {
        action: 'pogledaj',
        title: 'Pogledaj'
      },
      {
        action: 'zatvori',
        title: 'Zatvori'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Nova obavijest!', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  if (event.action === 'zatvori') {
    return;
  }

  let urlToOpen = event.notification.data?.url || '/notifications';
  
  // Convert relative URL to absolute URL
  if (urlToOpen.startsWith('/')) {
    urlToOpen = self.location.origin + urlToOpen;
  }

  event.waitUntil(
    clients.matchAll({ 
      type: 'window',
      includeUncontrolled: true 
    }).then(function(clientList) {
      const targetUrl = new URL(urlToOpen, self.location.origin).href;
      
    
      for (let client of clientList) {
        const clientUrl = new URL(client.url, self.location.origin).href;
        if (clientUrl === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

self.addEventListener('install', function(event) {
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim());
});self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  if (event.action === 'zatvori') {
    logToServer('Notification closed', { action: 'zatvori', notificationId: event.notification.data?._id });
    return;
  }

  let urlToOpen = event.notification.data?.url || '/notifications';
  

  if (urlToOpen.startsWith('/')) {
    urlToOpen = self.location.origin + urlToOpen;
  }


  logToServer('Notification clicked', { 
    url: urlToOpen, 
    notificationId: event.notification.data?._id,
    action: event.action || 'pogledaj'
  });

  event.waitUntil(
    clients.matchAll({ 
      type: 'window',
      includeUncontrolled: true 
    }).then(function(clientList) {
      const targetUrl = new URL(urlToOpen, self.location.origin).href;
      
      for (let client of clientList) {
        const clientUrl = new URL(client.url, self.location.origin).href;
        if (clientUrl === targetUrl && 'focus' in client) {
          logToServer('Existing window focused', { url: urlToOpen });
          return client.focus();
        }
      }
      
      if (clients.openWindow) {
        logToServer('New window opened', { url: urlToOpen });
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

function logToServer(message, data) {
  fetch('/api/logs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: message,
      data: data,
      timestamp: new Date().toISOString(),
      type: 'service-worker'
    })
  }).catch(error => {
    console.log('Server log failed, using console:', message, data);
  });
  
  console.log('SW Log:', message, data);
}