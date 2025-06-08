'use client';

import { useState } from 'react';
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { AssignmentFilter, TeacherOption } from '@/types/assignment';

interface AssignmentFiltersProps {
  filter: AssignmentFilter;
  onFilterChange: (filter: AssignmentFilter) => void;
  teachers: TeacherOption[];
  className?: string;
}

export default function AssignmentFilters({
  filter,
  onFilterChange,
  teachers,
  className = ''
}: AssignmentFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleFilterChange = (key: keyof AssignmentFilter, value: any) => {
    onFilterChange({
      ...filter,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFilterChange({
      search: '',
      status: 'all',
      grade: 'all',
      hasInterviewTeacher: 'all',
      hasLessonTeacher: 'all',
      teacherId: 'all'
    });
  };

  const hasActiveFilters = () => {
    return (
      filter.search !== '' ||
      filter.status !== 'all' ||
      filter.grade !== 'all' ||
      filter.hasInterviewTeacher !== 'all' ||
      filter.hasLessonTeacher !== 'all' ||
      filter.teacherId !== 'all'
    );
  };

  const grades = ['小学4年生', '小学5年生', '小学6年生', '中学1年生'];

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
              placeholder="生徒名またはフリガナで検索"
            />
          </div>
        </div>

        {/* 基本フィルター */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
              在籍状況
            </label>
            <select
              id="status"
              value={filter.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">すべて</option>
              <option value="在籍中">在籍中</option>
              <option value="休会中">休会中</option>
              <option value="退会済み">退会済み</option>
            </select>
          </div>

          <div>
            <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-1">
              学年
            </label>
            <select
              id="grade"
              value={filter.grade}
              onChange={(e) => handleFilterChange('grade', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">すべて</option>
              {grades.map(grade => (
                <option key={grade} value={grade}>{grade}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="teacherId" className="block text-sm font-medium text-gray-700 mb-1">
              担当講師
            </label>
            <select
              id="teacherId"
              value={filter.teacherId}
              onChange={(e) => handleFilterChange('teacherId', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">すべて</option>
              {teachers.map(teacher => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.full_name} ({teacher.currentAssignments}人担当)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 詳細フィルター */}
        {showAdvanced && (
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-3">詳細フィルター</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="hasInterviewTeacher" className="block text-sm font-medium text-gray-700 mb-1">
                  面談担当講師の設定状況
                </label>
                <select
                  id="hasInterviewTeacher"
                  value={filter.hasInterviewTeacher.toString()}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleFilterChange('hasInterviewTeacher', value === 'all' ? 'all' : value === 'true');
                  }}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">すべて</option>
                  <option value="true">設定済み</option>
                  <option value="false">未設定</option>
                </select>
              </div>

              <div>
                <label htmlFor="hasLessonTeacher" className="block text-sm font-medium text-gray-700 mb-1">
                  授業担当講師の設定状況
                </label>
                <select
                  id="hasLessonTeacher"
                  value={filter.hasLessonTeacher.toString()}
                  onChange={(e) => {
                    const value = e.target.value;
                    handleFilterChange('hasLessonTeacher', value === 'all' ? 'all' : value === 'true');
                  }}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">すべて</option>
                  <option value="true">設定済み</option>
                  <option value="false">未設定</option>
                </select>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <h5 className="text-sm font-medium text-blue-900 mb-2">フィルターのヒント</h5>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• 複数のフィルターを組み合わせて絞り込みができます</li>
                <li>• 「面談担当講師：未設定」で、面談担当講師が割り当てられていない生徒を確認できます</li>
                <li>• 特定の講師の担当生徒のみを表示できます</li>
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
                状況: {filter.status}
                <button
                  onClick={() => handleFilterChange('status', 'all')}
                  className="ml-1 text-green-600 hover:text-green-800"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}
            
            {filter.grade !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                学年: {filter.grade}
                <button
                  onClick={() => handleFilterChange('grade', 'all')}
                  className="ml-1 text-purple-600 hover:text-purple-800"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            )}
            
            {filter.teacherId !== 'all' && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                担当: {teachers.find(t => t.id === filter.teacherId)?.full_name || '不明'}
                <button
                  onClick={() => handleFilterChange('teacherId', 'all')}
                  className="ml-1 text-orange-600 hover:text-orange-800"
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