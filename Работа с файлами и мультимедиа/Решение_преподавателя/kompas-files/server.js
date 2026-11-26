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
const EXT = {                                  // какие типы принимаем и с каким расширением сохраняем
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
};
const MAX_SIZE = 30 * 1024 * 1024;             // не больше 30 МБ

// Шаг 9: определить настоящий тип файла по первым байтам
function realExt(data) {
  const text = (from, to) => data.toString('latin1', from, to);
  if (data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) return '.jpg';
  if (data[0] === 0x89 && text(1, 4) === 'PNG') return '.png';
  if (text(0, 4) === 'RIFF' && text(8, 12) === 'WEBP') return '.webp';
  if (text(4, 8) === 'ftyp') return '.mp4';
  if (data[0] === 0x1a && data[1] === 0x45 && data[2] === 0xdf && data[3] === 0xa3) return '.webm';
  return null;
}

function handleUpload(req, res) {
  // 1. Тип файла — из заголовка Content-Type
  const ext = EXT[req.headers['content-type']];
  if (!ext) {
    req.resume();                                // дочитываем запрос «вхолостую»
    return sendJson(res, 415, { error: 'Такой тип файла не принимается' });
  }
  // 2. Размер — из заголовка Content-Length, ещё до получения файла
  const size = Number(req.headers['content-length']);
  if (!size || size > MAX_SIZE) {
    req.resume();
    return sendJson(res, 413, { error: 'Файл больше 30 МБ' });
  }
  // 3. Получаем файл кусками и собираем в один
  const chunks = [];
  req.on('data', (chunk) => chunks.push(chunk));
  req.on('end', () => {
    const data = Buffer.concat(chunks);
    // Шаг 9: содержимое должно совпадать с заявленным типом
    if (realExt(data) !== ext) {
      return sendJson(res, 415, { error: 'Содержимое файла не совпадает с его типом' });
    }
    // 4. Имя придумывает сервер: случайное, чтобы файлы не перезаписывали друг друга
    const name = crypto.randomUUID() + ext;
    fs.writeFile(path.join(UPLOADS, name), data, (err) => {
      if (err) return sendJson(res, 500, { error: 'Не удалось сохранить файл' });
      sendJson(res, 201, { url: '/uploads/' + name, size: data.length });
    });
  });
}

// ---------------------------------------------------------------------
// Маршруты: какой код выполнять для какого адреса
// ---------------------------------------------------------------------
const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent(req.url.split('?')[0]);

  if (req.method === 'POST' && urlPath === '/api/upload') return handleUpload(req, res);
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
