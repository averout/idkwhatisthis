// Генерация тестовых данных каталога (одинакова для обеих версий страницы)
const CATEGORIES = ['Смартфоны', 'Ноутбуки', 'Наушники', 'Мониторы', 'Клавиатуры'];
const SINGULAR = ['Смартфон', 'Ноутбук', 'Наушники', 'Монитор', 'Клавиатура'];
const BRANDS = ['Nova', 'Sirius', 'Orion', 'Vega', 'Lumen', 'Aster', 'Quant', 'Zenit'];
const PRODUCT_COUNT = 500;   // если страница грузится дольше 10 секунд — уменьшите до 300

function createProducts() {
  const products = [];
  for (let i = 1; i <= PRODUCT_COUNT; i++) {
    const index = i % CATEGORIES.length;
    const category = CATEGORIES[index];
    const brand = BRANDS[i % BRANDS.length];
    products.push({
      id: i,
      name: `${SINGULAR[index]} ${brand} ${1000 + i}`,
      category: category,
      price: 2000 + ((i * 137) % 90000),
      rating: (3 + ((i * 7) % 20) / 10).toFixed(1),
    });
  }
  return products;
}

// Список идентификаторов «избранных» товаров (каждый десятый)
function createFavorites(products) {
  return products.filter(p => p.id % 10 === 0).map(p => p.id);
}

const PRODUCTS = createProducts();
const FAVORITES = createFavorites(PRODUCTS);
