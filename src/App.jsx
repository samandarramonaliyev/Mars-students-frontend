/**
 * Главный компонент приложения Mars Devs.
 * Настройка роутинга и защита маршрутов.
 */
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Страницы
import Login from './pages/Login';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentDashboard from './pages/StudentDashboard';
import Profile from './pages/Profile';
import Chess from './pages/Chess';

// Компонент загрузки
function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-space-950">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-mars-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-400">Загрузка...</p>
      </div>
    </div>
  );
}

// Защищённый роут
function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Перенаправляем на соответствующий дашборд
    if (user.role === 'TEACHER') {
      return <Navigate to="/teacher" replace />;
    }
    return <Navigate to="/student" replace />;
  }

  return children;
}

// Публичный роут (для неавторизованных)
function PublicRoute({ children }) {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    // Перенаправляем авторизованных пользователей
    if (user.role === 'TEACHER') {
      return <Navigate to="/teacher" replace />;
    }
    return <Navigate to="/student" replace />;
  }

  return children;
}

function App() {
  return (
    <div className="min-h-screen bg-space-950">
      <Routes>
        {/* Публичные маршруты */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />

        {/* Защищённые маршруты для учителей */}
        <Route
          path="/teacher"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/teacher/*"
          element={
            <ProtectedRoute allowedRoles={['TEACHER']}>
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />

        {/* Защищённые маршруты для студентов */}
        <Route
          path="/student"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/*"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        {/* Шахматы (только для студентов) */}
        <Route
          path="/chess"
          element={
            <ProtectedRoute allowedRoles={['STUDENT']}>
              <Chess />
            </ProtectedRoute>
          }
        />

        {/* Профиль (для всех авторизованных) */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={['TEACHER', 'STUDENT']}>
              <Profile />
            </ProtectedRoute>
          }
        />

        {/* Редирект с главной */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* 404 */}
        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-mars-500 mb-4">404</h1>
                <p className="text-gray-400 mb-4">Страница не найдена</p>
                <a href="/login" className="btn-primary">
                  На главную
                </a>
              </div>
            </div>
          }
        />
      </Routes>
    </div>
  );
}

export default App;
