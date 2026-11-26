// =====================================================================
// Сайт «Компас»: загрузка и вывод списка туров
// =====================================================================

const list = document.getElementById('list');          // контейнер для карточек
const statusText = document.getElementById('status');  // строка состояния над списком

// ---------- Карточка тура (изменим на шаге 4) ----------
function cardHtml(tour) {
  return `
    <article class="card">
      <img src="img/${tour.photo}-1600.jpg" alt="${tour.title}">
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

// ---------- Загрузка туров с сервера (изменим на шаге 6) ----------
async function loadTours() {
  statusText.textContent = 'Загружаем туры…';
  const response = await fetch('/api/tours');
  const tours = await response.json();
  statusText.textContent = '';
  render(tours);
}

loadTours();
