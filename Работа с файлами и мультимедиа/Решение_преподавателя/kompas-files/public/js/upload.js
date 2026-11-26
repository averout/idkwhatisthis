// =====================================================================
// Отзыв с фото и видео: выбор, проверка, обработка и отправка файлов
// =====================================================================

// ---------- 1. Элементы страницы ----------
const form = document.getElementById('form');
const nameInput = document.getElementById('name');
const textInput = document.getElementById('text');
const photoInput = document.getElementById('photos');      // поле выбора фотографий
const preview = document.getElementById('preview');        // список выбранных фото
const videoInput = document.getElementById('video');       // поле выбора видео
const videoBox = document.getElementById('videoBox');      // место для просмотра видео
const statusText = document.getElementById('status');      // строка состояния под кнопкой
const reviewsList = document.getElementById('reviews');    // список опубликованных отзывов

// ---------- 2. Состояние: что пользователь уже выбрал ----------
let photos = [];      // выбранные фото: { file, url, small }
let video = null;     // выбранное видео: { file, url, duration }

// ---------- 3. Размер файла по-человечески: 3480518 → «3,3 МБ» ----------
function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' Б';
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' КБ';
  return (bytes / 1024 / 1024).toFixed(1).replace('.', ',') + ' МБ';
}

// ---------- 4. Проверка фото ----------
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];   // разрешённые типы
const MAX_PHOTO = 10 * 1024 * 1024;                          // 10 МБ в байтах
const MAX_COUNT = 6;                                         // не больше 6 фото

// Настоящий тип файла по первым байтам («сигнатуре»)
async function realType(file) {
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const text = (from, to) => String.fromCharCode(...head.slice(from, to));
  if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return 'image/jpeg';
  if (head[0] === 0x89 && text(1, 4) === 'PNG') return 'image/png';
  if (text(0, 4) === 'RIFF' && text(8, 12) === 'WEBP') return 'image/webp';
  return 'неизвестный формат';
}

async function checkPhoto(file) {
  if (photos.length >= MAX_COUNT) return 'Можно добавить не больше 6 фотографий';
  if (!ALLOWED.includes(file.type)) return 'Нужна фотография JPEG, PNG или WebP';
  if (file.size > MAX_PHOTO) return `Файл ${formatSize(file.size)} — больше 10 МБ`;
  const real = await realType(file);
  if (real !== file.type) return `По расширению — ${file.type}, а внутри — ${real}. Это не фото`;
  return '';
}

// ---------- 5. Уменьшение фото ----------
const MAX_SIDE = 1280;     // самая длинная сторона после уменьшения, пикселей

async function shrink(file) {
  // 1. Раскодировать фото в картинку (с учётом поворота снимков с телефона)
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  // 2. Посчитать новый размер с сохранением пропорций
  const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  // 3. Нарисовать на холсте (canvas) нового размера
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  canvas.getContext('2d').drawImage(bitmap, 0, 0, width, height);
  bitmap.close();                                   // освобождаем память
  // 4. Сохранить содержимое холста как JPEG с качеством 85 %
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.85));
}

// ---------- 6. Добавить одно фото в список ----------
async function addPhoto(file) {
  const row = document.createElement('div');
  row.className = 'photo';
  const url = URL.createObjectURL(file);     // ссылка на файл для предпросмотра
  row.innerHTML = `
    <img src="${url}" alt="">
    <div>
      <div class="photo__name">${file.name}</div>
      <p class="photo__info">${formatSize(file.size)} · ${file.type || 'тип неизвестен'}</p>
      <p class="photo__info photo__result">проверка…</p>
    </div>
    <button type="button" class="small-button">Убрать</button>`;
  preview.append(row);
  const result = row.querySelector('.photo__result');

  const error = await checkPhoto(file);
  if (error) {
    row.classList.add('photo--bad');
    result.outerHTML = `<p class="error">${error}</p>`;
  } else {
    const small = await shrink(file);
    photos.push({ file, url, small });
    result.textContent = `Будет отправлено: ${formatSize(small.size)}`;
  }

  // Кнопка «Убрать»
  row.querySelector('button').addEventListener('click', () => {
    row.remove();
    photos = photos.filter((p) => p.url !== url);
    URL.revokeObjectURL(url);   // освобождаем память: ссылка больше не нужна
  });
}

// ---------- 7. Пользователь выбрал файлы ----------
photoInput.addEventListener('change', async () => {
  const files = Array.from(photoInput.files);   // список выбранных файлов
  photoInput.value = '';                        // очищаем поле, чтобы можно было выбрать ещё
  for (const file of files) {
    await addPhoto(file);                       // по одному, по очереди
  }
});

// ---------- 8. Отправить один файл на сервер ----------
async function uploadFile(blob) {
  const response = await fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': blob.type },   // сообщаем серверу тип файла
    body: blob,                               // сам файл
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error);
  return data.url;                            // адрес файла на сервере
}

// ---------- 9. Показать отзывы ----------
// Заменяет символы < > & " на безопасные коды, чтобы текст отзыва не мог стать HTML-кодом
function escapeHtml(text) {
  return text.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

async function loadReviews() {
  const response = await fetch('/api/reviews');
  const reviews = await response.json();
  if (reviews.length === 0) {
    reviewsList.innerHTML = '<p class="empty">Пока нет отзывов — оставьте первый!</p>';
    return;
  }
  reviewsList.innerHTML = reviews.map((r) => `
    <article class="review">
      <p class="review__name">${escapeHtml(r.name)}</p>
      <p class="review__text">${escapeHtml(r.text)}</p>
      <div class="review__photos">
        ${r.photos.map((url) => `<img src="${url}" alt="" loading="lazy">`).join('')}
      </div>
      ${r.video ? `<video src="${r.video}" controls preload="metadata"></video>` : ''}
    </article>`).join('');
}

// ---------- 10. Отправка формы ----------
form.addEventListener('submit', async (event) => {
  event.preventDefault();                     // не перезагружать страницу
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;                     // защита от двойного нажатия
  try {
    statusText.textContent = 'Загружаем фото…';
    const photoUrls = [];
    for (const p of photos) {
      photoUrls.push(await uploadFile(p.small));
    }
    let videoUrl = null;
    if (video) {
      statusText.textContent = 'Загружаем видео…';
      videoUrl = await uploadFile(video.file);
    }
    statusText.textContent = 'Сохраняем отзыв…';
    const response = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: nameInput.value, text: textInput.value, photos: photoUrls, video: videoUrl }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error);

    statusText.textContent = 'Отзыв опубликован!';
    form.reset();                                     // очистить поля формы
    photos.forEach((p) => URL.revokeObjectURL(p.url));
    photos = [];
    preview.innerHTML = '';
    if (video) {
      URL.revokeObjectURL(video.url);
      video = null;
      videoBox.innerHTML = '';
    }
    loadReviews();
  } catch (err) {
    statusText.textContent = 'Ошибка: ' + err.message;
  } finally {
    button.disabled = false;
  }
});

loadReviews();

// ---------- 11. Видео ----------
const MAX_DURATION = 20;   // секунд

// Узнать длительность видео: браузер читает только начало файла (метаданные)
function getDuration(url) {
  return new Promise((resolve, reject) => {
    const probe = document.createElement('video');
    probe.preload = 'metadata';
    probe.onloadedmetadata = () => resolve(probe.duration);
    probe.onerror = () => reject(new Error('Браузер не может прочитать это видео'));
    probe.src = url;
  });
}

videoInput.addEventListener('change', async () => {
  const file = videoInput.files[0];
  videoInput.value = '';
  if (!file) return;
  if (video) URL.revokeObjectURL(video.url);    // убираем прежнее видео
  video = null;
  videoBox.innerHTML = '';

  const url = URL.createObjectURL(file);
  try {
    const duration = await getDuration(url);
    if (duration > MAX_DURATION) {
      URL.revokeObjectURL(url);
      videoBox.innerHTML = `<p class="error">Видео длится ${Math.round(duration)} с — допустимо не больше ${MAX_DURATION} с</p>`;
      return;
    }
    video = { file, url, duration };
    videoBox.innerHTML = `
      <p class="photo__info">${file.name} · ${formatSize(file.size)} · ${duration.toFixed(1)} с</p>
      <video src="${url}" controls muted></video>`;
  } catch (err) {
    URL.revokeObjectURL(url);
    videoBox.innerHTML = `<p class="error">${err.message}</p>`;
  }
});
