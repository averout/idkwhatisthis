// Сценарий автоматического развёртывания с проверкой и откатом
// Запуск: node deploy/deploy.js
const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const SOURCE = path.join(ROOT, 'app');                    // «репозиторий» с кодом
const SERVER = path.join(ROOT, 'server-sim');             // «сервер»: папка с релизами
const RELEASES = path.join(SERVER, 'releases');
const STATE_FILE = path.join(SERVER, 'current.json');     // какой релиз сейчас работает
const LOG_FILE = path.join(SERVER, 'deploy.log');
const PORT = 3000;
const KEEP_RELEASES = 3;

const sleep = ms => new Promise(r => setTimeout(r, ms));

function log(message) {
  const line = `${new Date().toISOString()}  ${message}`;
  console.log(line);
  fs.appendFileSync(LOG_FILE, line + '\n');
}

function readState() {
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } catch { return null; }
}

// Атомарная запись: сначала во временный файл, затем переименование
function writeState(state) {
  fs.writeFileSync(STATE_FILE + '.tmp', JSON.stringify(state, null, 2));
  fs.renameSync(STATE_FILE + '.tmp', STATE_FILE);
}

function stop(pid) {
  if (!pid) return;
  try { process.kill(pid); log(`остановлен процесс ${pid}`); } catch { /* процесс уже не работает */ }
}

function start(release) {
  const dir = path.join(RELEASES, release);
  const out = fs.openSync(path.join(dir, 'app.log'), 'a');
  const child = spawn(process.execPath, ['server.js'], {
    cwd: dir,
    env: { ...process.env, PORT: String(PORT), NODE_ENV: 'production' },
    detached: true,
    stdio: ['ignore', out, out],
  });
  child.unref();                                           // приложение продолжит работу после выхода сценария
  log(`запущен релиз ${release}, процесс ${child.pid}`);
  return child.pid;
}

// TODO (шаг 4): проверка здоровья.
// Опрашивать http://localhost:PORT/health раз в 300 мс не дольше timeoutMs.
// Вернуть true, если ответ 200 и поле version совпадает с expectedVersion.
async function healthy(expectedVersion, timeoutMs = 5000) {
  return false;
}

// TODO (задание 4): удалить старые релизы, оставив KEEP_RELEASES последних.
// Текущий и предыдущий релизы удалять нельзя.
function cleanup() {
}

async function main() {
  fs.mkdirSync(RELEASES, { recursive: true });
  const { version } = JSON.parse(fs.readFileSync(path.join(SOURCE, 'package.json'), 'utf8'));
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15);
  const release = `${stamp}-v${version}`;
  log(`===== развёртывание версии ${version} =====`);

  // TODO шаг 1. Запустить тесты: spawnSync(process.execPath, ['--test'], { cwd: SOURCE, encoding: 'utf8' }).
  //             Если код завершения не 0 — записать в журнал и завершить сценарий: process.exit(1).

  // TODO шаг 2. Скопировать SOURCE в папку RELEASES/release (fs.cpSync), папку test не копировать.

  // TODO шаг 3. Прочитать состояние (readState), остановить работающую версию (stop),
  //             подождать 500 мс (await sleep(500)) и запустить новый релиз (start).

  // TODO шаг 4. Если await healthy(version) — записать новое состояние (writeState) с полями
  //             release, previous, pid, version, deployedAt и выполнить cleanup().

  // TODO шаг 5. Иначе — откат: остановить новый процесс, запустить предыдущий релиз,
  //             проверить его здоровье и восстановить состояние. Завершить с кодом 1.
}

main();
