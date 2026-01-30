/**
 * Страница шахмат.
 * Игра против бота или другого студента.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess as ChessJS } from 'chess.js';
import { useAuth } from '../context/AuthContext';
import { chessAPI } from '../api/axios';
import Navbar from '../components/Navbar';

// Награды за победу
const REWARDS = {
  BOT: { easy: 45, medium: 75, hard: 100 },
  STUDENT: 50
};

// Компонент модального окна результата
function ResultModal({ isOpen, result, coinsEarned, onClose, opponentName }) {
  if (!isOpen) return null;

  const resultText = {
    WIN: 'Победа! 🎉',
    LOSE: 'Поражение 😔',
    DRAW: 'Ничья 🤝'
  };

  const resultColor = {
    WIN: 'text-green-500',
    LOSE: 'text-red-500',
    DRAW: 'text-yellow-500'
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-space-800 rounded-xl p-8 max-w-md w-full mx-4 text-center">
        <h2 className={`text-4xl font-bold mb-4 ${resultColor[result]}`}>
          {resultText[result]}
        </h2>
        <p className="text-gray-300 mb-4">
          Игра против {opponentName}
        </p>
        {coinsEarned > 0 && (
          <div className="bg-space-700 rounded-lg p-4 mb-6">
            <p className="text-yellow-500 text-2xl font-bold">
              +{coinsEarned} 🪙
            </p>
            <p className="text-gray-400 text-sm">монет заработано</p>
          </div>
        )}
        <button 
          onClick={onClose}
          className="btn-primary w-full"
        >
          Продолжить
        </button>
      </div>
    </div>
  );
}

// Компонент выбора режима игры
function ModeSelector({ onSelectBot, onSelectPvP }) {
  return (
    <div className="text-center">
      <h2 className="text-2xl font-bold text-white mb-8">Выберите режим игры</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
        <button
          onClick={onSelectBot}
          className="bg-space-800 hover:bg-space-700 border border-space-600 rounded-xl p-8 transition-all hover:border-mars-500"
        >
          <div className="text-5xl mb-4">🤖</div>
          <h3 className="text-xl font-bold text-white mb-2">Играть с ботом</h3>
          <p className="text-gray-400">
            Выберите уровень сложности и сразитесь с компьютером
          </p>
        </button>
        <button
          onClick={onSelectPvP}
          className="bg-space-800 hover:bg-space-700 border border-space-600 rounded-xl p-8 transition-all hover:border-mars-500"
        >
          <div className="text-5xl mb-4">👤</div>
          <h3 className="text-xl font-bold text-white mb-2">Играть со студентом</h3>
          <p className="text-gray-400">
            Пригласите другого студента на партию
          </p>
        </button>
      </div>
    </div>
  );
}

// Компонент выбора уровня бота
function BotLevelSelector({ onSelect, onBack }) {
  const levels = [
    { id: 'easy', name: 'Легкий', description: 'Случайные ходы', reward: 45, emoji: '😊' },
    { id: 'medium', name: 'Средний', description: 'Приоритет взятий', reward: 75, emoji: '🤔' },
    { id: 'hard', name: 'Сложный', description: 'Продуманная игра', reward: 100, emoji: '🧠' }
  ];

  return (
    <div className="text-center">
      <button 
        onClick={onBack}
        className="mb-4 text-gray-400 hover:text-white transition-colors"
      >
        ← Назад
      </button>
      <h2 className="text-2xl font-bold text-white mb-8">Выберите уровень бота</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
        {levels.map(level => (
          <button
            key={level.id}
            onClick={() => onSelect(level.id)}
            className="bg-space-800 hover:bg-space-700 border border-space-600 rounded-xl p-6 transition-all hover:border-mars-500"
          >
            <div className="text-4xl mb-3">{level.emoji}</div>
            <h3 className="text-lg font-bold text-white mb-1">{level.name}</h3>
            <p className="text-gray-400 text-sm mb-3">{level.description}</p>
            <div className="text-yellow-500 font-bold">
              +{level.reward} 🪙 за победу
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// Компонент выбора противника (PvP)
function PvPSelector({ onBack, onGameStart }) {
  const [students, setStudents] = useState([]);
  const [invites, setInvites] = useState({ incoming: [], outgoing: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Загрузка данных
  const loadData = useCallback(async () => {
    try {
      const [studentsRes, invitesRes] = await Promise.all([
        chessAPI.onlineStudents(),
        chessAPI.myInvites()
      ]);
      setStudents(studentsRes.data);
      setInvites(invitesRes.data);
      setError(null);

      const acceptedInvite =
        invitesRes.data.outgoing.find((invite) => invite.status === 'ACCEPTED' && invite.game) ||
        invitesRes.data.incoming.find((invite) => invite.status === 'ACCEPTED' && invite.game);

      if (acceptedInvite) {
        const gameRes = await chessAPI.getGameState(acceptedInvite.game);
        if (gameRes.data?.game) {
          onGameStart(gameRes.data.game);
        }
      }
    } catch (err) {
      setError('Ошибка загрузки данных');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [onGameStart]);

  useEffect(() => {
    loadData();
    // Polling каждые 3 секунды
    const interval = setInterval(loadData, 3000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Отправить приглашение
  const sendInvite = async (studentId) => {
    try {
      await chessAPI.sendInvite(studentId);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка отправки приглашения');
    }
  };

  // Принять приглашение
  const acceptInvite = async (inviteId) => {
    try {
      const response = await chessAPI.respondInvite(inviteId, true);
      if (response.data.game) {
        onGameStart(response.data.game);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка принятия приглашения');
    }
  };

  // Отклонить приглашение
  const declineInvite = async (inviteId) => {
    try {
      await chessAPI.respondInvite(inviteId, false);
      loadData();
    } catch (err) {
      alert('Ошибка отклонения приглашения');
    }
  };

  // Отменить своё приглашение
  const cancelInvite = async (inviteId) => {
    try {
      await chessAPI.cancelInvite(inviteId);
      loadData();
    } catch (err) {
      alert('Ошибка отмены приглашения');
    }
  };

  if (loading) {
    return (
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-mars-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-gray-400 mt-4">Загрузка...</p>
      </div>
    );
  }

  return (
    <div>
      <button 
        onClick={onBack}
        className="mb-4 text-gray-400 hover:text-white transition-colors"
      >
        ← Назад
      </button>
      <h2 className="text-2xl font-bold text-white mb-6 text-center">Игра со студентом</h2>

      {error && (
        <div className="bg-red-500/20 text-red-400 p-4 rounded-lg mb-6 text-center">
          {error}
        </div>
      )}

      {/* Входящие приглашения */}
      {invites.incoming.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-bold text-white mb-4">📨 Входящие приглашения</h3>
          <div className="space-y-3">
            {invites.incoming.map(invite => (
              <div 
                key={invite.id}
                className="bg-space-800 border border-green-500/50 rounded-lg p-4 flex items-center justify-between"
              >
                <span className="text-white">{invite.from_player_name} хочет сыграть</span>
                <div className="flex gap-2">
                  <button 
                    onClick={() => acceptInvite(invite.id)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Принять
                  </button>
                  <button 
                    onClick={() => declineInvite(invite.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Отклонить
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Исходящие приглашения */}
      {invites.outgoing.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-bold text-white mb-4">📤 Отправленные приглашения</h3>
          <div className="space-y-3">
            {invites.outgoing.map(invite => (
              <div 
                key={invite.id}
                className="bg-space-800 border border-yellow-500/50 rounded-lg p-4 flex items-center justify-between"
              >
                <span className="text-white">Ожидание ответа от {invite.to_player_name}...</span>
                <button 
                  onClick={() => cancelInvite(invite.id)}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Отменить
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Список студентов */}
      <h3 className="text-lg font-bold text-white mb-4">👥 Доступные студенты</h3>
      {students.length === 0 ? (
        <p className="text-gray-400 text-center py-8">
          Нет доступных студентов для игры
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {students.map(student => (
            <div 
              key={student.id}
              className="bg-space-800 border border-space-600 rounded-lg p-4 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-space-700 overflow-hidden">
                  {student.avatar ? (
                    <img 
                      src={student.avatar.startsWith('http') ? student.avatar : `/media/${student.avatar}`}
                      alt="" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      👤
                    </div>
                  )}
                </div>
                <span className="text-white">{student.display_name}</span>
              </div>
              <button 
                onClick={() => sendInvite(student.id)}
                disabled={student.has_pending_invite}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  student.has_pending_invite
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    : 'bg-mars-600 hover:bg-mars-700 text-white'
                }`}
              >
                {student.has_pending_invite ? 'Отправлено' : 'Пригласить'}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-6 text-center text-gray-400 text-sm">
        За победу: +50 🪙 | За ничью: +20 🪙
      </div>
    </div>
  );
}

// Компонент шахматной доски (игра)
function ChessGame({ game, botLevel, isPvP, playerColor, onFinish, onBack }) {
  const [chess] = useState(new ChessJS());
  const [fen, setFen] = useState(chess.fen());
  const [gameOver, setGameOver] = useState(false);
  const [status, setStatus] = useState('Ваш ход');
  const [lastMove, setLastMove] = useState(null);
  const isThinking = useRef(false);

  // Обновление статуса
  const updateStatus = useCallback(() => {
    if (chess.isCheckmate()) {
      const winner = chess.turn() === 'w' ? 'black' : 'white';
      setStatus(winner === 'white' ? 'Мат! Белые победили' : 'Мат! Чёрные победили');
      return true;
    }
    if (chess.isDraw()) {
      setStatus('Ничья!');
      return true;
    }
    if (chess.isCheck()) {
      setStatus('Шах!');
    } else {
      setStatus(chess.turn() === 'w' ? 'Ход белых' : 'Ход чёрных');
    }
    return false;
  }, [chess]);

  // === БОТ ЛОГИКА ===
  
  // Легкий бот - случайный ход
  const easyBotMove = useCallback(() => {
    const moves = chess.moves();
    if (moves.length === 0) return null;
    return moves[Math.floor(Math.random() * moves.length)];
  }, [chess]);

  // Средний бот - приоритет взятий
  const mediumBotMove = useCallback(() => {
    const moves = chess.moves({ verbose: true });
    if (moves.length === 0) return null;
    
    // Сначала ищем взятия
    const captures = moves.filter(m => m.captured);
    if (captures.length > 0) {
      // Выбираем взятие с максимальной ценностью
      const pieceValues = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
      captures.sort((a, b) => pieceValues[b.captured] - pieceValues[a.captured]);
      return captures[0].san;
    }
    
    // Если нет взятий - случайный ход
    return moves[Math.floor(Math.random() * moves.length)].san;
  }, [chess]);

  // Сложный бот - minimax
  const hardBotMove = useCallback(() => {
    const pieceValues = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
    
    // Оценка позиции
    const evaluate = () => {
      let score = 0;
      const board = chess.board();
      
      for (let i = 0; i < 8; i++) {
        for (let j = 0; j < 8; j++) {
          const piece = board[i][j];
          if (piece) {
            const value = pieceValues[piece.type];
            score += piece.color === 'b' ? value : -value;
          }
        }
      }
      return score;
    };
    
    // Minimax с альфа-бета отсечением
    const minimax = (depth, alpha, beta, isMaximizing) => {
      if (depth === 0 || chess.isGameOver()) {
        return evaluate();
      }
      
      const moves = chess.moves();
      
      if (isMaximizing) {
        let maxEval = -Infinity;
        for (const move of moves) {
          chess.move(move);
          const evalScore = minimax(depth - 1, alpha, beta, false);
          chess.undo();
          maxEval = Math.max(maxEval, evalScore);
          alpha = Math.max(alpha, evalScore);
          if (beta <= alpha) break;
        }
        return maxEval;
      } else {
        let minEval = Infinity;
        for (const move of moves) {
          chess.move(move);
          const evalScore = minimax(depth - 1, alpha, beta, true);
          chess.undo();
          minEval = Math.min(minEval, evalScore);
          beta = Math.min(beta, evalScore);
          if (beta <= alpha) break;
        }
        return minEval;
      }
    };
    
    // Находим лучший ход
    const moves = chess.moves();
    if (moves.length === 0) return null;
    
    let bestMove = moves[0];
    let bestScore = -Infinity;
    
    for (const move of moves) {
      chess.move(move);
      const score = minimax(2, -Infinity, Infinity, false);
      chess.undo();
      
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    
    return bestMove;
  }, [chess]);

  // Ход бота
  const makeBotMove = useCallback(() => {
    if (isThinking.current || chess.isGameOver()) return;
    
    isThinking.current = true;
    setStatus('Бот думает...');
    
    setTimeout(() => {
      let move;
      switch (botLevel) {
        case 'easy':
          move = easyBotMove();
          break;
        case 'medium':
          move = mediumBotMove();
          break;
        case 'hard':
          move = hardBotMove();
          break;
        default:
          move = easyBotMove();
      }
      
      if (move) {
        const result = chess.move(move);
        if (result) {
          setFen(chess.fen());
          setLastMove({ from: result.from, to: result.to });
        }
      }
      
      isThinking.current = false;
      
      if (updateStatus()) {
        setGameOver(true);
      }
    }, 500 + Math.random() * 1000); // Задержка для реализма
  }, [chess, botLevel, easyBotMove, mediumBotMove, hardBotMove, updateStatus]);

  // Обработка хода игрока
  const onDrop = (sourceSquare, targetSquare) => {
    if (gameOver || isThinking.current) return false;
    
    // Для PvP проверяем, наш ли ход
    if (isPvP && chess.turn() !== playerColor[0]) {
      return false;
    }
    
    try {
      const move = chess.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q' // Всегда превращаем в ферзя
      });
      
      if (move === null) return false;
      
      setFen(chess.fen());
      setLastMove({ from: sourceSquare, to: targetSquare });
      
      if (updateStatus()) {
        setGameOver(true);
        return true;
      }
      
      // Если игра с ботом - делаем ход бота
      if (!isPvP) {
        makeBotMove();
      }
      
      return true;
    } catch (e) {
      return false;
    }
  };

  // Сдаться
  const resign = () => {
    setGameOver(true);
    setStatus('Вы сдались');
  };

  // Завершение игры
  const handleFinish = () => {
    let result;
    
    if (chess.isCheckmate()) {
      // Кто получил мат?
      const loser = chess.turn(); // Тот, чей ход - проиграл
      if (isPvP) {
        result = loser === playerColor[0] ? 'LOSE' : 'WIN';
      } else {
        result = loser === 'w' ? 'LOSE' : 'WIN';
      }
    } else if (chess.isDraw()) {
      result = 'DRAW';
    } else {
      // Сдались
      result = 'LOSE';
    }
    
    onFinish(result);
  };

  // Подсветка последнего хода
  const customSquareStyles = lastMove ? {
    [lastMove.from]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' },
    [lastMove.to]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' }
  } : {};

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start justify-center">
      {/* Доска */}
      <div className="w-full max-w-[600px]">
        <Chessboard 
          position={fen}
          onPieceDrop={onDrop}
          boardOrientation={isPvP ? playerColor : 'white'}
          customSquareStyles={customSquareStyles}
          customBoardStyle={{
            borderRadius: '8px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
          }}
        />
      </div>

      {/* Панель управления */}
      <div className="w-full lg:w-64 space-y-4">
        <div className="bg-space-800 rounded-lg p-4">
          <h3 className="text-lg font-bold text-white mb-2">
            {isPvP ? 'Игра со студентом' : `Бот (${botLevel})`}
          </h3>
          <p className={`text-lg ${
            status.includes('Мат') || status.includes('Ничья') 
              ? 'text-yellow-500 font-bold' 
              : 'text-gray-300'
          }`}>
            {status}
          </p>
        </div>

        {isPvP && (
          <div className="bg-space-800 rounded-lg p-4">
            <p className="text-gray-400">Вы играете:</p>
            <p className="text-white font-bold">
              {playerColor === 'white' ? '⬜ Белыми' : '⬛ Чёрными'}
            </p>
          </div>
        )}

        {!gameOver ? (
          <button 
            onClick={resign}
            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg transition-colors"
          >
            🏳️ Сдаться
          </button>
        ) : (
          <button 
            onClick={handleFinish}
            className="w-full btn-primary py-3"
          >
            Завершить игру
          </button>
        )}

        <button 
          onClick={onBack}
          className="w-full bg-space-700 hover:bg-space-600 text-white py-3 rounded-lg transition-colors"
        >
          Выйти
        </button>

        <div className="bg-space-800 rounded-lg p-4">
          <h4 className="text-sm font-bold text-gray-400 mb-2">Награды:</h4>
          {isPvP ? (
            <ul className="text-sm text-gray-300 space-y-1">
              <li>Победа: +50 🪙</li>
              <li>Ничья: +20 🪙</li>
            </ul>
          ) : (
            <p className="text-sm text-gray-300">
              Победа: +{REWARDS.BOT[botLevel]} 🪙
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Главный компонент страницы шахмат
export default function Chess() {
  const { user, updateUser } = useAuth();
  const [mode, setMode] = useState(null); // null | 'bot-select' | 'pvp-select' | 'playing'
  const [gameData, setGameData] = useState(null);
  const [showResult, setShowResult] = useState(false);
  const [result, setResult] = useState(null);
  const [coinsEarned, setCoinsEarned] = useState(0);

  // Начать игру с ботом
  const startBotGame = async (level) => {
    try {
      const response = await chessAPI.startGame('BOT', level);
      setGameData({
        game: response.data.game,
        botLevel: level,
        isPvP: false
      });
      setMode('playing');
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка создания игры');
    }
  };

  // Начать PvP игру
  const startPvPGame = (game) => {
    const playerColor = game.white_player === user.id ? 'white' : 'black';
    setGameData({
      game,
      isPvP: true,
      playerColor
    });
    setMode('playing');
  };

  // Завершить игру
  const finishGame = async (gameResult) => {
    try {
      const response = await chessAPI.finishGame(gameData.game.id, gameResult);
      setResult(gameResult);
      setCoinsEarned(response.data.coins_earned);
      setShowResult(true);
      
      // Обновляем баланс пользователя
      if (response.data.coins_earned > 0) {
        updateUser();
      }
    } catch (err) {
      console.error('Ошибка завершения игры:', err);
      // Всё равно показываем результат
      setResult(gameResult);
      setCoinsEarned(0);
      setShowResult(true);
    }
  };

  // Закрыть модальное окно результата
  const closeResult = () => {
    setShowResult(false);
    setMode(null);
    setGameData(null);
  };

  // Выйти из игры
  const exitGame = () => {
    if (confirm('Вы уверены, что хотите выйти? Игра будет засчитана как поражение.')) {
      finishGame('LOSE');
    }
  };

  // Получить имя противника
  const getOpponentName = () => {
    if (!gameData) return '';
    if (gameData.isPvP) {
      return gameData.game.opponent_name || 'Студент';
    }
    const levels = { easy: 'Легкий', medium: 'Средний', hard: 'Сложный' };
    return `Бот (${levels[gameData.botLevel]})`;
  };

  return (
    <div className="min-h-screen bg-space-950">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Заголовок */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            ♟️ Chess Arena
          </h1>
          <p className="text-gray-400">
            Играйте в шахматы и зарабатывайте монеты
          </p>
        </div>

        {/* Контент в зависимости от режима */}
        {mode === null && (
          <ModeSelector 
            onSelectBot={() => setMode('bot-select')}
            onSelectPvP={() => setMode('pvp-select')}
          />
        )}

        {mode === 'bot-select' && (
          <BotLevelSelector 
            onSelect={startBotGame}
            onBack={() => setMode(null)}
          />
        )}

        {mode === 'pvp-select' && (
          <PvPSelector 
            onBack={() => setMode(null)}
            onGameStart={startPvPGame}
          />
        )}

        {mode === 'playing' && gameData && (
          <ChessGame 
            game={gameData.game}
            botLevel={gameData.botLevel}
            isPvP={gameData.isPvP}
            playerColor={gameData.playerColor}
            onFinish={finishGame}
            onBack={exitGame}
          />
        )}

        {/* Модальное окно результата */}
        <ResultModal 
          isOpen={showResult}
          result={result}
          coinsEarned={coinsEarned}
          opponentName={getOpponentName()}
          onClose={closeResult}
        />
      </main>
    </div>
  );
}
