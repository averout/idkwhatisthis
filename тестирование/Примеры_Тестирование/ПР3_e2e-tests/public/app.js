const form = document.getElementById('task-form');
const input = document.getElementById('task-input');
const list = document.getElementById('task-list');
const error = document.getElementById('error');
const counter = document.getElementById('counter');
const doneCounter = document.getElementById('done-counter');

function updateCounters() {
  const items = list.querySelectorAll('.list__item');
  const done = list.querySelectorAll('.list__item--done');
  counter.textContent = items.length;
  doneCounter.textContent = done.length;
}

function createItem(title) {
  const li = document.createElement('li');
  li.className = 'list__item';

  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  checkbox.className = 'list__checkbox';

  const text = document.createElement('span');
  text.className = 'list__text';
  text.textContent = title;

  const remove = document.createElement('button');
  remove.className = 'list__delete';
  remove.textContent = 'Удалить';

  checkbox.addEventListener('change', () => {
    li.classList.toggle('list__item--done', checkbox.checked);
    updateCounters();
  });

  remove.addEventListener('click', () => {
    li.remove();
    updateCounters();
  });

  li.append(checkbox, text, remove);
  return li;
}

form.addEventListener('submit', event => {
  event.preventDefault();
  const title = input.value.trim();

  if (!title) {
    error.hidden = false;
    return;
  }

  error.hidden = true;
  list.append(createItem(title));
  input.value = '';
  updateCounters();
});
