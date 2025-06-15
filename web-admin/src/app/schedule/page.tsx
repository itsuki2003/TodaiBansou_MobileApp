'use client';

import { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import ja from 'date-fns/locale/ja';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './styles/calendar.css';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Header from '@/components/ui/Header';
import Breadcrumb from '@/components/ui/Breadcrumb';
import PageHeader from '@/components/ui/PageHeader';

import { LessonSlotWithDetails, CalendarEvent, Student, ModalState } from '@/types/schedule';
import StudentSelector from './components/StudentSelector';
import CalendarView from './components/CalendarView';
import CalendarToolbar from './components/CalendarToolbar';
import LessonLegend from './components/LessonLegend';
import LessonSlotModal from './components/LessonSlotModal';
import AddLessonModal from './components/AddLessonModal';
import { useScheduleData } from './hooks/useScheduleData';
import { useLessonActions } from './hooks/useLessonActions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendarDays, faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { getEventClassName } from './constants/colors';

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
  const [currentView, setCurrentView] = useState<'month' | 'week' | 'day'>('month');
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
    // タイムゾーンを考慮した日時作成
    const [year, month, day] = slot.slot_date.split('-').map(Number);
    const [startHour, startMinute] = slot.start_time.split(':').map(Number);
    const [endHour, endMinute] = slot.end_time.split(':').map(Number);
    
    const startDateTime = new Date(year, month - 1, day, startHour, startMinute);
    const endDateTime = new Date(year, month - 1, day, endHour, endMinute);

    const event = {
      id: slot.id,
      title: `${slot.student_name} - ${slot.slot_type}`,
      start: startDateTime,
      end: endDateTime,
      resource: slot
    };

    console.log('📅 イベント変換:', {
      original: slot,
      converted: event,
      startDateTime: startDateTime.toString(),
      endDateTime: endDateTime.toString()
    });

    return event;
  });

  console.log('📅 カレンダーイベント一覧:', calendarEvents);

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
    console.log('📅 スロットクリック:', slotInfo);
    console.log('📅 選択中の生徒:', selectedStudent);
    
    if (!selectedStudent) {
      alert('まず生徒を選択してください');
      return;
    }

    console.log('📅 モーダルを開きます');
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
        <PageHeader
          title="授業スケジュール管理"
          description="授業・面談のスケジュールを管理できます"
          icon="📅"
          colorTheme="success"
        />
        
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


        {/* カレンダーツールバー */}
        <CalendarToolbar
          currentView={currentView}
          currentDate={currentDate}
          onViewChange={setCurrentView}
          onNavigate={(action) => {
            const newDate = new Date(currentDate);
            switch (action) {
              case 'PREV':
                if (currentView === 'month') {
                  newDate.setMonth(newDate.getMonth() - 1);
                } else if (currentView === 'week') {
                  newDate.setDate(newDate.getDate() - 7);
                } else {
                  newDate.setDate(newDate.getDate() - 1);
                }
                break;
              case 'NEXT':
                if (currentView === 'month') {
                  newDate.setMonth(newDate.getMonth() + 1);
                } else if (currentView === 'week') {
                  newDate.setDate(newDate.getDate() + 7);
                } else {
                  newDate.setDate(newDate.getDate() + 1);
                }
                break;
              case 'TODAY':
                setCurrentDate(new Date());
                return;
            }
            setCurrentDate(newDate);
          }}
          onAddLesson={() => {
            if (!selectedStudent) {
              alert('まず生徒を選択してください');
              return;
            }
            setModalState({
              isOpen: true,
              mode: 'create',
              selectedDate: new Date()
            });
          }}
          onRefresh={() => refetch()}
          loading={loading}
        />

        {/* カレンダーと凡例を横並びに */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* カレンダー */}
          <div className="lg:col-span-3">
            <CalendarView
              localizer={localizer}
              events={calendarEvents}
              currentDate={currentDate}
              currentView={currentView}
              onNavigate={setCurrentDate}
              onView={setCurrentView}
              onEventClick={handleEventClick}
              onSlotClick={handleSlotClick}
              selectedStudent={selectedStudent}
              loading={loading}
            />
          </div>
          
          {/* 凡例 */}
          <div className="lg:col-span-1">
            <LessonLegend />
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
          students={students}
          teachers={teachers}
          onClose={closeModal}
          onCreate={createLessonSlot}
          onSuccess={handleDataUpdate}
        />
      </main>
    </div>
  );
}