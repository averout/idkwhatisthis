const { test, describe } = require('node:test');
const assert = require('node:assert/strict');
const { isNotEmpty, isEmail, isStrongPassword } = require('../src/validate');

describe('isNotEmpty', () => {
  test('возвращает true для непустой строки', () => {
    assert.strictEqual(isNotEmpty('Иван'), true);
  });

  test('возвращает false для пустой строки и пробелов', () => {
    assert.strictEqual(isNotEmpty(''), false);
    assert.strictEqual(isNotEmpty('   '), false);
  });

  test('возвращает false для не строки', () => {
    assert.strictEqual(isNotEmpty(null), false);
    assert.strictEqual(isNotEmpty(42), false);
  });
});

describe('isEmail', () => {
  const valid = ['user@mail.ru', 'ivan.petrov@example.com', 'a1@b2.org'];
  for (const email of valid) {
    test(`корректный адрес: ${email}`, () => {
      assert.strictEqual(isEmail(email), true);
    });
  }

  const invalid = ['', 'user', 'user@', '@mail.ru', 'user mail.ru', 'user@mail'];
  for (const email of invalid) {
    test(`некорректный адрес: "${email}"`, () => {
      assert.strictEqual(isEmail(email), false);
    });
  }
});

describe('isStrongPassword', () => {
  test('пароль с буквами разного регистра и цифрой', () => {
    assert.ok(isStrongPassword('Password1'));
  });

  test('короткий пароль не подходит', () => {
    assert.ok(!isStrongPassword('Pass1'));
  });

  test('пароль без цифр не подходит', () => {
    assert.ok(!isStrongPassword('PasswordPass'));
  });
});
