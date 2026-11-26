// =====================================================================
// Service Worker — «посредник» между страницей и сетью.
// Работает в фоне и может отвечать на запросы страницы из своего кэша,
// поэтому сайт открывается даже без интернета.
// =====================================================================

const CACHE_NAME = 'kompas-v1';
const APP_FILES = ['/', '/index.html', '/style.css', '/js/app.js'];   // «оболочка» сайта

// 1. Установка: сразу кладём в кэш главные файлы сайта
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_FILES)));
});

// 2. Каждый запрос страницы проходит через эту функцию
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;           // кэшируем только получение данных

  event.respondWith(
    fetch(event.request)                                // сначала пробуем сеть
      .then((response) => {
        const copy = response.clone();                  // ответ можно прочитать только один раз — делаем копию
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;                                // отдаём свежий ответ странице
      })
      .catch(() => caches.match(event.request))         // сети нет — отдаём сохранённую копию
  );
});
