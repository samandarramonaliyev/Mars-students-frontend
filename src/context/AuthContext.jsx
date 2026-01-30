/**
 * Контекст аутентификации для приложения.
 * Управляет JWT токенами и состоянием пользователя.
 * 
 * ВАЖНО О БЕЗОПАСНОСТИ:
 * В текущей реализации токены хранятся в localStorage для простоты.
 * Это делает приложение уязвимым к XSS атакам.
 * 
 * Для продакшена рекомендуется:
 * 1. Использовать httpOnly cookies для refresh токена
 * 2. Хранить access токен только в памяти (state)
 * 3. Настроить backend для установки Set-Cookie с httpOnly flag
 * 4. Включить CSRF защиту
 * 
 * См. README.md для подробных инструкций по настройке безопасного хранения токенов.
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI, profileAPI } from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const emitCoinReward = useCallback((prevBalance, nextBalance) => {
    if (typeof window === 'undefined') return;
    if (typeof prevBalance !== 'number' || typeof nextBalance !== 'number') return;
    if (nextBalance <= prevBalance) return;
    window.dispatchEvent(new CustomEvent('coins:earned', {
      detail: {
        amount: nextBalance - prevBalance,
        balance: nextBalance
      }
    }));
  }, []);

  // Функция логина
  const login = useCallback(async (username, password, expectedRole) => {
    setError(null);
    setLoading(true);

    try {
      const response = await authAPI.login(username, password, expectedRole);
      const { access, refresh, user: userData } = response.data;

      // Сохраняем токены
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user', JSON.stringify(userData));

      setUser(userData);
      setLoading(false);

      return userData;
    } catch (err) {
      const errorMessage = err.response?.data?.non_field_errors?.[0] 
        || err.response?.data?.detail 
        || 'Ошибка входа. Проверьте логин и пароль.';
      
      setError(errorMessage);
      setLoading(false);
      throw new Error(errorMessage);
    }
  }, []);

  // Функция выхода
  const logout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    setUser(null);
    setError(null);
  }, []);

  // Инициализация: проверяем наличие сохранённого токена
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('access_token');
      const savedUser = localStorage.getItem('user');
      let prevBalance = null;
      
      if (savedUser) {
        try {
          const savedUserData = JSON.parse(savedUser);
          if (typeof savedUserData?.balance === 'number') {
            prevBalance = savedUserData.balance;
          }
        } catch {
          prevBalance = null;
        }
      }
      
      if (token && savedUser) {
        try {
          // Проверяем актуальность данных пользователя
          const response = await profileAPI.get();
          setUser(response.data);
          localStorage.setItem('user', JSON.stringify(response.data));
          emitCoinReward(prevBalance, response.data?.balance);
        } catch (err) {
          // Токен невалиден, очищаем данные
          console.error('Ошибка получения профиля:', err);
          logout();
        }
      }
      
      setLoading(false);
    };

    initAuth();
  }, [emitCoinReward, logout]);

  // Обновление данных пользователя
  const updateUser = useCallback(async () => {
    const prevBalance = typeof user?.balance === 'number' ? user.balance : null;
    try {
      const response = await profileAPI.get();
      setUser(response.data);
      localStorage.setItem('user', JSON.stringify(response.data));
      emitCoinReward(prevBalance, response.data?.balance);
      return response.data;
    } catch (err) {
      console.error('Ошибка обновления профиля:', err);
      throw err;
    }
  }, [emitCoinReward, user]);

  // Проверка роли
  const isTeacher = user?.role === 'TEACHER';
  const isStudent = user?.role === 'STUDENT';
  const isAdmin = user?.role === 'ADMIN';

  const value = {
    user,
    loading,
    error,
    login,
    logout,
    updateUser,
    isAuthenticated: !!user,
    isTeacher,
    isStudent,
    isAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Хук для использования контекста аутентификации
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth должен использоваться внутри AuthProvider');
  }
  return context;
}

export default AuthContext;
