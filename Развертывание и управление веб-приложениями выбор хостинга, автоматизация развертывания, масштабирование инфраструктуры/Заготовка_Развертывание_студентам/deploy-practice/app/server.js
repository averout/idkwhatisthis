// Учебное веб-приложение турбюро «Компас» для отработки развёртывания и масштабирования
const http = require('http');
const { version } = require('./package.json');

const PORT = Number(process.env.PORT) || 3000;
const START = Date.now();
let visits = 0;                       // счётчик в памяти процесса (понадобится в занятии 2)

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

// «Тяжёлая» операция: расчёт стоимости туров — нагружает процессор на ~40 мс
function heavyWork() {
  let x = 0;
  const until = Date.now() + 40;
  while (Date.now() < until) x += Math.sqrt(x + 1);
  return Math.round(x);
}

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    return sendJson(res, 200, { status: 'ok', version, port: PORT, uptimeSec: Math.round((Date.now() - START) / 1000) });
  }
  if (req.url === '/api/heavy') {
    return sendJson(res, 200, { result: heavyWork(), port: PORT });
  }
  if (req.url === '/api/visits') {
    visits++;
    return sendJson(res, 200, { visits, port: PORT });
  }
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(`<!DOCTYPE html><html lang="ru"><head><meta charset="utf-8"><title>Компас</title></head>
<body style="font-family:Segoe UI,Arial,sans-serif;max-width:640px;margin:40px auto">
<h1>Турбюро «Компас»</h1>
<p>Версия приложения: <strong>${version}</strong></p>
<p>Экземпляр на порту: <strong>${PORT}</strong></p>
</body></html>`);
  }
  sendJson(res, 404, { error: 'not found' });
});

server.listen(PORT, () => console.log(`Компас ${version} запущен на порту ${PORT}`));

// Корректное завершение: дождаться окончания текущих запросов
process.on('SIGTERM', () => server.close(() => process.exit(0)));
