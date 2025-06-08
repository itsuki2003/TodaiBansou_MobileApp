'use client';

import { 
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  AcademicCapIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { TeacherStatistics } from '@/types/teacherManagement';

interface TeacherStatisticsCardProps {
  statistics: TeacherStatistics;
  className?: string;
}

export default function TeacherStatisticsCard({
  statistics,
  className = ''
}: TeacherStatisticsCardProps) {

  const cards = [
    {
      title: '講師総数',
      value: statistics.total,
      icon: UserGroupIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: '登録されている全講師'
    },
    {
      title: '有効アカウント',
      value: statistics.active,
      icon: CheckCircleIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'アクティブな講師アカウント'
    },
    {
      title: '無効アカウント',
      value: statistics.inactive,
      icon: XCircleIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      description: '無効化された講師アカウント'
    },
    {
      title: '承認待ち',
      value: statistics.pending,
      icon: ClockIcon,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      description: '審査待ちの講師申請'
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
                    人
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
        <h3 className="text-lg font-medium text-gray-900 mb-4">講師の活動状況</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* 担当割り当て状況 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <AcademicCapIcon className="h-4 w-4 mr-2 text-blue-600" />
              担当割り当て状況
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">担当生徒あり:</span>
                <span className="font-medium text-green-600">{statistics.with_assignments}人</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">担当生徒なし:</span>
                <span className="font-medium text-orange-600">{statistics.without_assignments}人</span>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">割り当て率:</span>
                  <span className="font-medium">
                    {statistics.total > 0 
                      ? Math.round((statistics.with_assignments / statistics.total) * 100)
                      : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* アカウント状態詳細 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <UserIcon className="h-4 w-4 mr-2 text-green-600" />
              アカウント状態
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">有効率:</span>
                <span className="font-medium text-green-600">
                  {statistics.total > 0 
                    ? Math.round((statistics.active / statistics.total) * 100)
                    : 0}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">無効率:</span>
                <span className="font-medium text-red-600">
                  {statistics.total > 0 
                    ? Math.round((statistics.inactive / statistics.total) * 100)
                    : 0}%
                </span>
              </div>
              {statistics.pending > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">承認待ち:</span>
                  <span className="font-medium text-yellow-600">
                    {Math.round((statistics.pending / statistics.total) * 100)}%
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 最近の活動 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <ClockIcon className="h-4 w-4 mr-2 text-purple-600" />
              最近の活動
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">新規登録 (30日):</span>
                <span className="font-medium text-blue-600">{statistics.recent_registrations}人</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">アクティブ (7日):</span>
                <span className="font-medium text-green-600">{statistics.recent_logins}人</span>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">活動率:</span>
                  <span className="font-medium">
                    {statistics.active > 0 
                      ? Math.round((statistics.recent_logins / statistics.active) * 100)
                      : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 全体サマリー */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              講師管理状況: <span className="font-medium text-gray-900">{statistics.total}人の講師を管理中</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-blue-600">
                有効: <span className="font-medium">{statistics.active}人</span>
              </div>
              {statistics.pending > 0 && (
                <div className="text-sm text-yellow-600">
                  要対応: <span className="font-medium">{statistics.pending}人</span>
                </div>
              )}
            </div>
          </div>
          
          {/* プログレスバー */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span>アクティブ率</span>
              <span>
                {statistics.total > 0 
                  ? Math.round((statistics.active / statistics.total) * 100)
                  : 0}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${statistics.total > 0 
                    ? (statistics.active / statistics.total) * 100
                    : 0}%` 
                }}
              />
            </div>
          </div>
        </div>

        {/* 注意事項・推奨アクション */}
        <div className="mt-6 space-y-3">
          {statistics.pending > 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex">
                <ClockIcon className="h-5 w-5 text-yellow-400" />
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    {statistics.pending}人の講師が承認待ちです。早めの審査をお願いします。
                  </p>
                </div>
              </div>
            </div>
          )}

          {statistics.without_assignments > 0 && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex">
                <UserGroupIcon className="h-5 w-5 text-orange-400" />
                <div className="ml-3">
                  <p className="text-sm text-orange-700">
                    {statistics.without_assignments}人の講師に担当生徒が割り当てられていません。
                  </p>
                </div>
              </div>
            </div>
          )}

          {statistics.inactive > statistics.active * 0.2 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex">
                <XCircleIcon className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-700">
                    無効化されたアカウントが多くなっています。定期的な見直しを検討してください。
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