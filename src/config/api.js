/**
 * Конфигурация API для Mars Devs.
 * Централизованное место для настроек API.
 */

// Базовый URL API из переменных окружения
// В development: /api (через vite proxy)
// В production: /api (через nginx proxy) или полный URL
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

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
  API_TIMEOUT,
  API_ENDPOINTS,
};
