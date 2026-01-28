/**
 * Модальное окно для отправки задания.
 */
import { useState } from 'react';
import { tasksAPI } from '../api/axios';

export default function TaskSubmitModal({ task, onClose }) {
  const [textAnswer, setTextAnswer] = useState('');
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Проверка размера (макс 5MB)
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('Файл слишком большой (максимум 5MB)');
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!textAnswer && !file) {
      setError('Добавьте текстовый ответ или прикрепите файл');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      if (textAnswer) {
        formData.append('text_answer', textAnswer);
      }
      if (file) {
        formData.append('file_answer', file);
      }

      await tasksAPI.submit(task.id, formData);
      alert('Задание успешно отправлено!');
      onClose();
    } catch (err) {
      const errorMessage = err.response?.data?.detail 
        || err.response?.data?.non_field_errors?.[0]
        || 'Ошибка отправки задания';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-space-900 rounded-xl border border-space-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Заголовок */}
        <div className="flex justify-between items-start p-6 border-b border-space-700">
          <div>
            <h2 className="text-xl font-semibold text-white">{task.title}</h2>
            <div className="flex items-center mt-2 text-sm text-yellow-500">
              <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6c.304 0 .792.193 1.264.979a1 1 0 001.715-1.029C12.279 4.784 11.232 4 10 4s-2.279.784-2.979 1.95c-.285.475-.507 1-.67 1.55H6a1 1 0 000 2h.013a9.358 9.358 0 000 1H6a1 1 0 100 2h.351c.163.55.385 1.075.67 1.55C7.721 15.216 8.768 16 10 16s2.279-.784 2.979-1.95a1 1 0 10-1.715-1.029c-.472.786-.96.979-1.264.979-.304 0-.792-.193-1.264-.979a4.265 4.265 0 01-.264-.521H10a1 1 0 100-2H8.017a7.36 7.36 0 010-1H10a1 1 0 100-2H8.472c.08-.185.167-.36.264-.521z" />
              </svg>
              Награда: {task.reward_coins} монет
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Описание задания */}
        <div className="p-6 border-b border-space-700">
          <h3 className="text-sm font-medium text-gray-400 mb-2">Описание</h3>
          <p className="text-gray-300 whitespace-pre-wrap">{task.description}</p>
        </div>

        {/* Форма отправки */}
        {task.is_submitted ? (
          <div className="p-6">
            <div className="text-center py-4">
              <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-gray-300">Вы уже отправили это задание</p>
              <p className="text-sm text-gray-500 mt-1">
                Статус: {task.submission_status === 'PENDING' ? 'На проверке' : 
                         task.submission_status === 'APPROVED' ? 'Одобрено' : 'Отклонено'}
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6">
            {error && (
              <div className="mb-4 p-3 bg-red-900/30 border border-red-500/50 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Текстовый ответ */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Текстовый ответ
              </label>
              <textarea
                value={textAnswer}
                onChange={(e) => setTextAnswer(e.target.value)}
                rows={5}
                className="input resize-none"
                placeholder="Опишите своё решение..."
              />
            </div>

            {/* Загрузка файла */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Прикрепить файл (опционально)
              </label>
              <div className="border-2 border-dashed border-space-600 rounded-lg p-4 text-center hover:border-mars-500 transition-colors">
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  {file ? (
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-gray-300">{file.name}</span>
                    </div>
                  ) : (
                    <div>
                      <svg className="w-8 h-8 text-gray-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="text-gray-400">Нажмите для выбора файла</span>
                      <p className="text-xs text-gray-500 mt-1">Максимум 5MB</p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Кнопки */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 btn-secondary"
              >
                Отмена
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 btn-primary"
              >
                {isSubmitting ? 'Отправка...' : 'Отправить'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
