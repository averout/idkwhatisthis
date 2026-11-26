// =====================================================================
// Учебный счётчик веб-аналитики — как маленькая Яндекс Метрика
// =====================================================================

// ---------- 1. Кто посетитель ----------
// Номер посетителя хранится в localStorage и не меняется между визитами
let visitorId = localStorage.getItem('visitorId');
if (!visitorId) {
  visitorId = crypto.randomUUID();                 // случайный номер вида 3f2a…
  localStorage.setItem('visitorId', visitorId);
}
// Номер визита (сессии) хранится в sessionStorage и пропадает, когда вкладку закрыли
let sessionId = sessionStorage.getItem('sessionId');
if (!sessionId) {
  sessionId = crypto.randomUUID();
  sessionStorage.setItem('sessionId', sessionId);
}

// ---------- 2. Устройство: узкий экран — телефон ----------
const device = window.innerWidth < 768 ? 'mobile' : 'desktop';

// ---------- 3. Источник перехода ----------
function getSource() {
  // 1. Метка в адресе ссылки: ?utm_source=vk — так помечают ссылки в рекламе и рассылках
  const utm = new URLSearchParams(location.search).get('utm_source');
  if (utm) {
    sessionStorage.setItem('source', utm);        // запоминаем источник на весь визит
    return utm;
  }
  // 2. Источник этого визита уже известен (пользователь ходит по нашим страницам)
  const saved = sessionStorage.getItem('source');
  if (saved) return saved;
  // 3. Адрес сайта, с которого пришли по ссылке
  const ref = document.referrer;
  let source = 'direct';                           // ссылки не было: набрали адрес или открыли закладку
  if (ref.includes('yandex')) source = 'yandex';
  else if (ref.includes('vk.com')) source = 'vk';
  else if (ref && !ref.includes(location.host)) source = 'other';
  sessionStorage.setItem('source', source);
  return source;
}

// ---------- 4. Отправка события на сервер ----------
function send(type, extra = {}) {
  const tourId = new URLSearchParams(location.search).get('id');   // номер тура из адреса, если есть
  const event = {
    type,                                   // что произошло: page_view, tour_click, booking…
    visitorId,
    sessionId,
    device,
    page: document.body.dataset.page,       // catalog, tour или booking
    source: getSource(),
    tourId: tourId ? Number(tourId) : undefined,
    ...extra,                               // дополнительные поля конкретного события
  };
  navigator.sendBeacon('/api/collect', JSON.stringify(event));
}

// ---------- 5. Просмотр страницы ----------
send('page_view');

// ---------- 6. Цели: клик по карточке тура и отправка заявки ----------
document.addEventListener('click', (event) => {
  const card = event.target.closest('[data-tour-id]');      // щёлкнули внутри карточки?
  if (card) {
    send('tour_click', { tourId: Number(card.dataset.tourId) });
  }
});

document.addEventListener('booking-sent', (event) => {       // это событие создаёт site.js
  send('booking', { tourId: event.detail.tourId });
});

// ---------- 7. Глубина прокрутки и время на странице ----------
let maxDepth = 0;                       // до какого места страницы долистали, в процентах
const startTime = Date.now();           // когда открыли страницу

function updateDepth() {
  const seen = window.scrollY + window.innerHeight;                  // сколько пикселей уже видно
  const depth = Math.round((seen / document.documentElement.scrollHeight) * 100);
  if (depth > maxDepth) maxDepth = depth;
}
window.addEventListener('scroll', updateDepth);
document.addEventListener('content-ready', updateDepth);              // страница построена

// Пользователь ушёл со страницы: перешёл по ссылке, закрыл вкладку или свернул браузер
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    send('leave', { depth: maxDepth, seconds: Math.round((Date.now() - startTime) / 1000) });
  }
});
