// =====================================================================
// Тот же каталог туров на фреймворке Vue
// =====================================================================

const { createApp } = Vue;   // берём из библиотеки функцию создания приложения

createApp({
  // data — СОСТОЯНИЕ приложения: все данные, от которых зависит страница
  data() {
    return {
      tours: [],          // все туры (загрузим с сервера)
      search: '',         // текст в поле поиска      (связан через v-model)
      region: '',         // выбранный регион          (связан через v-model)
      onlyCheap: false,   // отмечен ли флажок         (связан через v-model)
      sort: '',           // порядок сортировки        (связан через v-model)
    };
  },

  // computed — ВЫЧИСЛЯЕМЫЕ значения: Vue сам пересчитает их,
  // как только изменится любое значение из data, от которого они зависят
  computed: {
    filtered() {
      const text = this.search.trim().toLowerCase();
      const result = this.tours.filter((tour) => {
        if (text && !tour.title.toLowerCase().includes(text)) return false;
        if (this.region && tour.region !== this.region) return false;
        if (this.onlyCheap && tour.price > 20000) return false;
        return true;
      });
      if (this.sort === 'asc') result.sort((a, b) => a.price - b.price);
      if (this.sort === 'desc') result.sort((a, b) => b.price - a.price);
      return result;
    },
  },

  // methods — обычные функции, которые можно вызывать из разметки
  methods: {
    formatPrice(price) {
      return price.toLocaleString('ru-RU');
    },
  },

  // mounted — выполняется один раз, когда приложение появилось на странице
  mounted() {
    fetch('data/tours.json')
      .then((response) => response.json())
      .then((data) => {
        this.tours = data;   // меняем состояние — Vue сам перерисует страницу
      });
  },
}).mount('#app');            // «подключаем» приложение к элементу с id="app"
