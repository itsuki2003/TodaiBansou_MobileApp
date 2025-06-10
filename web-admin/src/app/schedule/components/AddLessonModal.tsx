'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendarPlus, 
  faTimes, 
  faUser, 
  faBook, 
  faClock, 
  faUserTie, 
  faVideo, 
  faCheck, 
  faExclamationTriangle,
  faStickyNote
} from '@fortawesome/free-solid-svg-icons';
import { Student, Teacher, LessonSlotFormData } from '@/types/schedule';
import { LESSON_COLORS } from '../constants/colors';

interface AddLessonModalProps {
  isOpen: boolean;
  selectedDate?: Date;
  selectedStudent: Student | null;
  students: Student[];
  teachers: Teacher[];
  onClose: () => void;
  onCreate: (data: LessonSlotFormData) => Promise<void>;
  onSuccess: () => void;
}

export default function AddLessonModal({
  isOpen,
  selectedDate,
  selectedStudent,
  students,
  teachers,
  onClose,
  onCreate,
  onSuccess
}: AddLessonModalProps) {
  const [formData, setFormData] = useState<LessonSlotFormData>({
    student_id: '',
    slot_type: '通常授業',
    slot_date: '',
    start_time: '16:00',
    end_time: '17:00',
    teacher_id: undefined,
    google_meet_link: undefined,
    notes: undefined
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // ESCキーでモーダルを閉じる処理
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen && !isSubmitting) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isSubmitting]);

  // モーダルが開かれたときにフォームを初期化
  useEffect(() => {
    if (isOpen) {
      const dateStr = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd');
      setFormData({
        student_id: selectedStudent?.id || '',
        slot_type: '通常授業',
        slot_date: dateStr,
        start_time: '16:00',
        end_time: '17:00',
        teacher_id: undefined,
        google_meet_link: undefined,
        notes: undefined
      });
      setError(null);
      setValidationErrors({});
    }
  }, [isOpen, selectedStudent, selectedDate]);

  // バリデーション
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.student_id) {
      errors.student_id = '生徒を選択してください';
    }
    if (!formData.slot_date) {
      errors.slot_date = '日付を選択してください';
    }
    if (!formData.start_time) {
      errors.start_time = '開始時刻を入力してください';
    }
    if (!formData.end_time) {
      errors.end_time = '終了時刻を入力してください';
    }
    if (formData.start_time && formData.end_time && formData.start_time >= formData.end_time) {
      errors.end_time = '終了時刻は開始時刻より後に設定してください';
    }
    if (formData.google_meet_link && !isValidUrl(formData.google_meet_link)) {
      errors.google_meet_link = '正しいURL形式で入力してください';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isValidUrl = (string: string): boolean => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onCreate(formData);
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '授業の作成に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  const handleInputChange = (field: keyof LessonSlotFormData, value: string | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // エラーがある場合はクリア
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  if (!isOpen) return null;

  const selectedLessonColor = LESSON_COLORS[formData.slot_type as keyof typeof LESSON_COLORS];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* オーバーレイ */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={handleClose}
        />
        
        {/* モーダルコンテンツ */}
        <div className="inline-block w-full max-w-2xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          {/* ヘッダー */}
          <div className="flex items-center justify-between pb-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 ${selectedLessonColor.legendBg} rounded-lg flex items-center justify-center`}>
                <FontAwesomeIcon icon={faCalendarPlus} className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">新規授業追加</h3>
                <p className="text-sm text-gray-500">授業または面談を新規作成します</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              disabled={isSubmitting}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
            >
              <FontAwesomeIcon icon={faTimes} className="w-5 h-5" />
            </button>
          </div>

          {/* フォーム */}
          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            {/* 生徒選択 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  生徒 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.student_id}
                    onChange={(e) => handleInputChange('student_id', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 ${
                      validationErrors.student_id ? 'border-red-300' : 'border-gray-300'
                    }`}
                    required
                    disabled={isSubmitting}
                  >
                    <option value="">生徒を選択</option>
                    {students.map(student => (
                      <option key={student.id} value={student.id}>
                        {student.full_name} {student.grade && `(${student.grade})`}
                      </option>
                    ))}
                  </select>
                  <FontAwesomeIcon 
                    icon={faUser} 
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" 
                  />
                </div>
                {validationErrors.student_id && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.student_id}</p>
                )}
              </div>

              {/* 授業種別 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  授業種別 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <select
                    value={formData.slot_type}
                    onChange={(e) => handleInputChange('slot_type', e.target.value as any)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                    disabled={isSubmitting}
                  >
                    {Object.keys(LESSON_COLORS).map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                  <FontAwesomeIcon 
                    icon={faBook} 
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" 
                  />
                </div>
              </div>
            </div>

            {/* 日時設定 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center">
                <FontAwesomeIcon icon={faClock} className="mr-2 w-4 h-4" />
                日時設定
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    日付 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.slot_date}
                    onChange={(e) => handleInputChange('slot_date', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 ${
                      validationErrors.slot_date ? 'border-red-300' : 'border-gray-300'
                    }`}
                    required
                    disabled={isSubmitting}
                  />
                  {validationErrors.slot_date && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.slot_date}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    開始時刻 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => handleInputChange('start_time', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 ${
                      validationErrors.start_time ? 'border-red-300' : 'border-gray-300'
                    }`}
                    required
                    disabled={isSubmitting}
                  />
                  {validationErrors.start_time && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.start_time}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    終了時刻 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => handleInputChange('end_time', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 ${
                      validationErrors.end_time ? 'border-red-300' : 'border-gray-300'
                    }`}
                    required
                    disabled={isSubmitting}
                  />
                  {validationErrors.end_time && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.end_time}</p>
                  )}
                </div>
              </div>
            </div>

            {/* 講師選択 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                担当講師（オプション）
              </label>
              <div className="relative">
                <select
                  value={formData.teacher_id || ''}
                  onChange={(e) => handleInputChange('teacher_id', e.target.value || undefined)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                  disabled={isSubmitting}
                >
                  <option value="">講師を選択（後で設定可能）</option>
                  {teachers.map(teacher => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.full_name}
                    </option>
                  ))}
                </select>
                <FontAwesomeIcon 
                  icon={faUserTie} 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" 
                />
              </div>
            </div>

            {/* Google Meet リンク */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Google Meet リンク（オプション）
              </label>
              <div className="relative">
                <input
                  type="url"
                  value={formData.google_meet_link || ''}
                  onChange={(e) => handleInputChange('google_meet_link', e.target.value || undefined)}
                  placeholder="https://meet.google.com/..."
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 ${
                    validationErrors.google_meet_link ? 'border-red-300' : 'border-gray-300'
                  }`}
                  disabled={isSubmitting}
                />
                <FontAwesomeIcon 
                  icon={faVideo} 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" 
                />
              </div>
              {validationErrors.google_meet_link && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.google_meet_link}</p>
              )}
            </div>

            {/* 備考 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                備考（オプション）
              </label>
              <div className="relative">
                <textarea
                  value={formData.notes || ''}
                  onChange={(e) => handleInputChange('notes', e.target.value || undefined)}
                  placeholder="授業に関する特記事項があれば入力してください"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 resize-none"
                  disabled={isSubmitting}
                />
                <FontAwesomeIcon 
                  icon={faStickyNote} 
                  className="absolute right-3 top-3 text-gray-400 w-4 h-4 pointer-events-none" 
                />
              </div>
            </div>

            {/* エラー表示 */}
            {error && (
              <div className="bg-error-50 border border-error-200 rounded-lg p-4">
                <div className="flex items-center">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="w-5 h-5 text-error-500 mr-3" />
                  <p className="text-sm text-error-700">{error}</p>
                </div>
              </div>
            )}

            {/* アクションボタン */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !formData.student_id || !formData.slot_date}
                className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    作成中...
                  </>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faCheck} className="mr-2 w-4 h-4" />
                    授業を作成
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}