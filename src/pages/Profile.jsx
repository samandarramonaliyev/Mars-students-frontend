/**
 * Страница профиля пользователя.
 * Редактирование профиля, загрузка аватара, история.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { profileAPI, coinsAPI, typingAPI, chessAPI, tasksAPI } from '../api/axios';
import { MEDIA_BASE_URL } from '../config/api';

export default function Profile() {
  const { user, updateUser, isStudent } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('info'); // 'info', 'tasks', 'coins', 'typing', 'chess'
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    nickname: user?.nickname || '',
    phone: user?.phone || '',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Данные для вкладок
  const [submissions, setSubmissions] = useState([]);
  const [coinHistory, setCoinHistory] = useState({ balance: 0, transactions: [] });
  const [typingResults, setTypingResults] = useState([]);
  const [chessHistory, setChessHistory] = useState({ games: [], stats: {} });
  const [tabLoading, setTabLoading] = useState(false);

  // Загрузка данных при смене вкладки
  useEffect(() => {
    if (!isStudent) return;
    
    const loadTabData = async () => {
      setTabLoading(true);
      try {
        switch (activeTab) {
          case 'tasks':
            const tasksRes = await tasksAPI.mySubmissions();
            setSubmissions(tasksRes.data);
            break;
          case 'coins':
            const coinsRes = await coinsAPI.myTransactions();
            setCoinHistory(coinsRes.data);
            break;
          case 'typing':
            const typingRes = await typingAPI.results();
            setTypingResults(typingRes.data);
            break;
          case 'chess':
            // Загружаем реальные игры с платформы
            const chessRes = await chessAPI.myGames();
            setChessHistory(chessRes.data);
            break;
        }
      } catch (err) {
        console.error('Ошибка загрузки данных:', err);
      } finally {
        setTabLoading(false);
      }
    };

    loadTabData();
  }, [activeTab, isStudent]);

  // Обработка выбора файла аватара
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Проверка типа файла
      if (!['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
        alert('Допустимые форматы: JPG, JPEG, PNG');
        return;
      }
      // Проверка размера (макс 2MB)
      if (file.size > 2 * 1024 * 1024) {
        alert('Размер файла не должен превышать 2MB');
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  // Сохранение профиля
  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Обновляем текстовые поля
      await profileAPI.update(formData);
      
      // Загружаем аватар, если выбран
      if (avatarFile) {
        await profileAPI.uploadAvatar(avatarFile);
      }

      // Обновляем данные пользователя
      await updateUser();
      
      setIsEditing(false);
      setAvatarFile(null);
      setAvatarPreview(null);
      alert('Профиль обновлён');
    } catch (err) {
      alert(err.response?.data?.detail || 'Ошибка сохранения');
    } finally {
      setIsSaving(false);
    }
  };

  // URL аватара
  const avatarUrl = avatarPreview 
    || (user?.avatar && (user.avatar.startsWith('http') ? user.avatar : `${MEDIA_BASE_URL}/media/${user.avatar}`));

  return (
    <div className="min-h-screen bg-space-950">
      <Navbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Шапка профиля */}
        <div className="card mb-6">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            {/* Аватар */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-space-700 border-4 border-space-600">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Аватар" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              {isEditing && (
                <label className="absolute bottom-0 right-0 w-8 h-8 bg-mars-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-mars-600 transition-colors">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/jpg"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Информация */}
            <div className="flex-1 text-center sm:text-left">
              {isEditing ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={formData.nickname}
                    onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                    className="input"
                    placeholder="Никнейм"
                  />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="input"
                    placeholder="Телефон"
                  />
                </div>
              ) : (
                <>
                  <h1 className="text-2xl font-bold text-white">
                    {user?.nickname || user?.first_name || user?.username}
                  </h1>
                  <p className="text-gray-400">@{user?.username}</p>
                  {user?.phone && <p className="text-gray-500 text-sm mt-1">{user.phone}</p>}
                </>
              )}
              
              <div className="flex items-center justify-center sm:justify-start gap-4 mt-3">
                <span className={`px-3 py-1 rounded-full text-sm ${
                  user?.role === 'TEACHER' 
                    ? 'bg-purple-600/30 text-purple-400' 
                    : 'bg-blue-600/30 text-blue-400'
                }`}>
                  {user?.role === 'TEACHER' ? 'Преподаватель' : 'Студент'}
                </span>
                {isStudent && (
                  <span className="px-3 py-1 rounded-full text-sm bg-space-700 text-gray-300">
                    {user?.student_group_display || 'Группа не указана'}
                  </span>
                )}
              </div>
            </div>

            {/* Кнопки */}
            <div className="flex gap-2">
              {isEditing ? (
                <>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setAvatarFile(null);
                      setAvatarPreview(null);
                      setFormData({ nickname: user?.nickname || '', phone: user?.phone || '' });
                    }}
                    className="btn-secondary"
                  >
                    Отмена
                  </button>
                  <button onClick={handleSave} disabled={isSaving} className="btn-primary">
                    {isSaving ? 'Сохранение...' : 'Сохранить'}
                  </button>
                </>
              ) : (
                <button onClick={() => setIsEditing(true)} className="btn-secondary">
                  Редактировать
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Табы (только для студентов) */}
        {isStudent && (
          <>
            <div className="flex space-x-1 mb-6 bg-space-900 p-1 rounded-lg overflow-x-auto">
              {[
                { id: 'info', label: 'Информация' },
                { id: 'tasks', label: 'Задания' },
                { id: 'coins', label: 'История монет' },
                { id: 'typing', label: 'Typing' },
                { id: 'chess', label: 'Шахматы' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-md font-medium transition-colors whitespace-nowrap ${
                    activeTab === tab.id ? 'bg-mars-500 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Контент вкладок */}
            {tabLoading ? (
              <div className="card py-12 text-center">
                <div className="w-8 h-8 border-2 border-mars-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            ) : (
              <>
                {activeTab === 'info' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="card">
                      <h3 className="text-lg font-semibold text-white mb-2">Баланс</h3>
                      <p className="text-3xl font-bold text-yellow-500">{user?.balance || 0}</p>
                      <p className="text-sm text-gray-400">монет</p>
                    </div>
                    <div className="card">
                      <h3 className="text-lg font-semibold text-white mb-2">Группа</h3>
                      <p className="text-3xl font-bold text-mars-500">{user?.student_group || '-'}</p>
                      <p className="text-sm text-gray-400">{user?.student_group_display}</p>
                    </div>
                  </div>
                )}

                {activeTab === 'tasks' && (
                  <div className="space-y-4">
                    {submissions.length === 0 ? (
                      <div className="card text-center py-8">
                        <p className="text-gray-400">Вы ещё не отправляли заданий</p>
                      </div>
                    ) : (
                      submissions.map((sub) => (
                        <div key={sub.id} className="card">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-semibold text-white">{sub.task_title}</h3>
                              <p className="text-sm text-gray-500">
                                {new Date(sub.submitted_at).toLocaleDateString('ru-RU')}
                              </p>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              sub.status === 'APPROVED' ? 'bg-green-600/30 text-green-400' :
                              sub.status === 'REJECTED' ? 'bg-red-600/30 text-red-400' :
                              'bg-yellow-600/30 text-yellow-400'
                            }`}>
                              {sub.status_display}
                            </span>
                          </div>
                          {sub.grade && (
                            <p className="mt-2 text-sm text-gray-400">
                              Оценка: <span className="text-white font-semibold">{sub.grade}</span>
                              {sub.coins_awarded > 0 && (
                                <span className="text-yellow-500 ml-2">+{sub.coins_awarded} монет</span>
                              )}
                            </p>
                          )}
                          {sub.teacher_comment && (
                            <p className="mt-2 text-sm text-gray-400">
                              Комментарий: {sub.teacher_comment}
                            </p>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'coins' && (
                  <div className="space-y-4">
                    <div className="card">
                      <p className="text-sm text-gray-400 mb-1">Текущий баланс</p>
                      <p className="text-3xl font-bold text-yellow-500">{coinHistory.balance} монет</p>
                    </div>
                    {coinHistory.transactions.length === 0 ? (
                      <div className="card text-center py-8">
                        <p className="text-gray-400">История транзакций пуста</p>
                      </div>
                    ) : (
                      coinHistory.transactions.map((tx) => (
                        <div key={tx.id} className="card flex justify-between items-center">
                          <div>
                            <p className="text-white">{tx.reason}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(tx.created_at).toLocaleDateString('ru-RU')} • {tx.source_display}
                            </p>
                          </div>
                          <span className={`text-lg font-bold ${tx.amount > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {tx.amount > 0 ? '+' : ''}{tx.amount}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'typing' && (
                  <div className="space-y-4">
                    {typingResults.length === 0 ? (
                      <div className="card text-center py-8">
                        <p className="text-gray-400">Пройдите тест печати, чтобы увидеть результаты</p>
                      </div>
                    ) : (
                      typingResults.map((result) => (
                        <div key={result.id} className="card">
                          <div className="grid grid-cols-4 gap-4 text-center">
                            <div>
                              <p className="text-2xl font-bold text-mars-500">{result.wpm}</p>
                              <p className="text-xs text-gray-400">WPM</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-green-400">{result.accuracy}%</p>
                              <p className="text-xs text-gray-400">Точность</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-blue-400">{result.characters_typed}</p>
                              <p className="text-xs text-gray-400">Символов</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-red-400">{result.errors}</p>
                              <p className="text-xs text-gray-400">Ошибок</p>
                            </div>
                          </div>
                          <p className="text-center text-sm text-gray-500 mt-2">
                            {new Date(result.created_at).toLocaleDateString('ru-RU')}
                          </p>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'chess' && (
                  <div className="space-y-4">
                    {/* Статистика */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <div className="card text-center">
                        <p className="text-2xl font-bold text-white">{chessHistory.stats?.total_games || 0}</p>
                        <p className="text-xs text-gray-400">Всего игр</p>
                      </div>
                      <div className="card text-center">
                        <p className="text-2xl font-bold text-green-400">{chessHistory.stats?.wins || 0}</p>
                        <p className="text-xs text-gray-400">Побед</p>
                      </div>
                      <div className="card text-center">
                        <p className="text-2xl font-bold text-red-400">{chessHistory.stats?.losses || 0}</p>
                        <p className="text-xs text-gray-400">Поражений</p>
                      </div>
                      <div className="card text-center">
                        <p className="text-2xl font-bold text-gray-400">{chessHistory.stats?.draws || 0}</p>
                        <p className="text-xs text-gray-400">Ничьих</p>
                      </div>
                      <div className="card text-center">
                        <p className="text-2xl font-bold text-yellow-500">{chessHistory.stats?.total_coins_earned || 0}</p>
                        <p className="text-xs text-gray-400">Монет заработано</p>
                      </div>
                    </div>

                    {/* Кнопка перехода к шахматам */}
                    <div className="text-center">
                      <button
                        onClick={() => navigate('/chess')}
                        className="btn-primary"
                      >
                        ♟️ Играть в шахматы
                      </button>
                    </div>

                    {/* История игр */}
                    <h3 className="text-lg font-semibold text-white">История партий</h3>
                    {(!chessHistory.games || chessHistory.games.length === 0) ? (
                      <div className="card text-center py-8">
                        <p className="text-gray-400">История шахматных игр пуста</p>
                        <p className="text-gray-500 text-sm mt-2">Сыграйте партию, чтобы увидеть результаты</p>
                      </div>
                    ) : (
                      chessHistory.games.map((game) => (
                        <div key={game.id} className="card">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="text-white font-medium">
                                vs {game.opponent_display || game.opponent_name || 'Противник'}
                              </p>
                              <p className="text-sm text-gray-500">
                                {new Date(game.finished_at || game.started_at).toLocaleDateString('ru-RU', {
                                  day: 'numeric',
                                  month: 'long',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                                {game.opponent_type === 'BOT' && (
                                  <span className="ml-2 text-gray-600">
                                    • {game.bot_level === 'easy' ? 'Легкий' : game.bot_level === 'medium' ? 'Средний' : 'Сложный'} бот
                                  </span>
                                )}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                game.result === 'WIN' ? 'bg-green-600/30 text-green-400' :
                                game.result === 'LOSE' ? 'bg-red-600/30 text-red-400' :
                                'bg-gray-600/30 text-gray-400'
                              }`}>
                                {game.result === 'WIN' ? 'Победа' : game.result === 'LOSE' ? 'Поражение' : 'Ничья'}
                              </span>
                              {game.coins_earned > 0 && (
                                <p className="text-yellow-500 text-sm mt-1">+{game.coins_earned} 🪙</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* Кнопка назад */}
        <div className="mt-6">
          <button
            onClick={() => navigate(-1)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            ← Назад
          </button>
        </div>
      </main>
    </div>
  );
}
