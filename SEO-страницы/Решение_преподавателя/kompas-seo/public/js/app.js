// СТАРЫЙ ВАРИАНТ САЙТА: каталог и описание тура рисует браузер с помощью JavaScript.
// Человек видит страницу нормально, а поисковый робот, который не выполняет скрипты, — пустой <div>.

const app = document.getElementById('app');

fetch('/api/tours')
  .then((r) => r.json())
  .then((tours) => {
    function show() {
      const id = Number(location.hash.replace('#tour-', ''));
      const t = tours.find((x) => x.id === id);
      if (t) {
        // «Страница» тура — это та же страница, просто с другим содержимым
        app.innerHTML = `
          <div class="big">${t.title}</div>
          <img src="/img/${t.photo}-800.jpg" class="tour-photo">
          <div class="tour__price">${t.price.toLocaleString('ru-RU')} ₽</div>
          <div class="text">${t.text}</div>`;
      } else {
        app.innerHTML = '<div class="big">Туры</div><div class="list">' + tours.map((t) => `
          <div class="card" onclick="location.hash = 'tour-${t.id}'">
            <img src="/img/${t.photo}-400.jpg">
            <div class="card__body">
              <div class="card__title">${t.title}</div>
              <div class="card__meta">${t.region} · ${t.days} дн.</div>
              <div class="card__price">${t.price.toLocaleString('ru-RU')} ₽</div>
            </div>
          </div>`).join('') + '</div>';
      }
      window.scrollTo(0, 0);
    }
    show();
    window.addEventListener('hashchange', show);
  });
