// =====================================================================
// Сайт «Компас»: загрузка и вывод списка туров
// =====================================================================

const list = document.getElementById('list');          // контейнер для карточек
const statusText = document.getElementById('status');  // строка состояния над списком

// ---------- Карточка тура ----------
function cardHtml(tour) {
  return `
    <article class="card">
      <img src="img/${tour.photo}-800.jpg"
           srcset="img/${tour.photo}-400.jpg 400w,
                   img/${tour.photo}-800.jpg 800w,
                   img/${tour.photo}-1600.jpg 1600w"
           sizes="(min-width: 1000px) 300px, (min-width: 640px) 50vw, 100vw"
           width="1600" height="1067" loading="lazy" alt="${tour.title}">
      <div class="card__body">
        <h3 class="card__title">${tour.title}</h3>
        <p class="card__meta">${tour.region} · ${tour.days} дн.</p>
        <div class="card__price">${tour.price.toLocaleString('ru-RU')} ₽</div>
      </div>
    </article>`;
}

function render(tours) {
  list.innerHTML = tours.map(cardHtml).join('');
}

// ---------- Загрузка туров: сначала из кэша, потом с сервера ----------
const CACHE_KEY = 'kompas-tours';       // под каким именем храним данные в браузере
const CACHE_TTL = 10 * 60 * 1000;       // сколько данные считаются свежими: 10 минут

// «5 мин назад» вместо числа миллисекунд
function timeAgo(time) {
  const minutes = Math.round((Date.now() - time) / 60000);
  return minutes === 0 ? 'только что' : minutes + ' мин назад';
}

async function loadTours() {
  // 1. Смотрим, что сохранено в браузере с прошлого раза
  const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');

  // 2. Если данные есть и они свежие — показываем сразу, сервер не спрашиваем
  if (cached && Date.now() - cached.savedAt < CACHE_TTL) {
    render(cached.tours);
    statusText.textContent = 'Показаны сохранённые данные (обновлены ' + timeAgo(cached.savedAt) + ')';
    return;
  }

  // 3. Иначе загружаем с сервера и сохраняем вместе со временем загрузки
  statusText.textContent = 'Загружаем туры…';
  try {
    const response = await fetch('/api/tours');
    const tours = await response.json();
    localStorage.setItem(CACHE_KEY, JSON.stringify({ tours, savedAt: Date.now() }));
    statusText.textContent = '';
    render(tours);
  } catch (err) {
    // 4. Нет связи: показываем хотя бы устаревшие данные, если они есть
    if (cached) {
      render(cached.tours);
      statusText.textContent = 'Нет связи. Показаны данные, сохранённые ' + timeAgo(cached.savedAt);
    } else {
      statusText.textContent = 'Нет связи с сервером. Проверьте интернет';
    }
  }
}

loadTours();

// ---------- Офлайн-режим: регистрируем Service Worker (шаг 8) ----------
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js')
    .then(() => console.log('Service Worker зарегистрирован'))
    .catch((err) => console.log('Service Worker не зарегистрирован:', err));
}
