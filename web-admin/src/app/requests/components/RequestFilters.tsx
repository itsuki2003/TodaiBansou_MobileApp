'use client';

import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { RequestFilter } from '@/types/requests';

interface RequestFiltersProps {
  filter: RequestFilter;
  onFilterChange: (filter: RequestFilter) => void;
  className?: string;
}

export default function RequestFilters({
  filter,
  onFilterChange,
  className = ''
}: RequestFiltersProps) {

  const handleFilterChange = (key: keyof RequestFilter, value: any) => {
    onFilterChange({
      ...filter,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFilterChange({
      search: '',
      type: 'all',
      status: 'all',
      dateRange: '30'
    });
  };

  const hasActiveFilters = () => {
    return (
      filter.search !== '' ||
      filter.type !== 'all' ||
      filter.status !== 'all' ||
      filter.dateRange !== '30'
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
        </div>
      </div>

      <div className="space-y-4">
        {/* 検索 */}
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
            生徒名検索
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
              placeholder="生徒名で検索"
            />
          </div>
        </div>

        {/* フィルター */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">
              申請種別
            </label>
            <select
              id="type"
              value={filter.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">すべて</option>
              <option value="absence">欠席申請</option>
              <option value="additional">追加授業申請</option>
            </select>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              ステータス
            </label>
            <select
              id="status"
              value={filter.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">すべて</option>
              <option value="pending">未対応</option>
              <option value="processed">対応済み</option>
            </select>
          </div>

          <div>
            <label htmlFor="dateRange" className="block text-sm font-medium text-gray-700 mb-1">
              申請日の範囲
            </label>
            <select
              id="dateRange"
              value={filter.dateRange}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="7">過去7日間</option>
              <option value="30">過去30日間</option>
              <option value="90">過去90日間</option>
            </select>
          </div>
        </div>

        {/* アクティブフィルターの表示 */}
        {hasActiveFilters() && (
          <div className="pt-4 border-t border-gray-200">
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
              
              {filter.type !== 'all' && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  種別: {filter.type === 'absence' ? '欠席申請' : '追加授業申請'}
                  <button
                    onClick={() => handleFilterChange('type', 'all')}
                    className="ml-1 text-purple-600 hover:text-purple-800"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              )}
              
              {filter.status !== 'all' && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  ステータス: {filter.status === 'pending' ? '未対応' : '対応済み'}
                  <button
                    onClick={() => handleFilterChange('status', 'all')}
                    className="ml-1 text-green-600 hover:text-green-800"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              )}
              
              {filter.dateRange !== '30' && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                  期間: 過去{filter.dateRange}日間
                  <button
                    onClick={() => handleFilterChange('dateRange', '30')}
                    className="ml-1 text-orange-600 hover:text-orange-800"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              )}
            </div>
          </div>
        )}

        {/* ヒント */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <h5 className="text-sm font-medium text-blue-900 mb-2">ヒント</h5>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• 「未対応」フィルターで処理が必要な申請のみを表示できます</li>
            <li>• 緊急マークがついた申請は24時間以内の授業に関する申請です</li>
            <li>• 申請種別でフィルターして、欠席と追加授業を分けて管理できます</li>
          </ul>
        </div>
      </div>
    </div>
  );
}