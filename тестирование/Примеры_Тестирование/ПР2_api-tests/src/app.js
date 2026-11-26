// Модуль веб-приложения: маршрутизация и обработка HTTP-запросов
const http = require('http');
const storage = require('./storage');

function sendJson(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}

function readBody(req) {
  return new Promise(resolve => {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve(null);          // некорректный JSON
      }
    });
  });
}

async function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const parts = url.pathname.split('/').filter(Boolean);   // ['api', 'tasks', '3']

  if (parts[0] !== 'api' || parts[1] !== 'tasks') {
    return sendJson(res, 404, { error: 'Ресурс не найден' });
  }

  // ----- /api/tasks -----
  if (parts.length === 2) {
    if (req.method === 'GET') {
      return sendJson(res, 200, storage.getAll());
    }
    if (req.method === 'POST') {
      const body = await readBody(req);
      if (body === null) return sendJson(res, 400, { error: 'Некорректный JSON' });
      const title = typeof body.title === 'string' ? body.title.trim() : '';
      if (!title) return sendJson(res, 400, { error: 'Поле title обязательно' });
      return sendJson(res, 201, storage.add(title));
    }
    res.writeHead(405, { 'Allow': 'GET, POST', 'Content-Type': 'application/json; charset=utf-8' });
    return res.end(JSON.stringify({ error: 'Метод не поддерживается' }));
  }

  // ----- /api/tasks/:id -----
  const id = Number(parts[2]);
  if (!Number.isInteger(id) || id <= 0) {
    return sendJson(res, 400, { error: 'Некорректный идентификатор' });
  }

  if (req.method === 'GET') {
    const task = storage.getById(id);
    return task ? sendJson(res, 200, task) : sendJson(res, 404, { error: 'Задача не найдена' });
  }

  if (req.method === 'PATCH') {
    const body = await readBody(req);
    if (body === null) return sendJson(res, 400, { error: 'Некорректный JSON' });
    const task = storage.update(id, body);
    return task ? sendJson(res, 200, task) : sendJson(res, 404, { error: 'Задача не найдена' });
  }

  if (req.method === 'DELETE') {
    if (!storage.remove(id)) return sendJson(res, 404, { error: 'Задача не найдена' });
    res.writeHead(204);
    return res.end();
  }

  res.writeHead(405, { 'Allow': 'GET, PATCH, DELETE', 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify({ error: 'Метод не поддерживается' }));
}

function createServer() {
  return http.createServer(handler);
}

module.exports = { createServer, handler };
