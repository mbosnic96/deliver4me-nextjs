const CACHE_NAME = 'app-cache-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/logo.png',
  '/manifest.json'
];

self.addEventListener('install', function(event) {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('All resources cached successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Cache installation failed:', error);
      })
  );
});

self.addEventListener('activate', function(event) {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker activated and ready to control clients');
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(event) {
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        if (response) {
          return response;
        }

        return fetch(event.request).then(function(response) {
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(function(cache) {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
      .catch(function(error) {
        console.error('Fetch failed; returning offline page:', error);
      })
  );
});

self.addEventListener('push', function(event) {
  if (!event.data) {
    console.log('Push event but no data');
    return;
  }

  let notificationData;
  try {
    notificationData = event.data.json();
  } catch (err) {
    console.error('Error parsing push data:', err);
    notificationData = {
      message: 'Imate novu obavijest',
      link: '/dashboard'
    };
  }

  let title = 'Nova obavijest!';
  let tag = notificationData._id || 'obavijest';
  let icon = '/logo.png';
  let badge = '/logo.png';
  
  if (notificationData.type === 'message') {
    title = `Nova poruka od ${notificationData.senderName || 'korisnika'}`;
    tag = `message-${notificationData.conversationId || notificationData._id}`;
  }

  const options = {
    body: notificationData.preview || notificationData.message,
    icon: icon,
    badge: badge,
    tag: tag,
    data: {
      url: notificationData.link || '/dashboard',
      _id: notificationData._id,
      type: notificationData.type,
      conversationId: notificationData.conversationId,
      senderName: notificationData.senderName,
      timestamp: new Date().toISOString()
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
    ],
    vibrate: [200, 100, 200],
    timestamp: Date.now()
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
      .then(() => {
        logToServer('Notification shown successfully', {
          title: title,
          notificationId: notificationData._id,
          type: notificationData.type
        });
      })
      .catch(error => {
        console.error('Error showing notification:', error);
        logToServer('Error showing notification', {
          error: error.message,
          notificationData: notificationData
        });
      })
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  logToServer('Notification clicked', {
    action: event.action,
    notificationId: event.notification.data?._id,
    type: event.notification.data?.type,
    url: event.notification.data?.url
  });

  if (event.action === 'zatvori') {
    console.log('Notification dismissed');
    return;
  }

  let urlToOpen = event.notification.data?.url || '/dashboard';
  if (event.notification.data?.type === 'message') {
    const conversationId = event.notification.data.conversationId;
    if (conversationId) {
      const users = conversationId.split('-');
      const currentUser = event.notification.data._id;
      urlToOpen = `/messages?with=${users[0]}`; 
    } else {
      urlToOpen = '/messages';
    }
  }

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
        if ((clientUrl === targetUrl || 
             (clientUrl.includes('/messages') && targetUrl.includes('/messages'))) && 
            'focus' in client) {
          logToServer('Existing window focused', { 
            clientUrl: clientUrl, 
            targetUrl: targetUrl 
          });
          
          if (clientUrl === targetUrl) {
            return client.focus();
          }     
          return client.navigate(targetUrl).then(() => client.focus());
        }
      }
      
      if (clients.openWindow) {
        logToServer('Opening new window', { url: targetUrl });
        return clients.openWindow(targetUrl);
      }
    }).catch(error => {
      console.error('Error in notificationclick:', error);
      logToServer('Error in notificationclick', { error: error.message });
    })
  );
});

self.addEventListener('sync', function(event) {
  if (event.tag === 'background-sync') {
    console.log('Background sync triggered');
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    console.log('Performing background sync...');
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Helper function for logging
function logToServer(message, data) {
  if (process.env.NODE_ENV !== 'production') {
    console.log('SW Log:', message, data);
  }
  
  const shouldLogToServer = false; 
  
  if (shouldLogToServer) {
    fetch('/api/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: message,
        data: data,
        timestamp: new Date().toISOString(),
        type: 'service-worker',
        userAgent: navigator.userAgent
      })
    }).catch(error => {
      console.log('Server log failed:', error);
    });
  }
}

self.addEventListener('message', function(event) {
  console.log('Service Worker received message:', event.data);
  
  switch (event.data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
    case 'GET_VERSION':
      event.ports[0].postMessage({ version: CACHE_NAME });
      break;
    case 'CACHE_URLS':
      event.waitUntil(
        caches.open(CACHE_NAME)
          .then(function(cache) {
            return cache.addAll(event.data.urls);
          })
      );
      break;
  }
});

self.addEventListener('error', function(event) {
  console.error('Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', function(event) {
  console.error('Service Worker unhandled rejection:', event.reason);
});