// =====================================================================
// Сервер «Компас: отзывы туристов»
// Запуск: node server.js        Остановка: Ctrl + C        Адрес: http://localhost:3000
// =====================================================================

const http = require('http');       // встроенный модуль: веб-сервер
const fs = require('fs');           // встроенный модуль: работа с файлами
const path = require('path');       // встроенный модуль: пути к файлам
const crypto = require('crypto');   // встроенный модуль: случайные имена файлов

const PORT = 3000;
const PUBLIC = path.join(__dirname, 'public');       // папка с сайтом
const UPLOADS = path.join(__dirname, 'uploads');     // папка для загруженных файлов
const REVIEWS_FILE = path.join(UPLOADS, 'reviews.json');

// Папку uploads создаём при запуске, если её ещё нет
fs.mkdirSync(UPLOADS, { recursive: true });

// Тип содержимого по расширению файла
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
};

// Отправить ответ в формате JSON
function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

// ---------------------------------------------------------------------
// Отдать файл браузеру. Поддерживает запрос части файла (Range) —
// без этого в видео не работает перемотка.
// ---------------------------------------------------------------------
function sendFile(req, res, filePath) {
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) return sendJson(res, 404, { error: 'Файл не найден' });
    const type = TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
    const range = /^bytes=(\d+)-(\d*)$/.exec(req.headers.range || '');
    if (range) {
      const start = Number(range[1]);
      const end = range[2] ? Math.min(Number(range[2]), stat.size - 1) : stat.size - 1;
      res.writeHead(206, {
        'Content-Type': type,
        'Content-Range': `bytes ${start}-${end}/${stat.size}`,
        'Content-Length': end - start + 1,
        'Accept-Ranges': 'bytes',
      });
      return fs.createReadStream(filePath, { start, end }).pipe(res);
    }
    res.writeHead(200, { 'Content-Type': type, 'Content-Length': stat.size, 'Accept-Ranges': 'bytes' });
    fs.createReadStream(filePath).pipe(res);
  });
}

// ---------------------------------------------------------------------
// Отзывы: хранятся в файле uploads/reviews.json
// ---------------------------------------------------------------------
function readReviews() {
  if (!fs.existsSync(REVIEWS_FILE)) return [];
  return JSON.parse(fs.readFileSync(REVIEWS_FILE, 'utf8'));
}

function handleNewReview(req, res) {
  let body = '';
  req.on('data', (chunk) => { body += chunk; });
  req.on('end', () => {
    let review;
    try { review = JSON.parse(body); } catch { return sendJson(res, 400, { error: 'Неверный JSON' }); }
    const name = String(review.name || '').trim().slice(0, 50);
    const text = String(review.text || '').trim().slice(0, 1000);
    const photos = Array.isArray(review.photos) ? review.photos.slice(0, 6) : [];
    const safe = (url) => typeof url === 'string' && /^\/uploads\/[\w-]+\.(jpg|png|webp|mp4|webm)$/.test(url);
    if (!name || !text) return sendJson(res, 400, { error: 'Укажите имя и текст отзыва' });
    if (!photos.every(safe) || (review.video && !safe(review.video))) return sendJson(res, 400, { error: 'Неверные адреса файлов' });
    const reviews = readReviews();
    const saved = { id: Date.now(), name, text, photos, video: review.video || null, date: new Date().toISOString() };
    reviews.unshift(saved);
    fs.writeFileSync(REVIEWS_FILE, JSON.stringify(reviews, null, 2));
    sendJson(res, 201, saved);
  });
}

// ===== Приём файла (шаг 6) =====
// Сюда вы вставите код на шаге 6

// ---------------------------------------------------------------------
// Маршруты: какой код выполнять для какого адреса
// ---------------------------------------------------------------------
const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);

  // (шаг 6) здесь будет маршрут приёма файла
  if (req.method === 'GET' && urlPath === '/api/reviews') return sendJson(res, 200, readReviews());
  if (req.method === 'POST' && urlPath === '/api/reviews') return handleNewReview(req, res);

  // Загруженные файлы — из папки uploads
  if (req.method === 'GET' && urlPath.startsWith('/uploads/')) {
    const filePath = path.join(UPLOADS, path.basename(urlPath));
    return sendFile(req, res, filePath);
  }
  // Всё остальное — файлы сайта из папки public
  const filePath = path.join(PUBLIC, urlPath === '/' ? 'index.html' : urlPath);
  if (!filePath.startsWith(PUBLIC)) return sendJson(res, 403, { error: 'Доступ запрещён' });
  sendFile(req, res, filePath);
});

server.listen(PORT, () => {
  console.log('Сервер запущен: http://localhost:' + PORT);
  console.log('Остановить: Ctrl + C');
});
