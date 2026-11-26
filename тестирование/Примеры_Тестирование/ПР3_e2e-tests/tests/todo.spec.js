const { test, expect } = require('@playwright/test');

test.beforeEach(async ({ page }) => {
  await page.goto('/');
});

test('страница открывается и содержит заголовок', async ({ page }) => {
  await expect(page).toHaveTitle('Список дел');
  await expect(page.getByRole('heading', { name: 'Список дел' })).toBeVisible();
  await expect(page.locator('#counter')).toHaveText('0');
});

test('добавление задачи', async ({ page }) => {
  await page.fill('#task-input', 'Выучить Playwright');
  await page.click('#add-button');

  await expect(page.locator('.list__item')).toHaveCount(1);
  await expect(page.locator('.list__text')).toHaveText('Выучить Playwright');
  await expect(page.locator('#counter')).toHaveText('1');
  await expect(page.locator('#task-input')).toHaveValue('');
});

test('нельзя добавить пустую задачу', async ({ page }) => {
  await page.click('#add-button');

  await expect(page.locator('#error')).toBeVisible();
  await expect(page.locator('#error')).toHaveText('Введите название задачи');
  await expect(page.locator('.list__item')).toHaveCount(0);
});

test('отметка задачи выполненной изменяет счётчик', async ({ page }) => {
  await page.fill('#task-input', 'Задача 1');
  await page.click('#add-button');
  await page.fill('#task-input', 'Задача 2');
  await page.click('#add-button');

  await page.locator('.list__checkbox').first().check();

  await expect(page.locator('.list__item--done')).toHaveCount(1);
  await expect(page.locator('#done-counter')).toHaveText('1');
  await expect(page.locator('#counter')).toHaveText('2');
});

test('удаление задачи', async ({ page }) => {
  await page.fill('#task-input', 'Временная задача');
  await page.click('#add-button');
  await expect(page.locator('.list__item')).toHaveCount(1);

  await page.click('.list__delete');

  await expect(page.locator('.list__item')).toHaveCount(0);
  await expect(page.locator('#counter')).toHaveText('0');
});

test('сквозной сценарий: три задачи, одна выполнена, одна удалена', async ({ page }) => {
  for (const title of ['Первая', 'Вторая', 'Третья']) {
    await page.fill('#task-input', title);
    await page.press('#task-input', 'Enter');
  }
  await expect(page.locator('.list__item')).toHaveCount(3);

  await page.locator('.list__checkbox').nth(1).check();
  await page.locator('.list__delete').last().click();

  await expect(page.locator('.list__item')).toHaveCount(2);
  await expect(page.locator('#done-counter')).toHaveText('1');
  await page.screenshot({ path: 'screenshots/final.png' });
});
