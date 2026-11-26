const { test, describe, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('../src/app');
const storage = require('../src/storage');

let server;
let baseUrl;

before(async () => {
  server = createServer();
  await new Promise(resolve => server.listen(0, resolve));   // 0 — свободный порт
  baseUrl = `http://localhost:${server.address().port}`;
});

after(() => server.close());

beforeEach(() => storage.reset());   // каждый тест начинается с пустого хранилища

describe('GET /api/tasks', () => {
  test('возвращает 200 и пустой массив', async () => {
    const res = await fetch(`${baseUrl}/api/tasks`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers.get('content-type'), 'application/json; charset=utf-8');
    assert.deepStrictEqual(await res.json(), []);
  });

  test('возвращает ранее добавленные задачи', async () => {
    storage.add('Купить хлеб');
    const res = await fetch(`${baseUrl}/api/tasks`);
    const tasks = await res.json();
    assert.strictEqual(tasks.length, 1);
    assert.strictEqual(tasks[0].title, 'Купить хлеб');
  });
});

describe('POST /api/tasks', () => {
  test('создаёт задачу и возвращает 201', async () => {
    const res = await fetch(`${baseUrl}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Сдать отчёт' }),
    });
    assert.strictEqual(res.status, 201);
    const task = await res.json();
    assert.strictEqual(task.title, 'Сдать отчёт');
    assert.strictEqual(task.done, false);
    assert.ok(task.id > 0);
  });

  test('возвращает 400, если поле title пустое', async () => {
    const res = await fetch(`${baseUrl}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: '   ' }),
    });
    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.ok(body.error.includes('title'));
  });

  test('созданная задача появляется в списке (сквозной сценарий)', async () => {
    await fetch(`${baseUrl}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Задача 1' }),
    });
    const tasks = await (await fetch(`${baseUrl}/api/tasks`)).json();
    assert.strictEqual(tasks.length, 1);
    assert.strictEqual(tasks[0].title, 'Задача 1');
  });
});

describe('Работа с одной задачей', () => {
  test('GET /api/tasks/:id возвращает задачу', async () => {
    const created = storage.add('Проверить почту');
    const res = await fetch(`${baseUrl}/api/tasks/${created.id}`);
    assert.strictEqual(res.status, 200);
    assert.deepStrictEqual(await res.json(), created);
  });

  test('GET несуществующей задачи возвращает 404', async () => {
    const res = await fetch(`${baseUrl}/api/tasks/999`);
    assert.strictEqual(res.status, 404);
  });

  test('PATCH отмечает задачу выполненной', async () => {
    const created = storage.add('Полить цветы');
    const res = await fetch(`${baseUrl}/api/tasks/${created.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ done: true }),
    });
    assert.strictEqual(res.status, 200);
    assert.strictEqual((await res.json()).done, true);
  });

  test('DELETE удаляет задачу и возвращает 204', async () => {
    const created = storage.add('Временная задача');
    const res = await fetch(`${baseUrl}/api/tasks/${created.id}`, { method: 'DELETE' });
    assert.strictEqual(res.status, 204);
    assert.strictEqual(storage.getById(created.id), null);
  });

  test('некорректный идентификатор возвращает 400', async () => {
    const res = await fetch(`${baseUrl}/api/tasks/abc`);
    assert.strictEqual(res.status, 400);
  });
});

describe('Прочие случаи', () => {
  test('неизвестный адрес возвращает 404', async () => {
    const res = await fetch(`${baseUrl}/api/unknown`);
    assert.strictEqual(res.status, 404);
  });

  test('неподдерживаемый метод возвращает 405 и заголовок Allow', async () => {
    const res = await fetch(`${baseUrl}/api/tasks`, { method: 'PUT' });
    assert.strictEqual(res.status, 405);
    assert.strictEqual(res.headers.get('allow'), 'GET, POST');
  });
});
