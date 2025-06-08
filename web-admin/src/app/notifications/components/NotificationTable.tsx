'use client';

import { useState } from 'react';
import { 
  ChevronUpIcon, 
  ChevronDownIcon, 
  EyeIcon, 
  PencilIcon, 
  TrashIcon,
  ClockIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  TagIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import { NotificationWithDetails, NotificationSort } from '@/types/notifications';

interface NotificationTableProps {
  notifications: NotificationWithDetails[];
  selectedNotifications: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  onPreview: (notification: NotificationWithDetails) => void;
  onEdit: (notification: NotificationWithDetails) => void;
  onDelete: (notificationId: string) => Promise<void>;
  sort: NotificationSort;
  onSortChange: (sort: NotificationSort) => void;
  className?: string;
}

export default function NotificationTable({
  notifications,
  selectedNotifications,
  onSelectionChange,
  onPreview,
  onEdit,
  onDelete,
  sort,
  onSortChange,
  className = ''
}: NotificationTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ソート処理
  const handleSort = (field: NotificationSort['field']) => {
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
      onSelectionChange(notifications.map(n => n.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectNotification = (notificationId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedNotifications, notificationId]);
    } else {
      onSelectionChange(selectedNotifications.filter(id => id !== notificationId));
    }
  };

  // 削除処理
  const handleDelete = async (notificationId: string) => {
    if (!confirm('このお知らせを削除してもよろしいですか？\nこの操作は取り消すことができません。')) {
      return;
    }

    setDeletingId(notificationId);
    try {
      await onDelete(notificationId);
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setDeletingId(null);
    }
  };

  // ステータス表示
  const getStatusBadge = (notification: NotificationWithDetails) => {
    if (notification.is_published) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
          <CheckCircleIcon className="h-3 w-3 mr-1" />
          配信済み
        </span>
      );
    } else if (notification.is_scheduled) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
          <ClockIcon className="h-3 w-3 mr-1" />
          予約配信
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
          <DocumentTextIcon className="h-3 w-3 mr-1" />
          下書き
        </span>
      );
    }
  };

  // 配信日時の表示
  const formatPublishTime = (notification: NotificationWithDetails) => {
    const publishTime = new Date(notification.publish_timestamp);
    const now = new Date();

    if (notification.is_published) {
      return (
        <div className="text-sm text-gray-900">
          {publishTime.toLocaleString('ja-JP')}
        </div>
      );
    } else if (notification.is_scheduled) {
      const minutesUntil = Math.ceil((publishTime.getTime() - now.getTime()) / (1000 * 60));
      return (
        <div>
          <div className="text-sm text-purple-600 font-medium">
            {publishTime.toLocaleString('ja-JP')}
          </div>
          <div className="text-xs text-purple-500">
            {minutesUntil > 60 
              ? `約${Math.ceil(minutesUntil / 60)}時間後`
              : `約${minutesUntil}分後`
            }
          </div>
        </div>
      );
    } else {
      return (
        <div className="text-sm text-gray-500">
          未設定
        </div>
      );
    }
  };

  const SortButton = ({ field, children }: { field: NotificationSort['field']; children: React.ReactNode }) => (
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

  const allSelected = notifications.length > 0 && selectedNotifications.length === notifications.length;
  const someSelected = selectedNotifications.length > 0 && selectedNotifications.length < notifications.length;

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
                    <SortButton field="title">タイトル</SortButton>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <SortButton field="category">カテゴリー</SortButton>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <SortButton field="status">状態</SortButton>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <SortButton field="publish_timestamp">配信日時</SortButton>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    作成者
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <SortButton field="created_at">作成日</SortButton>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <tr key={notification.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedNotifications.includes(notification.id)}
                        onChange={(e) => handleSelectNotification(notification.id, e.target.checked)}
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        <div className="text-sm font-medium text-gray-900 truncate" title={notification.title}>
                          {notification.title}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 line-clamp-2" title={notification.content}>
                          {notification.content.substring(0, 100)}
                          {notification.content.length > 100 && '...'}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      {notification.category ? (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-800">
                          <TagIcon className="h-3 w-3 mr-1" />
                          {notification.category.name}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-500">-</span>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(notification)}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatPublishTime(notification)}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {notification.creator?.full_name || '-'}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <CalendarDaysIcon className="h-4 w-4 mr-1 text-gray-400" />
                        {new Date(notification.created_at).toLocaleDateString('ja-JP')}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onPreview(notification)}
                          className="text-blue-600 hover:text-blue-900"
                          title="プレビュー"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => onEdit(notification)}
                          className="text-green-600 hover:text-green-900"
                          title="編集"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => handleDelete(notification.id)}
                          disabled={deletingId === notification.id}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          title="削除"
                        >
                          {deletingId === notification.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                          ) : (
                            <TrashIcon className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {notifications.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-500">
                  条件に一致するお知らせが見つかりませんでした
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}