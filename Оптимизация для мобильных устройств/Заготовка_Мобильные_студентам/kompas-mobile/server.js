// =====================================================================
// Сервер «Компас для телефона»
// Запуск: node server.js        Остановка: Ctrl + C        Адрес: http://localhost:3000
// =====================================================================

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const PUBLIC = path.join(__dirname, 'public');
const TOURS = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'tours.json'), 'utf8'));

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);

  // ---- API: список туров. Сервер нарочно «думает» 1,5 секунды,
  //      как будто запрос идёт через медленный мобильный интернет ----
  if (urlPath === '/api/tours') {
    setTimeout(() => {
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify(TOURS));
    }, 1500);
    return;
  }

  // ---- Файлы сайта из папки public ----
  const filePath = path.join(PUBLIC, urlPath === '/' ? 'index.html' : urlPath);
  if (!filePath.startsWith(PUBLIC)) {
    res.writeHead(403);
    return res.end();
  }
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Файл не найден');
    }
    // Кэширование в браузере (шаг 7): пока браузеру запрещено хранить копии файлов
    const cacheControl = 'no-store';
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(filePath)] || 'application/octet-stream',
      'Cache-Control': cacheControl,
    });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log('Сервер запущен: http://localhost:' + PORT);
  console.log('Остановить: Ctrl + C');
});
