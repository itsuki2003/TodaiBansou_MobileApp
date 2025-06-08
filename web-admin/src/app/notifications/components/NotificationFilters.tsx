'use client';

import { useState } from 'react';
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { NotificationFilter, NotificationCategory } from '@/types/notifications';

interface NotificationFiltersProps {
  filter: NotificationFilter;
  onFilterChange: (filter: NotificationFilter) => void;
  categories: NotificationCategory[];
  className?: string;
}

export default function NotificationFilters({
  filter,
  onFilterChange,
  categories,
  className = ''
}: NotificationFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleFilterChange = (key: keyof NotificationFilter, value: any) => {
    onFilterChange({
      ...filter,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFilterChange({
      search: '',
      status: 'all',
      category_id: 'all',
      creator_id: 'all',
      publish_date_range: null,
      created_date_range: null
    });
  };

  const hasActiveFilters = () => {
    return (
      filter.search !== '' ||
      filter.status !== 'all' ||
      filter.category_id !== 'all' ||
      filter.creator_id !== 'all' ||
      filter.publish_date_range !== null ||
      filter.created_date_range !== null
    );
  };

  const formatDateForInput = (dateString: string) => {
    return dateString ? dateString.split('T')[0] : '';
  };

  const handleDateRangeChange = (type: 'publish' | 'created', field: 'start' | 'end', value: string) => {
    const rangeKey = type === 'publish' ? 'publish_date_range' : 'created_date_range';
    const currentRange = filter[rangeKey] || { start: '', end: '' };
    
    onFilterChange({
      ...filter,
      [rangeKey]: {
        ...currentRange,
        [field]: value || undefined
      }
    });
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
            タイトル・内容検索
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
              placeholder="お知らせのタイトルまたは内容で検索"
            />
          </div>
        </div>

        {/* 基本フィルター */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              配信状態
            </label>
            <select
              id="status"
              value={filter.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">すべて</option>
              <option value="配信済み">配信済み</option>
              <option value="下書き">下書き</option>
            </select>
          </div>

          <div>
            <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-1">
              カテゴリー
            </label>
            <select
              id="category_id"
              value={filter.category_id}
              onChange={(e) => handleFilterChange('category_id', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">すべてのカテゴリー</option>
              <option value="">カテゴリーなし</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              配信日フィルター
            </label>
            <select
              onChange={(e) => {
                const value = e.target.value;
                if (value === 'all') {
                  handleFilterChange('publish_date_range', null);
                } else {
                  const today = new Date();
                  const days = parseInt(value);
                  const startDate = new Date(today.getTime() - days * 24 * 60 * 60 * 1000);
                  
                  handleFilterChange('publish_date_range', {
                    start: startDate.toISOString().split('T')[0],
                    end: today.toISOString().split('T')[0]
                  });
                }
              }}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">すべての期間</option>
              <option value="7">過去7日間</option>
              <option value="30">過去30日間</option>
              <option value="90">過去90日間</option>
            </select>
          </div>
        </div>

        {/* 詳細フィルター */}
        {showAdvanced && (
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-3">詳細フィルター</h4>
            <div className="space-y-4">
              {/* 配信日範囲指定 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  配信日期間指定
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">開始日</label>
                    <div className="relative">
                      <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="date"
                        value={filter.publish_date_range?.start || ''}
                        onChange={(e) => handleDateRangeChange('publish', 'start', e.target.value)}
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
                        value={filter.publish_date_range?.end || ''}
                        onChange={(e) => handleDateRangeChange('publish', 'end', e.target.value)}
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
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
                        onChange={(e) => handleDateRangeChange('created', 'start', e.target.value)}
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
                        onChange={(e) => handleDateRangeChange('created', 'end', e.target.value)}
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
                <li>• 複数のフィルターを組み合わせて絞り込みができます</li>
                <li>• 「下書き」フィルターで、配信前のお知らせを確認できます</li>
                <li>• 日付範囲を指定して、特定期間のお知らせを抽出できます</li>
                <li>• カテゴリー別に分類して管理・確認ができます</li>
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
            
            {filter.status !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                状態: {filter.status}
                <button
                  onClick={() => handleFilterChange('status', 'all')}
                  className="ml-1 text-green-600 hover:text-green-800"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}
            
            {filter.category_id !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                カテゴリー: {
                  filter.category_id === '' ? 'なし' :
                  categories.find(c => c.id === filter.category_id)?.name || 'Unknown'
                }
                <button
                  onClick={() => handleFilterChange('category_id', 'all')}
                  className="ml-1 text-purple-600 hover:text-purple-800"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}

            {filter.publish_date_range && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                配信日: {filter.publish_date_range.start} 〜 {filter.publish_date_range.end}
                <button
                  onClick={() => handleFilterChange('publish_date_range', null)}
                  className="ml-1 text-orange-600 hover:text-orange-800"
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