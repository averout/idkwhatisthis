// Модуль проверки данных, введённых пользователем

function isNotEmpty(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isEmail(value) {
  if (typeof value !== 'string') return false;
  return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(value.trim());
}

function isStrongPassword(value) {
  if (typeof value !== 'string' || value.length < 8) return false;
  return /[a-z]/.test(value) && /[A-Z]/.test(value) && /[0-9]/.test(value);
}

module.exports = { isNotEmpty, isEmail, isStrongPassword };
