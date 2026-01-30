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

  const getLoginErrorMessage = (data) => {
    if (!data) return 'Ошибка входа. Проверьте логин и пароль.';
    if (typeof data === 'string') return data;
    if (data.non_field_errors?.length) return data.non_field_errors[0];
    if (data.detail) return data.detail;
    if (data.error) return data.error;
    const firstKey = Object.keys(data)[0];
    if (firstKey) {
      const value = data[firstKey];
      if (Array.isArray(value)) return value[0];
      if (typeof value === 'string') return value;
    }
    return 'Ошибка входа. Проверьте логин и пароль.';
  };

  // Функция логина
  const login = useCallback(async (username, password, expectedRole) => {
    setError(null);
    setLoading(true);

    try {
      const cleanUsername = typeof username === 'string' ? username.trim() : username;
      const response = await authAPI.login(cleanUsername, password, expectedRole);
      const { access, refresh, user: userData } = response.data;

      // Сохраняем токены
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      localStorage.setItem('user', JSON.stringify(userData));

      setUser(userData);
      setLoading(false);

      return userData;
    } catch (err) {
      const errorMessage = getLoginErrorMessage(err.response?.data);
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
      if (token && savedUser) {
        try {
          // Проверяем актуальность данных пользователя
          const response = await profileAPI.get();
          setUser(response.data);
          localStorage.setItem('user', JSON.stringify(response.data));
        } catch (err) {
          // Токен невалиден, очищаем данные
          console.error('Ошибка получения профиля:', err);
          logout();
        }
      }
      
      setLoading(false);
    };

    initAuth();
  }, [logout]);

  // Обновление данных пользователя
  const updateUser = useCallback(async () => {
    try {
      const response = await profileAPI.get();
      setUser(response.data);
      localStorage.setItem('user', JSON.stringify(response.data));
      return response.data;
    } catch (err) {
      console.error('Ошибка обновления профиля:', err);
      throw err;
    }
  }, []);

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
