'use client';

import { useState } from 'react';
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { TeacherFilter } from '@/types/teacherManagement';

interface TeacherFiltersProps {
  filter: TeacherFilter;
  onFilterChange: (filter: TeacherFilter) => void;
  className?: string;
}

export default function TeacherFilters({
  filter,
  onFilterChange,
  className = ''
}: TeacherFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleFilterChange = (key: keyof TeacherFilter, value: any) => {
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
      has_assignments: 'all',
      last_login_period: 'all',
      registration_period: 'all'
    });
  };

  const hasActiveFilters = () => {
    return (
      filter.search !== '' ||
      filter.account_status !== 'all' ||
      filter.account_creation_method !== 'all' ||
      filter.has_assignments !== 'all' ||
      filter.last_login_period !== 'all' ||
      filter.registration_period !== 'all'
    );
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
            講師名・メールアドレス検索
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
              placeholder="講師名、フリガナ、またはメールアドレスで検索"
            />
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
              <option value="承認待ち">承認待ち</option>
            </select>
          </div>

          <div>
            <label htmlFor="has_assignments" className="block text-sm font-medium text-gray-700 mb-1">
              担当生徒の有無
            </label>
            <select
              id="has_assignments"
              value={filter.has_assignments.toString()}
              onChange={(e) => {
                const value = e.target.value;
                handleFilterChange('has_assignments', value === 'all' ? 'all' : value === 'true');
              }}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">すべて</option>
              <option value="true">担当生徒あり</option>
              <option value="false">担当生徒なし</option>
            </select>
          </div>

          <div>
            <label htmlFor="registration_period" className="block text-sm font-medium text-gray-700 mb-1">
              登録期間
            </label>
            <select
              id="registration_period"
              value={filter.registration_period}
              onChange={(e) => handleFilterChange('registration_period', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">すべて</option>
              <option value="7">過去7日間</option>
              <option value="30">過去30日間</option>
              <option value="90">過去90日間</option>
              <option value="365">過去1年間</option>
            </select>
          </div>
        </div>

        {/* 詳細フィルター */}
        {showAdvanced && (
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-3">詳細フィルター</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <option value="application">申請による登録</option>
                  <option value="manual">手動登録</option>
                  <option value="import">一括インポート</option>
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

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <h5 className="text-sm font-medium text-blue-900 mb-2">フィルターのヒント</h5>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 複数のフィルターを組み合わせて絞り込みができます</li>
                <li>• 「担当生徒なし」で、割り当てが必要な講師を確認できます</li>
                <li>• 「未ログイン」で、アクティベートが必要な講師を特定できます</li>
                <li>• 「承認待ち」で、審査が必要な申請を確認できます</li>
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
            
            {filter.has_assignments !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                担当: {filter.has_assignments ? 'あり' : 'なし'}
                <button
                  onClick={() => handleFilterChange('has_assignments', 'all')}
                  className="ml-1 text-purple-600 hover:text-purple-800"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}

            {filter.account_creation_method !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                作成方法: {
                  filter.account_creation_method === 'application' ? '申請' :
                  filter.account_creation_method === 'manual' ? '手動' : '一括'
                }
                <button
                  onClick={() => handleFilterChange('account_creation_method', 'all')}
                  className="ml-1 text-orange-600 hover:text-orange-800"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}

            {filter.last_login_period !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                ログイン: {
                  filter.last_login_period === 'never' ? '未ログイン' : 
                  `過去${filter.last_login_period}日以内`
                }
                <button
                  onClick={() => handleFilterChange('last_login_period', 'all')}
                  className="ml-1 text-gray-600 hover:text-gray-800"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}

            {filter.registration_period !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                登録: 過去{filter.registration_period}日間
                <button
                  onClick={() => handleFilterChange('registration_period', 'all')}
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