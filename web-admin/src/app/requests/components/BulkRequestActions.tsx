'use client';

import { useState } from 'react';
import { DocumentCheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { UnifiedRequest } from '@/types/requests';

interface BulkRequestActionsProps {
  selectedRequests: string[];
  requests: UnifiedRequest[];
  onBulkAction: () => Promise<void>;
  onClearSelection: () => void;
  className?: string;
}

export default function BulkRequestActions({
  selectedRequests,
  requests,
  onBulkAction,
  onClearSelection,
  className = ''
}: BulkRequestActionsProps) {
  const [bulkAction, setBulkAction] = useState<'approve' | 'mark_processed' | ''>('');
  const [processing, setProcessing] = useState(false);
  const [reason, setReason] = useState('');

  const selectedRequestData = requests.filter(r => selectedRequests.includes(r.id));

  const handleBulkAction = async () => {
    if (!bulkAction || !selectedRequests.length) return;

    setProcessing(true);
    try {
      // TODO: 実際の一括処理APIを実装
      await onBulkAction();
      setBulkAction('');
      setReason('');
    } catch (error) {
      console.error('Bulk action error:', error);
    } finally {
      setProcessing(false);
    }
  };

  const getActionDescription = () => {
    switch (bulkAction) {
      case 'approve':
        return '選択した申請を一括で承認/対応済みにします';
      case 'mark_processed':
        return '選択した申請を処理済みとしてマークします';
      default:
        return '';
    }
  };

  const getProcessableRequests = () => {
    return selectedRequestData.filter(r => 
      (r.type === 'absence' && r.status === '未振替') ||
      (r.type === 'additional' && r.status === '申請中')
    );
  };

  const processableRequests = getProcessableRequests();

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <DocumentCheckIcon className="h-5 w-5 text-blue-600" />
          <span className="font-medium text-blue-800">
            {selectedRequests.length}件の申請を選択中
          </span>
        </div>
        <button
          onClick={onClearSelection}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          選択解除
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="bulkAction" className="block text-sm font-medium text-gray-700 mb-1">
            一括操作を選択
          </label>
          <select
            id="bulkAction"
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value as any)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">操作を選択してください</option>
            <option value="approve">一括承認/対応済み</option>
            <option value="mark_processed">処理済みマーク</option>
          </select>
        </div>

        {bulkAction && (
          <>
            <div className="p-3 bg-white rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700">{getActionDescription()}</p>
              {processableRequests.length !== selectedRequests.length && (
                <p className="text-sm text-blue-600 mt-1">
                  ※ {selectedRequests.length}件中 {processableRequests.length}件に適用されます
                </p>
              )}
            </div>

            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                処理理由（任意）
              </label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="例：定期的な一括処理"
              />
            </div>

            {processableRequests.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">対象申請一覧</h4>
                <div className="max-h-32 overflow-y-auto bg-white border border-gray-200 rounded-md p-2">
                  <div className="text-sm text-gray-600 space-y-1">
                    {processableRequests.map(request => (
                      <div key={request.id} className="flex items-center justify-between">
                        <span>
                          {request.type === 'absence' ? '欠席' : '追加授業'}: {request.student_name}
                        </span>
                        <span className="text-xs text-gray-400">
                          {new Date(request.target_date).toLocaleDateString('ja-JP')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {processableRequests.length === 0 && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex">
                  <ExclamationTriangleIcon className="h-5 w-5 text-orange-400" />
                  <div className="ml-3">
                    <p className="text-sm text-orange-700">
                      選択された申請にはこの操作を適用できません。
                    </p>
                    <p className="text-xs text-orange-600 mt-1">
                      未対応の申請のみが一括処理の対象となります。
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setBulkAction('');
                  setReason('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleBulkAction}
                disabled={processing || processableRequests.length === 0}
                className="px-4 py-2 bg-blue-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? '処理中...' : `一括実行 (${processableRequests.length}件)`}
              </button>
            </div>
          </>
        )}
      </div>

      {/* 注意事項 */}
      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex">
          <ExclamationTriangleIcon className="h-4 w-4 text-yellow-400 mt-0.5" />
          <div className="ml-3">
            <h4 className="text-sm font-medium text-yellow-800">
              一括処理に関する注意事項
            </h4>
            <ul className="mt-1 text-sm text-yellow-700">
              <li>• 一括処理は元に戻すことができません</li>
              <li>• 緊急性の高い申請は個別に確認することをお勧めします</li>
              <li>• 処理後は関係者に適切な通知を行ってください</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}