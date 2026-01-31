/**
 * Настройка Axios для API запросов.
 * Включает interceptors для JWT токенов.
 */
import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT } from '../config/api';

// Базовый URL API
const API_URL = API_BASE_URL;

// Создание экземпляра axios
const api = axios.create({
  baseURL: API_URL,
  timeout: API_TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor для добавления токена к запросам
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor для обработки ответов и обновления токена
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Если получили 401 и это не повторный запрос
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        
        if (refreshToken) {
          // Пытаемся обновить токен
          const response = await axios.post(`${API_URL}/auth/refresh/`, {
            refresh: refreshToken,
          });

          const { access } = response.data;
          localStorage.setItem('access_token', access);

          // Повторяем оригинальный запрос с новым токеном
          originalRequest.headers.Authorization = `Bearer ${access}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Если не удалось обновить токен, очищаем данные и перенаправляем на логин
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API методы
export const authAPI = {
  // Логин пользователя
  login: (username, password) => 
    api.post('/auth/login/', { username, password }),
  
  // Обновление токена
  refreshToken: (refreshToken) => 
    api.post('/auth/refresh/', { refresh: refreshToken }),
};

export const profileAPI = {
  // Получить профиль
  get: () => api.get('/profile/'),
  
  // Обновить профиль
  update: (data) => api.patch('/profile/', data),
  
  // Загрузить аватар
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.patch('/profile/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const studentsAPI = {
  // Список студентов (для учителя)
  list: () => api.get('/students/'),
  
  // Создать студента
  create: (data) => api.post('/students/', data),
  
  // Получить студента
  get: (id) => api.get(`/students/${id}/`),
  
  // Обновить студента
  update: (id, data) => api.patch(`/students/${id}/`, data),
  
  // Операции с монетами
  getCoins: (id) => api.get(`/students/${id}/coins/`),
  updateCoins: (id, amount, reason) => 
    api.post(`/students/${id}/coins/`, { amount, reason }),
};

export const tasksAPI = {
  // Список заданий
  list: () => api.get('/tasks/'),
  
  // Отправить задание
  submit: (taskId, data) => {
    if (data instanceof FormData) {
      return api.post(`/tasks/${taskId}/submit/`, data, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }
    return api.post(`/tasks/${taskId}/submit/`, data);
  },
  
  // Список отправок (для учителя)
  submissions: (status) => 
    api.get('/submissions/', { params: status ? { status } : {} }),
  
  // Проверить отправку
  review: (submissionId, data) => 
    api.post(`/submissions/${submissionId}/review/`, data),
  
  // Мои отправки (для студента)
  mySubmissions: () => api.get('/my-submissions/'),
};

export const coinsAPI = {
  // Мои транзакции
  myTransactions: () => api.get('/my-coins/'),
};

export const typingAPI = {
  // Получить результаты
  results: () => api.get('/typing-results/'),
  
  // Сохранить результат
  save: (data) => api.post('/typing-results/', data),
};

export const chessAPI = {
  // История игр (старая - от учителя)
  history: (userId) => api.get('/chess-history/', { params: userId ? { user_id: userId } : {} }),
  
  // Добавить игру (для учителя)
  add: (data) => api.post('/chess-history/', data),
  
  // === Реальная игра в шахматы ===
  
  // Начать игру
  startGame: (opponentType, botLevel) => 
    api.post('/chess/start/', { opponent_type: opponentType, bot_level: botLevel }),
  
  // Завершить игру
  finishGame: (gameId, result) => 
    api.post('/chess/finish/', { game_id: gameId, result }),
  
  // Мои игры и статистика
  myGames: () => api.get('/chess/my-games/'),
  
  // Онлайн студенты для PvP
  onlineStudents: () => api.get('/chess/online-students/'),
  
  // Отправить приглашение
  sendInvite: (toPlayerId) => 
    api.post('/chess/invite/', { to_player_id: toPlayerId }),
  
  // Мои приглашения
  myInvites: () => api.get('/chess/my-invites/'),
  
  // Ответить на приглашение
  respondInvite: (inviteId, accept) => 
    api.post('/chess/respond-invite/', { invite_id: inviteId, accept }),
  
  // Отменить приглашение
  cancelInvite: (inviteId) => 
    api.post('/chess/cancel-invite/', { invite_id: inviteId }),
  
  // Состояние игры (PvP)
  getGameState: (gameId) => api.get(`/chess/game/${gameId}/`),
  
  // Сделать ход (PvP / fallback)
  makeMove: (gameId, data) =>
    api.post(`/chess/game/${gameId}/`, data),
};

export const teacherAPI = {
  // Статистика учителя
  stats: () => api.get('/teacher/stats/'),
};

export const shopAPI = {
  // Список товаров
  products: () => api.get('/shop/products/'),
  
  // Купить товар
  buy: (productId) => api.post('/shop/buy/', { product_id: productId }),
  
  // История покупок
  purchases: () => api.get('/shop/purchases/'),
};

export const notificationsAPI = {
  // Уведомления о начислении coin
  coins: () => api.get('/notifications/coins/'),
  
  // Пометить уведомления как просмотренные
  markCoinSeen: (ids) => api.post('/notifications/coins/mark-seen/', { ids }),
};

export default api;
