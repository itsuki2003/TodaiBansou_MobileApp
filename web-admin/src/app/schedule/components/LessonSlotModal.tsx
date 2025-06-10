'use client';

import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faCalendarDays,
  faTimes,
  faUser,
  faUserTie,
  faBook,
  faClock,
  faVideo,
  faCheck,
  faEdit,
  faUserXmark,
  faCalendarXmark,
  faTrash,
  faExclamationTriangle,
  faStickyNote,
  faInfoCircle,
  faCheckCircle,
  faExternalLinkAlt
} from '@fortawesome/free-solid-svg-icons';
import { CalendarEvent, Teacher, LessonSlotFormData, ModalState } from '@/types/schedule';
import { LESSON_COLORS, STATUS_COLORS } from '../constants/colors';

interface LessonSlotModalProps {
  isOpen: boolean;
  mode: ModalState['mode'];
  event?: CalendarEvent;
  teachers: Teacher[];
  onClose: () => void;
  onUpdate: (data: LessonSlotFormData) => Promise<void>;
  onMarkAbsent: (slotId: string, reason: string) => Promise<void>;
  onReschedule: (originalSlotId: string, newData: any) => Promise<void>;
  onDelete: (slotId: string) => Promise<void>;
}

export default function LessonSlotModal({
  isOpen,
  mode,
  event,
  teachers,
  onClose,
  onUpdate,
  onMarkAbsent,
  onReschedule,
  onDelete
}: LessonSlotModalProps) {
  const [currentView, setCurrentView] = useState<'detail' | 'edit' | 'absence' | 'reschedule'>('detail');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState<LessonSlotFormData>({
    student_id: '',
    slot_type: '通常授業',
    slot_date: '',
    start_time: '',
    end_time: '',
  });
  
  const [absenceReason, setAbsenceReason] = useState('');
  const [rescheduleData, setRescheduleData] = useState({
    new_date: '',
    new_start_time: '',
    new_end_time: '',
    teacher_id: ''
  });

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

  // モーダルが開かれたときにフォームデータを初期化
  useEffect(() => {
    if (event && isOpen) {
      const slot = event.resource;
      setFormData({
        student_id: slot.student_id,
        teacher_id: slot.teacher_id,
        slot_type: slot.slot_type,
        slot_date: slot.slot_date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        google_meet_link: slot.google_meet_link,
        notes: slot.notes
      });
      setRescheduleData({
        new_date: '',
        new_start_time: slot.start_time,
        new_end_time: slot.end_time,
        teacher_id: slot.teacher_id || ''
      });
    }
    setCurrentView('detail');
    setError(null);
    setValidationErrors({});
    setAbsenceReason('');
    setIsSubmitting(false);
  }, [event, isOpen]);

  // バリデーション
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (currentView === 'edit') {
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
    } else if (currentView === 'absence') {
      if (!absenceReason.trim()) {
        errors.absenceReason = '欠席理由を入力してください';
      }
    } else if (currentView === 'reschedule') {
      if (!rescheduleData.new_date) {
        errors.new_date = '振替日を選択してください';
      }
      if (!rescheduleData.new_start_time) {
        errors.new_start_time = '開始時刻を入力してください';
      }
      if (!rescheduleData.new_end_time) {
        errors.new_end_time = '終了時刻を入力してください';
      }
      if (rescheduleData.new_start_time && rescheduleData.new_end_time && rescheduleData.new_start_time >= rescheduleData.new_end_time) {
        errors.new_end_time = '終了時刻は開始時刻より後に設定してください';
      }
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
      if (currentView === 'edit') {
        await onUpdate(formData);
        setCurrentView('detail');
      } else if (currentView === 'absence' && event) {
        await onMarkAbsent(event.resource.id, absenceReason);
        onClose();
      } else if (currentView === 'reschedule' && event) {
        await onReschedule(event.resource.id, rescheduleData);
        onClose();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!event) return;
    
    const confirmMessage = '本当にこの授業を削除しますか？\n\n削除された授業は復元できません。';
    if (!confirm(confirmMessage)) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onDelete(event.resource.id);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '削除に失敗しました');
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

  if (!event || !isOpen) return null;

  const slot = event.resource;
  const selectedLessonColor = LESSON_COLORS[slot.slot_type as keyof typeof LESSON_COLORS];
  const selectedStatusColor = STATUS_COLORS[slot.status as keyof typeof STATUS_COLORS];

  // 日付フォーマット関数
  const formatSlotDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr + 'T00:00:00');
      return format(date, 'yyyy年M月d日(E)', { locale: ja });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* オーバーレイ */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={handleClose}
        />
        
        {/* モーダルコンテンツ */}
        <div className="inline-block w-full max-w-3xl p-6 my-8 overflow-hidden text-left align-middle transition-all transform bg-white shadow-xl rounded-2xl">
          {/* ヘッダー */}
          <div className="flex items-center justify-between pb-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 ${selectedLessonColor.legendBg} rounded-xl flex items-center justify-center`}>
                <FontAwesomeIcon icon={faCalendarDays} className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {currentView === 'detail' && '授業詳細'}
                  {currentView === 'edit' && '授業編集'}
                  {currentView === 'absence' && '欠席申請'}
                  {currentView === 'reschedule' && '振替設定'}
                </h3>
                <p className="text-sm text-gray-500">
                  {slot.student_name} / {slot.slot_type}
                </p>
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

          {/* 詳細表示 */}
          {currentView === 'detail' && (
            <div className="mt-6 space-y-6">
              {/* 基本情報カード */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FontAwesomeIcon icon={faInfoCircle} className="mr-3 text-primary-600 w-5 h-5" />
                  基本情報
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">生徒</label>
                      <div className="flex items-center space-x-2">
                        <FontAwesomeIcon icon={faUser} className="w-4 h-4 text-gray-500" />
                        <p className="text-lg font-medium text-gray-900">{slot.student_name}</p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">担当講師</label>
                      <div className="flex items-center space-x-2">
                        <FontAwesomeIcon icon={faUserTie} className="w-4 h-4 text-gray-500" />
                        <p className="text-lg font-medium text-gray-900">{slot.teacher_name || '未定'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">授業種別</label>
                      <div className="flex items-center space-x-2">
                        <FontAwesomeIcon icon={faBook} className="w-4 h-4 text-gray-500" />
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${selectedLessonColor.bg} ${selectedLessonColor.text}`}>
                          {slot.slot_type}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
                      <div className="flex items-center space-x-2">
                        <FontAwesomeIcon icon={faCheckCircle} className="w-4 h-4 text-gray-500" />
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${selectedStatusColor.bg} ${selectedStatusColor.text}`}>
                          {slot.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 日時情報カード */}
              <div className="bg-primary-50 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FontAwesomeIcon icon={faClock} className="mr-3 text-primary-600 w-5 h-5" />
                  日時情報
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">授業日</label>
                    <p className="text-lg font-medium text-gray-900">{formatSlotDate(slot.slot_date)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">開始時刻</label>
                    <p className="text-lg font-medium text-gray-900">{slot.start_time}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">終了時刻</label>
                    <p className="text-lg font-medium text-gray-900">{slot.end_time}</p>
                  </div>
                </div>
              </div>

              {/* Google Meet・備考 */}
              {(slot.google_meet_link || slot.notes) && (
                <div className="space-y-4">
                  {slot.google_meet_link && (
                    <div className="bg-blue-50 rounded-xl p-6">
                      <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center">
                        <FontAwesomeIcon icon={faVideo} className="mr-2 text-blue-600 w-4 h-4" />
                        Google Meet
                      </label>
                      <a
                        href={slot.google_meet_link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                      >
                        <FontAwesomeIcon icon={faExternalLinkAlt} className="mr-2 w-4 h-4" />
                        会議に参加
                      </a>
                    </div>
                  )}
                  {slot.notes && (
                    <div className="bg-amber-50 rounded-xl p-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                        <FontAwesomeIcon icon={faStickyNote} className="mr-2 text-amber-600 w-4 h-4" />
                        備考
                      </label>
                      <p className="text-gray-900 leading-relaxed">{slot.notes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* アクションボタン */}
              <div className="flex flex-col sm:flex-row justify-between space-y-3 sm:space-y-0 sm:space-x-4 pt-6 border-t border-gray-200">
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => setCurrentView('edit')}
                    disabled={isSubmitting}
                    className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 font-medium disabled:opacity-50"
                  >
                    <FontAwesomeIcon icon={faEdit} className="mr-2 w-4 h-4" />
                    編集
                  </button>
                  {slot.status === '予定通り' && (
                    <>
                      <button
                        onClick={() => setCurrentView('absence')}
                        disabled={isSubmitting}
                        className="flex items-center px-4 py-2 bg-warning-600 text-white rounded-lg hover:bg-warning-700 focus:ring-2 focus:ring-warning-500 focus:ring-offset-2 transition-all duration-200 font-medium disabled:opacity-50"
                      >
                        <FontAwesomeIcon icon={faUserXmark} className="mr-2 w-4 h-4" />
                        欠席申請
                      </button>
                      <button
                        onClick={() => setCurrentView('reschedule')}
                        disabled={isSubmitting}
                        className="flex items-center px-4 py-2 bg-accent-600 text-white rounded-lg hover:bg-accent-700 focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 transition-all duration-200 font-medium disabled:opacity-50"
                      >
                        <FontAwesomeIcon icon={faCalendarXmark} className="mr-2 w-4 h-4" />
                        振替設定
                      </button>
                    </>
                  )}
                </div>
                <button
                  onClick={handleDelete}
                  disabled={isSubmitting}
                  className="flex items-center px-4 py-2 bg-error-600 text-white rounded-lg hover:bg-error-700 focus:ring-2 focus:ring-error-500 focus:ring-offset-2 transition-all duration-200 font-medium disabled:opacity-50"
                >
                  <FontAwesomeIcon icon={faTrash} className="mr-2 w-4 h-4" />
                  削除
                </button>
              </div>
            </div>
          )}

          {/* 編集フォーム */}
          {currentView === 'edit' && (
            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
              {/* 基本設定 */}
              <div className="bg-gray-50 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FontAwesomeIcon icon={faEdit} className="mr-3 text-primary-600 w-5 h-5" />
                  授業設定
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      担当講師
                    </label>
                    <div className="relative">
                      <select
                        value={formData.teacher_id || ''}
                        onChange={(e) => handleInputChange('teacher_id', e.target.value || undefined)}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                        disabled={isSubmitting}
                      >
                        <option value="">講師を選択</option>
                        {teachers.filter(t => t.account_status === '有効').map(teacher => (
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
                </div>
              </div>

              {/* 日時設定 */}
              <div className="bg-primary-50 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FontAwesomeIcon icon={faClock} className="mr-3 text-primary-600 w-5 h-5" />
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

              {/* オプション設定 */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Google Meet リンク
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    備考
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
                  onClick={() => setCurrentView('detail')}
                  disabled={isSubmitting}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                      保存中...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faCheck} className="mr-2 w-4 h-4" />
                      変更を保存
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* 欠席フォーム */}
          {currentView === 'absence' && (
            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
              <div className="bg-warning-50 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FontAwesomeIcon icon={faUserXmark} className="mr-3 text-warning-600 w-5 h-5" />
                  欠席申請
                </h4>
                <div className="mb-4 p-4 bg-white rounded-lg border border-warning-200">
                  <div className="text-sm text-gray-700">
                    <p><strong>授業日時:</strong> {formatSlotDate(slot.slot_date)} {slot.start_time} - {slot.end_time}</p>
                    <p><strong>授業種別:</strong> {slot.slot_type}</p>
                    <p><strong>担当講師:</strong> {slot.teacher_name || '未定'}</p>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    欠席理由 <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <textarea
                      value={absenceReason}
                      onChange={(e) => {
                        setAbsenceReason(e.target.value);
                        if (validationErrors.absenceReason) {
                          setValidationErrors(prev => {
                            const newErrors = { ...prev };
                            delete newErrors.absenceReason;
                            return newErrors;
                          });
                        }
                      }}
                      placeholder="欠席理由を詳しく入力してください（例：発熱のため、学校行事のため等）"
                      rows={4}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-warning-500 focus:border-warning-500 transition-all duration-200 resize-none ${
                        validationErrors.absenceReason ? 'border-red-300' : 'border-gray-300'
                      }`}
                      required
                      disabled={isSubmitting}
                    />
                    <FontAwesomeIcon 
                      icon={faStickyNote} 
                      className="absolute right-3 top-3 text-gray-400 w-4 h-4 pointer-events-none" 
                    />
                  </div>
                  {validationErrors.absenceReason && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.absenceReason}</p>
                  )}
                </div>
                <div className="mt-4 p-3 bg-amber-100 rounded-lg">
                  <p className="text-sm text-amber-800">
                    <FontAwesomeIcon icon={faInfoCircle} className="mr-2 w-4 h-4" />
                    欠席申請後、運営より振替授業の調整についてご連絡いたします。
                  </p>
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
                  onClick={() => setCurrentView('detail')}
                  disabled={isSubmitting}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !absenceReason.trim()}
                  className="px-6 py-3 bg-warning-600 text-white rounded-lg font-medium hover:bg-warning-700 focus:ring-2 focus:ring-warning-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                      申請中...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faUserXmark} className="mr-2 w-4 h-4" />
                      欠席申請
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* 振替フォーム */}
          {currentView === 'reschedule' && (
            <form onSubmit={handleSubmit} className="mt-6 space-y-6">
              <div className="bg-accent-50 rounded-xl p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FontAwesomeIcon icon={faCalendarXmark} className="mr-3 text-accent-600 w-5 h-5" />
                  振替授業設定
                </h4>
                
                {/* 元の授業情報 */}
                <div className="mb-6 p-4 bg-white rounded-lg border border-accent-200">
                  <h5 className="text-sm font-medium text-gray-700 mb-2">振替元授業</h5>
                  <div className="text-sm text-gray-700 space-y-1">
                    <p><strong>日時:</strong> {formatSlotDate(slot.slot_date)} {slot.start_time} - {slot.end_time}</p>
                    <p><strong>種別:</strong> {slot.slot_type}</p>
                    <p><strong>講師:</strong> {slot.teacher_name || '未定'}</p>
                  </div>
                </div>

                {/* 振替先設定 */}
                <div className="space-y-4">
                  <h5 className="text-sm font-medium text-gray-700">振替先設定</h5>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        振替日 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={rescheduleData.new_date}
                        onChange={(e) => {
                          setRescheduleData({...rescheduleData, new_date: e.target.value});
                          if (validationErrors.new_date) {
                            setValidationErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors.new_date;
                              return newErrors;
                            });
                          }
                        }}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all duration-200 ${
                          validationErrors.new_date ? 'border-red-300' : 'border-gray-300'
                        }`}
                        required
                        disabled={isSubmitting}
                      />
                      {validationErrors.new_date && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.new_date}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        開始時刻 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="time"
                        value={rescheduleData.new_start_time}
                        onChange={(e) => {
                          setRescheduleData({...rescheduleData, new_start_time: e.target.value});
                          if (validationErrors.new_start_time) {
                            setValidationErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors.new_start_time;
                              return newErrors;
                            });
                          }
                        }}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all duration-200 ${
                          validationErrors.new_start_time ? 'border-red-300' : 'border-gray-300'
                        }`}
                        required
                        disabled={isSubmitting}
                      />
                      {validationErrors.new_start_time && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.new_start_time}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        終了時刻 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="time"
                        value={rescheduleData.new_end_time}
                        onChange={(e) => {
                          setRescheduleData({...rescheduleData, new_end_time: e.target.value});
                          if (validationErrors.new_end_time) {
                            setValidationErrors(prev => {
                              const newErrors = { ...prev };
                              delete newErrors.new_end_time;
                              return newErrors;
                            });
                          }
                        }}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all duration-200 ${
                          validationErrors.new_end_time ? 'border-red-300' : 'border-gray-300'
                        }`}
                        required
                        disabled={isSubmitting}
                      />
                      {validationErrors.new_end_time && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors.new_end_time}</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      担当講師
                    </label>
                    <div className="relative">
                      <select
                        value={rescheduleData.teacher_id}
                        onChange={(e) => setRescheduleData({...rescheduleData, teacher_id: e.target.value})}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent-500 focus:border-accent-500 transition-all duration-200"
                        disabled={isSubmitting}
                      >
                        <option value="">現在の講師を維持（{slot.teacher_name || '未定'}）</option>
                        {teachers.filter(t => t.account_status === '有効').map(teacher => (
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
                </div>
                <div className="mt-4 p-3 bg-blue-100 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <FontAwesomeIcon icon={faInfoCircle} className="mr-2 w-4 h-4" />
                    振替授業を設定すると、元の授業は「振替済み」の状態に変更され、新しい授業コマが作成されます。
                  </p>
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
                  onClick={() => setCurrentView('detail')}
                  disabled={isSubmitting}
                  className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !rescheduleData.new_date || !rescheduleData.new_start_time || !rescheduleData.new_end_time}
                  className="px-6 py-3 bg-accent-600 text-white rounded-lg font-medium hover:bg-accent-700 focus:ring-2 focus:ring-accent-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                      設定中...
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faCalendarXmark} className="mr-2 w-4 h-4" />
                      振替設定
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}