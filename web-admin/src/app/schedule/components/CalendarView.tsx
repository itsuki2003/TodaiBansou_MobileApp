'use client';

import { Calendar, DateLocalizer, View } from 'react-big-calendar';
import { CalendarEvent, Student } from '@/types/schedule';

interface CalendarViewProps {
  localizer: DateLocalizer;
  events: CalendarEvent[];
  currentDate: Date;
  onNavigate: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  onSlotClick: (slotInfo: { start: Date; end: Date }) => void;
  selectedStudent: Student | null;
}

export default function CalendarView({
  localizer,
  events,
  currentDate,
  onNavigate,
  onEventClick,
  onSlotClick,
  selectedStudent
}: CalendarViewProps) {
  
  // カスタムイベントコンポーネント
  const EventComponent = ({ event }: { event: CalendarEvent }) => {
    const slot = event.resource;
    
    return (
      <div className="p-1 text-xs leading-tight">
        <div className="font-medium truncate">
          {slot.slot_type}
        </div>
        <div className="truncate opacity-90">
          {slot.teacher_name || '講師未定'}
        </div>
        {slot.status !== '予定通り' && (
          <div className="text-yellow-100 font-medium">
            {slot.status}
          </div>
        )}
      </div>
    );
  };

  // ツールバーのカスタマイズ
  const CustomToolbar = ({ label, onNavigate, onView }: any) => {
    return (
      <div className="flex justify-between items-center mb-4 p-4 bg-gray-50 rounded-t-lg">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onNavigate('PREV')}
            className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            ‹ 前月
          </button>
          <button
            onClick={() => onNavigate('TODAY')}
            className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            今月
          </button>
          <button
            onClick={() => onNavigate('NEXT')}
            className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            次月 ›
          </button>
        </div>
        
        <h2 className="text-xl font-semibold text-gray-900">
          {label}
        </h2>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => onView('month')}
            className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            月表示
          </button>
          <button
            onClick={() => onView('week')}
            className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50"
          >
            週表示
          </button>
        </div>
      </div>
    );
  };

  if (!selectedStudent) {
    return (
      <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg">
        <div className="text-center text-gray-500">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V3a2 2 0 012-2h4a2 2 0 012 2v4M9 11v4a2 2 0 002 2h2a2 2 0 002-2v-4M7 21h10"
            />
          </svg>
          <h3 className="text-sm font-medium text-gray-900 mb-1">
            生徒が選択されていません
          </h3>
          <p className="text-sm text-gray-500">
            上記のドロップダウンから生徒を選択してください
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-white">
      <style jsx global>{`
        .rbc-calendar {
          min-height: 600px;
        }
        
        .rbc-header {
          padding: 12px 8px;
          font-weight: 600;
          background-color: #f8fafc;
          border-bottom: 2px solid #e2e8f0;
        }
        
        .rbc-month-view {
          padding: 0;
        }
        
        .rbc-date-cell {
          padding: 8px;
          text-align: right;
        }
        
        .rbc-today {
          background-color: #fffbeb;
        }
        
        /* 授業種別による色分け */
        .lesson-event.lesson-regular {
          background-color: #3b82f6;
          border-color: #2563eb;
        }
        
        .lesson-event.lesson-consultation {
          background-color: #8b5cf6;
          border-color: #7c3aed;
        }
        
        .lesson-event.lesson-makeup {
          background-color: #f59e0b;
          border-color: #d97706;
        }
        
        .lesson-event.lesson-additional {
          background-color: #10b981;
          border-color: #059669;
        }
        
        .lesson-event.lesson-absent {
          background-color: #6b7280;
          border-color: #4b5563;
          opacity: 0.7;
        }
        
        .lesson-event.lesson-rescheduled {
          background-color: #ef4444;
          border-color: #dc2626;
          opacity: 0.8;
        }
        
        .rbc-event {
          border: none;
          border-radius: 4px;
          color: white;
          font-size: 12px;
          padding: 2px 4px;
          cursor: pointer;
        }
        
        .rbc-event:hover {
          opacity: 0.8;
        }
        
        .rbc-selected {
          background-color: #1f2937 !important;
        }
        
        .rbc-slot-selection {
          background-color: rgba(59, 130, 246, 0.2);
        }
        
        .rbc-time-view .rbc-header {
          border-bottom: 1px solid #e5e7eb;
        }
        
        .rbc-time-slot {
          border-top: 1px solid #f3f4f6;
        }
        
        .rbc-current-time-indicator {
          background-color: #ef4444;
        }
      `}</style>
      
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        date={currentDate}
        onNavigate={onNavigate}
        onSelectEvent={onEventClick}
        onSelectSlot={onSlotClick}
        selectable
        popup
        views={['month', 'week', 'day']}
        defaultView="month"
        step={30}
        showMultiDayTimes
        components={{
          event: EventComponent,
          toolbar: CustomToolbar,
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
            localizer.format(date, 'yyyy年M月', 'ja'),
          dayHeaderFormat: (date: Date) =>
            localizer.format(date, 'M月d日(E)', 'ja'),
          dayRangeHeaderFormat: ({ start, end }: { start: Date; end: Date }) =>
            `${localizer.format(start, 'M月d日', 'ja')} - ${localizer.format(end, 'M月d日', 'ja')}`,
          timeGutterFormat: (date: Date) =>
            localizer.format(date, 'HH:mm', 'ja'),
          eventTimeRangeFormat: ({ start, end }: { start: Date; end: Date }) =>
            `${localizer.format(start, 'HH:mm', 'ja')} - ${localizer.format(end, 'HH:mm', 'ja')}`,
        }}
      />
    </div>
  );
}