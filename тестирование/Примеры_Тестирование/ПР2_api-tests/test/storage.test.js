const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const storage = require('../src/storage');

beforeEach(() => storage.reset());

describe('Модуль storage (модульные тесты)', () => {
  test('add добавляет задачу и присваивает идентификатор', () => {
    const task = storage.add('Первая');
    assert.strictEqual(task.id, 1);
    assert.strictEqual(task.done, false);
    assert.strictEqual(storage.getAll().length, 1);
  });

  test('getById возвращает null для несуществующей задачи', () => {
    assert.strictEqual(storage.getById(42), null);
  });

  test('update изменяет только переданные поля', () => {
    const task = storage.add('Задача');
    storage.update(task.id, { done: true });
    assert.strictEqual(storage.getById(task.id).title, 'Задача');
    assert.strictEqual(storage.getById(task.id).done, true);
  });

  test('remove удаляет задачу и возвращает true', () => {
    const task = storage.add('Удалить меня');
    assert.strictEqual(storage.remove(task.id), true);
    assert.strictEqual(storage.getAll().length, 0);
    assert.strictEqual(storage.remove(task.id), false);
  });
});
