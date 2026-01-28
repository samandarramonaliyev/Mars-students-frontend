/**
 * Навигационная панель.
 * Отображает логотип, баланс монет и аватар пользователя.
 */
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout, isStudent } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // URL аватара
  const avatarUrl = user?.avatar 
    ? (user.avatar.startsWith('http') ? user.avatar : `/media/${user.avatar}`)
    : null;

  return (
    <nav className="bg-space-900 border-b border-space-700 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Логотип */}
          <Link 
            to={user?.role === 'TEACHER' ? '/teacher' : '/student'} 
            className="flex items-center space-x-2"
          >
            <span className="text-2xl font-bold text-white">
              Mars <span className="text-mars-500">Devs</span>
            </span>
          </Link>

          {/* Правая часть */}
          <div className="flex items-center space-x-4">
            {/* Ссылка на шахматы (только для студентов) */}
            {isStudent && (
              <Link 
                to="/chess"
                className="flex items-center space-x-1 bg-space-800 hover:bg-space-700 px-3 py-1.5 rounded-lg transition-colors"
              >
                <span className="text-lg">♟️</span>
                <span className="text-white text-sm font-medium hidden sm:inline">Chess</span>
              </Link>
            )}

            {/* Баланс монет (только для студентов) */}
            {isStudent && (
              <div className="flex items-center space-x-2 bg-space-800 px-3 py-1.5 rounded-lg">
                <svg 
                  className="w-5 h-5 text-yellow-500" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6c.304 0 .792.193 1.264.979a1 1 0 001.715-1.029C12.279 4.784 11.232 4 10 4s-2.279.784-2.979 1.95c-.285.475-.507 1-.67 1.55H6a1 1 0 000 2h.013a9.358 9.358 0 000 1H6a1 1 0 100 2h.351c.163.55.385 1.075.67 1.55C7.721 15.216 8.768 16 10 16s2.279-.784 2.979-1.95a1 1 0 10-1.715-1.029c-.472.786-.96.979-1.264.979-.304 0-.792-.193-1.264-.979a4.265 4.265 0 01-.264-.521H10a1 1 0 100-2H8.017a7.36 7.36 0 010-1H10a1 1 0 100-2H8.472c.08-.185.167-.36.264-.521z" />
                </svg>
                <span className="font-semibold text-white">{user?.balance || 0}</span>
              </div>
            )}

            {/* Имя пользователя и роль */}
            <div className="hidden sm:block text-right">
              <p className="text-sm font-medium text-white">
                {user?.nickname || user?.first_name || user?.username}
              </p>
              <p className="text-xs text-gray-400">
                {user?.role === 'TEACHER' ? 'Преподаватель' : 'Студент'}
              </p>
            </div>

            {/* Аватар и меню */}
            <div className="relative group">
              <Link to="/profile">
                <div className="w-10 h-10 rounded-full overflow-hidden bg-space-700 border-2 border-space-600 hover:border-mars-500 transition-colors">
                  {avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      alt="Аватар" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </Link>

              {/* Выпадающее меню */}
              <div className="absolute right-0 mt-2 w-48 bg-space-800 rounded-lg shadow-lg border border-space-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div className="py-1">
                  <Link 
                    to="/profile" 
                    className="block px-4 py-2 text-sm text-gray-300 hover:bg-space-700 hover:text-white"
                  >
                    Профиль
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-space-700 hover:text-red-300"
                  >
                    Выйти
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
