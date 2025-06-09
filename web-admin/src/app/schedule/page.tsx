'use client';

import { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import ja from 'date-fns/locale/ja';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Header from '@/components/ui/Header';
import Breadcrumb from '@/components/ui/Breadcrumb';

import { LessonSlotWithDetails, CalendarEvent, Student, ModalState } from '@/types/schedule';
import StudentSelector from './components/StudentSelector';
import CalendarView from './components/CalendarView';
import LessonSlotModal from './components/LessonSlotModal';
import AddLessonModal from './components/AddLessonModal';
import { useScheduleData } from './hooks/useScheduleData';
import { useLessonActions } from './hooks/useLessonActions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarDays, faInfoCircle } from '@fortawesome/free-solid-svg-icons';

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
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [modalState, setModalState] = useState<ModalState>({
    isOpen: false,
    mode: 'view'
  });

  // 認証チェック
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

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

    const event = {
      id: slot.id,
      title: `${slot.student_name} - ${slot.slot_type}`,
      start: startDateTime,
      end: endDateTime,
      resource: slot,
      className: getEventClassName(slot)
    };

    console.log('📅 イベント変換:', { slot, event });
    return event;
  });

  console.log('📅 カレンダーイベント一覧:', calendarEvents);

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

  // 認証中
  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">読み込み中...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
        <Header />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="text-lg text-red-600 mb-4">エラー: {error}</div>
            <button 
              onClick={() => window.location.reload()} 
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
            >
              ページを再読み込み
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
      <Header />
      
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* パンくずリスト */}
        <Breadcrumb 
          items={[
            { label: 'スケジュール管理' }
          ]}
        />
        
        {/* ページヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            授業スケジュール管理
          </h1>
          <p className="text-gray-600">
            授業・面談のスケジュールを管理できます
          </p>
        </div>
        
        {/* 生徒選択 */}
        <div className="mb-6">
          <div className="bg-white rounded-xl shadow-lg border-0 p-6">
            <StudentSelector
              students={students}
              selectedStudent={selectedStudent}
              onSelectStudent={setSelectedStudent}
            />
          </div>
        </div>

        {/* ヘルプテキスト */}
        {selectedStudent && (
          <div className="bg-gradient-to-r from-success-50 to-success-100 border border-success-200 rounded-xl p-6 mb-6 shadow-sm">
            <div className="flex items-start space-x-3">
              <FontAwesomeIcon icon={faInfoCircle} className="w-5 h-5 text-success-600 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-success-900 mb-3">操作方法</h3>
                <ul className="text-sm text-success-800 space-y-2">
                  <li className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 bg-success-600 rounded-full mt-2 flex-shrink-0"></span>
                    <span>授業をクリックすると詳細を表示します</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 bg-success-600 rounded-full mt-2 flex-shrink-0"></span>
                    <span>空いている時間をクリックすると新しい授業を追加できます</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="w-1.5 h-1.5 bg-success-600 rounded-full mt-2 flex-shrink-0"></span>
                    <span>授業を右クリックするとコンテキストメニューが表示されます</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* カレンダー */}
        <div className="bg-white rounded-xl shadow-xl border-0">
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
        <div className="mt-8 bg-white rounded-xl shadow-lg border-0 p-6">
          <h3 className="font-semibold text-gray-900 mb-4 text-lg">凡例</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-blue-500 rounded shadow-sm"></div>
              <span className="text-sm font-medium text-gray-700">通常授業</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-purple-500 rounded shadow-sm"></div>
              <span className="text-sm font-medium text-gray-700">固定面談</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-orange-500 rounded shadow-sm"></div>
              <span className="text-sm font-medium text-gray-700">振替授業</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-green-500 rounded shadow-sm"></div>
              <span className="text-sm font-medium text-gray-700">追加授業</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-gray-400 rounded shadow-sm"></div>
              <span className="text-sm font-medium text-gray-700">欠席</span>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 bg-red-300 rounded shadow-sm"></div>
              <span className="text-sm font-medium text-gray-700">振替済み</span>
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
      </main>
    </div>
  );
}