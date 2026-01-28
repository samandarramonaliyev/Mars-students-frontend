/**
 * Компонент списка заданий.
 * Для студентов показывает задания для их группы.
 * Для учителей показывает все задания.
 */
import { useState, useEffect } from 'react';
import { tasksAPI } from '../api/axios';
import { useAuth } from '../context/AuthContext';

export default function TaskList({ onSelectTask }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const { isStudent } = useAuth();

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      const response = await tasksAPI.list();
      setTasks(response.data);
    } catch (err) {
      setError('Не удалось загрузить задания');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (task) => {
    if (!task.is_submitted) {
      return (
        <span className="px-2 py-1 text-xs rounded-full bg-gray-600 text-gray-300">
          Не выполнено
        </span>
      );
    }

    switch (task.submission_status) {
      case 'PENDING':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-yellow-600/30 text-yellow-400">
            На проверке
          </span>
        );
      case 'APPROVED':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-green-600/30 text-green-400">
            Одобрено
          </span>
        );
      case 'REJECTED':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-red-600/30 text-red-400">
            Отклонено
          </span>
        );
      default:
        return null;
    }
  };

  const getGroupBadge = (group) => {
    switch (group) {
      case 'FRONTEND':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-blue-600/30 text-blue-400">
            Frontend
          </span>
        );
      case 'BACKEND':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-purple-600/30 text-purple-400">
            Backend
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-gray-600/30 text-gray-400">
            Все группы
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-space-800 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <p className="text-red-400 text-center">{error}</p>
        <button onClick={loadTasks} className="mt-4 btn-secondary w-full">
          Попробовать снова
        </button>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="card text-center py-8">
        <svg 
          className="w-16 h-16 text-gray-600 mx-auto mb-4" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" 
          />
        </svg>
        <p className="text-gray-400">Заданий пока нет</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tasks.map((task) => (
        <div 
          key={task.id}
          className="card-hover cursor-pointer"
          onClick={() => onSelectTask && onSelectTask(task)}
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-white">{task.title}</h3>
            <div className="flex gap-2">
              {getGroupBadge(task.target_group)}
              {isStudent && getStatusBadge(task)}
            </div>
          </div>
          
          <p className="text-gray-400 text-sm mb-3 line-clamp-2">
            {task.description}
          </p>
          
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center text-yellow-500">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6c.304 0 .792.193 1.264.979a1 1 0 001.715-1.029C12.279 4.784 11.232 4 10 4s-2.279.784-2.979 1.95c-.285.475-.507 1-.67 1.55H6a1 1 0 000 2h.013a9.358 9.358 0 000 1H6a1 1 0 100 2h.351c.163.55.385 1.075.67 1.55C7.721 15.216 8.768 16 10 16s2.279-.784 2.979-1.95a1 1 0 10-1.715-1.029c-.472.786-.96.979-1.264.979-.304 0-.792-.193-1.264-.979a4.265 4.265 0 01-.264-.521H10a1 1 0 100-2H8.017a7.36 7.36 0 010-1H10a1 1 0 100-2H8.472c.08-.185.167-.36.264-.521z" />
              </svg>
              <span>{task.reward_coins} монет</span>
            </div>
            
            {task.deadline && (
              <span className="text-gray-500">
                До: {new Date(task.deadline).toLocaleDateString('ru-RU')}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
