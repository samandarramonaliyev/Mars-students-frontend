/**
 * Страница логина с переключателем Teacher/Student.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [role, setRole] = useState('STUDENT'); // 'TEACHER' или 'STUDENT'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const user = await login(username, password, role);
      
      // Редирект в зависимости от роли
      if (user.role === 'TEACHER') {
        navigate('/teacher');
      } else {
        navigate('/student');
      }
    } catch (err) {
      setError(err.message || 'Ошибка входа');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      {/* Фоновые элементы */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-mars-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-space-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Логотип */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Mars <span className="text-mars-500">Devs</span>
          </h1>
          <p className="text-gray-400">Образовательная платформа</p>
        </div>

        {/* Карточка формы */}
        <div className="card">
          {/* Переключатель ролей */}
          <div className="flex mb-6 bg-space-800 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setRole('TEACHER')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all duration-200 ${
                role === 'TEACHER'
                  ? 'bg-mars-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Учитель
            </button>
            <button
              type="button"
              onClick={() => setRole('STUDENT')}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition-all duration-200 ${
                role === 'STUDENT'
                  ? 'bg-mars-500 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Студент
            </button>
          </div>

          {/* Форма */}
          <form onSubmit={handleSubmit}>
            {/* Ошибка */}
            {error && (
              <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Логин */}
            <div className="mb-4">
              <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-1">
                Логин
              </label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input"
                placeholder="Введите логин"
                required
                autoComplete="username"
              />
            </div>

            {/* Пароль */}
            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
                Пароль
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="Введите пароль"
                required
                autoComplete="current-password"
              />
            </div>

            {/* Кнопка входа */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary py-3 flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  Вход...
                </>
              ) : (
                `Войти как ${role === 'TEACHER' ? 'учитель' : 'студент'}`
              )}
            </button>
          </form>

          {/* Подсказка */}
          <p className="mt-6 text-center text-sm text-gray-500">
            {role === 'TEACHER' 
              ? 'Учётные записи учителей создаются администратором'
              : 'Учётные записи студентов создаются преподавателем'
            }
          </p>
        </div>

        {/* Футер */}
        <p className="mt-8 text-center text-sm text-gray-600">
          &copy; 2024 Mars Devs. Все права защищены.
        </p>
      </div>
    </div>
  );
}
