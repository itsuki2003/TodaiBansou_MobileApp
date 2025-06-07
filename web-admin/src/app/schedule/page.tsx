'use client';

import { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { ja } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import { LessonSlotWithDetails, CalendarEvent, Student, ModalState } from '@/types/schedule';
import StudentSelector from './components/StudentSelector';
import CalendarView from './components/CalendarView';
import LessonSlotModal from './components/LessonSlotModal';
import AddLessonModal from './components/AddLessonModal';
import { useScheduleData } from './hooks/useScheduleData';
import { useLessonActions } from './hooks/useLessonActions';

// react-big-calendarの日本語ローカライゼーション
const locales = {
  'ja': ja,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

export default function SchedulePage() {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    mode: 'view'
  });

  const {
    lessonSlots,
    students,
    teachers,
    loading,
    error,
    refetch
  } = useScheduleData(selectedStudent?.id, currentDate);

  const {
    createLessonSlot,
    updateLessonSlot,
    deleteLessonSlot,
    markAsAbsent,
    createReschedule
  } = useLessonActions();

  // LessonSlotをCalendarEventに変換
  const calendarEvents: CalendarEvent[] = lessonSlots.map(slot => {
    const startDateTime = new Date(`${slot.slot_date}T${slot.start_time}`);
    const endDateTime = new Date(`${slot.slot_date}T${slot.end_time}`);

    return {
      id: slot.id,
      title: `${slot.student_name} - ${slot.slot_type}`,
      start: startDateTime,
      end: endDateTime,
      resource: slot,
      className: getEventClassName(slot)
    };
  });

  // 授業種別・ステータスに応じたCSSクラス
  function getEventClassName(slot: LessonSlotWithDetails): string {
    const baseClass = 'lesson-event';
    
    if (slot.status === '欠席') return `${baseClass} lesson-absent`;
    if (slot.status === '振替済み（振替元）') return `${baseClass} lesson-rescheduled`;
    
    switch (slot.slot_type) {
      case '通常授業': return `${baseClass} lesson-regular`;
      case '固定面談': return `${baseClass} lesson-consultation`;
      case '振替授業': return `${baseClass} lesson-makeup`;
      case '追加授業': return `${baseClass} lesson-additional`;
      default: return baseClass;
    }
  }

  // カレンダーイベントクリック
  const handleEventClick = (event: CalendarEvent) => {
    setModalState({
      isOpen: true,
      mode: 'view',
      selectedEvent: event
    });
  };

  // 空の日時クリック（新規授業追加）
  const handleSlotClick = (slotInfo: { start: Date; end: Date }) => {
    if (!selectedStudent) {
      alert('まず生徒を選択してください');
      return;
    }

    setModalState({
      isOpen: true,
      mode: 'create',
      selectedDate: slotInfo.start
    });
  };

  // モーダルを閉じる
  const closeModal = () => {
    setModalState({
      isOpen: false,
      mode: 'view'
    });
  };

  // データを再読み込み
  const handleDataUpdate = () => {
    refetch();
    closeModal();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-600">読み込み中...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg text-red-600">エラー: {error}</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          授業スケジュール管理
        </h1>
        
        {/* 生徒選択 */}
        <div className="mb-4">
          <StudentSelector
            students={students}
            selectedStudent={selectedStudent}
            onSelectStudent={setSelectedStudent}
          />
        </div>

        {/* ヘルプテキスト */}
        {selectedStudent && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
            <h3 className="font-medium text-blue-900 mb-2">操作方法:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• 授業をクリックすると詳細を表示します</li>
              <li>• 空いている時間をクリックすると新しい授業を追加できます</li>
              <li>• 授業を右クリックするとコンテキストメニューが表示されます</li>
            </ul>
          </div>
        )}
      </div>

      {/* カレンダー */}
      <div className="bg-white rounded-lg shadow-lg">
        <CalendarView
          localizer={localizer}
          events={calendarEvents}
          currentDate={currentDate}
          onNavigate={setCurrentDate}
          onEventClick={handleEventClick}
          onSlotClick={handleSlotClick}
          selectedStudent={selectedStudent}
        />
      </div>

      {/* 凡例 */}
      <div className="mt-6 bg-white rounded-lg shadow p-4">
        <h3 className="font-medium mb-3">凡例</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-500 rounded mr-2"></div>
            <span>通常授業</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-purple-500 rounded mr-2"></div>
            <span>固定面談</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-orange-500 rounded mr-2"></div>
            <span>振替授業</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
            <span>追加授業</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gray-400 rounded mr-2"></div>
            <span>欠席</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-300 rounded mr-2"></div>
            <span>振替済み</span>
          </div>
        </div>
      </div>

      {/* モーダル */}
      <LessonSlotModal
        isOpen={modalState.isOpen && modalState.mode !== 'create'}
        mode={modalState.mode}
        event={modalState.selectedEvent}
        teachers={teachers}
        onClose={closeModal}
        onUpdate={handleDataUpdate}
        onMarkAbsent={markAsAbsent}
        onReschedule={createReschedule}
        onDelete={deleteLessonSlot}
      />

      <AddLessonModal
        isOpen={modalState.isOpen && modalState.mode === 'create'}
        selectedDate={modalState.selectedDate}
        selectedStudent={selectedStudent}
        teachers={teachers}
        onClose={closeModal}
        onCreate={createLessonSlot}
        onSuccess={handleDataUpdate}
      />
    </div>
  );
}