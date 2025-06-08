'use client';

// Heroiconsの代替として簡単なSVGアイコンを使用
const BellIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const CheckCircleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const DocumentTextIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const ClockIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const CalendarDaysIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const TagIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
  </svg>
);

const TrendingUpIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const ExclamationTriangleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.94-.833-2.71 0L4.204 16.5c-.77.833.192 2.5 1.732 2.5z" />
  </svg>
);
import { NotificationStatistics } from '@/types/notifications';

interface NotificationStatisticsCardProps {
  statistics: NotificationStatistics;
  className?: string;
}

export default function NotificationStatisticsCard({
  statistics,
  className = ''
}: NotificationStatisticsCardProps) {

  const cards = [
    {
      title: 'お知らせ総数',
      value: statistics.total,
      icon: BellIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: '全てのお知らせ'
    },
    {
      title: '配信済み',
      value: statistics.published,
      icon: CheckCircleIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: '公開・配信済みのお知らせ'
    },
    {
      title: '下書き',
      value: statistics.draft,
      icon: DocumentTextIcon,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      description: '下書き保存中のお知らせ'
    },
    {
      title: '予約配信',
      value: statistics.scheduled,
      icon: ClockIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: '配信予約済みのお知らせ'
    }
  ];

  return (
    <div className={className}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, index) => (
          <div key={index} className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className={`flex-shrink-0 ${card.bgColor} rounded-md p-3`}>
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
              <div className="ml-4 flex-1">
                <div className="flex items-baseline">
                  <div className="text-2xl font-semibold text-gray-900">
                    {card.value}
                  </div>
                  <div className="ml-2 text-sm font-medium text-gray-500">
                    件
                  </div>
                </div>
                <div className="text-sm font-medium text-gray-600">
                  {card.title}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {card.description}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 詳細統計 */}
      <div className="mt-6 bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">配信活動</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 期間別統計 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <CalendarDaysIcon className="h-4 w-4 mr-2 text-blue-600" />
              期間別配信数
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">今週:</span>
                <span className="font-medium text-green-600">{statistics.this_week_published}件</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">今月:</span>
                <span className="font-medium text-blue-600">{statistics.this_month_published}件</span>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">月平均:</span>
                  <span className="font-medium">
                    {statistics.total > 0 
                      ? Math.round(statistics.this_month_published)
                      : 0}件
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* カテゴリー統計 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <TagIcon className="h-4 w-4 mr-2 text-purple-600" />
              カテゴリー・分類
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">登録カテゴリー数:</span>
                <span className="font-medium text-purple-600">{statistics.categories_count}個</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">配信率:</span>
                <span className="font-medium text-green-600">
                  {statistics.total > 0 
                    ? Math.round((statistics.published / statistics.total) * 100)
                    : 0}%
                </span>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">下書き率:</span>
                  <span className="font-medium">
                    {statistics.total > 0 
                      ? Math.round((statistics.draft / statistics.total) * 100)
                      : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 最近の活動 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <TrendingUpIcon className="h-4 w-4 mr-2 text-green-600" />
              最近の活動
            </h4>
            <div className="space-y-2">
              <div>
                <span className="text-xs text-gray-500">最終配信:</span>
                <div className="text-sm font-medium text-gray-900">
                  {statistics.recent_activity.last_published ? 
                    new Date(statistics.recent_activity.last_published).toLocaleDateString('ja-JP') :
                    '-'
                  }
                </div>
              </div>
              <div>
                <span className="text-xs text-gray-500">最終作成:</span>
                <div className="text-sm font-medium text-gray-900">
                  {statistics.recent_activity.last_created ? 
                    new Date(statistics.recent_activity.last_created).toLocaleDateString('ja-JP') :
                    '-'
                  }
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 全体サマリー */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              お知らせ管理状況: <span className="font-medium text-gray-900">{statistics.total}件のお知らせを管理中</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-green-600">
                配信済み: <span className="font-medium">{statistics.published}件</span>
              </div>
              {statistics.scheduled > 0 && (
                <div className="text-sm text-purple-600">
                  予約中: <span className="font-medium">{statistics.scheduled}件</span>
                </div>
              )}
            </div>
          </div>
          
          {/* プログレスバー */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span>配信率</span>
              <span>
                {statistics.total > 0 
                  ? Math.round((statistics.published / statistics.total) * 100)
                  : 0}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${statistics.total > 0 
                    ? (statistics.published / statistics.total) * 100
                    : 0}%` 
                }}
              />
            </div>
          </div>
        </div>

        {/* 注意事項・推奨アクション */}
        <div className="mt-6 space-y-3">
          {statistics.scheduled > 0 && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex">
                <ClockIcon className="h-5 w-5 text-purple-400" />
                <div className="ml-3">
                  <p className="text-sm text-purple-700">
                    {statistics.scheduled}件のお知らせが配信予約中です。配信時刻を確認してください。
                  </p>
                </div>
              </div>
            </div>
          )}

          {statistics.draft > statistics.published && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex">
                <DocumentTextIcon className="h-5 w-5 text-yellow-400" />
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    下書きのお知らせが多くなっています。配信の検討をお願いします。
                  </p>
                </div>
              </div>
            </div>
          )}

          {statistics.this_week_published === 0 && statistics.total > 0 && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-orange-400" />
                <div className="ml-3">
                  <p className="text-sm text-orange-700">
                    今週はお知らせの配信がありません。定期的な情報発信を検討してください。
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}