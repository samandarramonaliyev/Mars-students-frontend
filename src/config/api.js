/**
 * Конфигурация API для Mars Devs.
 * Централизованное место для настроек API.
 */

// Определяем API URL автоматически
const getApiUrl = () => {
  // Если задана переменная окружения - используем её
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // В production на Render - используем backend URL
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    
    // Если на Render frontend - используем Render backend
    if (hostname.includes('mars-students-frontend.onrender.com')) {
      return 'https://mars-students-backend.onrender.com/api';
    }
    
    // Если на любом другом .onrender.com домене
    if (hostname.includes('.onrender.com')) {
      return 'https://mars-students-backend.onrender.com/api';
    }
  }
  
  // По умолчанию (localhost) - используем прокси
  return '/api';
};

export const API_BASE_URL = getApiUrl();

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
