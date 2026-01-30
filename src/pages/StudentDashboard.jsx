/**
 * Дашборд студента.
 * Содержит задания, typing, обзор и магазин.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import Navbar from '../components/Navbar';
import TypingWidget from '../components/TypingWidget';
import TaskList from '../components/TaskList';
import TaskSubmitModal from '../components/TaskSubmitModal';
import { useAuth } from '../context/AuthContext';
import { shopAPI } from '../api/axios';

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'tasks', 'typing', 'shop'
  const [selectedTask, setSelectedTask] = useState(null);
  const { user, updateUser } = useAuth();
  
  // Данные магазина
  const [products, setProducts] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [shopLoading, setShopLoading] = useState(false);
  const [buyingProduct, setBuyingProduct] = useState(null);
  
  // Модальное окно после покупки
  const [purchaseResult, setPurchaseResult] = useState(null);
  
  // Уведомление о награде монет
  const [coinReward, setCoinReward] = useState(null);
  const [confettiPieces, setConfettiPieces] = useState([]);
  const hideRewardTimeoutRef = useRef(null);

  const createConfettiPieces = () => {
    const colors = ['#F59E0B', '#F97316', '#10B981', '#3B82F6', '#A855F7', '#F43F5E'];
    return Array.from({ length: 36 }).map((_, idx) => ({
      id: idx,
      left: Math.random() * 100,
      size: 6 + Math.random() * 6,
      delay: Math.random() * 0.4,
      duration: 2.2 + Math.random() * 1.4,
      rotation: Math.random() * 360,
      color: colors[Math.floor(Math.random() * colors.length)]
    }));
  };

  const handleTaskSelect = (task) => {
    setSelectedTask(task);
  };

  const handleCloseModal = () => {
    setSelectedTask(null);
  };

  // Загрузка данных магазина
  const loadShopData = useCallback(async () => {
    setShopLoading(true);
    try {
      const [productsRes, purchasesRes] = await Promise.all([
        shopAPI.products(),
        shopAPI.purchases()
      ]);
      setProducts(productsRes.data);
      setPurchases(purchasesRes.data);
    } catch (err) {
      console.error('Ошибка загрузки магазина:', err);
    } finally {
      setShopLoading(false);
    }
  }, []);

  // Загружаем данные магазина при переключении на вкладку
  useEffect(() => {
    if (activeTab === 'shop') {
      loadShopData();
    }
  }, [activeTab, loadShopData]);

  useEffect(() => {
    if (!user?.id) return;
    const interval = setInterval(() => {
      updateUser();
    }, 15000);
    return () => clearInterval(interval);
  }, [updateUser, user?.id]);

  useEffect(() => {
    const handleCoinsEarned = (event) => {
      const amount = event?.detail?.amount;
      if (!amount || amount <= 0) return;
      
      setCoinReward({ amount });
      setConfettiPieces(createConfettiPieces());
      
      if (hideRewardTimeoutRef.current) {
        clearTimeout(hideRewardTimeoutRef.current);
      }
      hideRewardTimeoutRef.current = setTimeout(() => {
        setCoinReward(null);
        setConfettiPieces([]);
      }, 3200);
    };

    window.addEventListener('coins:earned', handleCoinsEarned);
    return () => {
      window.removeEventListener('coins:earned', handleCoinsEarned);
      if (hideRewardTimeoutRef.current) {
        clearTimeout(hideRewardTimeoutRef.current);
      }
    };
  }, []);

  // Покупка товара
  const handleBuyProduct = async (product) => {
    if (!product.in_stock) {
      alert('Товар закончился');
      return;
    }
    
    if (user.balance < product.price) {
      alert('Недостаточно монет для покупки');
      return;
    }
    
    if (!confirm(`Купить "${product.name}" за ${product.price} монет?`)) {
      return;
    }
    
    setBuyingProduct(product.id);
    try {
      const response = await shopAPI.buy(product.id);
      // Показываем модальное окно с кодом покупки
      setPurchaseResult({
        purchase_code: response.data.purchase_code,
        product_name: response.data.product_name,
        price: response.data.price
      });
      // Обновляем баланс пользователя
      await updateUser();
      // Обновляем историю покупок
      loadShopData();
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка покупки');
    } finally {
      setBuyingProduct(null);
    }
  };

  return (
    <div className="min-h-screen bg-space-950">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative">
        {coinReward && activeTab === 'dashboard' && (
          <div className="fixed inset-0 pointer-events-none z-50">
            <div className="absolute inset-0 overflow-hidden">
              {confettiPieces.map(piece => (
                <span
                  key={piece.id}
                  className="confetti-piece"
                  style={{
                    left: `${piece.left}%`,
                    width: `${piece.size}px`,
                    height: `${piece.size * 1.4}px`,
                    backgroundColor: piece.color,
                    animationDelay: `${piece.delay}s`,
                    animationDuration: `${piece.duration}s`,
                    transform: `rotate(${piece.rotation}deg)`
                  }}
                />
              ))}
            </div>
            <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-space-900/90 border border-mars-500/50 text-white px-6 py-3 rounded-xl shadow-xl backdrop-blur">
              <span className="text-lg font-semibold">
                🎉 Вам начислено {coinReward.amount} 🪙
              </span>
            </div>
          </div>
        )}
        {/* Приветствие */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Привет, {user?.nickname || user?.first_name || 'Студент'}!
          </h1>
          <p className="text-gray-400">
            Группа: {user?.student_group_display || 'Не указана'}
          </p>
        </div>

        {/* Быстрые действия */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <button
            onClick={() => setActiveTab('tasks')}
            className={`card-hover text-left ${activeTab === 'tasks' ? 'border-mars-500' : ''}`}
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-lg bg-mars-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-mars-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-white">Задания</h3>
                <p className="text-sm text-gray-400">Посмотреть список заданий</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('typing')}
            className={`card-hover text-left ${activeTab === 'typing' ? 'border-mars-500' : ''}`}
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-white">Typing</h3>
                <p className="text-sm text-gray-400">Тренировка скорости печати</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('dashboard')}
            className={`card-hover text-left ${activeTab === 'dashboard' ? 'border-mars-500' : ''}`}
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold text-white">Обзор</h3>
                <p className="text-sm text-gray-400">Общая информация</p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('shop')}
            className={`card-hover text-left ${activeTab === 'shop' ? 'border-mars-500' : ''}`}
          >
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                <span className="text-2xl">🛒</span>
              </div>
              <div>
                <h3 className="font-semibold text-white">Магазин</h3>
                <p className="text-sm text-gray-400">Тратить монеты</p>
              </div>
            </div>
          </button>
        </div>

        {/* Контент в зависимости от вкладки */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Статистика */}
            <div className="card">
              <h2 className="text-xl font-semibold text-white mb-4">Статистика</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-space-800 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-yellow-500">{user?.balance || 0}</p>
                  <p className="text-sm text-gray-400">Монет</p>
                </div>
                <div className="bg-space-800 rounded-lg p-4 text-center">
                  <p className="text-3xl font-bold text-mars-500">{user?.student_group || '-'}</p>
                  <p className="text-sm text-gray-400">Группа</p>
                </div>
              </div>
            </div>

            {/* Быстрый typing */}
            <TypingWidget />
          </div>
        )}

        {activeTab === 'tasks' && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Список заданий</h2>
            <TaskList onSelectTask={handleTaskSelect} />
          </div>
        )}

        {activeTab === 'typing' && (
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Тренировка печати</h2>
            <TypingWidget />
          </div>
        )}

        {activeTab === 'shop' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-white">Магазин</h2>
              <div className="bg-space-800 px-4 py-2 rounded-lg">
                <span className="text-gray-400">Ваш баланс: </span>
                <span className="text-yellow-500 font-bold">{user?.balance || 0} 🪙</span>
              </div>
            </div>

            {shopLoading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-2 border-mars-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            ) : (
              <>
                {/* Товары */}
                {products.length === 0 ? (
                  <div className="card text-center py-8">
                    <p className="text-gray-400">Товары пока недоступны</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {products.map(product => {
                      // Формируем URL изображения
                      const imageUrl = product.image 
                        ? (product.image.startsWith('http') 
                            ? product.image 
                            : `http://localhost:8000${product.image}`)
                        : null;
                      
                      // Проверка доступности для покупки
                      const canBuy = product.in_stock && user?.balance >= product.price;
                      const isOutOfStock = !product.in_stock;
                      const notEnoughCoins = product.in_stock && user?.balance < product.price;
                      
                      return (
                        <div key={product.id} className="card relative">
                          {/* Метка "Нет в наличии" */}
                          {isOutOfStock && (
                            <div className="absolute top-2 right-2 bg-red-600 text-white text-xs px-2 py-1 rounded">
                              Нет в наличии
                            </div>
                          )}
                          
                          {imageUrl && (
                            <img 
                              src={imageUrl}
                              alt={product.name}
                              className={`w-full h-40 object-cover rounded-lg mb-4 ${isOutOfStock ? 'opacity-50' : ''}`}
                            />
                          )}
                          <h3 className="text-lg font-semibold text-white mb-2">{product.name}</h3>
                          {product.description && (
                            <p className="text-gray-400 text-sm mb-4">{product.description}</p>
                          )}
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="text-yellow-500 font-bold text-lg">{product.price} 🪙</span>
                              {product.quantity > 0 && (
                                <span className="text-gray-500 text-xs ml-2">({product.quantity} шт.)</span>
                              )}
                            </div>
                            <button
                              onClick={() => handleBuyProduct(product)}
                              disabled={buyingProduct === product.id || !canBuy}
                              className={`px-4 py-2 rounded-lg transition-colors ${
                                !canBuy
                                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                  : 'bg-mars-600 hover:bg-mars-700 text-white'
                              }`}
                            >
                              {buyingProduct === product.id ? 'Покупка...' : 
                               isOutOfStock ? 'Нет в наличии' :
                               notEnoughCoins ? 'Недостаточно' : 'Купить'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* История покупок */}
                <h3 className="text-lg font-semibold text-white mb-4">История покупок</h3>
                {purchases.length === 0 ? (
                  <div className="card text-center py-8">
                    <p className="text-gray-400">У вас пока нет покупок</p>
                  </div>
                ) : (
                  <div className="card overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-space-700">
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Дата</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Товар</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Код</th>
                          <th className="text-left py-3 px-4 text-gray-400 font-medium">Статус</th>
                          <th className="text-right py-3 px-4 text-gray-400 font-medium">Цена</th>
                        </tr>
                      </thead>
                      <tbody>
                        {purchases.map(purchase => {
                          // Статусы с иконками
                          const statusConfig = {
                            PENDING: { icon: '🟡', text: 'Можно забрать', color: 'text-yellow-400' },
                            SOLD: { icon: '✅', text: 'Получено', color: 'text-green-400' },
                            RETURNED: { icon: '🔴', text: 'Возвращено', color: 'text-red-400' },
                          };
                          const statusInfo = statusConfig[purchase.status] || statusConfig.PENDING;
                          
                          return (
                            <tr key={purchase.id} className="border-b border-space-800">
                              <td className="py-3 px-4 text-gray-300">
                                {new Date(purchase.purchased_at).toLocaleDateString('ru-RU')}
                              </td>
                              <td className="py-3 px-4 text-white">{purchase.product_name}</td>
                              <td className="py-3 px-4 text-mars-400 font-mono text-sm">{purchase.purchase_code}</td>
                              <td className={`py-3 px-4 ${statusInfo.color}`}>
                                {statusInfo.icon} {statusInfo.text}
                              </td>
                              <td className="py-3 px-4 text-yellow-500 text-right">{purchase.price} 🪙</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </main>

      {/* Модальное окно для отправки задания */}
      {selectedTask && (
        <TaskSubmitModal task={selectedTask} onClose={handleCloseModal} />
      )}

      {/* Модальное окно после покупки */}
      {purchaseResult && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-space-900 rounded-xl border border-space-700 w-full max-w-md">
            <div className="p-6 text-center">
              {/* Иконка успеха */}
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h2 className="text-xl font-semibold text-white mb-2">Покупка успешна!</h2>
              <p className="text-gray-400 mb-4">{purchaseResult.product_name}</p>
              
              {/* Код покупки */}
              <div className="bg-space-800 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-400 mb-2">Ваш код товара:</p>
                <p className="text-xl font-mono font-bold text-mars-400 select-all">
                  {purchaseResult.purchase_code}
                </p>
              </div>
              
              {/* Инструкция */}
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3 mb-6">
                <p className="text-sm text-yellow-400">
                  ⚠️ Сохраните этот код! Он нужен для получения товара.
                </p>
              </div>
              
              <button
                onClick={() => setPurchaseResult(null)}
                className="w-full btn-primary"
              >
                Понятно
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
