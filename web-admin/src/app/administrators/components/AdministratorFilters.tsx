'use client';

import { useState } from 'react';
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon, CalendarIcon, ShieldExclamationIcon } from '@heroicons/react/24/outline';
import { AdministratorFilter } from '@/types/adminManagement';

interface AdministratorFiltersProps {
  filter: AdministratorFilter;
  onFilterChange: (filter: AdministratorFilter) => void;
  className?: string;
}

export default function AdministratorFilters({
  filter,
  onFilterChange,
  className = ''
}: AdministratorFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleFilterChange = (key: keyof AdministratorFilter, value: any) => {
    onFilterChange({
      ...filter,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFilterChange({
      search: '',
      account_status: 'all',
      account_creation_method: 'all',
      last_login_period: 'all',
      login_frequency: 'all',
      created_date_range: null
    });
  };

  const hasActiveFilters = () => {
    return (
      filter.search !== '' ||
      filter.account_status !== 'all' ||
      filter.account_creation_method !== 'all' ||
      filter.last_login_period !== 'all' ||
      filter.login_frequency !== 'all' ||
      filter.created_date_range !== null
    );
  };

  const handleDateRangeChange = (field: 'start' | 'end', value: string) => {
    const currentRange = filter.created_date_range || { start: '', end: '' };
    
    onFilterChange({
      ...filter,
      created_date_range: {
        ...currentRange,
        [field]: value || undefined
      }
    });
  };

  // セキュリティフィルターのクイックアクション
  const applySecurityFilter = (type: 'without_2fa' | 'failed_logins' | 'never_logged_in') => {
    switch (type) {
      case 'without_2fa':
        // TODO: 2FA無効アカウントフィルター
        console.log('Filter by accounts without 2FA');
        break;
      case 'failed_logins':
        // TODO: ログイン失敗履歴ありフィルター
        console.log('Filter by accounts with failed logins');
        break;
      case 'never_logged_in':
        handleFilterChange('last_login_period', 'never');
        break;
    }
  };

  return (
    <div className={`bg-white shadow rounded-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">検索・フィルター</h3>
        <div className="flex items-center space-x-2">
          {hasActiveFilters() && (
            <button
              onClick={clearFilters}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center space-x-1"
            >
              <XMarkIcon className="h-4 w-4" />
              <span>クリア</span>
            </button>
          )}
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
          >
            <FunnelIcon className="h-4 w-4" />
            <span>{showAdvanced ? '詳細を閉じる' : '詳細フィルター'}</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* 検索 */}
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            運営者名・メールアドレス検索
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              id="search"
              value={filter.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              placeholder="運営者名またはメールアドレスで検索"
            />
          </div>
        </div>

        {/* セキュリティクイックフィルター */}
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <h4 className="text-sm font-medium text-red-900 mb-2 flex items-center">
            <ShieldExclamationIcon className="h-4 w-4 mr-1" />
            セキュリティクイックフィルター
          </h4>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => applySecurityFilter('without_2fa')}
              className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800 hover:bg-red-200"
            >
              2FA未設定
            </button>
            <button
              onClick={() => applySecurityFilter('failed_logins')}
              className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
            >
              ログイン失敗履歴あり
            </button>
            <button
              onClick={() => applySecurityFilter('never_logged_in')}
              className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800 hover:bg-orange-200"
            >
              未ログイン
            </button>
          </div>
        </div>

        {/* 基本フィルター */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="account_status" className="block text-sm font-medium text-gray-700 mb-1">
              アカウント状態
            </label>
            <select
              id="account_status"
              value={filter.account_status}
              onChange={(e) => handleFilterChange('account_status', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">すべて</option>
              <option value="有効">有効</option>
              <option value="無効">無効</option>
            </select>
          </div>

          <div>
            <label htmlFor="login_frequency" className="block text-sm font-medium text-gray-700 mb-1">
              ログイン頻度
            </label>
            <select
              id="login_frequency"
              value={filter.login_frequency}
              onChange={(e) => handleFilterChange('login_frequency', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">すべて</option>
              <option value="daily">毎日</option>
              <option value="weekly">週1回以上</option>
              <option value="monthly">月1回以上</option>
              <option value="rarely">稀に</option>
              <option value="never">未ログイン</option>
            </select>
          </div>

          <div>
            <label htmlFor="last_login_period" className="block text-sm font-medium text-gray-700 mb-1">
              最終ログイン
            </label>
            <select
              id="last_login_period"
              value={filter.last_login_period}
              onChange={(e) => handleFilterChange('last_login_period', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">すべて</option>
              <option value="7">過去7日以内</option>
              <option value="30">過去30日以内</option>
              <option value="90">過去90日以内</option>
              <option value="never">未ログイン</option>
            </select>
          </div>
        </div>

        {/* 詳細フィルター */}
        {showAdvanced && (
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-3">詳細フィルター</h4>
            <div className="space-y-4">
              {/* アカウント作成方法 */}
              <div>
                <label htmlFor="account_creation_method" className="block text-sm font-medium text-gray-700 mb-1">
                  アカウント作成方法
                </label>
                <select
                  id="account_creation_method"
                  value={filter.account_creation_method}
                  onChange={(e) => handleFilterChange('account_creation_method', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">すべて</option>
                  <option value="manual">手動作成</option>
                  <option value="system">システム作成</option>
                  <option value="import">一括インポート</option>
                </select>
              </div>

              {/* 作成日範囲指定 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  作成日期間指定
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">開始日</label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="date"
                        value={filter.created_date_range?.start || ''}
                        onChange={(e) => handleDateRangeChange('start', e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">終了日</label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="date"
                        value={filter.created_date_range?.end || ''}
                        onChange={(e) => handleDateRangeChange('end', e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <h5 className="text-sm font-medium text-blue-900 mb-2">フィルターのヒント</h5>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• セキュリティクイックフィルターで素早く問題のあるアカウントを特定できます</li>
                <li>• 「未ログイン」フィルターで、アクティベートが必要なアカウントを確認できます</li>
                <li>• ログイン頻度で、システムの利用状況を把握できます</li>
                <li>• 複数のフィルターを組み合わせて、詳細な分析が可能です</li>
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* アクティブフィルターの表示 */}
      {hasActiveFilters() && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-gray-500">アクティブフィルター:</span>
            
            {filter.search && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                検索: {filter.search}
                <button
                  onClick={() => handleFilterChange('search', '')}
                  className="ml-1 text-blue-600 hover:text-blue-800"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}
            
            {filter.account_status !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                状態: {filter.account_status}
                <button
                  onClick={() => handleFilterChange('account_status', 'all')}
                  className="ml-1 text-green-600 hover:text-green-800"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}
            
            {filter.login_frequency !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                頻度: {
                  filter.login_frequency === 'daily' ? '毎日' :
                  filter.login_frequency === 'weekly' ? '週1回以上' :
                  filter.login_frequency === 'monthly' ? '月1回以上' :
                  filter.login_frequency === 'rarely' ? '稀に' : '未ログイン'
                }
                <button
                  onClick={() => handleFilterChange('login_frequency', 'all')}
                  className="ml-1 text-purple-600 hover:text-purple-800"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}

            {filter.last_login_period !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                ログイン: {
                  filter.last_login_period === 'never' ? '未ログイン' : 
                  `過去${filter.last_login_period}日以内`
                }
                <button
                  onClick={() => handleFilterChange('last_login_period', 'all')}
                  className="ml-1 text-orange-600 hover:text-orange-800"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}

            {filter.account_creation_method !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                作成方法: {
                  filter.account_creation_method === 'manual' ? '手動' :
                  filter.account_creation_method === 'system' ? 'システム' : '一括'
                }
                <button
                  onClick={() => handleFilterChange('account_creation_method', 'all')}
                  className="ml-1 text-gray-600 hover:text-gray-800"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}

            {filter.created_date_range && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                作成日: {filter.created_date_range.start} 〜 {filter.created_date_range.end}
                <button
                  onClick={() => handleFilterChange('created_date_range', null)}
                  className="ml-1 text-indigo-600 hover:text-indigo-800"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}