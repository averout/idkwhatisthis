// Балансировщик нагрузки: node scale/balancer.js 3001 3002 3003
// Принимает запросы на порту 8080 и по очереди (round-robin) передаёт их исправным экземплярам
const http = require('http');

const PORT = 8080;
const targets = (process.argv.slice(2).length ? process.argv.slice(2) : ['3001', '3002', '3003'])
  .map(port => ({ port: Number(port), healthy: true, served: 0 }));
let next = 0;

// TODO (задание 9): проверка здоровья экземпляров каждые 2 секунды.
// Для каждого target запросить http://localhost:<port>/health с тайм-аутом 1 с,
// выставить target.healthy = true или false и вывести сообщение при смене состояния.
async function checkHealth() {
}
setInterval(checkHealth, 2000);
checkHealth();

// TODO (задание 7): выбор экземпляра по кругу (round-robin).
// Вернуть следующий исправный target после выбранного в прошлый раз; если исправных нет — null.
function pickTarget() {
  return targets[0];
}

const server = http.createServer((req, res) => {
  if (req.url === '/balancer/stats') {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify(targets));
  }

  const target = pickTarget();
  if (!target) {
    res.writeHead(503, { 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({ error: 'Нет доступных экземпляров приложения' }));
  }

  const proxyReq = http.request({ host: 'localhost', port: target.port, path: req.url, method: req.method, headers: req.headers }, proxyRes => {
    target.served++;
    res.writeHead(proxyRes.statusCode, { ...proxyRes.headers, 'X-Instance': String(target.port) });
    proxyRes.pipe(res);
  });
  proxyReq.on('error', () => {
    if (target.healthy) console.log(`экземпляр ${target.port} не ответил на запрос — исключён из балансировки`);
    target.healthy = false;                     // экземпляр упал между проверками
    res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ error: 'Экземпляр приложения не ответил' }));
  });
  req.pipe(proxyReq);
});

server.listen(PORT, () => console.log(`Балансировщик: http://localhost:${PORT} → порты ${targets.map(t => t.port).join(', ')}`));
