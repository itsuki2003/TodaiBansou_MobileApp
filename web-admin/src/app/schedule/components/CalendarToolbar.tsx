'use client';

import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChevronLeft, 
  faChevronRight, 
  faPlus, 
  faCalendarDays,
  faRefresh
} from '@fortawesome/free-solid-svg-icons';

interface CalendarToolbarProps {
  currentView: 'month' | 'week' | 'day';
  currentDate: Date;
  onViewChange: (view: 'month' | 'week' | 'day') => void;
  onNavigate: (action: 'PREV' | 'NEXT' | 'TODAY') => void;
  onAddLesson: () => void;
  onRefresh?: () => void;
  loading?: boolean;
}

export default function CalendarToolbar({
  currentView,
  currentDate, 
  onViewChange,
  onNavigate,
  onAddLesson,
  onRefresh,
  loading = false
}: CalendarToolbarProps) {
  
  const getDateDisplayText = () => {
    switch (currentView) {
      case 'month':
        return format(currentDate, 'yyyy年M月', { locale: ja });
      case 'week':
        // 週の開始日と終了日を表示
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay() + 1); // 月曜始まり
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        if (weekStart.getMonth() === weekEnd.getMonth()) {
          return `${format(weekStart, 'yyyy年M月d日', { locale: ja })} - ${format(weekEnd, 'd日', { locale: ja })}`;
        } else {
          return `${format(weekStart, 'M月d日', { locale: ja })} - ${format(weekEnd, 'M月d日', { locale: ja })}`;
        }
      case 'day':
        return format(currentDate, 'yyyy年M月d日（E）', { locale: ja });
      default:
        return format(currentDate, 'yyyy年M月', { locale: ja });
    }
  };

  const viewButtons = [
    { key: 'month' as const, label: '月', description: '月表示' },
    { key: 'week' as const, label: '週', description: '週表示' },
    { key: 'day' as const, label: '日', description: '日表示' }
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        
        {/* 左側: ナビゲーションとタイトル */}
        <div className="flex items-center space-x-4">
          {/* ナビゲーションボタン */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onNavigate('PREV')}
              disabled={loading}
              className="p-3 rounded-lg border border-gray-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="前へ"
            >
              <FontAwesomeIcon icon={faChevronLeft} className="w-4 h-4 text-gray-600" />
            </button>
            
            <button
              onClick={() => onNavigate('TODAY')}
              disabled={loading}
              className="px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 text-sm font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              今日
            </button>
            
            <button
              onClick={() => onNavigate('NEXT')}
              disabled={loading}
              className="p-3 rounded-lg border border-gray-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="次へ"
            >
              <FontAwesomeIcon icon={faChevronRight} className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* タイトル表示 */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <FontAwesomeIcon icon={faCalendarDays} className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 min-w-[200px]">
                {getDateDisplayText()}
              </h2>
              <p className="text-sm text-gray-500">
                {currentView === 'month' && '月間スケジュール'}
                {currentView === 'week' && '週間スケジュール'}
                {currentView === 'day' && '日別スケジュール'}
              </p>
            </div>
          </div>
        </div>

        {/* 右側: ビュー切り替えとアクション */}
        <div className="flex items-center space-x-4">
          {/* ビュー切り替えボタン */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {viewButtons.map((view) => (
              <button
                key={view.key}
                onClick={() => onViewChange(view.key)}
                disabled={loading}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                  currentView === view.key
                    ? 'bg-white text-primary-600 shadow-sm ring-1 ring-primary-200'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
                title={view.description}
                aria-pressed={currentView === view.key}
              >
                {view.label}
              </button>
            ))}
          </div>
          
          {/* アクションボタン */}
          <div className="flex items-center space-x-2">
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={loading}
                className="p-3 rounded-lg border border-gray-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="更新"
                aria-label="データを更新"
              >
                <FontAwesomeIcon 
                  icon={faRefresh} 
                  className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`} 
                />
              </button>
            )}
            
            <button
              onClick={onAddLesson}
              disabled={loading}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              aria-label="新規授業を追加"
            >
              <FontAwesomeIcon icon={faPlus} className="mr-2 w-4 h-4" />
              <span className="hidden sm:inline">新規授業追加</span>
              <span className="sm:hidden">追加</span>
            </button>
          </div>
        </div>
      </div>

      {/* 読み込み中のインジケーター */}
      {loading && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-600 border-t-transparent mr-2" />
            <span className="text-sm text-gray-600">読み込み中...</span>
          </div>
        </div>
      )}
    </div>
  );
}