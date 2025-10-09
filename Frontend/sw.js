const CACHE_NAME = 'academic-app-v1.7';
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request).then(fetchResponse => {
      if(!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') return fetchResponse;
      const responseToCache = fetchResponse.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, responseToCache));
      return fetchResponse;
    }))
  );
});

self.addEventListener("push", (event) => {
  let data = { title: "Notificación", body: "" };

  try {
    data = event.data.json(); 
  } catch (err) {
    if(event.data) data.body = event.data.text();
  }

  self.registration.showNotification(data.title, {
    body: data.body,
    icon: "icon-192x192.png"
  });
});

