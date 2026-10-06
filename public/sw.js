self.addEventListener('install', function() {
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    Promise.all([
      self.registration.unregister(),
      typeof caches !== 'undefined'
        ? caches.keys().then(function(names) {
            return Promise.all(
              names.map(function(name) {
                return caches.delete(name);
              })
            );
          })
        : Promise.resolve(),
    ])
  );
});