'use client';

import { useState, useEffect } from 'react';
import Modal from 'react-modal';
import { CalendarEvent, Teacher, LessonSlotFormData, ModalState } from '@/types/schedule';

interface LessonSlotModalProps {
  isOpen: boolean;
  mode: ModalState['mode'];
  event?: CalendarEvent;
  teachers: Teacher[];
  onClose: () => void;
  onUpdate: (data: LessonSlotFormData) => void;
  onMarkAbsent: (slotId: string, reason: string) => void;
  onReschedule: (originalSlotId: string, newData: any) => void;
  onDelete: (slotId: string) => void;
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
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<LessonSlotFormData>({
    student_id: '',
    slot_type: '通常授業',
    slot_date: '',
    start_time: '',
    end_time: '',
  });
  const [absenceReason, setAbsenceReason] = useState('');
  const [showAbsenceForm, setShowAbsenceForm] = useState(false);
  const [showRescheduleForm, setShowRescheduleForm] = useState(false);
  const [rescheduleData, setRescheduleData] = useState({
    new_date: '',
    new_start_time: '',
    new_end_time: '',
    teacher_id: ''
  });

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
    }
    setIsEditing(false);
    setShowAbsenceForm(false);
    setShowRescheduleForm(false);
    setAbsenceReason('');
  }, [event, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
    setIsEditing(false);
  };

  const handleAbsenceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (event && absenceReason.trim()) {
      onMarkAbsent(event.resource.id, absenceReason);
      setShowAbsenceForm(false);
      setAbsenceReason('');
    }
  };

  const handleRescheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (event) {
      onReschedule(event.resource.id, rescheduleData);
      setShowRescheduleForm(false);
    }
  };

  const handleDelete = () => {
    if (event && confirm('この授業を削除してもよろしいですか？')) {
      onDelete(event.resource.id);
    }
  };

  if (!event) return null;

  const slot = event.resource;

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      contentLabel="授業詳細"
      className="max-w-2xl mx-auto mt-20 bg-white rounded-lg shadow-xl outline-none"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center p-4"
    >
      <div className="p-6">
        {/* ヘッダー */}
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            授業詳細
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* メイン情報 */}
        {!isEditing && !showAbsenceForm && !showRescheduleForm && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">生徒</label>
                <p className="mt-1 text-lg">{slot.student_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">講師</label>
                <p className="mt-1 text-lg">{slot.teacher_name || '未定'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">授業種別</label>
                <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${
                  slot.slot_type === '通常授業' ? 'bg-blue-100 text-blue-800' :
                  slot.slot_type === '固定面談' ? 'bg-purple-100 text-purple-800' :
                  slot.slot_type === '振替授業' ? 'bg-orange-100 text-orange-800' :
                  'bg-green-100 text-green-800'
                }`}>
                  {slot.slot_type}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">ステータス</label>
                <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${
                  slot.status === '予定通り' ? 'bg-green-100 text-green-800' :
                  slot.status === '実施済み' ? 'bg-blue-100 text-blue-800' :
                  slot.status === '欠席' ? 'bg-gray-100 text-gray-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {slot.status}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">日付</label>
                <p className="mt-1 text-lg">{slot.slot_date}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">開始時刻</label>
                <p className="mt-1 text-lg">{slot.start_time}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">終了時刻</label>
                <p className="mt-1 text-lg">{slot.end_time}</p>
              </div>
            </div>

            {slot.google_meet_link && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Google Meet</label>
                <a
                  href={slot.google_meet_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-blue-600 hover:text-blue-800 underline"
                >
                  会議に参加
                </a>
              </div>
            )}

            {slot.notes && (
              <div>
                <label className="block text-sm font-medium text-gray-700">備考</label>
                <p className="mt-1 text-gray-900">{slot.notes}</p>
              </div>
            )}

            {/* アクションボタン */}
            <div className="flex justify-between pt-6 border-t">
              <div className="space-x-2">
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  編集
                </button>
                {slot.status === '予定通り' && (
                  <>
                    <button
                      onClick={() => setShowAbsenceForm(true)}
                      className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
                    >
                      欠席マーク
                    </button>
                    <button
                      onClick={() => setShowRescheduleForm(true)}
                      className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                    >
                      振替設定
                    </button>
                  </>
                )}
              </div>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                削除
              </button>
            </div>
          </div>
        )}

        {/* 編集フォーム */}
        {isEditing && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">授業種別</label>
                <select
                  value={formData.slot_type}
                  onChange={(e) => setFormData({...formData, slot_type: e.target.value as any})}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="通常授業">通常授業</option>
                  <option value="固定面談">固定面談</option>
                  <option value="振替授業">振替授業</option>
                  <option value="追加授業">追加授業</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">担当講師</label>
                <select
                  value={formData.teacher_id || ''}
                  onChange={(e) => setFormData({...formData, teacher_id: e.target.value})}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">講師を選択</option>
                  {teachers.filter(t => t.account_status === '有効').map(teacher => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.full_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">日付</label>
                <input
                  type="date"
                  value={formData.slot_date}
                  onChange={(e) => setFormData({...formData, slot_date: e.target.value})}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">開始時刻</label>
                <input
                  type="time"
                  value={formData.start_time}
                  onChange={(e) => setFormData({...formData, start_time: e.target.value})}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">終了時刻</label>
                <input
                  type="time"
                  value={formData.end_time}
                  onChange={(e) => setFormData({...formData, end_time: e.target.value})}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Google Meet リンク</label>
              <input
                type="url"
                value={formData.google_meet_link || ''}
                onChange={(e) => setFormData({...formData, google_meet_link: e.target.value})}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="https://meet.google.com/..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">備考</label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4 border-t">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                保存
              </button>
            </div>
          </form>
        )}

        {/* 欠席フォーム */}
        {showAbsenceForm && (
          <form onSubmit={handleAbsenceSubmit} className="space-y-4">
            <h3 className="text-lg font-medium">欠席理由を入力してください</h3>
            <textarea
              value={absenceReason}
              onChange={(e) => setAbsenceReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={3}
              placeholder="欠席理由を入力..."
              required
            />
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowAbsenceForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
              >
                欠席マーク
              </button>
            </div>
          </form>
        )}

        {/* 振替フォーム */}
        {showRescheduleForm && (
          <form onSubmit={handleRescheduleSubmit} className="space-y-4">
            <h3 className="text-lg font-medium">振替授業の設定</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">振替日</label>
                <input
                  type="date"
                  value={rescheduleData.new_date}
                  onChange={(e) => setRescheduleData({...rescheduleData, new_date: e.target.value})}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">開始時刻</label>
                <input
                  type="time"
                  value={rescheduleData.new_start_time}
                  onChange={(e) => setRescheduleData({...rescheduleData, new_start_time: e.target.value})}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">終了時刻</label>
                <input
                  type="time"
                  value={rescheduleData.new_end_time}
                  onChange={(e) => setRescheduleData({...rescheduleData, new_end_time: e.target.value})}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">担当講師</label>
              <select
                value={rescheduleData.teacher_id}
                onChange={(e) => setRescheduleData({...rescheduleData, teacher_id: e.target.value})}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">現在の講師を維持</option>
                {teachers.filter(t => t.account_status === '有効').map(teacher => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.full_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowRescheduleForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                振替設定
              </button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}