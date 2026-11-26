// Модуль хранения задач (имитация базы данных в оперативной памяти)

let tasks = [];
let nextId = 1;

function reset() {
  tasks = [];
  nextId = 1;
}

function getAll() {
  return tasks;
}

function getById(id) {
  return tasks.find(task => task.id === id) || null;
}

function add(title) {
  const task = { id: nextId++, title, done: false };
  tasks.push(task);
  return task;
}

function update(id, fields) {
  const task = getById(id);
  if (!task) return null;
  if (typeof fields.title === 'string') task.title = fields.title;
  if (typeof fields.done === 'boolean') task.done = fields.done;
  return task;
}

function remove(id) {
  const index = tasks.findIndex(task => task.id === id);
  if (index === -1) return false;
  tasks.splice(index, 1);
  return true;
}

module.exports = { reset, getAll, getById, add, update, remove };
