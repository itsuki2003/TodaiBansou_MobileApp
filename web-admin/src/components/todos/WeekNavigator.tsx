import React from 'react';
import { 
  getWeekDisplayString, 
  getPreviousWeek, 
  getNextWeek, 
  getCurrentWeekStart 
} from '@/utils/dateUtils';

interface WeekNavigatorProps {
  currentWeekStart: string;
  onWeekChange: (weekStart: string) => void;
}

export default function WeekNavigator({ currentWeekStart, onWeekChange }: WeekNavigatorProps) {
  const previousWeek = getPreviousWeek(currentWeekStart);
  const nextWeek = getNextWeek(currentWeekStart);
  const thisWeek = getCurrentWeekStart();
  const isCurrentWeek = currentWeekStart === thisWeek;

  return (
    <div className="flex items-center gap-2 bg-white rounded-lg border border-gray-200 p-2">
      {/* 前の週ボタン */}
      <button
        onClick={() => onWeekChange(previousWeek)}
        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
        title="前の週"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* 現在の週表示 */}
      <div className="px-4 py-2 min-w-0">
        <div className="text-sm font-medium text-gray-900 text-center">
          {getWeekDisplayString(currentWeekStart)}
        </div>
        {isCurrentWeek && (
          <div className="text-xs text-blue-600 text-center mt-1">
            今週
          </div>
        )}
      </div>

      {/* 次の週ボタン */}
      <button
        onClick={() => onWeekChange(nextWeek)}
        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
        title="次の週"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* 今週に戻るボタン */}
      {!isCurrentWeek && (
        <>
          <div className="w-px h-6 bg-gray-300 mx-1" />
          <button
            onClick={() => onWeekChange(thisWeek)}
            className="px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
          >
            今週
          </button>
        </>
      )}
    </div>
  );
}