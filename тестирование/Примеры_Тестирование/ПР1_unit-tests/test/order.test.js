const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { applyDiscount, calcTotal } = require('../src/order');

describe('applyDiscount', () => {
  test('скидка 10% от 1000 равна 900', () => {
    assert.strictEqual(applyDiscount(1000, 10), 900);
  });

  test('нулевая скидка не меняет цену', () => {
    assert.strictEqual(applyDiscount(1500, 0), 1500);
  });

  test('скидка 100% даёт 0', () => {
    assert.strictEqual(applyDiscount(1500, 100), 0);
  });

  test('результат округляется до целого', () => {
    assert.strictEqual(applyDiscount(999, 15), 849);
  });

  test('ошибка при нечисловых данных', () => {
    assert.throws(() => applyDiscount('1000', 10), TypeError);
  });

  test('ошибка при скидке больше 100', () => {
    assert.throws(() => applyDiscount(1000, 150), RangeError);
  });
});

describe('calcTotal', () => {
  test('считает сумму по списку товаров', () => {
    const items = [
      { name: 'Мышь', price: 900, count: 2 },
      { name: 'Коврик', price: 300, count: 1 },
    ];
    assert.strictEqual(calcTotal(items), 2100);
  });

  test('пустой заказ стоит 0', () => {
    assert.strictEqual(calcTotal([]), 0);
  });

  test('ошибка, если передан не массив', () => {
    assert.throws(() => calcTotal(null), TypeError);
  });
});
