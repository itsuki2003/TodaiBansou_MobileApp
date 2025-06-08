'use client';

import { useState } from 'react';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon, 
  KeyIcon,
  TrashIcon,
  DocumentArrowDownIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { TeacherWithManagementInfo, BulkTeacherAction } from '@/types/teacherManagement';

interface BulkTeacherActionsProps {
  selectedTeachers: string[];
  teachers: TeacherWithManagementInfo[];
  onBulkAction: (action: BulkTeacherAction) => Promise<void>;
  onClearSelection: () => void;
  className?: string;
}

export default function BulkTeacherActions({
  selectedTeachers,
  teachers,
  onBulkAction,
  onClearSelection,
  className = ''
}: BulkTeacherActionsProps) {
  const [showConfirmation, setShowConfirmation] = useState<BulkTeacherAction | null>(null);
  const [processing, setProcessing] = useState(false);

  if (selectedTeachers.length === 0) {
    return null;
  }

  const selectedTeacherData = teachers.filter(t => selectedTeachers.includes(t.id));
  
  // 選択された講師の状態統計
  const stats = {
    active: selectedTeacherData.filter(t => t.account_status === '有効').length,
    inactive: selectedTeacherData.filter(t => t.account_status === '無効').length,
    pending: selectedTeacherData.filter(t => t.account_status === '承認待ち').length,
    withAssignments: selectedTeacherData.filter(t => t.assigned_students_count > 0).length
  };

  const handleBulkAction = async (action: BulkTeacherAction) => {
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

  const confirmAction = (action: BulkTeacherAction) => {
    setShowConfirmation(action);
  };

  const exportSelectedTeachers = () => {
    const csvContent = [
      // ヘッダー
      ['講師名', 'フリガナ', 'メールアドレス', '電話番号', 'アカウント状態', '担当生徒数', '登録日'].join(','),
      // データ
      ...selectedTeacherData.map(teacher => [
        teacher.full_name,
        teacher.furigana_name || '',
        teacher.email,
        teacher.phone_number || '',
        teacher.account_status,
        teacher.assigned_students_count.toString(),
        teacher.registration_application_date ? 
          new Date(teacher.registration_application_date).toLocaleDateString('ja-JP') :
          new Date(teacher.created_at).toLocaleDateString('ja-JP')
      ].join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `teachers_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getActionConfirmationMessage = (action: BulkTeacherAction) => {
    switch (action.type) {
      case 'activate':
        return `選択した${selectedTeachers.length}人の講師アカウントを有効化します。これらの講師はログインが可能になります。`;
      case 'deactivate':
        return `選択した${selectedTeachers.length}人の講師アカウントを無効化します。これらの講師はログインできなくなります。`;
      case 'approve':
        return `選択した${selectedTeachers.length}人の講師を承認し、アカウントを有効化します。`;
      case 'reset_password':
        return `選択した${selectedTeachers.length}人の講師のパスワードをリセットします。新しいパスワードがメールで送信されます。`;
      case 'send_welcome':
        return `選択した${selectedTeachers.length}人の講師にウェルカムメールを再送信します。`;
      case 'delete':
        return `選択した${selectedTeachers.length}人の講師アカウントを完全に削除します。この操作は取り消すことができません。`;
      default:
        return '選択した操作を実行します。';
    }
  };

  const getActionWarning = (action: BulkTeacherAction) => {
    switch (action.type) {
      case 'deactivate':
        if (stats.withAssignments > 0) {
          return `⚠️ ${stats.withAssignments}人の講師に担当生徒が割り当てられています。無効化すると生徒への指導に影響する可能性があります。`;
        }
        break;
      case 'delete':
        if (stats.withAssignments > 0) {
          return `⚠️ ${stats.withAssignments}人の講師に担当生徒が割り当てられています。削除前に担当割り当てを解除してください。`;
        }
        return `⚠️ この操作は取り消すことができません。講師のデータは完全に削除されます。`;
      case 'reset_password':
        return `⚠️ 新しいパスワードは講師のメールアドレスに送信されます。メールアドレスが正しいことを確認してください。`;
    }
    return null;
  };

  return (
    <>
      <div className={`bg-white border border-gray-200 rounded-lg shadow-sm p-4 ${className}`}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0">
          <div className="flex items-center space-x-3">
            <div className="text-sm font-medium text-gray-900">
              {selectedTeachers.length}人の講師を選択中
            </div>
            <div className="flex items-center space-x-2 text-xs text-gray-500">
              {stats.active > 0 && (
                <span className="flex items-center space-x-1">
                  <CheckCircleIcon className="h-3 w-3 text-green-500" />
                  <span>有効: {stats.active}</span>
                </span>
              )}
              {stats.inactive > 0 && (
                <span className="flex items-center space-x-1">
                  <XCircleIcon className="h-3 w-3 text-red-500" />
                  <span>無効: {stats.inactive}</span>
                </span>
              )}
              {stats.pending > 0 && (
                <span className="flex items-center space-x-1">
                  <ClockIcon className="h-3 w-3 text-yellow-500" />
                  <span>承認待ち: {stats.pending}</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center space-x-2">
            {/* 状態変更アクション */}
            {stats.pending > 0 && (
              <button
                onClick={() => confirmAction({ type: 'approve', teacherIds: selectedTeachers })}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                承認
              </button>
            )}

            {stats.inactive > 0 && (
              <button
                onClick={() => confirmAction({ type: 'activate', teacherIds: selectedTeachers })}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <CheckCircleIcon className="h-4 w-4 mr-1" />
                有効化
              </button>
            )}

            {stats.active > 0 && (
              <button
                onClick={() => confirmAction({ type: 'deactivate', teacherIds: selectedTeachers })}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <XCircleIcon className="h-4 w-4 mr-1" />
                無効化
              </button>
            )}

            {/* その他のアクション */}
            <button
              onClick={() => confirmAction({ type: 'reset_password', teacherIds: selectedTeachers })}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-orange-700 bg-orange-100 hover:bg-orange-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
            >
              <KeyIcon className="h-4 w-4 mr-1" />
              パスワードリセット
            </button>

            <button
              onClick={() => confirmAction({ type: 'send_welcome', teacherIds: selectedTeachers })}
              className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <EnvelopeIcon className="h-4 w-4 mr-1" />
              メール再送
            </button>

            <button
              onClick={exportSelectedTeachers}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <DocumentArrowDownIcon className="h-4 w-4 mr-1" />
              エクスポート
            </button>

            {/* 危険なアクション */}
            {stats.withAssignments === 0 && (
              <button
                onClick={() => confirmAction({ type: 'delete', teacherIds: selectedTeachers })}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <TrashIcon className="h-4 w-4 mr-1" />
                削除
              </button>
            )}

            <button
              onClick={onClearSelection}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              選択解除
            </button>
          </div>
        </div>

        {/* 選択状況の詳細 */}
        {stats.withAssignments > 0 && (
          <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-700">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
              <span>{stats.withAssignments}人の講師に担当生徒が割り当てられています。操作時はご注意ください。</span>
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
                disabled={processing}
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