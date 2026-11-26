// =====================================================================
// Сервер «Компас» с учебной системой веб-аналитики
// Запуск: node server.js        Остановка: Ctrl + C        Адрес: http://localhost:3000
// =====================================================================

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const PUBLIC = path.join(__dirname, 'public');
const EVENTS_FILE = path.join(__dirname, 'data', 'events.jsonl');   // журнал событий: одна строка — одно событие

fs.mkdirSync(path.dirname(EVENTS_FILE), { recursive: true });

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
};

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

// ---- Приём события от счётчика: POST /api/collect ----
function collect(req, res) {
  let body = '';
  req.on('data', (chunk) => {
    body += chunk;
    if (body.length > 10000) req.destroy();         // событие не может быть большим
  });
  req.on('end', () => {
    let event;
    try { event = JSON.parse(body); } catch { return sendJson(res, 400, { error: 'Неверный JSON' }); }
    if (!event.type || !event.visitorId) return sendJson(res, 400, { error: 'Нет type или visitorId' });
    event.time = new Date().toISOString();          // время ставит сервер, а не браузер
    fs.appendFile(EVENTS_FILE, JSON.stringify(event) + '\n', () => {});
    console.log('событие:', event.type, event.page || '', event.tourId || '');
    res.writeHead(204);                              // 204 — «принято, ответа нет»
    res.end();
  });
}

// ---- Выдача всех событий для отчёта: GET /api/events ----
function events(req, res) {
  if (!fs.existsSync(EVENTS_FILE)) return sendJson(res, 200, []);
  const lines = fs.readFileSync(EVENTS_FILE, 'utf8').split('\n').filter(Boolean);
  sendJson(res, 200, lines.map((line) => JSON.parse(line)));
}

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (req.method === 'POST' && urlPath === '/api/collect') return collect(req, res);
  if (req.method === 'GET' && urlPath === '/api/events') return events(req, res);

  const filePath = path.join(PUBLIC, urlPath === '/' ? 'index.html' : urlPath);
  if (!filePath.startsWith(PUBLIC)) { res.writeHead(403); return res.end(); }
  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('Файл не найден'); }
    res.writeHead(200, { 'Content-Type': TYPES[path.extname(filePath)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log('Сервер запущен: http://localhost:' + PORT);
  console.log('Отчёт по аналитике: http://localhost:' + PORT + '/report.html');
  console.log('Остановить: Ctrl + C');
});
