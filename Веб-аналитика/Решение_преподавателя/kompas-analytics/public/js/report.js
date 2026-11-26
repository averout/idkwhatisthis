// =====================================================================
// Отчёт по веб-аналитике. Помощники (верхняя часть) ИЗМЕНЯТЬ НЕ НУЖНО.
// Свой код вы добавляете в отмеченное место внизу файла (шаги 7, 8, 9).
// =====================================================================

// ---------- Помощники для вывода ----------

// Доля в процентах с одним знаком после запятой: percent(1, 8) → "12.5 %"
function percent(part, whole) {
  if (!whole) return '0 %';
  return (part / whole * 100).toFixed(1) + ' %';
}

// Карточка с крупной цифрой вверху отчёта: addKpi(1234, 'посетителей')
function addKpi(value, label) {
  document.getElementById('kpis').insertAdjacentHTML('beforeend',
    `<div class="kpi"><div class="kpi__value">${value}</div><div class="kpi__label">${label}</div></div>`);
}

// Таблица в блоке: addTable('sources', ['Источник', 'Визиты'], [['vk', 500], ['email', 200]])
function addTable(blockId, headers, rows) {
  const isNum = (cell) => typeof cell === 'number' || String(cell).endsWith('%');   // числа — по правому краю
  const head = '<tr>' + headers.map((h, i) => `<th class="${rows[0] && isNum(rows[0][i]) ? 'num' : ''}">${h}</th>`).join('') + '</tr>';
  const body = rows.map((row) => '<tr>' + row.map((cell) =>
    `<td class="${isNum(cell) ? 'num' : ''}">${cell}</td>`).join('') + '</tr>').join('');
  document.getElementById(blockId).innerHTML = `<table>${head}${body}</table>`;
}

// Воронка из полос: addFunnel('funnel', [['Каталог', 2000], ['Тур', 1100], …])
function addFunnel(blockId, steps) {
  const first = steps[0][1];
  document.getElementById(blockId).innerHTML = steps.map(([name, count], i) => {
    const fromPrev = i === 0 ? '' : ` · от предыдущего шага ${percent(count, steps[i - 1][1])}`;
    const width = count / first * 100;      // какая часть полосы закрашена
    return `<div class="bar" style="background-size: ${width}% 100%">${name}: ${count} (${percent(count, first)}${fromPrev})</div>`;
  }).join('');
}

// ---------- Загрузка данных ----------
Promise.all([
  fetch('/api/events').then((r) => r.json()),      // все события из журнала data/events.jsonl
  fetch('data/tours.json').then((r) => r.json()),  // список туров — чтобы показывать названия, а не номера
]).then(([events, tours]) => {
  document.getElementById('total').textContent = events.length;
  if (events.length === 0) {
    document.getElementById('kpis').innerHTML = '<p class="empty">Событий пока нет. Походите по сайту или выполните node simulate.js</p>';
    return;
  }
  // Название тура по номеру: tourName(6) → "Камчатка: вулканы и гейзеры"
  const tourName = (id) => (tours.find((t) => t.id === id) || { title: 'тур ' + id }).title;

  // ===== Сюда добавляйте код шагов 7, 8 и 9 — каждый следующий блок под предыдущим =====

  // ---------- Шаг 7. Основные метрики ----------
  const views = events.filter((e) => e.type === 'page_view');           // только просмотры страниц
  const visitors = new Set(events.map((e) => e.visitorId)).size;        // разные посетители
  const sessions = new Set(events.map((e) => e.sessionId)).size;        // разные визиты

  // Сколько страниц открыли в каждом визите: { 'номер визита': 3, … }
  const viewsInSession = {};
  for (const e of views) {
    viewsInSession[e.sessionId] = (viewsInSession[e.sessionId] || 0) + 1;
  }
  // Отказ — визит, в котором открыли всего одну страницу
  const bounces = Object.values(viewsInSession).filter((n) => n === 1).length;

  // Среднее время на странице — по событиям ухода
  const leaves = events.filter((e) => e.type === 'leave');
  const totalSeconds = leaves.reduce((sum, e) => sum + e.seconds, 0);

  addKpi(visitors, 'посетителей');
  addKpi(sessions, 'визитов');
  addKpi(views.length, 'просмотров страниц');
  addKpi((views.length / sessions).toFixed(2), 'глубина просмотра, страниц за визит');
  addKpi(percent(bounces, sessions), 'отказов');
  addKpi(Math.round(totalSeconds / leaves.length) + ' с', 'в среднем на странице');


  // ---------- Шаг 8. Воронка и конверсия ----------
  // Сколько разных визитов содержат хотя бы одно событие, подходящее под условие
  function sessionsWith(condition) {
    return new Set(events.filter(condition).map((e) => e.sessionId)).size;
  }
  const funnel = [
    ['Каталог', sessionsWith((e) => e.type === 'page_view' && e.page === 'catalog')],
    ['Страница тура', sessionsWith((e) => e.type === 'page_view' && e.page === 'tour')],
    ['Форма заявки', sessionsWith((e) => e.type === 'page_view' && e.page === 'booking')],
    ['Заявка отправлена', sessionsWith((e) => e.type === 'booking')],
  ];
  addFunnel('funnel', funnel);
  addKpi(percent(funnel[3][1], sessions), 'конверсия визита в заявку');


  // ---------- Шаг 9. Отчёты по источникам, устройствам и турам ----------
  // Группируем визиты по полю field ('source' или 'device') и считаем показатели для каждой группы
  function statsBy(field) {
    const groups = {};
    for (const e of events) {
      const key = e[field];
      if (!groups[key]) groups[key] = { sessions: new Set(), forms: new Set(), bookings: 0 };
      const g = groups[key];
      g.sessions.add(e.sessionId);
      if (e.type === 'page_view' && e.page === 'booking') g.forms.add(e.sessionId);
      if (e.type === 'booking') g.bookings++;
    }
    return Object.entries(groups)
      .map(([key, g]) => {
        const bounced = [...g.sessions].filter((s) => viewsInSession[s] === 1).length;
        return [key, g.sessions.size, percent(bounced, g.sessions.size), g.forms.size, g.bookings,
          percent(g.bookings, g.forms.size), percent(g.bookings, g.sessions.size)];
      })
      .sort((a, b) => b[1] - a[1]);          // сначала группы, где больше визитов
  }
  const headers = ['Визиты', 'Отказы', 'Открыли форму', 'Заявки', 'Заполнили форму', 'Конверсия'];
  addTable('sources', ['Источник', ...headers], statsBy('source'));
  addTable('devices', ['Устройство', ...headers], statsBy('device'));

  // По турам: сколько раз открывали страницу тура и сколько заявок он принёс
  const byTour = {};
  for (const e of events) {
    if (!e.tourId) continue;
    if (!byTour[e.tourId]) byTour[e.tourId] = { views: 0, forms: 0, bookings: 0 };
    if (e.type === 'page_view' && e.page === 'tour') byTour[e.tourId].views++;
    if (e.type === 'page_view' && e.page === 'booking') byTour[e.tourId].forms++;
    if (e.type === 'booking') byTour[e.tourId].bookings++;
  }
  const tourRows = Object.entries(byTour)
    .map(([id, t]) => [tourName(Number(id)), t.views, t.forms, t.bookings, percent(t.bookings, t.views)])
    .sort((a, b) => b[1] - a[1]);
  addTable('tours', ['Тур', 'Просмотры', 'Открыли форму', 'Заявки', 'Конверсия просмотра в заявку'], tourRows);

  // ===== Конец места для вашего кода =====
});
