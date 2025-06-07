'use client';

import { UpcomingLesson } from '@/types/teacher';

interface UpcomingLessonsProps {
  lessons: UpcomingLesson[];
  showAll?: boolean;
}

export default function UpcomingLessons({ lessons, showAll = false }: UpcomingLessonsProps) {
  const displayLessons = showAll ? lessons : lessons.slice(0, 5);

  if (lessons.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {showAll ? '授業予定' : '直近の授業予定'}
          </h3>
        </div>
        <div className="p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V3a2 2 0 012-2h4a2 2 0 012 2v4M9 11v4a2 2 0 002 2h2a2 2 0 002-2v-4M7 21h10" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">授業予定なし</h3>
          <p className="mt-1 text-sm text-gray-500">
            {showAll 
              ? '現在、スケジュールされている授業はありません。'
              : '直近の授業予定はありません。'
            }
          </p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: UpcomingLesson['status']) => {
    switch (status) {
      case '予定通り':
        return 'bg-green-100 text-green-800';
      case '実施済み':
        return 'bg-blue-100 text-blue-800';
      case '欠席':
        return 'bg-gray-100 text-gray-800';
      case '振替済み（振替元）':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSlotTypeColor = (slotType: UpcomingLesson['slot_type']) => {
    switch (slotType) {
      case '通常授業':
        return 'bg-blue-100 text-blue-800';
      case '固定面談':
        return 'bg-purple-100 text-purple-800';
      case '振替授業':
        return 'bg-orange-100 text-orange-800';
      case '追加授業':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return '今日';
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return '明日';
    } else {
      return date.toLocaleDateString('ja-JP', {
        month: 'numeric',
        day: 'numeric',
        weekday: 'short'
      });
    }
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          {showAll ? `授業予定 (${lessons.length}件)` : '直近の授業予定'}
        </h3>
      </div>

      <div className="divide-y divide-gray-200">
        {displayLessons.map((lesson) => (
          <div key={lesson.id} className="p-6">
            <div className="flex items-center justify-between">
              {/* 左側：時間と生徒情報 */}
              <div className="flex items-start space-x-4">
                {/* 日時 */}
                <div className="text-center min-w-0 flex-shrink-0">
                  <div className="text-sm font-medium text-gray-900">
                    {formatDate(lesson.slot_date)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {lesson.start_time.slice(0, 5)} - {lesson.end_time.slice(0, 5)}
                  </div>
                </div>

                {/* 区切り線 */}
                <div className="w-px h-12 bg-gray-200"></div>

                {/* 授業情報 */}
                <div className="min-w-0 flex-1">
                  <h4 className="text-lg font-medium text-gray-900 truncate">
                    {lesson.student_name}
                  </h4>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSlotTypeColor(lesson.slot_type)}`}>
                      {lesson.slot_type}
                    </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(lesson.status)}`}>
                      {lesson.status}
                    </span>
                  </div>
                  
                  {lesson.notes && (
                    <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                      {lesson.notes}
                    </p>
                  )}
                </div>
              </div>

              {/* 右側：アクション */}
              <div className="flex items-center space-x-3 ml-4">
                {lesson.google_meet_link && (
                  <a
                    href={lesson.google_meet_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Meet
                  </a>
                )}

                <a
                  href={`/schedule?student=${lesson.student_id}&date=${lesson.slot_date}`}
                  className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  編集
                </a>
              </div>
            </div>

            {/* タイムライン表示（今日以降の授業のみ） */}
            {new Date(lesson.slot_date) >= new Date().setHours(0, 0, 0, 0) && (
              <div className="mt-4 pl-4 border-l-2 border-gray-200">
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>
                    {(() => {
                      const lessonDateTime = new Date(`${lesson.slot_date}T${lesson.start_time}`);
                      const now = new Date();
                      const diffHours = Math.ceil((lessonDateTime.getTime() - now.getTime()) / (1000 * 60 * 60));
                      
                      if (diffHours < 0) {
                        return '授業時間を過ぎています';
                      } else if (diffHours < 1) {
                        return 'まもなく開始';
                      } else if (diffHours < 24) {
                        return `${diffHours}時間後`;
                      } else {
                        const diffDays = Math.ceil(diffHours / 24);
                        return `${diffDays}日後`;
                      }
                    })()}
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 更に表示ボタン */}
      {!showAll && lessons.length > 5 && (
        <div className="px-6 py-4 border-t border-gray-200">
          <a
            href="/teacher-dashboard?tab=lessons"
            className="text-center block w-full text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            すべての授業予定を見る ({lessons.length - 5}件)
          </a>
        </div>
      )}
    </div>
  );
}