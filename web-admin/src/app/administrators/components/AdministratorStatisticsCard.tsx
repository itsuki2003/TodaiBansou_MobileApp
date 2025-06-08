'use client';

import { 
  UserGroupIcon,
  CheckCircleIcon,
  XCircleIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CalendarDaysIcon,
  KeyIcon,
  EyeSlashIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';
import { AdministratorStatistics } from '@/types/adminManagement';

interface AdministratorStatisticsCardProps {
  statistics: AdministratorStatistics;
  className?: string;
}

export default function AdministratorStatisticsCard({
  statistics,
  className = ''
}: AdministratorStatisticsCardProps) {

  const cards = [
    {
      title: '運営者総数',
      value: statistics.total,
      icon: UserGroupIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: '登録されている全運営者'
    },
    {
      title: '有効アカウント',
      value: statistics.active,
      icon: CheckCircleIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'アクティブな運営者アカウント'
    },
    {
      title: 'スーパー管理者',
      value: statistics.super_admins,
      icon: ShieldCheckIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: '最高権限を持つ管理者'
    },
    {
      title: 'セキュリティ警告',
      value: statistics.security_alerts.accounts_without_2fa + statistics.security_alerts.accounts_with_failed_logins,
      icon: ExclamationTriangleIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      description: '要対応のセキュリティ問題'
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
                    {index === 3 ? '件' : '人'}
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
        <h3 className="text-lg font-medium text-gray-900 mb-4">運営者活動とセキュリティ</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* アカウント状態 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <CheckCircleIcon className="h-4 w-4 mr-2 text-green-600" />
              アカウント状態
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">有効:</span>
                <span className="font-medium text-green-600">{statistics.active}人</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">無効:</span>
                <span className="font-medium text-red-600">{statistics.inactive}人</span>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">有効率:</span>
                  <span className="font-medium">
                    {statistics.total > 0 
                      ? Math.round((statistics.active / statistics.total) * 100)
                      : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ログイン活動 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <ClockIcon className="h-4 w-4 mr-2 text-blue-600" />
              ログイン活動
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">今週ログイン:</span>
                <span className="font-medium text-blue-600">{statistics.recent_logins}人</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">未ログイン:</span>
                <span className="font-medium text-orange-600">{statistics.never_logged_in}人</span>
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

          {/* セキュリティ状況 */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
              <LockClosedIcon className="h-4 w-4 mr-2 text-red-600" />
              セキュリティ状況
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">2FA未設定:</span>
                <span className="font-medium text-red-600">{statistics.security_alerts.accounts_without_2fa}人</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">ログイン失敗:</span>
                <span className="font-medium text-yellow-600">{statistics.security_alerts.accounts_with_failed_logins}人</span>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">セキュリティスコア:</span>
                  <span className={`font-medium ${
                    statistics.security_alerts.accounts_without_2fa === 0 ? 'text-green-600' :
                    statistics.security_alerts.accounts_without_2fa <= 2 ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {statistics.security_alerts.accounts_without_2fa === 0 ? '良好' :
                     statistics.security_alerts.accounts_without_2fa <= 2 ? '注意' : '危険'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* アクセス権限分析 */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-3 flex items-center">
            <ShieldCheckIcon className="h-4 w-4 mr-2 text-purple-600" />
            権限分析
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">スーパー管理者:</span>
                <span className="font-medium text-purple-600">{statistics.super_admins}人</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">一般管理者:</span>
                <span className="font-medium text-blue-600">{statistics.regular_admins}人</span>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">今月新規作成:</span>
                <span className="font-medium text-green-600">{statistics.this_month_created}人</span>
              </div>
              <div className="text-xs text-gray-500">
                適切な権限分散が維持されています
              </div>
            </div>
          </div>
        </div>

        {/* 全体サマリー */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              システム管理状況: <span className="font-medium text-gray-900">{statistics.total}人の運営者が管理中</span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-green-600">
                有効: <span className="font-medium">{statistics.active}人</span>
              </div>
              {statistics.security_alerts.accounts_without_2fa > 0 && (
                <div className="text-sm text-red-600">
                  要対応: <span className="font-medium">{statistics.security_alerts.accounts_without_2fa}人</span>
                </div>
              )}
            </div>
          </div>
          
          {/* セキュリティプログレスバー */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
              <span>セキュリティ準拠率</span>
              <span>
                {statistics.total > 0 
                  ? Math.round(((statistics.total - statistics.security_alerts.accounts_without_2fa) / statistics.total) * 100)
                  : 100}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  statistics.security_alerts.accounts_without_2fa === 0 ? 'bg-green-600' :
                  statistics.security_alerts.accounts_without_2fa <= 2 ? 'bg-yellow-500' : 'bg-red-600'
                }`}
                style={{ 
                  width: `${statistics.total > 0 
                    ? ((statistics.total - statistics.security_alerts.accounts_without_2fa) / statistics.total) * 100
                    : 100}%` 
                }}
              />
            </div>
          </div>
        </div>

        {/* セキュリティ警告・推奨アクション */}
        <div className="mt-6 space-y-3">
          {statistics.security_alerts.accounts_without_2fa > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex">
                <EyeSlashIcon className="h-5 w-5 text-red-400" />
                <div className="ml-3">
                  <p className="text-sm text-red-700">
                    <strong>重要:</strong> {statistics.security_alerts.accounts_without_2fa}人の運営者で2要素認証が無効です。セキュリティ強化のため、有効化を推奨します。
                  </p>
                </div>
              </div>
            </div>
          )}

          {statistics.security_alerts.accounts_with_failed_logins > 0 && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex">
                <KeyIcon className="h-5 w-5 text-yellow-400" />
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    {statistics.security_alerts.accounts_with_failed_logins}人の運営者アカウントでログイン失敗が記録されています。不審な活動の可能性があります。
                  </p>
                </div>
              </div>
            </div>
          )}

          {statistics.never_logged_in > 0 && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex">
                <CalendarDaysIcon className="h-5 w-5 text-blue-400" />
                <div className="ml-3">
                  <p className="text-sm text-blue-700">
                    {statistics.never_logged_in}人の運営者がまだログインしていません。アカウントの有効化状況を確認してください。
                  </p>
                </div>
              </div>
            </div>
          )}

          {statistics.total === 1 && (
            <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-orange-400" />
                <div className="ml-3">
                  <p className="text-sm text-orange-700">
                    運営者アカウントが1人のみです。システム運用の継続性のため、複数の運営者の設定を推奨します。
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