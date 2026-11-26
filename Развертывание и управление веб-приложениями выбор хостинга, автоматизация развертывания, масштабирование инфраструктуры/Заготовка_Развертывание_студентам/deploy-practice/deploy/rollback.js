// Ручной откат на предыдущий релиз: node deploy/rollback.js
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const SERVER = path.join(__dirname, '..', 'server-sim');
const RELEASES = path.join(SERVER, 'releases');
const STATE_FILE = path.join(SERVER, 'current.json');
const PORT = 3000;

const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
if (!state.previous) { console.log('Предыдущего релиза нет'); process.exit(1); }

try { process.kill(state.pid); } catch {}

setTimeout(async () => {
  const dir = path.join(RELEASES, state.previous);
  const out = fs.openSync(path.join(dir, 'app.log'), 'a');
  const child = spawn(process.execPath, ['server.js'], { cwd: dir, env: { ...process.env, PORT: String(PORT) }, detached: true, stdio: ['ignore', out, out] });
  child.unref();
  const { version } = JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8'));
  fs.writeFileSync(STATE_FILE, JSON.stringify({ release: state.previous, previous: state.release, pid: child.pid, version, deployedAt: new Date().toISOString() }, null, 2));
  fs.appendFileSync(path.join(SERVER, 'deploy.log'), `${new Date().toISOString()}  РУЧНОЙ ОТКАТ на ${state.previous}\n`);
  console.log(`Откат выполнен: работает ${state.previous}`);
}, 500);
