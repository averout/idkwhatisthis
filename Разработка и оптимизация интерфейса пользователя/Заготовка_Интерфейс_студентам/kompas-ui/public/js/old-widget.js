// Виджет онлайн-консультанта от стороннего подрядчика. ИЗМЕНЯТЬ НЕ НУЖНО.
// Имитирует «тяжёлую» библиотеку: при загрузке примерно 1,5 секунды
// занимает процессор (как будто разбирает и запускает много кода).

(function () {
  const start = Date.now();
  while (Date.now() - start < 1500) {
    // «работаем»: браузер в это время ничего не может показать
  }

  function addButton() {
    const button = document.createElement('button');
    button.className = 'chat-button';
    button.textContent = '💬 Задать вопрос';
    button.addEventListener('click', () => alert('Консультант скоро ответит'));
    document.body.append(button);
  }

  // Если страница ещё не готова — подождать, иначе добавить кнопку сразу
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addButton);
  } else {
    addButton();
  }
})();
