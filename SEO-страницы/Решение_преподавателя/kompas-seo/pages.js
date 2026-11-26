// =====================================================================
// Страницы, которые собирает сервер. ЭТОТ ФАЙЛ ВЫ ДОПИСЫВАЕТЕ (шаги 2–8).
// После сохранения достаточно обновить страницу в браузере — сервер перезапускать не нужно.
// =====================================================================

const tours = require('./data/tours.json');          // список туров
const SITE = 'http://localhost:3000';                // адрес сайта. На настоящем сайте — https://kompas-tour.ru

// Цена с пробелами между тысячами: 32500 → "32 500"
const price = (n) => n.toLocaleString('ru-RU');

// ---------- Шаблон страницы (шаг 2) ----------
// Общая «рамка» всех страниц: <head>, шапка, подвал. Внутрь подставляется заголовок и содержимое.
function layout({ title, description, url, image = '/img/tour2-800.jpg', schema, body }) {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${title}</title>
  <meta name="description" content="${description}">
  <link rel="canonical" href="${SITE}${url}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${SITE}${image}">
  <meta property="og:url" content="${SITE}${url}">
  ${schema ? `<script type="application/ld+json">${JSON.stringify(schema)}</script>` : ''}
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <header class="header">
    <a class="logo" href="/">КОМПАС</a>
    <nav><a href="/">Все туры</a></nav>
  </header>
  <main class="page">
${body}
  </main>
  <footer class="footer">© Компас, туры по России · <a href="/about">О компании</a></footer>
</body>
</html>`;
}

// ---------- Страница тура (шаг 2) ----------
function tourPage(tour) {
  return layout({
    title: `Тур «${tour.title}» — ${tour.days} дн., от ${price(tour.price)} ₽ | Компас`,
    description: `Тур «${tour.title}»: ${tour.highlights.join(', ')}. ${tour.days} дн., от ${price(tour.price)} ₽.`,
    url: `/tours/${tour.slug}`,
    image: `/img/${tour.photo}-800.jpg`,
    schema: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: tour.title,
      description: tour.text,
      image: `${SITE}/img/${tour.photo}-800.jpg`,
      offers: {
        '@type': 'Offer',
        price: tour.price,
        priceCurrency: 'RUB',
        availability: 'https://schema.org/InStock',
        url: `${SITE}/tours/${tour.slug}`,
      },
    },
    body: `
    ${breadcrumbs(tour)}
    <article class="tour">
      <h1>${tour.title}</h1>
      <img src="/img/${tour.photo}-800.jpg" alt="${tour.title}" width="800" height="533">
      <p class="tour__price">от ${price(tour.price)} ₽ за ${tour.days} дн.</p>
      <p class="text">${tour.text}</p>
      ${tourDetails(tour)}
      ${relatedTours(tour)}
    </article>`,
  });
}

// ---------- Подробности тура (шаг 5) ----------
function tourDetails(tour) {
  return `
      <h2>Что вы увидите в туре «${tour.title}»</h2>
      <ul>${tour.highlights.map((h) => `<li>${h}</li>`).join('')}</ul>

      <h2>Что входит в стоимость</h2>
      <ul>
        <li>проживание в гостиницах и на турбазах на всё время тура (${tour.days} дн.)</li>
        <li>трансферы и переезды по программе на комфортабельном транспорте</li>
        <li>экскурсии и входные билеты во все места из программы</li>
        <li>сопровождение опытного гида на всём маршруте</li>
        <li>завтраки, а на турбазах — завтраки и ужины</li>
      </ul>

      <h2>Частые вопросы</h2>
      <h3>Как забронировать тур?</h3>
      <p class="text">Оставьте заявку на сайте или позвоните нам. Менеджер подтвердит даты, ответит на вопросы
        и пришлёт договор. Для бронирования достаточно предоплаты 20 % от стоимости тура.</p>
      <h3>Сколько человек в группе?</h3>
      <p class="text">Не больше 16 человек, поэтому гид успевает уделить внимание каждому. Если вы едете компанией
        от четырёх человек, мы дадим скидку 5 %.</p>
      <h3>Можно ли поехать с детьми?</h3>
      <p class="text">Да, мы берём в тур детей от 7 лет. Для детей до 12 лет действует скидка 10 %.</p>`;
}

// ---------- Каталог (шаг 4) ----------
function catalogPage() {
  // Карточка каждого тура — настоящая ссылка <a href> на его страницу
  const cards = tours.map((t) => `
      <a class="card" href="/tours/${t.slug}">
        <img src="/img/${t.photo}-400.jpg" alt="${t.title}" width="400" height="267">
        <div class="card__body">
          <h2 class="card__title">${t.title}</h2>
          <p class="card__meta">${t.region} · ${t.days} дн.</p>
          <p class="card__price">от ${price(t.price)} ₽</p>
        </div>
      </a>`).join('');

  return layout({
    title: 'Туры по России 2026 — Алтай, Байкал, Камчатка | Компас',
    description: 'Туры по России от турбюро «Компас»: Алтай, Байкал, Камчатка, Карелия, Кавказ и Крым. Группы до 16 человек, цены от 6 900 ₽, гид на всём маршруте.',
    url: '/',
    body: `
    <h1>Туры по России</h1>
    <p class="text">Турбюро «Компас» организует групповые туры по России с 2015 года. Мы сами проезжаем
      каждый маршрут, прежде чем включить его в каталог. Выберите направление: горы Алтая и Кавказа,
      зимний Байкал, вулканы Камчатки, водопады Карелии или выходные в городах Поволжья. В стоимость каждого
      тура входят проживание, переезды, экскурсии и работа гида, а группы небольшие — до 16 человек.</p>
    <div class="list">${cards}</div>`,
  });
}

// ---------- Перелинковка (шаг 6) ----------
// Хлебные крошки: путь от главной до текущей страницы
function breadcrumbs(tour) {
  return `
    <ol class="crumbs">
      <li><a href="/">Все туры</a></li>
      <li>${tour.region}</li>
      <li>${tour.title}</li>
    </ol>`;
}

// Похожие туры: сначала из того же региона, потом остальные — всего три
function relatedTours(tour) {
  const sameRegion = tours.filter((t) => t.region === tour.region && t.id !== tour.id);
  const otherRegions = tours.filter((t) => t.region !== tour.region);
  const list = [...sameRegion, ...otherRegions].slice(0, 3);
  return `
      <h2>Похожие туры</h2>
      <div class="related">${list.map((t) => `
        <a class="card" href="/tours/${t.slug}">
          <div class="card__body">
            <h3 class="card__title">${t.title}</h3>
            <p class="card__price">от ${price(t.price)} ₽</p>
          </div>
        </a>`).join('')}
      </div>`;
}

// Страница «О компании»
function aboutPage() {
  return layout({
    title: 'О турбюро «Компас» — туры по России с 2015 года',
    description: 'Турбюро «Компас»: более 10 лет организуем групповые туры по России. Проверенные маршруты, опытные гиды, небольшие группы и честные цены без доплат на месте.',
    url: '/about',
    body: `
    <h1>О турбюро «Компас»</h1>
    <p class="text">Мы работаем с 2015 года и за это время отправили в путешествия по России больше 20 тысяч
      туристов. Каждый маршрут из нашего каталога сотрудники сначала проходят сами: проверяем гостиницы и турбазы,
      дороги и время переездов, договариваемся с местными гидами. Поэтому в программе тура нет «пустых» дней,
      а в стоимость уже входит всё, что обещано, без доплат на месте.</p>
    <p class="text">Наши группы небольшие — до 16 человек. Так гид успевает рассказать и показать больше,
      а путешествие проходит спокойно и без очередей. Мы подбираем туры для разных путешественников: лёгкие
      поездки выходного дня в Казань и Самару, семейные туры в Карелию и Крым, активные маршруты по горам
      Алтая, Урала и Кавказа, большие экспедиции на Байкал и Камчатку.</p>
    <p class="text">Перед поездкой менеджер подробно расскажет, какие вещи взять с собой, как добраться до места
      начала тура и какая погода ждёт вас в эти даты. После путешествия мы всегда просим оставить отзыв:
      так мы делаем маршруты ещё лучше.</p>
    <p class="text">Телефон: +7 (900) 000-00-00. Офис открыт ежедневно с 9:00 до 20:00.
      <a href="/">Посмотреть все туры</a></p>`,
  });
}

// ---------- Файлы для поисковых роботов (шаг 7) ----------
// robots.txt — правила для роботов: что можно обходить и где лежит карта сайта
function robotsTxt() {
  return `User-agent: *
Disallow: /api/
Sitemap: ${SITE}/sitemap.xml
`;
}

// sitemap.xml — карта сайта: список всех страниц, которые нужно показывать в поиске
function sitemapXml() {
  const urls = ['/', '/about', ...tours.map((t) => '/tours/' + t.slug)];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${SITE}${u}</loc></url>`).join('\n')}
</urlset>`;
}

// ---------- Выбор страницы по адресу ----------
// Получает адрес (например, '/tours/bajkal-zimoj') и возвращает страницу или null, если такой нет
function render(urlPath) {
  // Главная страница — каталог
  if (urlPath === '/') return { body: catalogPage() };
  if (urlPath === '/about') return { body: aboutPage() };
  if (urlPath === '/index.html') return { redirect: '/' };       // старый адрес главной → постоянная переадресация
  if (urlPath === '/robots.txt') return { type: 'text/plain; charset=utf-8', body: robotsTxt() };
  if (urlPath === '/sitemap.xml') return { type: 'application/xml; charset=utf-8', body: sitemapXml() };
  // Страница тура: /tours/ + короткое имя тура (slug)
  if (urlPath.startsWith('/tours/')) {
    const slug = urlPath.slice('/tours/'.length);             // всё, что после /tours/
    const tour = tours.find((t) => t.slug === slug);          // ищем тур с таким именем
    if (tour) return { body: tourPage(tour) };
  }
  return null;
}

module.exports = { render };
