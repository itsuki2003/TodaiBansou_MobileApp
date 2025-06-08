'use client';

import { Button } from '@/components/ui/Button';
import { format, addWeeks, subWeeks, startOfWeek, endOfWeek } from 'date-fns';
import { ja } from 'date-fns/locale';

interface WeekNavigatorProps {
  currentWeek?: string; // YYYY-MM-DD (新システム用)
  currentWeekStart?: string; // YYYY-MM-DD (既存システム用)
  onWeekChange: ((direction: 'prev' | 'next') => void) | ((weekStart: string) => void);
  studentName?: string;
}

export default function WeekNavigator({
  currentWeek,
  currentWeekStart,
  onWeekChange,
  studentName
}: WeekNavigatorProps) {
  // 両方のプロパティに対応
  const effectiveCurrentWeek = currentWeek || currentWeekStart || format(new Date(), 'yyyy-MM-dd');
  
  // currentWeekが有効な日付文字列かチェック
  const currentDate = new Date(effectiveCurrentWeek);
  
  // 無効な日付の場合は今週の月曜日をデフォルトとする
  if (isNaN(currentDate.getTime())) {
    console.warn('Invalid date provided to WeekNavigator:', effectiveCurrentWeek);
    const today = new Date();
    const mondayThisWeek = startOfWeek(today, { weekStartsOn: 1 }); // 月曜日始まり
    currentDate.setTime(mondayThisWeek.getTime());
  }

  // onWeekChangeのタイプを判定
  const isDirectionBasedChange = (callback: any): callback is (direction: 'prev' | 'next') => void => {
    // 新システムの場合：引数が'prev'または'next'の方向指定
    return currentWeek !== undefined;
  };

  const handleWeekChange = (direction: 'prev' | 'next') => {
    if (isDirectionBasedChange(onWeekChange)) {
      // 新システム：方向指定
      onWeekChange(direction);
    } else {
      // 既存システム：具体的な日付文字列
      const newDate = direction === 'prev' 
        ? subWeeks(currentDate, 1)
        : addWeeks(currentDate, 1);
      const newWeekStart = format(newDate, 'yyyy-MM-dd');
      (onWeekChange as (weekStart: string) => void)(newWeekStart);
    }
  };

  const prevWeekDate = subWeeks(currentDate, 1);
  const nextWeekDate = addWeeks(currentDate, 1);

  const getCurrentWeekDisplay = () => {
    try {
      const weekStart = format(currentDate, 'M月d日', { locale: ja });
      const weekEndDate = endOfWeek(currentDate, { weekStartsOn: 1 }); // 月曜始まりの週の終わり（日曜日）
      const weekEnd = format(weekEndDate, 'M月d日', { locale: ja });
      return `${weekStart}〜${weekEnd}の週`;
    } catch (error) {
      console.error('Date formatting error:', error);
      return '日付エラー';
    }
  };

  const isPrevWeekDisabled = () => {
    // 過去4週間までしか遡れない制限
    const fourWeeksAgo = subWeeks(new Date(), 4);
    return prevWeekDate < fourWeeksAgo;
  };

  const isNextWeekDisabled = () => {
    // 未来4週間までしか進めない制限
    const fourWeeksLater = addWeeks(new Date(), 4);
    return nextWeekDate > fourWeeksLater;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-medium text-gray-900">
            {studentName ? `${studentName}さんの週間プラン` : '週間プラン'}
          </h2>
          <span className="text-sm text-gray-600">
            {getCurrentWeekDisplay()}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleWeekChange('prev')}
            disabled={isPrevWeekDisabled()}
            className="flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            前週
          </Button>

          <span className="text-sm font-medium text-gray-700 px-3">
            {format(currentDate, 'yyyy年M月', { locale: ja })}
          </span>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => handleWeekChange('next')}
            disabled={isNextWeekDisabled()}
            className="flex items-center gap-1"
          >
            次週
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Button>
        </div>
      </div>

      {/* 週の詳細情報 */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="flex items-center gap-6 text-xs text-gray-500">
          <span>
            📅 {format(currentDate, 'M月d日', { locale: ja })}（月）〜 
            {format(endOfWeek(currentDate, { weekStartsOn: 1 }), 'M月d日', { locale: ja })}（日）
          </span>
          <span>
            📝 週間学習プラン編集
          </span>
        </div>
      </div>
    </div>
  );
}