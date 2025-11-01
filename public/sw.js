const CACHE_NAME = 'app-cache-v1';
const urlsToCache = [
  '/',
  '/logo.png',
  '/manifest.json'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        return Promise.allSettled(
          urlsToCache.map(url => 
            cache.add(url).catch(err => {
              console.warn(`Failed to cache ${url}:`, err);
              return null;
            })
          )
        );
      })
      .then(() => {
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Cache installation failed:', error);
      })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(event) {
  // Skip non-GET requests and external URLs
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip API routes and SSE streams
  if (event.request.url.includes('/api/')) {
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
        console.error('Fetch failed:', error);
      })
  );
});

self.addEventListener('push', function(event) {
  if (!event.data) {
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
    timestamp: Date.now(),
    requireInteraction: false
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
      .then(() => {
        console.log('Notification shown successfully', {
          title: title,
          notificationId: notificationData._id,
          type: notificationData.type
        });
      })
      .catch(error => {
        console.error('Error showing notification:', error);
      })
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  

  if (event.action === 'zatvori') {
    return;
  }

  let urlToOpen = event.notification.data?.url || '/dashboard';
  
  // Handle message notifications
  if (event.notification.data?.type === 'message') {
    const conversationId = event.notification.data.conversationId;
    if (conversationId) {
      const users = conversationId.split('-');
      urlToOpen = `/messages?with=${users[0]}`; 
    } else {
      urlToOpen = '/messages';
    }
  }

  // Ensure full URL
  if (urlToOpen.startsWith('/')) {
    urlToOpen = self.location.origin + urlToOpen;
  }

  event.waitUntil(
    clients.matchAll({ 
      type: 'window',
      includeUncontrolled: true 
    }).then(function(clientList) {
      const targetUrl = new URL(urlToOpen, self.location.origin).href;
      
      // Try to focus existing window
      for (let client of clientList) {
        const clientUrl = new URL(client.url, self.location.origin).href;
        if ((clientUrl === targetUrl || 
             (clientUrl.includes('/messages') && targetUrl.includes('/messages'))) && 
            'focus' in client) {
          console.log('Existing window focused', { 
            clientUrl: clientUrl, 
            targetUrl: targetUrl 
          });
          
          if (clientUrl === targetUrl) {
            return client.focus();
          }     
          return client.navigate(targetUrl).then(() => client.focus());
        }
      }
      
      // Open new window if no matching window found
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    }).catch(error => {
      console.error('Error in notificationclick:', error);
    })
  );
});

self.addEventListener('sync', function(event) {
  if (event.tag === 'background-sync') {
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

self.addEventListener('message', function(event) {
  
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