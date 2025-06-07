'use client';

import { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { Student, Teacher, LessonSlotFormData } from '@/types/schedule';

interface AddLessonModalProps {
  isOpen: boolean;
  selectedDate?: Date;
  selectedStudent: Student | null;
  teachers: Teacher[];
  onClose: () => void;
  onCreate: (data: LessonSlotFormData) => Promise<void>;
  onSuccess: () => void;
}

export default function AddLessonModal({
  isOpen,
  selectedDate,
  selectedStudent,
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
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // モーダルが開かれたときにフォームを初期化
  useEffect(() => {
    if (isOpen && selectedStudent && selectedDate) {
      const dateStr = selectedDate.toISOString().split('T')[0];
      setFormData({
        student_id: selectedStudent.id,
        slot_type: '通常授業',
        slot_date: dateStr,
        start_time: '16:00',
        end_time: '17:00',
      });
      setError(null);
    }
  }, [isOpen, selectedStudent, selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleClose}
      contentLabel="新規授業追加"
      className="max-w-lg mx-auto mt-20 bg-white rounded-lg shadow-xl outline-none"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4"
    >
      <div className="p-6">
        {/* ヘッダー */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            新規授業追加
          </h2>
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 生徒情報（読み取り専用） */}
          <div>
            <label className="block text-sm font-medium text-gray-700">生徒</label>
            <div className="mt-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
              {selectedStudent?.full_name} {selectedStudent?.grade && `(${selectedStudent.grade})`}
            </div>
          </div>

          {/* 授業種別 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">授業種別</label>
            <select
              value={formData.slot_type}
              onChange={(e) => setFormData({...formData, slot_type: e.target.value as any})}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
            >
              <option value="通常授業">通常授業</option>
              <option value="固定面談">固定面談</option>
              <option value="振替授業">振替授業</option>
              <option value="追加授業">追加授業</option>
            </select>
          </div>

          {/* 担当講師 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">担当講師</label>
            <select
              value={formData.teacher_id || ''}
              onChange={(e) => setFormData({...formData, teacher_id: e.target.value})}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isSubmitting}
            >
              <option value="">講師を選択（後で設定可）</option>
              {teachers
                .filter(t => t.account_status === '有効')
                .map(teacher => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.full_name}
                  </option>
                ))}
            </select>
          </div>

          {/* 日付 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">日付</label>
            <input
              type="date"
              value={formData.slot_date}
              onChange={(e) => setFormData({...formData, slot_date: e.target.value})}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* 時間 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">開始時刻</label>
              <input
                type="time"
                value={formData.start_time}
                onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={isSubmitting}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">終了時刻</label>
              <input
                type="time"
                value={formData.end_time}
                onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Google Meet リンク */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Google Meet リンク（任意）
            </label>
            <input
              type="url"
              value={formData.google_meet_link || ''}
              onChange={(e) => setFormData({...formData, google_meet_link: e.target.value})}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://meet.google.com/..."
              disabled={isSubmitting}
            />
          </div>

          {/* 備考 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">備考（任意）</label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              placeholder="授業に関する備考があれば入力..."
              disabled={isSubmitting}
            />
          </div>

          {/* アクションボタン */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {isSubmitting && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isSubmitting ? '作成中...' : '授業を作成'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}