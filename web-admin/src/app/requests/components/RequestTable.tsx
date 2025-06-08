'use client';

import { useState } from 'react';
import { ChevronUpIcon, ChevronDownIcon, EyeIcon } from '@heroicons/react/24/outline';
import { UnifiedRequest, RequestSort } from '@/types/requests';

interface RequestTableProps {
  requests: UnifiedRequest[];
  selectedRequests: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  onViewDetail: (request: UnifiedRequest) => void;
  onProcessRequest: (requestId: string, action: string, notes?: string) => Promise<void>;
  sort: RequestSort;
  onSortChange: (sort: RequestSort) => void;
  className?: string;
}

export default function RequestTable({
  requests,
  selectedRequests,
  onSelectionChange,
  onViewDetail,
  onProcessRequest,
  sort,
  onSortChange,
  className = ''
}: RequestTableProps) {
  const [processingId, setProcessingId] = useState<string | null>(null);

  // ソート処理
  const handleSort = (field: RequestSort['field']) => {
    if (sort.field === field) {
      onSortChange({
        field,
        direction: sort.direction === 'asc' ? 'desc' : 'asc'
      });
    } else {
      onSortChange({
        field,
        direction: 'asc'
      });
    }
  };

  // 選択処理
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(requests.map(r => r.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectRequest = (requestId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedRequests, requestId]);
    } else {
      onSelectionChange(selectedRequests.filter(id => id !== requestId));
    }
  };

  // 申請処理
  const handleProcess = async (requestId: string, action: string) => {
    setProcessingId(requestId);
    try {
      await onProcessRequest(requestId, action);
    } finally {
      setProcessingId(null);
    }
  };

  // ステータス表示
  const getStatusBadge = (request: UnifiedRequest) => {
    if (request.type === 'absence') {
      return request.status === '未振替' ? (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
          未対応
        </span>
      ) : (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
          振替済み
        </span>
      );
    } else {
      return request.status === '申請中' ? (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
          申請中
        </span>
      ) : (
        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
          承認済み
        </span>
      );
    }
  };

  // タイプ表示
  const getTypeBadge = (type: 'absence' | 'additional') => {
    return type === 'absence' ? (
      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
        欠席
      </span>
    ) : (
      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
        追加授業
      </span>
    );
  };

  // 緊急度判定
  const isUrgent = (request: UnifiedRequest) => {
    const targetDate = new Date(request.target_date);
    const now = new Date();
    const diffHours = (targetDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return diffHours <= 24 && diffHours > 0; // 24時間以内
  };

  const SortButton = ({ field, children }: { field: RequestSort['field']; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="group inline-flex items-center space-x-1 text-left font-medium text-gray-900 hover:text-gray-600"
    >
      <span>{children}</span>
      {sort.field === field ? (
        sort.direction === 'asc' ? (
          <ChevronUpIcon className="h-4 w-4" />
        ) : (
          <ChevronDownIcon className="h-4 w-4" />
        )
      ) : (
        <div className="h-4 w-4 opacity-0 group-hover:opacity-50">
          <ChevronUpIcon className="h-4 w-4" />
        </div>
      )}
    </button>
  );

  const allSelected = requests.length > 0 && selectedRequests.length === requests.length;
  const someSelected = selectedRequests.length > 0 && selectedRequests.length < requests.length;

  return (
    <div className={className}>
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someSelected;
                      }}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    種別
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <SortButton field="student_name">生徒名</SortButton>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <SortButton field="target_date">対象日時</SortButton>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    担当講師
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <SortButton field="request_date">申請日時</SortButton>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <SortButton field="status">ステータス</SortButton>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {requests.map((request) => (
                  <tr 
                    key={request.id} 
                    className={`hover:bg-gray-50 ${isUrgent(request) ? 'bg-red-50' : ''}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedRequests.includes(request.id)}
                        onChange={(e) => handleSelectRequest(request.id, e.target.checked)}
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getTypeBadge(request.type)}
                        {isUrgent(request) && (
                          <span className="inline-flex px-1 py-0.5 text-xs font-semibold rounded bg-red-500 text-white">
                            緊急
                          </span>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{request.student_name}</div>
                        {request.student_grade && (
                          <div className="text-sm text-gray-500">{request.student_grade}</div>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(request.target_date).toLocaleDateString('ja-JP')}
                      </div>
                      <div className="text-sm text-gray-500">{request.target_time}</div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {request.teacher_name || '-'}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(request.request_date).toLocaleString('ja-JP')}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(request)}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onViewDetail(request)}
                          className="text-blue-600 hover:text-blue-900"
                          title="詳細表示"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        
                        {((request.type === 'absence' && request.status === '未振替') ||
                          (request.type === 'additional' && request.status === '申請中')) && (
                          <button
                            onClick={() => handleProcess(request.id, 'approve')}
                            disabled={processingId === request.id}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                          >
                            {processingId === request.id ? '処理中...' : 
                             request.type === 'absence' ? '対応済み' : '承認'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {requests.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-500">
                  申請が見つかりませんでした
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}