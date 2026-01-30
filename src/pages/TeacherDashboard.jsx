/**
 * Дашборд учителя.
 * Управление студентами, проверка заданий, начисление монет.
 */
import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import { studentsAPI, tasksAPI, teacherAPI } from '../api/axios';
import { MEDIA_BASE_URL } from '../config/api';

export default function TeacherDashboard() {
  const [activeTab, setActiveTab] = useState('students'); // 'students', 'submissions', 'create'
  const [students, setStudents] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Форма создания студента
  const [newStudent, setNewStudent] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    parent_info: '',
    student_group: 'FRONTEND',
  });
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [isCreating, setIsCreating] = useState(false);

  // Загрузка данных
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [studentsRes, submissionsRes, statsRes] = await Promise.all([
        studentsAPI.list(),
        tasksAPI.submissions('PENDING'),
        teacherAPI.stats(),
      ]);
      setStudents(studentsRes.data);
      setSubmissions(submissionsRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error('Ошибка загрузки данных:', err);
    } finally {
      setLoading(false);
    }
  };

  // Создание студента
  const handleCreateStudent = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    setCreatedCredentials(null);

    try {
      const response = await studentsAPI.create(newStudent);
      setCreatedCredentials(response.data.credentials);
      setStudents([response.data.student, ...students]);
      setNewStudent({
        first_name: '',
        last_name: '',
        phone: '',
        parent_info: '',
        student_group: 'FRONTEND',
      });
    } catch (err) {
      alert(err.response?.data?.detail || 'Ошибка создания студента');
    } finally {
      setIsCreating(false);
    }
  };

  // Начисление монет
  const handleCoinsOperation = async (studentId, amount, reason) => {
    try {
      const response = await studentsAPI.updateCoins(studentId, amount, reason);
      // Обновляем баланс студента в списке
      setStudents(students.map(s => 
        s.id === studentId 
          ? { ...s, balance: response.data.new_balance }
          : s
      ));
      alert('Операция выполнена успешно');
      setSelectedStudent(null);
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка операции');
    }
  };

  // Проверка задания
  const handleReviewSubmission = async (submissionId, status, grade, comment, coins) => {
    try {
      await tasksAPI.review(submissionId, {
        status,
        grade,
        teacher_comment: comment,
        coins_awarded: coins,
      });
      // Убираем из списка ожидающих
      setSubmissions(submissions.filter(s => s.id !== submissionId));
      alert('Задание проверено');
    } catch (err) {
      alert(err.response?.data?.error || 'Ошибка проверки');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-space-950">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="w-16 h-16 border-4 border-mars-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-space-950">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="card">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats?.students_count || 0}</p>
                <p className="text-sm text-gray-400">Студентов</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-lg bg-yellow-500/20 flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats?.pending_submissions || 0}</p>
                <p className="text-sm text-gray-400">На проверке</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="w-12 h-12 rounded-lg bg-green-500/20 flex items-center justify-center mr-4">
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stats?.reviewed_today || 0}</p>
                <p className="text-sm text-gray-400">Проверено сегодня</p>
              </div>
            </div>
          </div>
        </div>

        {/* Табы */}
        <div className="flex space-x-2 mb-6 bg-space-900 p-1 rounded-lg w-fit">
          <button
            onClick={() => setActiveTab('students')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'students' ? 'bg-mars-500 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Студенты
          </button>
          <button
            onClick={() => setActiveTab('submissions')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'submissions' ? 'bg-mars-500 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            Проверка ({submissions.length})
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 rounded-md font-medium transition-colors ${
              activeTab === 'create' ? 'bg-mars-500 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            + Создать студента
          </button>
        </div>

        {/* Контент */}
        {activeTab === 'students' && (
          <StudentsList 
            students={students} 
            onSelectStudent={setSelectedStudent}
          />
        )}

        {activeTab === 'submissions' && (
          <SubmissionsList 
            submissions={submissions}
            onReview={handleReviewSubmission}
          />
        )}

        {activeTab === 'create' && (
          <CreateStudentForm
            newStudent={newStudent}
            setNewStudent={setNewStudent}
            onSubmit={handleCreateStudent}
            isCreating={isCreating}
            createdCredentials={createdCredentials}
          />
        )}
      </main>

      {/* Модальное окно для работы с монетами */}
      {selectedStudent && (
        <CoinsModal
          student={selectedStudent}
          onClose={() => setSelectedStudent(null)}
          onSubmit={handleCoinsOperation}
        />
      )}
    </div>
  );
}

// Компонент списка студентов
function StudentsList({ students, onSelectStudent }) {
  // Состояние для отображения паролей (по ID студента)
  const [visiblePasswords, setVisiblePasswords] = useState({});

  const togglePassword = (studentId) => {
    setVisiblePasswords(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  if (students.length === 0) {
    return (
      <div className="card text-center py-8">
        <p className="text-gray-400">У вас пока нет студентов</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {students.map((student) => (
        <div key={student.id} className="card">
          <div className="flex justify-between items-start">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-space-700 flex items-center justify-center overflow-hidden">
                {student.avatar ? (
                  <img 
                    src={student.avatar.startsWith('http') ? student.avatar : `${MEDIA_BASE_URL}/media/${student.avatar}`} 
                    alt="" 
                    className="w-full h-full object-cover" 
                  />
                ) : (
                  <span className="text-lg font-semibold text-gray-400">
                    {student.first_name?.[0] || student.username[0]}
                  </span>
                )}
              </div>
              <div>
                <h3 className="font-semibold text-white">
                  {student.first_name} {student.last_name}
                </h3>
                <p className="text-sm text-gray-400">@{student.username}</p>
                {/* Отображение пароля */}
                {student.raw_password && (
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">Пароль:</span>
                    <span className="text-xs font-mono text-gray-400">
                      {visiblePasswords[student.id] ? student.raw_password : '********'}
                    </span>
                    <button
                      onClick={() => togglePassword(student.id)}
                      className="text-xs text-mars-500 hover:text-mars-400 transition-colors"
                    >
                      {visiblePasswords[student.id] ? 'Скрыть' : 'Показать'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <span className="px-2 py-1 text-xs rounded-full bg-space-700 text-gray-300">
                  {student.student_group_display}
                </span>
                <div className="mt-1 flex items-center text-yellow-500">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.736 6.979C9.208 6.193 9.696 6 10 6c.304 0 .792.193 1.264.979a1 1 0 001.715-1.029C12.279 4.784 11.232 4 10 4s-2.279.784-2.979 1.95c-.285.475-.507 1-.67 1.55H6a1 1 0 000 2h.013a9.358 9.358 0 000 1H6a1 1 0 100 2h.351c.163.55.385 1.075.67 1.55C7.721 15.216 8.768 16 10 16s2.279-.784 2.979-1.95a1 1 0 10-1.715-1.029c-.472.786-.96.979-1.264.979-.304 0-.792-.193-1.264-.979a4.265 4.265 0 01-.264-.521H10a1 1 0 100-2H8.017a7.36 7.36 0 010-1H10a1 1 0 100-2H8.472c.08-.185.167-.36.264-.521z" />
                  </svg>
                  <span className="font-semibold">{student.balance}</span>
                </div>
              </div>
              
              <button
                onClick={() => onSelectStudent(student)}
                className="btn-secondary text-sm"
              >
                Монеты
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// Компонент списка отправок на проверку
function SubmissionsList({ submissions, onReview }) {
  const [reviewData, setReviewData] = useState({});

  if (submissions.length === 0) {
    return (
      <div className="card text-center py-8">
        <p className="text-gray-400">Нет заданий на проверке</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {submissions.map((submission) => (
        <div key={submission.id} className="card">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="font-semibold text-white">{submission.task_title}</h3>
              <p className="text-sm text-gray-400">От: {submission.student_name}</p>
            </div>
            <span className="px-2 py-1 text-xs rounded-full bg-yellow-600/30 text-yellow-400">
              На проверке
            </span>
          </div>

          {submission.text_answer && (
            <div className="mb-4 p-3 bg-space-800 rounded-lg">
              <p className="text-sm text-gray-400 mb-1">Ответ:</p>
              <p className="text-gray-300 whitespace-pre-wrap">{submission.text_answer}</p>
            </div>
          )}

          {submission.file_answer && (
            <div className="mb-4">
              <a 
                href={submission.file_answer} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-mars-500 hover:text-mars-400 text-sm"
              >
                Скачать прикреплённый файл
              </a>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <input
              type="number"
              placeholder="Оценка"
              className="input text-sm"
              onChange={(e) => setReviewData({
                ...reviewData,
                [submission.id]: { ...reviewData[submission.id], grade: e.target.value }
              })}
            />
            <input
              type="number"
              placeholder="Монеты"
              className="input text-sm"
              onChange={(e) => setReviewData({
                ...reviewData,
                [submission.id]: { ...reviewData[submission.id], coins: e.target.value }
              })}
            />
            <input
              type="text"
              placeholder="Комментарий"
              className="input text-sm md:col-span-2"
              onChange={(e) => setReviewData({
                ...reviewData,
                [submission.id]: { ...reviewData[submission.id], comment: e.target.value }
              })}
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => onReview(
                submission.id,
                'APPROVED',
                reviewData[submission.id]?.grade || 5,
                reviewData[submission.id]?.comment || '',
                reviewData[submission.id]?.coins || 0
              )}
              className="btn-primary text-sm flex-1"
            >
              Одобрить
            </button>
            <button
              onClick={() => onReview(
                submission.id,
                'REJECTED',
                reviewData[submission.id]?.grade || 0,
                reviewData[submission.id]?.comment || '',
                0
              )}
              className="btn-secondary text-sm flex-1"
            >
              Отклонить
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// Форма создания студента
function CreateStudentForm({ newStudent, setNewStudent, onSubmit, isCreating, createdCredentials }) {
  return (
    <div className="max-w-xl">
      <div className="card">
        <h2 className="text-xl font-semibold text-white mb-6">Создать нового студента</h2>

        {createdCredentials && (
          <div className="mb-6 p-4 bg-green-900/30 border border-green-500/50 rounded-lg">
            <h3 className="font-semibold text-green-400 mb-2">Студент создан!</h3>
            <p className="text-gray-300 text-sm mb-2">Учётные данные для входа:</p>
            <div className="bg-space-800 p-3 rounded font-mono text-sm">
              <p className="text-gray-300">Логин: <span className="text-white">{createdCredentials.username}</span></p>
              <p className="text-gray-300">Пароль: <span className="text-white">{createdCredentials.password}</span></p>
            </div>
            <p className="text-xs text-gray-500 mt-2">Сохраните эти данные, пароль показывается только один раз!</p>
          </div>
        )}

        <form onSubmit={onSubmit}>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Имя *</label>
              <input
                type="text"
                value={newStudent.first_name}
                onChange={(e) => setNewStudent({ ...newStudent, first_name: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Фамилия</label>
              <input
                type="text"
                value={newStudent.last_name}
                onChange={(e) => setNewStudent({ ...newStudent, last_name: e.target.value })}
                className="input"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">Телефон</label>
            <input
              type="tel"
              value={newStudent.phone}
              onChange={(e) => setNewStudent({ ...newStudent, phone: e.target.value })}
              className="input"
              placeholder="+7 (999) 123-45-67"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">Группа *</label>
            <select
              value={newStudent.student_group}
              onChange={(e) => setNewStudent({ ...newStudent, student_group: e.target.value })}
              className="input"
            >
              <option value="FRONTEND">Frontend</option>
              <option value="BACKEND">Backend</option>
              <option value="NONE">Не указано</option>
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-1">Информация о родителях</label>
            <textarea
              value={newStudent.parent_info}
              onChange={(e) => setNewStudent({ ...newStudent, parent_info: e.target.value })}
              className="input resize-none"
              rows={3}
              placeholder="ФИО родителей, контакты..."
            />
          </div>

          <button type="submit" disabled={isCreating} className="w-full btn-primary">
            {isCreating ? 'Создание...' : 'Создать студента'}
          </button>
        </form>
      </div>
    </div>
  );
}

// Модальное окно для работы с монетами
function CoinsModal({ student, onClose, onSubmit }) {
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!amount || !reason) {
      alert('Заполните все поля');
      return;
    }
    onSubmit(student.id, parseInt(amount), reason);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-space-900 rounded-xl border border-space-700 w-full max-w-md">
        <div className="p-6 border-b border-space-700">
          <h2 className="text-xl font-semibold text-white">
            Управление монетами
          </h2>
          <p className="text-gray-400 text-sm">
            {student.first_name} {student.last_name} (баланс: {student.balance})
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Сумма (положительная для начисления, отрицательная для списания)
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input"
              placeholder="50 или -30"
              required
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Причина
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="input"
              placeholder="За хорошую работу / Штраф за..."
              required
            />
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 btn-secondary">
              Отмена
            </button>
            <button type="submit" className="flex-1 btn-primary">
              Выполнить
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
