/**
 * Виджет для теста скорости печати.
 * Похож на упрощённый MonkeyType.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { typingAPI } from '../api/axios';

// Набор фраз для печати
const PHRASES = [
  "const greeting = 'Hello, World!';",
  "function sum(a, b) { return a + b; }",
  "for (let i = 0; i < 10; i++) { console.log(i); }",
  "const array = [1, 2, 3, 4, 5];",
  "if (condition) { doSomething(); }",
  "const obj = { name: 'Mars', type: 'planet' };",
  "async function fetchData() { await api.get(); }",
  "import React from 'react';",
  "export default function App() { return <div />; }",
  "npm install --save react react-dom",
  "git commit -m 'Initial commit'",
  "python manage.py runserver",
  "SELECT * FROM users WHERE active = true;",
  "def fibonacci(n): return n if n < 2 else fibonacci(n-1) + fibonacci(n-2)",
  "class User: def __init__(self, name): self.name = name",
];

// Время теста в секундах
const TEST_DURATION = 30;

export default function TypingWidget() {
  const [currentPhrase, setCurrentPhrase] = useState('');
  const [typedText, setTypedText] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TEST_DURATION);
  const [errors, setErrors] = useState(0);
  const [totalTyped, setTotalTyped] = useState(0);
  const [result, setResult] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  // Генерация новой фразы
  const generatePhrase = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * PHRASES.length);
    return PHRASES[randomIndex];
  }, []);

  // Расчёт WPM
  const calculateWPM = useCallback(() => {
    const timeElapsed = TEST_DURATION - timeLeft;
    if (timeElapsed === 0) return 0;
    
    const words = totalTyped / 5; // Стандартный расчёт: 5 символов = 1 слово
    const minutes = timeElapsed / 60;
    
    return Math.round(words / minutes);
  }, [totalTyped, timeLeft]);

  // Расчёт точности
  const calculateAccuracy = useCallback(() => {
    if (totalTyped === 0) return 100;
    return Math.round(((totalTyped - errors) / totalTyped) * 100);
  }, [totalTyped, errors]);

  // Запуск теста
  const startTest = useCallback(() => {
    setCurrentPhrase(generatePhrase());
    setTypedText('');
    setErrors(0);
    setTotalTyped(0);
    setTimeLeft(TEST_DURATION);
    setResult(null);
    setIsRunning(true);
    inputRef.current?.focus();
  }, [generatePhrase]);

  // Завершение теста
  const endTest = useCallback(() => {
    setIsRunning(false);
    clearInterval(timerRef.current);
    
    const wpm = calculateWPM();
    const accuracy = calculateAccuracy();
    
    setResult({
      wpm,
      accuracy,
      characters_typed: totalTyped,
      errors,
      duration_seconds: TEST_DURATION - timeLeft || TEST_DURATION,
    });
  }, [calculateWPM, calculateAccuracy, totalTyped, errors, timeLeft]);

  // Таймер
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(timerRef.current);
  }, [isRunning]);

  // Завершение при окончании времени
  useEffect(() => {
    if (isRunning && timeLeft === 0) {
      endTest();
    }
  }, [timeLeft, isRunning, endTest]);

  // Обработка ввода
  const handleInput = (e) => {
    if (!isRunning) return;

    const value = e.target.value;
    const currentIndex = value.length - 1;
    
    // Проверяем последний символ
    if (currentIndex >= 0 && currentIndex < currentPhrase.length) {
      const expectedChar = currentPhrase[currentIndex];
      const typedChar = value[currentIndex];
      
      if (typedChar !== expectedChar) {
        setErrors((prev) => prev + 1);
      }
      
      setTotalTyped((prev) => prev + 1);
    }

    setTypedText(value);

    // Если закончили фразу, генерируем новую
    if (value.length >= currentPhrase.length) {
      setCurrentPhrase(generatePhrase());
      setTypedText('');
    }
  };

  // Сохранение результата
  const saveResult = async () => {
    if (!result) return;
    
    setIsSaving(true);
    try {
      await typingAPI.save(result);
      alert('Результат сохранён!');
    } catch (error) {
      console.error('Ошибка сохранения:', error);
      alert('Не удалось сохранить результат');
    } finally {
      setIsSaving(false);
    }
  };

  // Отрисовка символов с подсветкой
  const renderCharacters = () => {
    return currentPhrase.split('').map((char, index) => {
      let className = 'transition-colors duration-100';
      
      if (index < typedText.length) {
        if (typedText[index] === char) {
          className += ' char-correct';
        } else {
          className += ' char-incorrect';
        }
      } else if (index === typedText.length) {
        className += ' char-current';
      } else {
        className += ' text-gray-500';
      }
      
      return (
        <span key={index} className={className}>
          {char}
        </span>
      );
    });
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Тест скорости печати</h3>
        
        {/* Таймер */}
        <div className={`text-2xl font-mono font-bold ${timeLeft <= 10 ? 'text-red-400' : 'text-mars-500'}`}>
          {timeLeft}с
        </div>
      </div>

      {/* Результат */}
      {result && (
        <div className="mb-4 p-4 bg-space-800 rounded-lg">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
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
          
          <div className="mt-4 flex gap-2 justify-center">
            <button onClick={saveResult} disabled={isSaving} className="btn-primary text-sm">
              {isSaving ? 'Сохранение...' : 'Сохранить результат'}
            </button>
            <button onClick={startTest} className="btn-secondary text-sm">
              Попробовать снова
            </button>
          </div>
        </div>
      )}

      {/* Область теста */}
      {!result && (
        <>
          {/* Текст для печати */}
          <div 
            className="mb-4 p-4 bg-space-800 rounded-lg font-mono text-lg leading-relaxed cursor-text min-h-[80px]"
            onClick={() => inputRef.current?.focus()}
          >
            {isRunning ? renderCharacters() : (
              <span className="text-gray-500">
                Нажмите &quot;Начать&quot; для старта теста
              </span>
            )}
          </div>

          {/* Скрытое поле ввода */}
          <input
            ref={inputRef}
            type="text"
            value={typedText}
            onChange={handleInput}
            className="absolute opacity-0 -z-10"
            disabled={!isRunning}
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
          />

          {/* Статистика во время теста */}
          {isRunning && (
            <div className="flex justify-between text-sm text-gray-400 mb-4">
              <span>WPM: {calculateWPM()}</span>
              <span>Точность: {calculateAccuracy()}%</span>
              <span>Ошибки: {errors}</span>
            </div>
          )}

          {/* Кнопка старта */}
          {!isRunning && (
            <button onClick={startTest} className="w-full btn-primary">
              Начать тест
            </button>
          )}
        </>
      )}
    </div>
  );
}
