// Запуск нескольких экземпляров приложения: node scale/cluster.js 3
const path = require('path');
const { spawn } = require('child_process');

const COUNT = Number(process.argv[2]) || 3;
const FIRST_PORT = 3001;
const APP = path.join(__dirname, '..', 'app', 'server.js');

const children = [];
for (let i = 0; i < COUNT; i++) {
  const port = FIRST_PORT + i;
  const child = spawn(process.execPath, [APP], { env: { ...process.env, PORT: String(port) }, stdio: 'inherit' });
  children.push(child);
}
console.log(`Запущено экземпляров: ${COUNT} (порты ${FIRST_PORT}–${FIRST_PORT + COUNT - 1}). Остановка — Ctrl+C`);

process.on('SIGINT', () => { children.forEach(c => c.kill()); process.exit(0); });
