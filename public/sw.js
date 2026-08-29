// Service worker mínimo — existe só pra habilitar "Adicionar à tela inicial"
// no Chrome/Android. Não faz cache de nada de propósito: este é um sistema
// de dados em tempo real (OS, clientes, financeiro), então servir conteúdo
// antigo do cache seria pior do que não ter service worker nenhum.
self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  event.respondWith(fetch(event.request));
});
