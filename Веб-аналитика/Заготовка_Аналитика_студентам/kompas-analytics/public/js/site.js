// Код самого сайта: выводит каталог, страницу тура и форму заявки. ИЗМЕНЯТЬ НЕ НУЖНО.

const page = document.body.dataset.page;                       // какая это страница: catalog, tour, booking
const params = new URLSearchParams(location.search);           // параметры из адреса (?id=3)

fetch('data/tours.json')
  .then((r) => r.json())
  .then((tours) => {
    const main = document.getElementById('content');

    if (page === 'catalog') {
      main.innerHTML = '<h1>Туры по России</h1><div class="list">' + tours.map((t) => `
        <a class="card" href="tour.html?id=${t.id}" data-tour-id="${t.id}">
          <img src="img/${t.photo}-400.jpg" alt="${t.title}" width="400" height="267">
          <div class="card__body">
            <h3 class="card__title">${t.title}</h3>
            <p class="card__meta">${t.region} · ${t.days} дн.</p>
            <div class="card__price">${t.price.toLocaleString('ru-RU')} ₽</div>
          </div>
        </a>`).join('') + '</div>';
    }

    if (page === 'tour') {
      const t = tours.find((x) => x.id === Number(params.get('id'))) || tours[0];
      main.innerHTML = `
        <div class="tour">
          <h1>${t.title}</h1>
          <img src="img/${t.photo}-800.jpg" alt="${t.title}" width="800" height="533">
          <p class="tour__price">${t.price.toLocaleString('ru-RU')} ₽</p>
          <p class="text">${t.region}, ${t.days} дн. Группа до 16 человек, проживание и трансферы включены,
            гид сопровождает всю поездку.</p>
          <a class="button" id="book-button" href="booking.html?id=${t.id}">Забронировать</a>
          <div class="spacer">Программа тура по дням, отзывы туристов, частые вопросы…</div>
        </div>`;
    }

    if (page === 'booking') {
      const t = tours.find((x) => x.id === Number(params.get('id'))) || tours[0];
      main.innerHTML = `
        <h1>Заявка: ${t.title}</h1>
        <form class="form" id="booking-form">
          <label>Имя <input name="name" required></label>
          <label>Телефон <input name="phone" type="tel" required></label>
          <button class="button" type="submit">Отправить заявку</button>
        </form>`;
      document.getElementById('booking-form').addEventListener('submit', (event) => {
        event.preventDefault();
        main.innerHTML = '<p class="thanks">Спасибо! Менеджер позвонит вам в течение часа.</p>';
        // Сообщаем остальным скриптам страницы, что заявка отправлена
        document.dispatchEvent(new CustomEvent('booking-sent', { detail: { tourId: t.id } }));
      });
    }

    // Сообщаем, что содержимое страницы готово (его ждёт счётчик)
    document.dispatchEvent(new Event('content-ready'));
  });
