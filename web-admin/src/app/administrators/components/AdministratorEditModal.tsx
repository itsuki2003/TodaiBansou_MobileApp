'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, ExclamationTriangleIcon, ShieldCheckIcon, UserIcon } from '@heroicons/react/24/outline';
import { AdministratorWithManagementInfo } from '@/types/adminManagement';

interface AdministratorEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  administrator: AdministratorWithManagementInfo | null;
  currentUserId?: string;
  onSubmit: (adminId: string, updateData: any) => Promise<void>;
}

interface EditFormData {
  full_name: string;
  email: string;
  account_status: '有効' | '無効';
  notes_admin_only: string;
}

export default function AdministratorEditModal({
  isOpen,
  onClose,
  administrator,
  currentUserId,
  onSubmit
}: AdministratorEditModalProps) {
  const [formData, setFormData] = useState<EditFormData>({
    full_name: '',
    email: '',
    account_status: '有効',
    notes_admin_only: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // 管理者データが変更されたときにフォームを初期化
  useEffect(() => {
    if (administrator) {
      setFormData({
        full_name: administrator.full_name,
        email: administrator.email,
        account_status: administrator.account_status,
        notes_admin_only: administrator.notes_admin_only || ''
      });
      setErrors({});
    }
  }, [administrator]);

  // フォームデータの更新
  const updateFormData = (field: keyof EditFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // エラーをクリア
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // バリデーション
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = '運営者名は必須です';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'メールアドレスは必須です';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '有効なメールアドレスを入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // フォーム送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!administrator || !validateForm()) return;

    // 自分自身を無効化する場合の確認
    const isSelf = administrator.id === currentUserId;
    if (isSelf && formData.account_status === '無効' && administrator.account_status === '有効') {
      if (!confirm('⚠️ 重要な警告\n\n自分自身のアカウントを無効化しようとしています。\n無効化すると、このアカウントでログインできなくなります。\n\n本当に実行しますか？')) {
        return;
      }
    }

    setSubmitting(true);
    try {
      await onSubmit(administrator.id, formData);
      handleClose();
    } catch (error) {
      console.error('Administrator update error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // モーダルを閉じる
  const handleClose = () => {
    if (!submitting) {
      setErrors({});
      onClose();
    }
  };

  if (!administrator) return null;

  const isCurrentUser = administrator.id === currentUserId;
  const hasChanges = JSON.stringify(formData) !== JSON.stringify({
    full_name: administrator.full_name,
    email: administrator.email,
    account_status: administrator.account_status,
    notes_admin_only: administrator.notes_admin_only || ''
  });

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleClose}>
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    onClick={handleClose}
                    disabled={submitting}
                  >
                    <span className="sr-only">閉じる</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mt-3 w-full text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 flex items-center">
                      <UserIcon className="h-5 w-5 mr-2 text-gray-600" />
                      運営者情報の編集
                      {isCurrentUser && (
                        <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          自分
                        </span>
                      )}
                    </Dialog.Title>
                    
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        運営者アカウントの基本情報を編集します。
                      </p>
                    </div>

                    {/* 自分自身の編集時の警告 */}
                    {isCurrentUser && (
                      <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex">
                          <ExclamationTriangleIcon className="h-5 w-5 text-blue-400" />
                          <div className="ml-3">
                            <h4 className="text-sm font-medium text-blue-800">自分自身のアカウント編集</h4>
                            <div className="mt-1 text-sm text-blue-700">
                              <ul className="list-disc list-inside space-y-1">
                                <li>アカウントを無効化すると、ログインできなくなります</li>
                                <li>メールアドレス変更は次回ログイン時に有効になります</li>
                                <li>変更は慎重に行ってください</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                      {/* 運営者名 */}
                      <div>
                        <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                          運営者名 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="full_name"
                          value={formData.full_name}
                          onChange={(e) => updateFormData('full_name', e.target.value)}
                          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                            errors.full_name ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="例: 管理太郎"
                        />
                        {errors.full_name && (
                          <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>
                        )}
                      </div>

                      {/* メールアドレス */}
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                          メールアドレス（ログインID） <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          id="email"
                          value={formData.email}
                          onChange={(e) => updateFormData('email', e.target.value)}
                          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                            errors.email ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="例: admin@example.com"
                        />
                        {errors.email && (
                          <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                        )}
                        {administrator.email !== formData.email && (
                          <p className="mt-1 text-xs text-orange-600">
                            ⚠️ メールアドレス変更は次回ログイン時に有効になります
                          </p>
                        )}
                      </div>

                      {/* アカウント状態 */}
                      <div>
                        <label htmlFor="account_status" className="block text-sm font-medium text-gray-700">
                          アカウント状態
                        </label>
                        <select
                          id="account_status"
                          value={formData.account_status}
                          onChange={(e) => updateFormData('account_status', e.target.value as '有効' | '無効')}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="有効">有効（ログイン可能）</option>
                          <option value="無効">無効（ログイン不可）</option>
                        </select>
                        {isCurrentUser && formData.account_status === '無効' && (
                          <p className="mt-1 text-sm text-red-600">
                            ⚠️ 自分自身のアカウントを無効化すると、ログインできなくなります
                          </p>
                        )}
                      </div>

                      {/* 管理メモ */}
                      <div>
                        <label htmlFor="notes_admin_only" className="block text-sm font-medium text-gray-700">
                          運営専用メモ
                        </label>
                        <textarea
                          id="notes_admin_only"
                          value={formData.notes_admin_only}
                          onChange={(e) => updateFormData('notes_admin_only', e.target.value)}
                          rows={3}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="管理に関する特記事項・メモ"
                        />
                      </div>

                      {/* 最終更新情報 */}
                      <div className="bg-gray-50 rounded-lg p-3">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">アカウント情報</h4>
                        <div className="space-y-1 text-xs text-gray-600">
                          <div className="flex justify-between">
                            <span>作成日:</span>
                            <span>{new Date(administrator.created_at).toLocaleDateString('ja-JP')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>最終更新:</span>
                            <span>{new Date(administrator.updated_at).toLocaleDateString('ja-JP')}</span>
                          </div>
                          {administrator.last_login_at && (
                            <div className="flex justify-between">
                              <span>最終ログイン:</span>
                              <span>{new Date(administrator.last_login_at).toLocaleDateString('ja-JP')}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </form>
                  </div>
                </div>

                <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                  <button
                    type="submit"
                    onClick={handleSubmit}
                    disabled={submitting || !hasChanges}
                    className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:col-start-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? '更新中...' : hasChanges ? '更新する' : '変更なし'}
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
                    onClick={handleClose}
                    disabled={submitting}
                  >
                    キャンセル
                  </button>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}