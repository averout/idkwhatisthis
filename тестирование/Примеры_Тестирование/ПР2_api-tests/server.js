const { createServer } = require('./src/app');
const PORT = 3000;
createServer().listen(PORT, () => console.log('Сервер запущен: http://localhost:' + PORT + '/api/tasks'));
