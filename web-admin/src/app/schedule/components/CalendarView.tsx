'use client';

import { Calendar, DateLocalizer } from 'react-big-calendar';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faClock, faMapMarkerAlt } from '@fortawesome/free-solid-svg-icons';
import { CalendarEvent, Student } from '@/types/schedule';
import { getEventClassName, getLessonTypeColor, getStatusColor } from '../constants/colors';

interface CalendarViewProps {
  localizer: DateLocalizer;
  events: CalendarEvent[];
  currentDate: Date;
  currentView: 'month' | 'week' | 'day';
  onNavigate: (date: Date) => void;
  onView: (view: 'month' | 'week' | 'day') => void;
  onEventClick: (event: CalendarEvent) => void;
  onSlotClick: (slotInfo: { start: Date; end: Date }) => void;
  selectedStudent: Student | null;
  loading?: boolean;
}

export default function CalendarView({
  localizer,
  events,
  currentDate,
  currentView,
  onNavigate,
  onView,
  onEventClick,
  onSlotClick,
  selectedStudent,
  loading = false
}: CalendarViewProps) {
  
  // カスタムイベントコンポーネント
  const EventComponent = ({ event }: { event: CalendarEvent }) => {
    const slot = event.resource;
    const typeColor = getLessonTypeColor(slot.slot_type);
    const statusColor = getStatusColor(slot.status);
    
    return (
      <div className="p-2 text-xs leading-tight h-full flex flex-col justify-between">
        <div className="flex-1">
          <div className="font-semibold truncate mb-1 flex items-center">
            <FontAwesomeIcon icon={faUser} className="w-3 h-3 mr-1 opacity-75" />
            {slot.slot_type}
          </div>
          <div className="truncate opacity-90 flex items-center">
            <FontAwesomeIcon icon={faClock} className="w-3 h-3 mr-1 opacity-60" />
            {slot.teacher_name || '講師未定'}
          </div>
        </div>
        {slot.status !== '予定通り' && (
          <div className={`text-xs font-medium mt-1 px-1 py-0.5 rounded ${statusColor.bg} ${statusColor.text}`}>
            {slot.status}
          </div>
        )}
      </div>
    );
  };

  // ツールバーを非表示にする（外部で管理）
  const CustomToolbar = () => null;

  if (!selectedStudent) {
    return (
      <div className="bg-white rounded-xl shadow-lg">
        <div className="h-96 flex items-center justify-center bg-gray-50 rounded-xl">
          <div className="text-center text-gray-500">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon icon={faUser} className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              生徒が選択されていません
            </h3>
            <p className="text-sm text-gray-500 max-w-md">
              上記のドロップダウンから生徒を選択してください。<br />
              選択後、カレンダーに授業スケジュールが表示されます。
            </p>
          </div>
        </div>
      </div>
    );
  }

  // スロットクリックハンドラー
  const handleSlotClick = (slotInfo: { start: Date; end: Date }) => {
    if (!selectedStudent) {
      alert('まず生徒を選択してください');
      return;
    }
    onSlotClick(slotInfo);
  };

  // イベントクリックハンドラー
  const handleEventClick = (event: CalendarEvent) => {
    onEventClick(event);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-lg">
        <div className="h-96 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-600 border-t-transparent mx-auto mb-4" />
            <p className="text-sm text-gray-600">スケジュールを読み込み中...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        date={currentDate}
        view={currentView}
        onNavigate={onNavigate}
        onView={onView}
        onSelectEvent={handleEventClick}
        onSelectSlot={handleSlotClick}
        selectable={true}
        popup
        views={['month', 'week', 'day']}
        defaultView="month"
        step={30}
        showMultiDayTimes
        min={new Date(2024, 0, 1, 8, 0)} // 8:00から
        max={new Date(2024, 0, 1, 22, 0)} // 22:00まで
        components={{
          event: EventComponent,
          toolbar: CustomToolbar
        }}
        eventPropGetter={(event) => {
          const slot = event.resource;
          const className = getEventClassName(slot.slot_type, slot.status);
          return {
            className,
            style: {
              border: 'none',
              borderRadius: '6px',
              color: 'white',
              fontSize: '12px',
              padding: '4px 8px'
            }
          };
        }}
        dayPropGetter={(date) => {
          const today = new Date();
          const isToday = date.toDateString() === today.toDateString();
          return {
            className: isToday ? 'rbc-today' : '',
            style: isToday ? { backgroundColor: '#fef3c7' } : {}
          };
        }}
        messages={{
          allDay: '終日',
          previous: '前',
          next: '次',
          today: '今日',
          month: '月',
          week: '週',
          day: '日',
          agenda: '予定',
          date: '日付',
          time: '時間',
          event: '予定',
          noEventsInRange: 'この期間に予定はありません',
          showMore: (total) => `他 ${total} 件`,
        }}
        formats={{
          monthHeaderFormat: (date: Date) =>
            format(date, 'yyyy年M月', { locale: ja }),
          dayHeaderFormat: (date: Date) =>
            format(date, 'M月d日(E)', { locale: ja }),
          dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
            `${format(start, 'M月d日', { locale: ja })} - ${format(end, 'M月d日', { locale: ja })}`,
          timeGutterFormat: (date: Date) =>
            format(date, 'HH:mm', { locale: ja }),
          eventTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
            `${format(start, 'HH:mm', { locale: ja })} - ${format(end, 'HH:mm', { locale: ja })}`,
          agendaHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
            `${format(start, 'M月d日', { locale: ja })} - ${format(end, 'M月d日', { locale: ja })}`,
          agendaDateFormat: (date: Date) =>
            format(date, 'M月d日(E)', { locale: ja }),
          agendaTimeFormat: (date: Date) =>
            format(date, 'HH:mm', { locale: ja }),
          agendaTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
            `${format(start, 'HH:mm', { locale: ja })} - ${format(end, 'HH:mm', { locale: ja })}`
        }}
      />
    </div>
  );
}