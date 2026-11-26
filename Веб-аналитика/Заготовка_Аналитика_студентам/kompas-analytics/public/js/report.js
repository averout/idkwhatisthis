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

  // ===== Конец места для вашего кода =====
});
