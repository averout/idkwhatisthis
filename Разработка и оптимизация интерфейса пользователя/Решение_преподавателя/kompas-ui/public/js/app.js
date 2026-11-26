// =====================================================================
// Каталог туров на «чистом» JavaScript (без фреймворка)
// =====================================================================

// 1. Находим на странице элементы, с которыми будем работать
const searchInput = document.getElementById('search');   // поле поиска
const regionSelect = document.getElementById('region');  // список регионов
const cheapCheckbox = document.getElementById('cheap');  // флажок «до 20 000 ₽»
const countText = document.getElementById('count');      // строка «Найдено туров: …»
const list = document.getElementById('list');            // контейнер для карточек
const sortSelect = document.getElementById('sort');      // список «Сортировка»

// 2. Здесь будут храниться все туры, загруженные с сервера
let tours = [];

// 3. Функция получает один тур и возвращает HTML-код его карточки
function cardHtml(tour) {
  return `
    <article class="card">
      <img src="${tour.imageSmall}" alt="${tour.title}"
           width="600" height="400" loading="lazy" decoding="async">
      <div class="card__body">
        <h3 class="card__title">${tour.title}</h3>
        <p class="card__meta">${tour.region} · ${tour.days} дн.</p>
        <div class="card__price">${tour.price.toLocaleString('ru-RU')} ₽</div>
      </div>
    </article>`;
}

// 4. Функция отбирает туры по фильтрам и выводит их на страницу
function render() {
  const text = searchInput.value.trim().toLowerCase();   // что ввели в поиск
  const region = regionSelect.value;                     // выбранный регион ('' — все)
  const onlyCheap = cheapCheckbox.checked;               // отмечен ли флажок

  const filtered = tours.filter((tour) => {
    if (text && !tour.title.toLowerCase().includes(text)) return false;
    if (region && tour.region !== region) return false;
    if (onlyCheap && tour.price > 20000) return false;
    return true;                                         // тур подходит
  });

  if (sortSelect.value === 'asc') filtered.sort((a, b) => a.price - b.price);   // по возрастанию цены
  if (sortSelect.value === 'desc') filtered.sort((a, b) => b.price - a.price);  // по убыванию цены

  countText.textContent = 'Найдено туров: ' + filtered.length;
  list.innerHTML = filtered.length > 0
    ? filtered.map(cardHtml).join('')
    : '<p class="empty">Ничего не найдено</p>';
}

// 5. При каждом изменении фильтров перерисовываем список
searchInput.addEventListener('input', render);
regionSelect.addEventListener('change', render);
cheapCheckbox.addEventListener('change', render);
sortSelect.addEventListener('change', render);

// 6. Загружаем туры с сервера и показываем их
fetch('data/tours.json')
  .then((response) => response.json())
  .then((data) => {
    tours = data;
    render();
    console.log('Карточки показаны через ' + Math.round(performance.now()) + ' мс');
  });
