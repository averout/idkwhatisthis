// =====================================================================
// Сервер сайта «Компас». ИЗМЕНЯТЬ НЕ НУЖНО.
// Запуск: node server.js        Остановка: Ctrl + C        Адрес: http://localhost:3000
//
// Сначала сервер спрашивает файл pages.js: «есть у тебя страница с таким адресом?»
// Если есть — отдаёт её. Если нет — ищет обычный файл в папке public.
// =====================================================================

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const PUBLIC = path.join(__dirname, 'public');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
};

// pages.js перечитывается при каждом запросе — после его изменения сервер перезапускать не нужно
function loadPages() {
  delete require.cache[require.resolve('./pages')];
  return require('./pages');
}

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);

  // Данные о турах для старого варианта сайта (public/js/app.js)
  if (urlPath === '/api/tours') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(fs.readFileSync(path.join(__dirname, 'data', 'tours.json')));
  }

  // 1. Страницы, которые собирает pages.js
  let page;
  try {
    page = loadPages().render(urlPath);
  } catch (err) {
    console.log('ОШИБКА в pages.js:', err.message);
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Ошибка в pages.js:\n\n' + err.stack);
  }
  if (page) {
    if (page.redirect) {                                        // постоянная переадресация на другой адрес
      res.writeHead(301, { Location: page.redirect });
      return res.end();
    }
    res.writeHead(page.status || 200, { 'Content-Type': page.type || 'text/html; charset=utf-8' });
    return res.end(page.body);
  }

  // 2. Обычные файлы из папки public
  const filePath = path.join(PUBLIC, urlPath === '/' ? 'index.html' : urlPath);
  if (!filePath.startsWith(PUBLIC)) { res.writeHead(403); return res.end(); }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end('<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><title>Страница не найдена</title></head><body><h1>404 — страница не найдена</h1><p><a href="/">На главную</a></p></body></html>');
    }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(filePath)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log('Сервер запущен: http://localhost:' + PORT);
  console.log('Проверка SEO (во втором терминале): node seo-check.js');
  console.log('Остановить: Ctrl + C');
});
