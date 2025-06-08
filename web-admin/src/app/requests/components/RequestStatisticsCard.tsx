'use client';

import { 
  ExclamationTriangleIcon,
  ClockIcon,
  CheckCircleIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { RequestStatistics } from '@/types/requests';

interface RequestStatisticsCardProps {
  statistics: RequestStatistics;
  className?: string;
}

export default function RequestStatisticsCard({
  statistics,
  className = ''
}: RequestStatisticsCardProps) {

  const cards = [
    {
      title: '未対応申請',
      value: statistics.pending,
      icon: ExclamationTriangleIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      description: '処理が必要な申請'
    },
    {
      title: '対応済み申請',
      value: statistics.processed,
      icon: CheckCircleIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: '処理完了済みの申請'
    },
    {
      title: '欠席申請',
      value: statistics.absenceRequests.total,
      icon: ClockIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      description: `未対応: ${statistics.absenceRequests.pending}件`
    },
    {
      title: '追加授業申請',
      value: statistics.additionalRequests.total,
      icon: DocumentTextIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: `未対応: ${statistics.additionalRequests.pending}件`
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
        <h3 className="text-lg font-medium text-gray-900 mb-4">申請の詳細統計</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 欠席申請の詳細 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <ClockIcon className="h-4 w-4 mr-2 text-orange-600" />
              欠席申請
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">総申請数:</span>
                <span className="font-medium">{statistics.absenceRequests.total}件</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">未対応:</span>
                <span className="font-medium text-red-600">{statistics.absenceRequests.pending}件</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">対応済み:</span>
                <span className="font-medium text-green-600">{statistics.absenceRequests.processed}件</span>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">対応率:</span>
                  <span className="font-medium">
                    {statistics.absenceRequests.total > 0 
                      ? Math.round((statistics.absenceRequests.processed / statistics.absenceRequests.total) * 100)
                      : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 追加授業申請の詳細 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <DocumentTextIcon className="h-4 w-4 mr-2 text-blue-600" />
              追加授業申請
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">総申請数:</span>
                <span className="font-medium">{statistics.additionalRequests.total}件</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">未承認:</span>
                <span className="font-medium text-blue-600">{statistics.additionalRequests.pending}件</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">承認済み:</span>
                <span className="font-medium text-green-600">{statistics.additionalRequests.processed}件</span>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">承認率:</span>
                  <span className="font-medium">
                    {statistics.additionalRequests.total > 0 
                      ? Math.round((statistics.additionalRequests.processed / statistics.additionalRequests.total) * 100)
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
              総申請数: <span className="font-medium text-gray-900">{statistics.total}件</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-red-600">
                未対応: <span className="font-medium">{statistics.pending}件</span>
              </div>
              <div className="text-sm text-green-600">
                対応済み: <span className="font-medium">{statistics.processed}件</span>
              </div>
            </div>
          </div>
          
          {/* プログレスバー */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span>処理進捗</span>
              <span>
                {statistics.total > 0 
                  ? Math.round((statistics.processed / statistics.total) * 100)
                  : 0}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{ 
                  width: `${statistics.total > 0 
                    ? (statistics.processed / statistics.total) * 100
                    : 0}%` 
                }}
              />
            </div>
          </div>
        </div>

        {/* 注意事項 */}
        {statistics.pending > 0 && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  {statistics.pending}件の申請が処理待ちです。早めの対応をお願いします。
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}