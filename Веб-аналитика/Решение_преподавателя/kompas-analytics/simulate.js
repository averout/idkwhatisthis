// =====================================================================
// Имитация посетителей: создаёт журнал событий за две недели работы сайта
// Запуск: node simulate.js        (сервер при этом можно не останавливать)
// ИЗМЕНЯТЬ НЕ НУЖНО. Результат каждый раз одинаковый — у всех в группе одни и те же цифры.
// =====================================================================

const fs = require('fs');
const path = require('path');

const FILE = path.join(__dirname, 'data', 'events.jsonl');
const MINE = path.join(__dirname, 'data', 'events-mine.jsonl');
const SESSIONS = 2000;

// Генератор «случайных» чисел с постоянным зерном: числа выглядят случайными, но повторяются при каждом запуске
let seed = 20261012;
function random() {
  seed = (seed + 0x6D2B79F5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const between = (a, b) => Math.round(a + random() * (b - a));
const chance = (p) => random() < p;
function pick(weights) {                       // выбор по весам: { yandex: 35, vk: 25, … }
  let r = random() * Object.values(weights).reduce((s, w) => s + w, 0);
  for (const [key, w] of Object.entries(weights)) { r -= w; if (r < 0) return key; }
}
const uuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
  const r = Math.floor(random() * 16);
  return (c === 'x' ? r : (r & 3) | 8).toString(16);
});

// ---- Поведение посетителей из разных источников ----
const SOURCES = { yandex: 35, vk: 25, direct: 20, telegram: 10, email: 10 };   // доля визитов, %
const MOBILE = { yandex: 0.55, vk: 0.8, direct: 0.45, telegram: 0.8, email: 0.45 };   // доля телефонов
const BOUNCE = { yandex: 0.35, vk: 0.7, direct: 0.3, telegram: 0.45, email: 0.2 };   // ушли с первой страницы
const TO_FORM = { yandex: 0.4, vk: 0.35, direct: 0.45, telegram: 0.4, email: 0.6 };  // со страницы тура в форму
const FILL = { mobile: 0.12, desktop: 0.45 };                                   // заполнили форму до конца
const TOURS = { 1: 8, 2: 9, 3: 8, 4: 7, 5: 7, 6: 22, 7: 9, 8: 6, 9: 6, 10: 6, 11: 5, 12: 7 };  // интерес к турам

const events = [];
const visitors = [];
const start = Date.parse('2026-10-12T08:00:00Z');

for (let i = 0; i < SESSIONS; i++) {
  // 30 % визитов — от тех, кто уже был на сайте
  let visitor;
  if (visitors.length > 50 && chance(0.3)) visitor = visitors[Math.floor(random() * visitors.length)];
  else { visitor = { id: uuid(), device: null }; visitors.push(visitor); }

  const source = pick(SOURCES);
  if (!visitor.device) visitor.device = chance(MOBILE[source]) ? 'mobile' : 'desktop';
  const device = visitor.device;
  const sessionId = uuid();
  let time = start + Math.floor(random() * 14 * 24 * 3600) * 1000;

  const add = (type, page, extra = {}) => {
    events.push({ type, visitorId: visitor.id, sessionId, device, page, source, ...extra, time: new Date(time).toISOString() });
  };
  const leave = (page, seconds, depth, extra = {}) => {
    time += seconds * 1000;
    add('leave', page, { ...extra, depth, seconds });
  };

  // Каталог
  add('page_view', 'catalog');
  if (chance(BOUNCE[source])) {                             // отказ: посмотрел каталог и ушёл
    leave('catalog', source === 'vk' ? between(2, 9) : between(4, 40), between(30, 60));
    continue;
  }

  let tourId;
  for (let n = 0; ; n++) {
    if (n > 0) {                                             // вернулся в каталог за другим туром
      leave('tour', between(10, 60), between(30, 70), { tourId });
      time += 2000;
      add('page_view', 'catalog');
    }
    tourId = Number(pick(TOURS));
    add('tour_click', 'catalog', { tourId });
    leave('catalog', between(8, 70), between(40, 100));
    time += 1000;
    add('page_view', 'tour', { tourId });
    if (n === 2 || !chance(0.3)) break;                       // смотрят не больше трёх туров
  }

  const toForm = tourId === 6 ? 0.08 : TO_FORM[source];   // Камчатку смотрят много, но бронируют редко
  if (!chance(toForm)) {
    leave('tour', between(15, 150), between(35, 100), { tourId });
    continue;
  }
  leave('tour', between(30, 180), between(60, 100), { tourId });
  time += 1000;
  add('page_view', 'booking', { tourId });
  if (chance(FILL[device])) {
    time += between(30, 110) * 1000;
    add('booking', 'booking', { tourId });
    leave('booking', between(3, 15), 100, { tourId });
  } else {
    leave('booking', between(15, 90), 100, { tourId });     // начал заполнять и бросил
  }
}

events.sort((a, b) => a.time.localeCompare(b.time));
fs.mkdirSync(path.dirname(FILE), { recursive: true });
if (fs.existsSync(FILE)) {
  fs.renameSync(FILE, MINE);                                 // ваши собственные события не пропадут
  console.log('Ваши события сохранены в data/events-mine.jsonl');
}
fs.writeFileSync(FILE, events.map((e) => JSON.stringify(e)).join('\n') + '\n');
console.log('Создано событий:', events.length, '— визитов:', SESSIONS, '— посетителей:', visitors.length);
console.log('Откройте отчёт: http://localhost:3000/report.html');
