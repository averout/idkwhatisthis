// Нагрузочный тест: node scale/load.js <адрес> <одновременных запросов> <секунд>
// Пример: node scale/load.js http://localhost:8080/api/heavy 20 10
const url = process.argv[2] || 'http://localhost:3000/api/heavy';
const concurrency = Number(process.argv[3]) || 20;
const seconds = Number(process.argv[4]) || 10;

const latencies = [];
const byInstance = {};
let errors = 0;
const until = Date.now() + seconds * 1000;

async function worker() {
  while (Date.now() < until) {
    const started = performance.now();
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      await res.arrayBuffer();
      if (!res.ok) { errors++; continue; }
      latencies.push(performance.now() - started);
      const inst = res.headers.get('x-instance') || 'напрямую';
      byInstance[inst] = (byInstance[inst] || 0) + 1;
    } catch {
      errors++;
    }
  }
}

(async () => {
  console.log(`Нагрузка: ${url}, ${concurrency} одновременных запросов, ${seconds} с`);
  await Promise.all(Array.from({ length: concurrency }, worker));
  latencies.sort((a, b) => a - b);
  const pct = p => latencies.length ? latencies[Math.min(latencies.length - 1, Math.floor(latencies.length * p))].toFixed(0) : '—';
  console.log(`Успешных запросов:     ${latencies.length}`);
  console.log(`Запросов в секунду:    ${(latencies.length / seconds).toFixed(1)}`);
  console.log(`Время ответа, медиана: ${pct(0.5)} мс`);
  console.log(`Время ответа, 95 %:    ${pct(0.95)} мс`);
  console.log(`Ошибок:                ${errors}`);
  console.log('Распределение по экземплярам:', byInstance);
})();
