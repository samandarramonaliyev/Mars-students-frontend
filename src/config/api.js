/**
 * Конфигурация API для Mars Devs.
 * Централизованное место для настроек API.
 * 
 * ВАЖНО: Для production всегда устанавливайте VITE_API_URL в переменных окружения.
 * Формат: https://your-backend-domain.com/api (с /api на конце!)
 * 
 * Локально используется прокси через vite.config.js, поэтому VITE_API_URL = /api
 */

// Определяем API URL
const getApiUrl = () => {
  // Если задана переменная окружения - используем её
  // ВАЖНО: VITE_API_URL должен включать /api на конце
  if (import.meta.env.VITE_API_URL) {
    // Убираем trailing slash если есть и гарантируем /api на конце
    const rawUrl = import.meta.env.VITE_API_URL.replace(/\/$/, '');
    return rawUrl.endsWith('/api') ? rawUrl : `${rawUrl}/api`;
  }
  
  // Локально используем прокси Vite: /api -> http://localhost:8000/api
  if (import.meta.env.DEV) {
    return '/api';
  }
  
  // Production fallback (если rewrite/proxy не настроен)
  return 'https://mars-students-backend.onrender.com/api';
};

export const API_BASE_URL = getApiUrl();
// Базовый URL для медиа (убираем /api если есть)
export const MEDIA_BASE_URL = API_BASE_URL.replace(/\/api$/, '');

// Таймауты запросов (в миллисекундах)
export const API_TIMEOUT = 30000;

// Эндпоинты API
export const API_ENDPOINTS = {
  // Аутентификация
  AUTH: {
    LOGIN: '/auth/login/',
    REFRESH: '/auth/refresh/',
  },
  
  // Профиль
  PROFILE: '/profile/',
  
  // Студенты
  STUDENTS: {
    LIST: '/students/',
    DETAIL: (id) => `/students/${id}/`,
    COINS: (id) => `/students/${id}/coins/`,
  },
  
  // Задания
  TASKS: {
    LIST: '/tasks/',
    SUBMIT: (id) => `/tasks/${id}/submit/`,
    SUBMISSIONS: '/submissions/',
    REVIEW: (id) => `/submissions/${id}/review/`,
    MY_SUBMISSIONS: '/my-submissions/',
  },
  
  // Монеты
  COINS: {
    MY_TRANSACTIONS: '/my-coins/',
  },
  
  // Typing
  TYPING: {
    RESULTS: '/typing-results/',
  },
  
  // Шахматы
  CHESS: {
    HISTORY: '/chess-history/',
    START: '/chess/start/',
    FINISH: '/chess/finish/',
    MY_GAMES: '/chess/my-games/',
    ONLINE_STUDENTS: '/chess/online-students/',
    INVITE: '/chess/invite/',
    MY_INVITES: '/chess/my-invites/',
    RESPOND_INVITE: '/chess/respond-invite/',
    CANCEL_INVITE: '/chess/cancel-invite/',
    GAME: (id) => `/chess/game/${id}/`,
  },
  
  // Курсы
  COURSES: '/courses/',
  
  // Статистика учителя
  TEACHER: {
    STATS: '/teacher/stats/',
  },
  
  // Магазин
  SHOP: {
    PRODUCTS: '/shop/products/',
    BUY: '/shop/buy/',
    PURCHASES: '/shop/purchases/',
  },
};

export default {
  API_BASE_URL,
  MEDIA_BASE_URL,
  API_TIMEOUT,
  API_ENDPOINTS,
};
