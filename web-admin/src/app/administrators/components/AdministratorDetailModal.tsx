'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
  XMarkIcon, 
  UserIcon,
  EnvelopeIcon,
  CalendarDaysIcon,
  ClockIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  ExclamationTriangleIcon,
  PencilIcon,
  KeyIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeSlashIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline';
import { AdministratorWithManagementInfo } from '@/types/adminManagement';

interface AdministratorDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  administrator: AdministratorWithManagementInfo | null;
  currentUserId?: string;
  onEdit: () => void;
  onPasswordReset: (adminId: string) => Promise<void>;
}

export default function AdministratorDetailModal({
  isOpen,
  onClose,
  administrator,
  currentUserId,
  onEdit,
  onPasswordReset
}: AdministratorDetailModalProps) {
  if (!administrator) return null;

  const isCurrentUser = administrator.id === currentUserId;

  // ステータス表示コンポーネント
  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case '有効':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="h-3 w-3 mr-1" />
            有効
          </span>
        );
      case '無効':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircleIcon className="h-3 w-3 mr-1" />
            無効
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  // ログイン頻度バッジ
  const LoginFrequencyBadge = ({ frequency }: { frequency: string }) => {
    const badges = {
      'daily': { color: 'bg-green-100 text-green-800', text: '毎日' },
      'weekly': { color: 'bg-blue-100 text-blue-800', text: '週1回' },
      'monthly': { color: 'bg-yellow-100 text-yellow-800', text: '月1回' },
      'rarely': { color: 'bg-orange-100 text-orange-800', text: '稀に' },
      'never': { color: 'bg-red-100 text-red-800', text: '未ログイン' }
    };

    const badge = badges[frequency as keyof typeof badges] || { color: 'bg-gray-100 text-gray-800', text: frequency };

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  // セキュリティスコア
  const getSecurityIssues = () => {
    const issues = [];
    if (!administrator.security_info.two_factor_enabled) issues.push('2FA無効');
    if (administrator.security_info.failed_login_attempts > 0) issues.push('ログイン失敗履歴');
    if (!administrator.last_login_at) issues.push('未ログイン');
    return issues;
  };

  const securityIssues = getSecurityIssues();

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    onClick={onClose}
                  >
                    <span className="sr-only">閉じる</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mt-3 w-full text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 flex items-center">
                      <UserIcon className="h-5 w-5 mr-2 text-gray-600" />
                      運営者詳細情報
                      {isCurrentUser && (
                        <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          自分
                        </span>
                      )}
                    </Dialog.Title>

                    <div className="mt-6 space-y-6">
                      {/* 基本情報 */}
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                          <UserIcon className="h-5 w-5 mr-2 text-blue-600" />
                          基本情報
                        </h4>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                          <div>
                            <dt className="text-sm font-medium text-gray-500">運営者名</dt>
                            <dd className="mt-1 text-sm text-gray-900">{administrator.full_name}</dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">メールアドレス</dt>
                            <dd className="mt-1 text-sm text-gray-900 flex items-center">
                              <EnvelopeIcon className="h-4 w-4 mr-1 text-gray-400" />
                              {administrator.email}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">アカウント状態</dt>
                            <dd className="mt-1">
                              <StatusBadge status={administrator.account_status} />
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">作成方法</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {
                                administrator.account_creation_method === 'manual' ? '手動作成' :
                                administrator.account_creation_method === 'system' ? 'システム作成' : '一括インポート'
                              }
                            </dd>
                          </div>
                        </div>
                      </div>

                      {/* ログイン・活動情報 */}
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                          <ClockIcon className="h-5 w-5 mr-2 text-green-600" />
                          ログイン・活動情報
                        </h4>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                          <div>
                            <dt className="text-sm font-medium text-gray-500">最終ログイン</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {administrator.last_login_at ? (
                                <>
                                  {new Date(administrator.last_login_at).toLocaleDateString('ja-JP')}
                                  <span className="text-gray-500 ml-2">
                                    {new Date(administrator.last_login_at).toLocaleTimeString('ja-JP', {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </span>
                                </>
                              ) : (
                                <span className="text-gray-500">未ログイン</span>
                              )}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">ログイン頻度</dt>
                            <dd className="mt-1">
                              <LoginFrequencyBadge frequency={administrator.login_frequency} />
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">作成日</dt>
                            <dd className="mt-1 text-sm text-gray-900 flex items-center">
                              <CalendarDaysIcon className="h-4 w-4 mr-1 text-gray-400" />
                              {new Date(administrator.created_at).toLocaleDateString('ja-JP')}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">最終更新</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {new Date(administrator.updated_at).toLocaleDateString('ja-JP')}
                            </dd>
                          </div>
                        </div>
                      </div>

                      {/* セキュリティ情報 */}
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                          <LockClosedIcon className="h-5 w-5 mr-2 text-red-600" />
                          セキュリティ情報
                        </h4>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                          <div>
                            <dt className="text-sm font-medium text-gray-500">2要素認証</dt>
                            <dd className="mt-1">
                              {administrator.security_info.two_factor_enabled ? (
                                <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                  <ShieldCheckIcon className="h-3 w-3 mr-1" />
                                  有効
                                </span>
                              ) : (
                                <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                                  <ShieldExclamationIcon className="h-3 w-3 mr-1" />
                                  無効
                                </span>
                              )}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">ログイン失敗回数</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {administrator.security_info.failed_login_attempts > 0 ? (
                                <span className="text-yellow-600 font-medium">
                                  {administrator.security_info.failed_login_attempts}回
                                </span>
                              ) : (
                                <span className="text-green-600">0回</span>
                              )}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">パスワード最終変更</dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {administrator.security_info.password_last_changed ? (
                                new Date(administrator.security_info.password_last_changed).toLocaleDateString('ja-JP')
                              ) : (
                                <span className="text-gray-500">未記録</span>
                              )}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">セキュリティスコア</dt>
                            <dd className="mt-1">
                              {securityIssues.length === 0 ? (
                                <span className="text-green-600 font-medium">良好</span>
                              ) : securityIssues.length <= 1 ? (
                                <span className="text-yellow-600 font-medium">注意 ({securityIssues.length})</span>
                              ) : (
                                <span className="text-red-600 font-medium">危険 ({securityIssues.length})</span>
                              )}
                            </dd>
                          </div>
                        </div>

                        {/* セキュリティ問題があれば表示 */}
                        {securityIssues.length > 0 && (
                          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex">
                              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
                              <div className="ml-3">
                                <h5 className="text-sm font-medium text-yellow-800">セキュリティ問題</h5>
                                <ul className="mt-1 text-sm text-yellow-700 list-disc list-inside">
                                  {securityIssues.map((issue, index) => (
                                    <li key={index}>{issue}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* 活動統計 */}
                      <div className="bg-white border border-gray-200 rounded-lg p-6">
                        <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                          <CalendarDaysIcon className="h-5 w-5 mr-2 text-purple-600" />
                          今月の活動統計
                        </h4>
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                          <div>
                            <dt className="text-sm font-medium text-gray-500">お知らせ作成</dt>
                            <dd className="mt-1 text-lg font-semibold text-gray-900">
                              {administrator.activity_stats.notifications_created_this_month}件
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">生徒登録</dt>
                            <dd className="mt-1 text-lg font-semibold text-gray-900">
                              {administrator.activity_stats.students_registered_this_month}人
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">講師作成</dt>
                            <dd className="mt-1 text-lg font-semibold text-gray-900">
                              {administrator.activity_stats.teachers_created_this_month}人
                            </dd>
                          </div>
                        </div>
                        <div className="mt-4">
                          <dt className="text-sm font-medium text-gray-500">最終活動</dt>
                          <dd className="mt-1 text-sm text-gray-900">
                            {administrator.activity_stats.last_activity_at ? (
                              new Date(administrator.activity_stats.last_activity_at).toLocaleDateString('ja-JP')
                            ) : (
                              <span className="text-gray-500">記録なし</span>
                            )}
                          </dd>
                        </div>
                      </div>

                      {/* 管理メモ */}
                      {administrator.notes_admin_only && (
                        <div className="bg-white border border-gray-200 rounded-lg p-6">
                          <h4 className="text-lg font-medium text-gray-900 mb-4">運営専用メモ</h4>
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">
                            {administrator.notes_admin_only}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* アクションボタン */}
                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={onEdit}
                    className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <PencilIcon className="h-4 w-4 mr-2" />
                    編集
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => onPasswordReset(administrator.id)}
                    className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    <KeyIcon className="h-4 w-4 mr-2" />
                    パスワードリセット
                  </button>

                  <div className="sm:ml-auto">
                    <button
                      type="button"
                      onClick={onClose}
                      className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      閉じる
                    </button>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}