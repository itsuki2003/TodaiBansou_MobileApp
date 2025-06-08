'use client';

import { useState } from 'react';
import { 
  CheckCircleIcon,
  XCircleIcon,
  KeyIcon,
  BellIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import { AdministratorWithManagementInfo, BulkAdministratorAction } from '@/types/adminManagement';

interface BulkAdministratorActionsProps {
  selectedAdministrators: string[];
  administrators: AdministratorWithManagementInfo[];
  currentUserId?: string;
  onBulkAction: (action: BulkAdministratorAction) => Promise<void>;
  onClearSelection: () => void;
  className?: string;
}

export default function BulkAdministratorActions({
  selectedAdministrators,
  administrators,
  currentUserId,
  onBulkAction,
  onClearSelection,
  className = ''
}: BulkAdministratorActionsProps) {
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);

  // 選択された運営者の情報を取得
  const selectedAdmins = administrators.filter(admin => 
    selectedAdministrators.includes(admin.id)
  );

  const includesSelf = selectedAdministrators.includes(currentUserId || '');
  const activeCount = selectedAdmins.filter(admin => admin.account_status === '有効').length;
  const inactiveCount = selectedAdmins.filter(admin => admin.account_status === '無効').length;

  // 一括操作の実行
  const handleBulkAction = async (actionType: BulkAdministratorAction['type'], options?: any) => {
    if (selectedAdministrators.length === 0) return;

    setActionInProgress(actionType);
    try {
      const action: BulkAdministratorAction = {
        type: actionType,
        adminIds: selectedAdministrators,
        ...options
      };

      await onBulkAction(action);
      onClearSelection();
    } catch (error) {
      console.error('Bulk action error:', error);
    } finally {
      setActionInProgress(null);
    }
  };

  // 通知送信モーダル
  const NotificationModal = () => (
    showNotificationModal && (
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowNotificationModal(false)} />
          
          <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">通知メッセージ送信</h3>
              <button
                onClick={() => setShowNotificationModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                選択した{selectedAdministrators.length}人の運営者に通知メッセージを送信します。
              </p>
            </div>

            <div className="mb-6">
              <label htmlFor="notification-message" className="block text-sm font-medium text-gray-700 mb-2">
                メッセージ内容
              </label>
              <textarea
                id="notification-message"
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
                rows={4}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="運営者への通知メッセージを入力してください"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowNotificationModal(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                onClick={() => {
                  if (notificationMessage.trim()) {
                    handleBulkAction('send_notification', { notificationMessage });
                    setShowNotificationModal(false);
                    setNotificationMessage('');
                  }
                }}
                disabled={!notificationMessage.trim()}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                送信
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  );

  return (
    <>
      <div className={`bg-white border border-blue-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-900">
                {selectedAdministrators.length}人の運営者を選択中
              </span>
              {includesSelf && (
                <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                  自分を含む
                </span>
              )}
            </div>
            
            <div className="text-xs text-gray-500">
              有効: {activeCount}人 | 無効: {inactiveCount}人
            </div>
          </div>

          <button
            onClick={onClearSelection}
            className="text-gray-400 hover:text-gray-600"
            title="選択をクリア"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* 自分自身を含む場合の警告 */}
        {includesSelf && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>注意:</strong> 自分自身のアカウントも選択されています。一部の操作では自分自身は対象外となります。
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {/* アクティベート */}
          {inactiveCount > 0 && (
            <button
              onClick={() => handleBulkAction('activate')}
              disabled={actionInProgress === 'activate'}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
            >
              {actionInProgress === 'activate' ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <CheckCircleIcon className="h-4 w-4 mr-2" />
              )}
              有効化 ({inactiveCount})
            </button>
          )}

          {/* 非アクティベート */}
          {activeCount > 0 && (
            <button
              onClick={() => {
                if (includesSelf && !confirm('⚠️ 自分自身のアカウントも無効化されます。続行しますか？')) {
                  return;
                }
                handleBulkAction('deactivate');
              }}
              disabled={actionInProgress === 'deactivate'}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
            >
              {actionInProgress === 'deactivate' ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <XCircleIcon className="h-4 w-4 mr-2" />
              )}
              無効化 ({activeCount})
            </button>
          )}

          {/* パスワードリセット */}
          <button
            onClick={() => {
              if (!confirm(`選択した${selectedAdministrators.length}人の運営者のパスワードをリセットしますか？\n新しいパスワードがメールで送信されます。`)) {
                return;
              }
              handleBulkAction('reset_password');
            }}
            disabled={actionInProgress === 'reset_password'}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {actionInProgress === 'reset_password' ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
            ) : (
              <KeyIcon className="h-4 w-4 mr-2" />
            )}
            パスワードリセット
          </button>

          {/* 通知送信 */}
          <button
            onClick={() => setShowNotificationModal(true)}
            disabled={actionInProgress === 'send_notification'}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {actionInProgress === 'send_notification' ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
            ) : (
              <EnvelopeIcon className="h-4 w-4 mr-2" />
            )}
            通知送信
          </button>

          {/* 削除 */}
          <button
            onClick={() => {
              const deletableCount = selectedAdministrators.filter(id => id !== currentUserId).length;
              if (deletableCount === 0) {
                alert('削除可能なアカウントがありません。自分自身のアカウントは削除できません。');
                return;
              }
              
              if (!confirm(`⚠️ 重要な警告\n\n${deletableCount}人の運営者アカウントを完全に削除します。\nこの操作は取り消すことができません。\n\n本当に削除しますか？`)) {
                return;
              }
              handleBulkAction('delete');
            }}
            disabled={actionInProgress === 'delete'}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
          >
            {actionInProgress === 'delete' ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <TrashIcon className="h-4 w-4 mr-2" />
            )}
            削除
          </button>
        </div>

        {/* 選択された運営者の一覧（省略表示） */}
        <div className="mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2">選択中の運営者:</p>
          <div className="flex flex-wrap gap-1">
            {selectedAdmins.slice(0, 5).map((admin) => (
              <span
                key={admin.id}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {admin.full_name}
                {admin.id === currentUserId && ' (自分)'}
              </span>
            ))}
            {selectedAdmins.length > 5 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                他 {selectedAdmins.length - 5}人
              </span>
            )}
          </div>
        </div>
      </div>

      <NotificationModal />
    </>
  );
}