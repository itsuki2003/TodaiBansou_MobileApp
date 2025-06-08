'use client';

import { useState } from 'react';
import { 
  CheckCircleIcon, 
  DocumentTextIcon, 
  TrashIcon,
  ClockIcon,
  BellIcon,
  ExclamationTriangleIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { NotificationWithDetails, NotificationCategory, BulkNotificationAction } from '@/types/notifications';

interface BulkNotificationActionsProps {
  selectedNotifications: string[];
  notifications: NotificationWithDetails[];
  categories: NotificationCategory[];
  onBulkAction: (action: BulkNotificationAction) => Promise<void>;
  onClearSelection: () => void;
  className?: string;
}

export default function BulkNotificationActions({
  selectedNotifications,
  notifications,
  categories,
  onBulkAction,
  onClearSelection,
  className = ''
}: BulkNotificationActionsProps) {
  const [showConfirmation, setShowConfirmation] = useState<BulkNotificationAction | null>(null);
  const [processing, setProcessing] = useState(false);
  const [scheduleDateTime, setScheduleDateTime] = useState('');
  const [newCategoryId, setNewCategoryId] = useState('');

  if (selectedNotifications.length === 0) {
    return null;
  }

  const selectedNotificationData = notifications.filter(n => selectedNotifications.includes(n.id));
  
  // 選択されたお知らせの状態統計
  const stats = {
    published: selectedNotificationData.filter(n => n.status === '配信済み').length,
    draft: selectedNotificationData.filter(n => n.status === '下書き').length,
    scheduled: selectedNotificationData.filter(n => n.is_scheduled).length,
    withCategory: selectedNotificationData.filter(n => n.category_id).length
  };

  const handleBulkAction = async (action: BulkNotificationAction) => {
    setProcessing(true);
    try {
      await onBulkAction(action);
      setShowConfirmation(null);
      onClearSelection();
    } catch (error) {
      console.error('Bulk action error:', error);
    } finally {
      setProcessing(false);
    }
  };

  const confirmAction = (actionType: BulkNotificationAction['type'], additionalData?: any) => {
    const action: BulkNotificationAction = {
      type: actionType,
      notificationIds: selectedNotifications,
      ...additionalData
    };
    setShowConfirmation(action);
  };

  const exportSelectedNotifications = () => {
    const csvContent = [
      // ヘッダー
      ['タイトル', 'カテゴリー', '状態', '配信日時', '作成者', '作成日'].join(','),
      // データ
      ...selectedNotificationData.map(notification => [
        `"${notification.title.replace(/"/g, '""')}"`,
        notification.category?.name || 'なし',
        notification.status,
        new Date(notification.publish_timestamp).toLocaleString('ja-JP'),
        notification.creator?.full_name || '',
        new Date(notification.created_at).toLocaleDateString('ja-JP')
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `notifications_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActionConfirmationMessage = (action: BulkNotificationAction) => {
    switch (action.type) {
      case 'publish':
        return `選択した${selectedNotifications.length}件のお知らせを今すぐ配信します。`;
      case 'draft':
        return `選択した${selectedNotifications.length}件のお知らせを下書き状態に変更します。`;
      case 'delete':
        return `選択した${selectedNotifications.length}件のお知らせを完全に削除します。この操作は取り消すことができません。`;
      case 'change_category':
        const categoryName = categories.find(c => c.id === action.newCategoryId)?.name || 'カテゴリーなし';
        return `選択した${selectedNotifications.length}件のお知らせのカテゴリーを「${categoryName}」に変更します。`;
      case 'schedule_publish':
        return `選択した${selectedNotifications.length}件のお知らせを指定した日時に配信予約します。`;
      default:
        return '選択した操作を実行します。';
    }
  };

  const getActionWarning = (action: BulkNotificationAction) => {
    switch (action.type) {
      case 'publish':
        if (stats.published > 0) {
          return `⚠️ ${stats.published}件のお知らせはすでに配信済みです。重複配信にご注意ください。`;
        }
        break;
      case 'draft':
        if (stats.published > 0) {
          return `⚠️ ${stats.published}件の配信済みお知らせは下書きに戻せません。下書き可能なお知らせのみ変更されます。`;
        }
        break;
      case 'delete':
        return `⚠️ この操作は取り消すことができません。お知らせのデータは完全に削除されます。`;
      case 'schedule_publish':
        if (!action.publishTimestamp) {
          return `⚠️ 配信日時を指定してください。`;
        }
        break;
    }
    return null;
  };

  // 日時フォーマット（input[type="datetime-local"]用）
  const formatDateTimeLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  return (
    <>
      <div className={`bg-white border border-gray-200 rounded-lg shadow-sm p-4 ${className}`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <div className="text-sm font-medium text-gray-900">
              {selectedNotifications.length}件のお知らせを選択中
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              {stats.published > 0 && (
                <span className="flex items-center space-x-1">
                  <CheckCircleIcon className="h-3 w-3 text-green-500" />
                  <span>配信済み: {stats.published}</span>
                </span>
              )}
              {stats.draft > 0 && (
                <span className="flex items-center space-x-1">
                  <DocumentTextIcon className="h-3 w-3 text-yellow-500" />
                  <span>下書き: {stats.draft}</span>
                </span>
              )}
              {stats.scheduled > 0 && (
                <span className="flex items-center space-x-1">
                  <ClockIcon className="h-3 w-3 text-purple-500" />
                  <span>予約: {stats.scheduled}</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* 配信関連アクション */}
            {stats.draft > 0 && (
              <button
                onClick={() => confirmAction('publish')}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <BellIcon className="h-4 w-4 mr-1" />
                今すぐ配信
              </button>
            )}

            {stats.published > 0 && (
              <button
                onClick={() => confirmAction('draft')}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-yellow-700 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                <DocumentTextIcon className="h-4 w-4 mr-1" />
                下書きに戻す
              </button>
            )}

            {/* 予約配信 */}
            <button
              onClick={() => {
                // デフォルトを明日の朝9時に設定
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(9, 0, 0, 0);
                setScheduleDateTime(formatDateTimeLocal(tomorrow));
                setShowConfirmation({
                  type: 'schedule_publish',
                  notificationIds: selectedNotifications,
                  publishTimestamp: tomorrow.toISOString()
                });
              }}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-purple-700 bg-purple-100 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <ClockIcon className="h-4 w-4 mr-1" />
              予約配信
            </button>

            {/* カテゴリー変更 */}
            <div className="relative">
              <select
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    setNewCategoryId(e.target.value);
                    confirmAction('change_category', { newCategoryId: e.target.value });
                  }
                }}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <option value="">カテゴリー変更</option>
                <option value="">カテゴリーなし</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* エクスポート */}
            <button
              onClick={exportSelectedNotifications}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
              エクスポート
            </button>

            {/* 削除 */}
            <button
              onClick={() => confirmAction('delete')}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <TrashIcon className="h-4 w-4 mr-1" />
              削除
            </button>

            <button
              onClick={onClearSelection}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              選択解除
            </button>
          </div>
        </div>

        {/* 選択状況の詳細 */}
        {(stats.published > 0 || stats.scheduled > 0) && (
          <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-700">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
              <span>
                {stats.published > 0 && `${stats.published}件は配信済み、`}
                {stats.scheduled > 0 && `${stats.scheduled}件は予約配信中です。`}
                操作時はご注意ください。
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 確認ダイアログ */}
      {showConfirmation && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-orange-100">
                <ExclamationTriangleIcon className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                操作の確認
              </h3>
              
              <p className="text-sm text-gray-600 mb-4">
                {getActionConfirmationMessage(showConfirmation)}
              </p>

              {/* 予約配信の場合の日時入力 */}
              {showConfirmation.type === 'schedule_publish' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    配信日時
                  </label>
                  <div className="relative">
                    <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="datetime-local"
                      value={scheduleDateTime}
                      onChange={(e) => {
                        setScheduleDateTime(e.target.value);
                        setShowConfirmation({
                          ...showConfirmation,
                          publishTimestamp: e.target.value ? new Date(e.target.value).toISOString() : undefined
                        });
                      }}
                      min={formatDateTimeLocal(new Date())}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}
              
              {getActionWarning(showConfirmation) && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700">
                  {getActionWarning(showConfirmation)}
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setShowConfirmation(null)}
                disabled={processing}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                onClick={() => handleBulkAction(showConfirmation)}
                disabled={processing || (showConfirmation.type === 'schedule_publish' && !showConfirmation.publishTimestamp)}
                className={`px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${
                  showConfirmation.type === 'delete' 
                    ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                    : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                }`}
              >
                {processing ? '実行中...' : '実行'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}