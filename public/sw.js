const CACHE_NAME = 'fintech-casal-v3'; // Incrementa versão para invalidar cache antigo
const ASSETS_TO_CACHE = [
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          // Deleta caches de versões anteriores
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Limpando cache antigo', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Ignora chamadas de API, Supabase ou métodos não-GET
  if (
    event.request.method !== 'GET' ||
    event.request.url.includes('/api/') ||
    event.request.url.includes('supabase.co') ||
    event.request.url.includes('/_next/webpack-hmr') // Ignora HMR do Hot Reload
  ) {
    return;
  }

  // IMPORTANTE: Não fazemos cache de chunks JS/CSS do Next.js (_next/static)
  // em tempo de execução para evitar conflitos de HMR no desenvolvimento e
  // erros de "module factory not available".
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request)
        .then((response) => {
          // Faz cache dinâmico APENAS de assets estáticos duráveis (não-JS)
          if (
            response &&
            response.status === 200 &&
            (event.request.url.includes('/badges/') ||
              event.request.url.includes('/icons/'))
          ) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Fallback offline se o fetch falhar
          if (event.request.mode === 'navigate') {
            return new Response(
              '<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>Você está offline</title><style>body{background-color:#09090b;color:#f4f4f5;font-family:sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;text-align:center}h1{color:#eab308;margin-bottom:8px}button{background-color:#eab308;color:#09090b;border:none;padding:10px 20px;border-radius:6px;font-weight:bold;cursor:pointer;margin-top:16px}</style></head><body><h1>Conexão perdida</h1><p>Você está offline no momento. Conecte-se à internet para acessar o painel financeiro.</p><button onclick="window.location.reload()">Tentar novamente</button></body></html>',
              {
                headers: { 'Content-Type': 'text/html; charset=utf-8' }
              }
            );
          }
        });
    })
  );
});
