// =====================================================================
// Учебный SEO-робот. ИЗМЕНЯТЬ НЕ НУЖНО.
// Смотрит на сайт так, как его видит простой поисковый робот: скачивает HTML,
// НЕ выполняет JavaScript, переходит по ссылкам <a href="…"> и проверяет каждую страницу.
//
// Запуск (сервер должен работать в другом терминале):
//   node seo-check.js                       — обойти весь сайт, начиная с главной
//   node seo-check.js /tours/bajkal-zimoj   — подробно проверить одну страницу
// =====================================================================

const BASE = 'http://localhost:3000';
const MAX_PAGES = 60;

async function get(url) {
  try {
    const r = await fetch(BASE + url, { redirect: 'manual' });
    return { status: r.status, location: r.headers.get('location'), type: r.headers.get('content-type') || '', text: await r.text() };
  } catch {
    console.log('Сервер не отвечает. Запустите в другом терминале: node server.js');
    process.exit(1);
  }
}

const decode = (s) => s.replace(/&quot;/g, '"').replace(/&laquo;/g, '«').replace(/&raquo;/g, '»').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ');
function metaContent(html, attr, name) {
  const tag = (html.match(new RegExp(`<meta\\b[^>]*${attr}="${name}"[^>]*>`, 'i')) || [])[0];
  if (!tag) return null;
  const m = tag.match(/content="([^"]*)"/i);
  return m ? decode(m[1]).trim() : '';
}

// Разбор одной страницы
function analyze(html) {
  const title = (html.match(/<title>([\s\S]*?)<\/title>/i) || [])[1];
  const canonical = ((html.match(/<link\b[^>]*rel="canonical"[^>]*>/i) || [''])[0].match(/href="([^"]*)"/) || [])[1] || null;
  const imgs = html.match(/<img\b[^>]*>/gi) || [];
  const links = [...html.matchAll(/<a\b[^>]*href="([^"]*)"/gi)].map((m) => m[1].split('#')[0])
    .filter((h) => h.startsWith('/') && !h.startsWith('//'));
  const schemas = [...html.matchAll(/<script\b[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)].map((m) => {
    try { return JSON.parse(m[1])['@type'] || '(без @type)'; } catch { return 'ОШИБКА В JSON'; }
  });
  const text = html.replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<head[\s\S]*?<\/head>/i, ' ').replace(/<[^>]+>/g, ' ');
  return {
    lang: /<html\b[^>]*lang="ru"/i.test(html),
    title: title ? decode(title).trim() : null,
    description: metaContent(html, 'name', 'description'),
    h1: (html.match(/<h1[\s>]/gi) || []).length,
    imgs: imgs.length,
    noAlt: imgs.filter((i) => !/\balt="[^"]+"/i.test(i)).length,
    words: (decode(text).match(/[A-Za-zА-Яа-яЁё0-9-]{2,}/g) || []).length,
    canonical,
    og: ['og:title', 'og:description', 'og:image', 'og:url'].filter((p) => metaContent(html, 'property', p) !== null).length,
    schemas,
    links: [...new Set(links.map((h) => h.split('?')[0]))],
  };
}

function pageProblems(url, p) {
  const list = [];
  if (!p.lang) list.push('нет <html lang="ru"> — роботу сложнее понять язык страницы');
  if (!p.title) list.push('нет <title>');
  else if (p.title.length < 15 || p.title.length > 70) list.push(`длина title ${p.title.length} символов (нужно 15–70)`);
  if (p.description === null) list.push('нет <meta name="description">');
  else if (p.description.length < 50 || p.description.length > 170) list.push(`длина description ${p.description.length} символов (нужно 50–170)`);
  if (p.h1 !== 1) list.push(`заголовков h1: ${p.h1} (нужен ровно один)`);
  if (p.noAlt) list.push(`картинок без alt: ${p.noAlt} из ${p.imgs}`);
  if (p.words < 150) list.push(`мало текста: ${p.words} слов (нужно от 150)`);
  if (!p.canonical) list.push('нет <link rel="canonical">');
  else if (p.canonical !== BASE + url) list.push(`canonical указывает на ${p.canonical}`);
  if (p.og < 4) list.push(`Open Graph: ${p.og} из 4 тегов (og:title, og:description, og:image, og:url)`);
  if (url.startsWith('/tours/') && !p.schemas.length) list.push('нет микроразметки JSON-LD (schema.org)');
  if (p.schemas.includes('ОШИБКА В JSON')) list.push('ошибка в микроразметке JSON-LD — проверьте запятые и кавычки');
  return list;
}

// ---------- Режим 1: одна страница ----------
async function checkOne(url) {
  const r = await get(url);
  console.log(`\nСтраница ${url} — код ответа ${r.status}${r.location ? ' → ' + r.location : ''}\n`);
  if (r.status !== 200) return;
  const p = analyze(r.text);
  const rows = [
    ['title', p.title === null ? '— нет —' : `${p.title}  (${p.title.length} симв.)`],
    ['description', p.description === null ? '— нет —' : `${p.description}  (${p.description.length} симв.)`],
    ['h1', p.h1], ['картинок / без alt', `${p.imgs} / ${p.noAlt}`], ['слов текста', p.words],
    ['canonical', p.canonical || '— нет —'], ['Open Graph', `${p.og} из 4`],
    ['JSON-LD', p.schemas.join(', ') || '— нет —'], ['ссылок на свои страницы', p.links.length],
  ];
  for (const [k, v] of rows) console.log(k.padEnd(24), v);
  const problems = pageProblems(url, p);
  console.log(problems.length ? '\nЗамечания:\n  • ' + problems.join('\n  • ') : '\nЗамечаний нет.');
}

// ---------- Режим 2: обход всего сайта ----------
async function crawl() {
  const pages = new Map();               // адрес → результат разбора
  const incoming = new Map();            // адрес → с каких страниц на него ссылаются
  const broken = [];
  const queue = ['/'];
  while (queue.length && pages.size < MAX_PAGES) {
    const url = queue.shift();
    if (pages.has(url)) continue;
    const r = await get(url);
    if (r.status >= 300 && r.status < 400 && r.location) { pages.set(url, { redirect: r.location }); queue.push(r.location); continue; }
    if (r.status !== 200) { pages.set(url, { status: r.status }); continue; }
    const p = analyze(r.text);
    p.status = 200;
    pages.set(url, p);
    for (const link of p.links) {
      if (link === url) continue;
      if (!incoming.has(link)) incoming.set(link, new Set());
      incoming.get(link).add(url);
      if (!pages.has(link)) queue.push(link);
    }
  }
  for (const [url, p] of pages) {
    if (!p.status || p.status === 200) continue;
    const from = [...(incoming.get(url) || [])];
    broken.push(`${url} (код ${p.status}, ссылаются: ${from.slice(0, 2).join(', ')}${from.length > 2 ? ` и ещё ${from.length - 2} стр.` : ''})`);
  }

  const good = [...pages].filter(([, p]) => p.status === 200);
  console.log(`\nРобот нашёл страниц: ${good.length}\n`);
  console.log('Адрес'.padEnd(38), 'title', 'descr', 'h1', 'alt', 'слов', 'вход.ссылок');
  for (const [url, p] of good) {
    console.log(url.padEnd(38), String(p.title ? p.title.length : '—').padEnd(5), String(p.description ? p.description.length : '—').padEnd(5),
      String(p.h1).padEnd(2), String(p.noAlt ? '−' + p.noAlt : 'ok').padEnd(3), String(p.words).padEnd(4), incoming.has(url) ? incoming.get(url).size : 0);
  }

  // Файлы для роботов
  const robots = await get('/robots.txt');
  const robotsOk = robots.status === 200 && /sitemap:/i.test(robots.text);
  const sitemap = await get('/sitemap.xml');
  const inSitemap = sitemap.status === 200 ? [...sitemap.text.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(BASE, '')) : [];
  const sitemapBad = [];
  for (const u of inSitemap) { const r = await get(u); if (r.status !== 200) sitemapBad.push(`${u} (код ${r.status})`); }
  const notInSitemap = good.map(([u]) => u).filter((u) => !inSitemap.includes(u));
  const orphans = inSitemap.filter((u) => u !== '/' && !incoming.has(u));
  const indexDup = await get('/index.html');
  const indexOk = indexDup.status === 301 || indexDup.status === 404 || (indexDup.status === 200 && analyze(indexDup.text).canonical === BASE + '/');

  // Повторы title и description
  const dup = (field) => {
    const seen = {};
    for (const [u, p] of good) if (p[field]) (seen[p[field]] = seen[p[field]] || []).push(u);
    return Object.values(seen).filter((l) => l.length > 1);
  };
  const dupTitles = dup('title'), dupDescr = dup('description');

  // ---- Замечания ----
  console.log('\n================ ЗАМЕЧАНИЯ ПО СТРАНИЦАМ ================');
  let pageScore = { title: 0, description: 0, h1: 0, alt: 0, words: 0, canonical: 0, og: 0, schema: 0 };
  const tourPages = good.filter(([u]) => u.startsWith('/tours/'));
  for (const [url, p] of good) {
    const problems = pageProblems(url, p);
    if (problems.length) console.log(`\n${url}\n  • ` + problems.join('\n  • '));
    if (p.title && p.title.length >= 15 && p.title.length <= 70) pageScore.title++;
    if (p.description && p.description.length >= 50 && p.description.length <= 170) pageScore.description++;
    if (p.h1 === 1) pageScore.h1++;
    if (!p.noAlt) pageScore.alt++;
    if (p.words >= 150) pageScore.words++;
    if (p.canonical === BASE + url) pageScore.canonical++;
    if (p.og === 4) pageScore.og++;
  }
  for (const [, p] of tourPages) if (p.schemas.length && !p.schemas.includes('ОШИБКА В JSON')) pageScore.schema++;

  console.log('\n================ ЗАМЕЧАНИЯ ПО САЙТУ ================');
  const site = [];
  if (good.length < 10) site.push(`робот нашёл всего ${good.length} стр. Остальные он не видит: на них нет обычных ссылок <a href>, или содержимое рисует JavaScript`);
  if (broken.length) site.push('битые ссылки: ' + broken.join('; '));
  if (dupTitles.length) site.push('одинаковые title у страниц: ' + dupTitles.map((l) => l.join(' и ')).join('; '));
  if (dupDescr.length) site.push('одинаковые description у страниц: ' + dupDescr.map((l) => l.join(' и ')).join('; '));
  if (!robotsOk) site.push(robots.status === 200 ? 'в robots.txt нет строки Sitemap:' : 'нет файла /robots.txt');
  if (sitemap.status !== 200) site.push('нет файла /sitemap.xml');
  else {
    if (sitemapBad.length) site.push('в sitemap.xml есть неработающие адреса: ' + sitemapBad.join(', '));
    if (notInSitemap.length) site.push('страниц нет в sitemap.xml: ' + notInSitemap.join(', '));
    if (orphans.length) site.push('страницы-сироты (есть в sitemap, но на них никто не ссылается): ' + orphans.join(', '));
  }
  if (!indexOk) site.push('/index.html отдаёт копию главной страницы (дубль). Нужна переадресация 301 на / или canonical');
  console.log(site.length ? '  • ' + site.join('\n  • ') : '  Замечаний нет.');

  // ---- Оценка ----
  const n = good.length || 1;
  const share = (k, total = n) => (total ? pageScore[k] / total : 0);
  const parts = [
    ['Робот видит все страницы (от 10)', 10, Math.min(good.length / 10, 1)],
    ['Нет битых ссылок', 5, broken.length ? 0 : 1],
    ['Нет повторов title и description', 5, dupTitles.length || dupDescr.length ? 0 : 1],
    ['robots.txt со строкой Sitemap', 5, robotsOk ? 1 : 0],
    ['sitemap.xml: все страницы, без ошибок', 5, sitemap.status === 200 && !sitemapBad.length && !notInSitemap.length ? 1 : 0],
    ['Нет страниц-сирот', 5, sitemap.status === 200 && !orphans.length ? 1 : 0],
    ['Нет дубля /index.html', 5, indexOk ? 1 : 0],
    ['title нужной длины', 10, share('title')],
    ['description нужной длины', 10, share('description')],
    ['ровно один h1', 10, share('h1')],
    ['у всех картинок alt', 5, share('alt')],
    ['от 150 слов текста', 10, share('words')],
    ['canonical на себя', 5, share('canonical')],
    ['Open Graph (4 тега)', 5, share('og')],
    ['JSON-LD на страницах туров', 5, share('schema', tourPages.length)],
  ];
  console.log('\n================ ОЦЕНКА ================');
  let total = 0;
  for (const [name, max, k] of parts) {
    const pts = Math.round(max * k * 10) / 10;
    total += pts;
    console.log(name.padEnd(40), `${pts} из ${max}`);
  }
  console.log('-'.repeat(52));
  console.log('ИТОГО'.padEnd(40), `${Math.round(total)} из 100\n`);
}

const arg = process.argv[2];
if (arg) checkOne(arg.startsWith('/') ? arg : '/' + arg);
else crawl();
