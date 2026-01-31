/**
 * Страница шахмат.
 * Игра против бота или другого студента.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import { Chess as ChessJS } from 'chess.js';
import { useAuth } from '../context/AuthContext';
import { authAPI, chessAPI } from '../api/axios';
import { MEDIA_BASE_URL, WS_BASE_URL } from '../config/api';
import Navbar from '../components/Navbar';

// Компонент модального окна результата
function ResultModal({ isOpen, result, coinsEarned, onClose, opponentName }) {
  if (!isOpen) return null;

  const resultText = {
    WIN: 'Победа! 🎉',
    LOSE: 'Поражение 🚩',
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
  const [acceptedInvite, setAcceptedInvite] = useState(null);
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
      
      const activeInvite =
        invitesRes.data.outgoing.find((invite) => invite.status === 'ACCEPTED' && invite.game) ||
        invitesRes.data.incoming.find((invite) => invite.status === 'ACCEPTED' && invite.game);
      
      setAcceptedInvite(activeInvite || null);
    } catch (err) {
      setError('Ошибка загрузки данных');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

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

  const joinAcceptedGame = async (gameId) => {
    const targetGameId = gameId || acceptedInvite?.game;
    if (!targetGameId) return;
    try {
      const gameRes = await chessAPI.getGameState(targetGameId);
      if (gameRes.data?.game) {
        onGameStart(gameRes.data.game);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка входа в игру');
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
      
      {acceptedInvite && (
        <div className="bg-green-500/10 border border-green-500/40 rounded-lg p-4 mb-6 flex items-center justify-between">
          <span className="text-green-300">
            Игра готова. {acceptedInvite.from_player_name || 'Соперник'} принял приглашение.
          </span>
          <button
            onClick={() => joinAcceptedGame(acceptedInvite.game)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Войти в игру
          </button>
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
                {invite.status === 'ACCEPTED' && invite.game ? (
                  <button
                    onClick={() => joinAcceptedGame(invite.game)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Войти в игру
                  </button>
                ) : (
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
                )}
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
                {invite.status === 'ACCEPTED' && invite.game ? (
                  <>
                    <span className="text-white">
                      {invite.to_player_name} принял приглашение
                    </span>
                    <button
                      onClick={() => joinAcceptedGame(invite.game)}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Войти в игру
                    </button>
                  </>
                ) : (
                  <>
                    <span className="text-white">Ожидание ответа от {invite.to_player_name}...</span>
                    <button 
                      onClick={() => cancelInvite(invite.id)}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      Отменить
                    </button>
                  </>
                )}
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
                      src={student.avatar.startsWith('http') ? student.avatar : `${MEDIA_BASE_URL}/media/${student.avatar}`}
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
function ChessGame({ game, isPvP, playerColor, onGameOver, onExit }) {
  const [chess] = useState(new ChessJS());
  const [fen, setFen] = useState(game?.fen_position || chess.fen());
  const [gameOver, setGameOver] = useState(false);
  const [status, setStatus] = useState('Ожидание соперника...');
  const [lastMove, setLastMove] = useState(null);
  const [moveHistory, setMoveHistory] = useState(game?.move_history || []);
  const [whiteTime, setWhiteTime] = useState(game?.white_time ?? 300);
  const [blackTime, setBlackTime] = useState(game?.black_time ?? 300);
  const [currentTurn, setCurrentTurn] = useState(game?.current_turn || 'white');
  const [replayIndex, setReplayIndex] = useState(null);
  const [replayFen, setReplayFen] = useState(null);
  const [usePolling, setUsePolling] = useState(false);
  const socketRef = useRef(null);
  const pollingRef = useRef(null);
  const gameOverRef = useRef(false);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef(null);

  const isMyTurn = currentTurn === playerColor;
  const isReplay = replayIndex !== null;

  const formatTime = (seconds) => {
    const safeSeconds = Math.max(0, Math.floor(seconds || 0));
    const mins = String(Math.floor(safeSeconds / 60)).padStart(2, '0');
    const secs = String(safeSeconds % 60).padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const uciToSquares = (uci) => {
    if (!uci || uci.length < 4) return null;
    return { from: uci.slice(0, 2), to: uci.slice(2, 4) };
  };

  const applyState = (data) => {
    if (data.fen) {
      chess.load(data.fen);
      setFen(data.fen);
    }
    if (data.last_move) {
      setLastMove(uciToSquares(data.last_move));
    }
    if (Array.isArray(data.move_history)) {
      setMoveHistory(data.move_history);
    }
    if (typeof data.white_time === 'number') setWhiteTime(data.white_time);
    if (typeof data.black_time === 'number') setBlackTime(data.black_time);
    if (data.current_turn) setCurrentTurn(data.current_turn);
    if (data.status === 'FINISHED' || data.type === 'game_over') {
      setGameOver(true);
    }
  };

  const applyGameSnapshot = (gameSnapshot) => {
    if (!gameSnapshot) return;
    applyState({
      fen: gameSnapshot.fen_position,
      last_move: gameSnapshot.last_move,
      move_history: gameSnapshot.move_history,
      white_time: gameSnapshot.white_time,
      black_time: gameSnapshot.black_time,
      current_turn: gameSnapshot.current_turn,
      status: gameSnapshot.status,
      result: gameSnapshot.result,
      ended_reason: gameSnapshot.ended_reason,
      winner_id: gameSnapshot.winner,
      loser_id: gameSnapshot.loser,
      type: gameSnapshot.status === 'FINISHED' ? 'game_over' : 'game_state',
    });

    if (gameSnapshot.status === 'FINISHED' && !gameOverRef.current) {
      gameOverRef.current = true;
      onGameOver?.({
        result: gameSnapshot.result,
        winner_id: gameSnapshot.winner,
        loser_id: gameSnapshot.loser,
        ended_reason: gameSnapshot.ended_reason,
      });
    }
  };

  const refreshAccessToken = useCallback(async () => {
    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) return null;
    try {
      const response = await authAPI.refreshToken(refreshToken);
      const access = response.data?.access;
      if (access) {
        localStorage.setItem('access_token', access);
        return access;
      }
    } catch (err) {
      return null;
    }
    return null;
  }, []);

  const stopPolling = useCallback(() => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
      pollingRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    if (pollingRef.current) return;
    const fetchSnapshot = async () => {
      try {
        const response = await chessAPI.getGameState(game.id);
        applyGameSnapshot(response.data?.game);
      } catch (err) {
        setStatus(err.response?.data?.error || 'Ошибка синхронизации');
      }
    };
    fetchSnapshot();
    pollingRef.current = setInterval(async () => {
      await fetchSnapshot();
    }, 2000);
  }, [game.id, applyGameSnapshot]);

  const buildReplayFen = (history, index) => {
    const temp = new ChessJS();
    for (let i = 0; i <= index; i += 1) {
      const move = history[i];
      if (!move) break;
      temp.move(move);
    }
    return temp.fen();
  };

  useEffect(() => {
    let isActive = true;

    const cleanupSocket = () => {
      if (socketRef.current) {
        try {
          socketRef.current.close();
        } catch (err) {
          // no-op
        }
      }
    };

    const handleSocketFailure = async (reason) => {
      if (!isActive || gameOverRef.current) return;
      if (reason === 'not_in_game' || reason === 'game_not_found') {
        setStatus('Игра недоступна');
        setUsePolling(true);
        return;
      }
      if (reconnectAttemptsRef.current >= 2) {
        setStatus('Подключение потеряно, обновление каждые 2с');
        setUsePolling(true);
        return;
      }

      setStatus('Пробую переподключиться...');
      const refreshed = await refreshAccessToken();
      const token = refreshed || localStorage.getItem('access_token');
      if (!token) {
        setUsePolling(true);
        return;
      }

      reconnectAttemptsRef.current += 1;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      const delay = 500 * reconnectAttemptsRef.current;
      reconnectTimerRef.current = setTimeout(() => {
        if (!isActive) return;
        createSocket(token);
      }, delay);
    };

    const createSocket = (token) => {
      cleanupSocket();
      const ws = new WebSocket(`${WS_BASE_URL}/ws/chess/${game.id}/?token=${token}`);
      socketRef.current = ws;
      gameOverRef.current = false;

      ws.onopen = () => {
        if (!isActive) return;
        reconnectAttemptsRef.current = 0;
        setUsePolling(false);
        setStatus('Соединение установлено');
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'game_state') {
          applyState(data);
        }
        if (data.type === 'move') {
          applyState(data);
        }
        if (data.type === 'timer_update') {
          if (typeof data.white_time === 'number') setWhiteTime(data.white_time);
          if (typeof data.black_time === 'number') setBlackTime(data.black_time);
          if (data.current_turn) setCurrentTurn(data.current_turn);
        }
        if (data.type === 'game_over') {
          applyState(data);
          setGameOver(true);
          gameOverRef.current = true;
          onGameOver?.(data);
        }
        if (data.type === 'error') {
          if (['auth_failed', 'game_not_found', 'not_in_game'].includes(data.message)) {
            handleSocketFailure(data.message);
            return;
          }
          setStatus(data.message || 'Ошибка хода');
        }
      };

      ws.onerror = () => {
        if (!isActive) return;
        handleSocketFailure('error');
      };

      ws.onclose = () => {
        if (!isActive) return;
        handleSocketFailure('close');
      };
    };

    const initialToken = localStorage.getItem('access_token');
    if (initialToken) {
      createSocket(initialToken);
    } else {
      refreshAccessToken().then((token) => {
        if (!isActive) return;
        if (token) {
          createSocket(token);
        } else {
          setUsePolling(true);
        }
      });
    }

    return () => {
      isActive = false;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      stopPolling();
      cleanupSocket();
    };
  }, [game.id, onGameOver, refreshAccessToken, stopPolling]);

  useEffect(() => {
    if (usePolling) {
      setStatus('Подключение потеряно, обновление каждые 2с');
      startPolling();
      return;
    }
    stopPolling();
  }, [usePolling, startPolling, stopPolling]);

  useEffect(() => {
    if (gameOver) {
      setStatus('Игра завершена');
      return;
    }
    setStatus(isMyTurn ? 'Ваш ход' : 'Ход соперника');
  }, [currentTurn, isMyTurn, gameOver]);

  // Обработка хода игрока
  const onDrop = (sourceSquare, targetSquare) => {
    if (gameOver || isReplay) return false;
    if (!isMyTurn) return false;

    const temp = new ChessJS(fen);
    const move = temp.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q'
    });
    if (!move) {
      return false;
    }

    const socket = socketRef.current;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'move',
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q'
      }));
      return true;
    }

    setUsePolling(true);
    chessAPI.makeMove(game.id, {
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q'
    }).then((response) => {
      applyGameSnapshot(response.data?.game);
    }).catch((err) => {
      setStatus(err.response?.data?.error || 'Ошибка отправки хода');
    });
    return true;
  };

  const handleResign = () => {
    if (gameOver) return;
    if (!confirm('Вы уверены, что хотите сдаться?')) return;
    socketRef.current?.send(JSON.stringify({ type: 'resign' }));
  };

  const handleReplayClick = (index) => {
    setReplayIndex(index);
    setReplayFen(buildReplayFen(moveHistory, index));
  };

  const handleReplayPrev = () => {
    if (replayIndex === null) return;
    const nextIndex = Math.max(-1, replayIndex - 1);
    if (nextIndex === -1) {
      setReplayIndex(null);
      setReplayFen(null);
      return;
    }
    setReplayIndex(nextIndex);
    setReplayFen(buildReplayFen(moveHistory, nextIndex));
  };

  const handleReplayNext = () => {
    if (replayIndex === null) return;
    const nextIndex = Math.min(moveHistory.length - 1, replayIndex + 1);
    setReplayIndex(nextIndex);
    setReplayFen(buildReplayFen(moveHistory, nextIndex));
  };

  const boardFen = isReplay ? replayFen : fen;

  const moveRows = [];
  for (let i = 0; i < moveHistory.length; i += 2) {
    moveRows.push({
      number: i / 2 + 1,
      white: moveHistory[i],
      black: moveHistory[i + 1],
      whiteIndex: i,
      blackIndex: i + 1
    });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <div className="bg-space-900 rounded-xl p-4">
          <Chessboard
            position={boardFen}
            onPieceDrop={onDrop}
            boardOrientation={playerColor}
            arePiecesDraggable={!gameOver && !isReplay}
            animationDuration={300}
            customSquareStyles={
              lastMove
                ? {
                    [lastMove.from]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' },
                    [lastMove.to]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' },
                  }
                : {}
            }
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-2">Таймер</h3>
          <div className="flex justify-between text-gray-300">
            <span>Белые:</span>
            <span className="font-mono">{formatTime(whiteTime)}</span>
          </div>
          <div className="flex justify-between text-gray-300">
            <span>Чёрные:</span>
            <span className="font-mono">{formatTime(blackTime)}</span>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-2">Статус</h3>
          <p className="text-gray-300">{status}</p>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-2">История ходов</h3>
          <div className="max-h-64 overflow-y-auto text-sm text-gray-300 space-y-1">
            {moveRows.length === 0 && <p>Пока ходов нет</p>}
            {moveRows.map((row) => (
              <div key={row.number} className="flex gap-3">
                <span className="w-6 text-gray-500">{row.number}.</span>
                <button
                  type="button"
                  onClick={() => handleReplayClick(row.whiteIndex)}
                  className="hover:text-white"
                >
                  {row.white || '-'}
                </button>
                <button
                  type="button"
                  onClick={() => handleReplayClick(row.blackIndex)}
                  className="hover:text-white"
                >
                  {row.black || '-'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {gameOver && (
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-2">Replay</h3>
            <div className="flex gap-2">
              <button onClick={handleReplayPrev} className="btn-secondary">Назад</button>
              <button onClick={handleReplayNext} className="btn-secondary">Вперёд</button>
              <button onClick={() => { setReplayIndex(null); setReplayFen(null); }} className="btn-secondary">
                К игре
              </button>
            </div>
          </div>
        )}

        <div className="card">
          <button
            onClick={handleResign}
            className="w-full btn-outline mb-3"
            disabled={gameOver}
          >
            🚩 Сдаться
          </button>
          <button
            onClick={onExit}
            className="w-full bg-space-700 hover:bg-space-600 text-white py-3 rounded-lg transition-colors"
          >
            Выйти
          </button>
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
        isPvP: false,
        playerColor: 'white'
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

  const handleGameOver = (payload) => {
    const resultValue = payload?.result || (
      payload?.winner_id === user?.id ? 'WIN' :
      payload?.loser_id === user?.id ? 'LOSE' :
      'DRAW'
    );
    setResult(resultValue);
    setCoinsEarned(payload?.coins_earned || 0);
    setShowResult(true);
    updateUser();
  };

  // Закрыть модальное окно результата
  const closeResult = () => {
    setShowResult(false);
    setMode(null);
    setGameData(null);
  };

  // Выйти из игры
  const exitGame = () => {
    if (!gameData) {
      setMode(null);
      return;
    }
    if (confirm('Выйти из игры?')) {
      setMode(null);
      setGameData(null);
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
            isPvP={gameData.isPvP}
            playerColor={gameData.playerColor}
            onGameOver={handleGameOver}
            onExit={exitGame}
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
