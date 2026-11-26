// Модуль расчёта заказа

function applyDiscount(price, percent) {
  if (typeof price !== 'number' || typeof percent !== 'number') {
    throw new TypeError('Цена и скидка должны быть числами');
  }
  if (price < 0) throw new RangeError('Цена не может быть отрицательной');
  if (percent < 0 || percent > 100) throw new RangeError('Скидка должна быть от 0 до 100');
  return Math.round(price * (1 - percent / 100));
}

function calcTotal(items) {
  if (!Array.isArray(items)) throw new TypeError('Ожидается массив товаров');
  return items.reduce((sum, item) => sum + item.price * item.count, 0);
}

module.exports = { applyDiscount, calcTotal };
