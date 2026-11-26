// =====================================================================
// Простой веб-сервер: отдаёт браузеру файлы из папки public.
// ЭТОТ ФАЙЛ ИЗМЕНЯТЬ НЕ НУЖНО.
//
// Запуск:      node server.js
// Остановка:   Ctrl + C в окне терминала
// Адрес сайта: http://localhost:3000
// =====================================================================

const http = require('http');   // встроенный модуль Node.js для веб-сервера
const fs = require('fs');       // встроенный модуль для чтения файлов
const path = require('path');   // встроенный модуль для работы с путями

const PORT = 3000;
const PUBLIC = path.join(__dirname, 'public');

// Тип содержимого по расширению файла — чтобы браузер понял, что ему прислали
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
  // Адрес из запроса: «/» означает главную страницу index.html
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/') urlPath = '/index.html';

  const filePath = path.join(PUBLIC, urlPath);
  // Защита: не выпускаем запросы за пределы папки public
  if (!filePath.startsWith(PUBLIC)) {
    res.writeHead(403);
    return res.end('Доступ запрещён');
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Файл не найден: ' + urlPath);
    }
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(filePath)] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log('Сервер запущен: http://localhost:' + PORT);
  console.log('Остановить: Ctrl + C');
});
