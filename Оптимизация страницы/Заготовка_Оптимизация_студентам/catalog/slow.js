// Каталог товаров — версия, требующая оптимизации

const listEl = document.getElementById('list');
const searchEl = document.getElementById('search');
const countEl = document.getElementById('count');
const statsEl = document.getElementById('stats');

function log(name, ms) {
  const row = document.createElement('div');
  row.textContent = `${name}: ${ms.toFixed(1)} мс`;
  statsEl.prepend(row);
  console.log(name, ms.toFixed(1), 'мс');
}

function isFavorite(id) {
  return FAVORITES.indexOf(id) !== -1;
}

function render(products) {
  listEl.innerHTML = '';

  for (let i = 0; i < products.length; i++) {
    const product = products[i];
    const favorite = isFavorite(product.id) ? ' ★' : '';
    listEl.innerHTML += `
      <article class="card" data-id="${product.id}">
        <h3 class="card__title">${product.name}${favorite}</h3>
        <p class="card__category">${product.category}</p>
        <p class="card__price">${product.price} ₽</p>
        <p class="card__rating">Рейтинг: ${product.rating}</p>
        <button class="card__button">В корзину</button>
      </article>`;
  }

  const cards = document.querySelectorAll('.card');
  for (let i = 0; i < cards.length; i++) {
    cards[i].addEventListener('click', function () {
      this.classList.toggle('card--selected');
    });
  }

  for (let i = 0; i < cards.length; i++) {
    cards[i].style.minHeight = cards[i].offsetHeight + 'px';
  }

  countEl.textContent = `Найдено товаров: ${products.length}`;
}

function search(query) {
  const result = [];
  for (let i = 0; i < PRODUCTS.length; i++) {
    if (PRODUCTS[i].name.toLowerCase().indexOf(query.toLowerCase()) !== -1) {
      result.push(PRODUCTS[i]);
    }
  }
  return result;
}

searchEl.addEventListener('input', function () {
  const start = performance.now();
  render(search(searchEl.value));
  log('Отклик поиска', performance.now() - start);
});

const startRender = performance.now();
render(PRODUCTS);
log('Первичный вывод каталога', performance.now() - startRender);
