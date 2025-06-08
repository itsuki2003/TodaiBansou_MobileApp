'use client';

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { NewTeacherFormData } from '@/types/teacherManagement';

interface TeacherCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: NewTeacherFormData) => Promise<void>;
}

export default function TeacherCreateModal({
  isOpen,
  onClose,
  onSubmit
}: TeacherCreateModalProps) {
  const [formData, setFormData] = useState<NewTeacherFormData>({
    full_name: '',
    furigana_name: '',
    email: '',
    phone_number: '',
    account_status: '有効',
    notes_admin_only: '',
    initial_password: '',
    send_welcome_email: true
  });

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // フォームデータの更新
  const updateFormData = (field: keyof NewTeacherFormData, value: any) => {
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
      newErrors.full_name = '講師名は必須です';
    }

    if (!formData.furigana_name.trim()) {
      newErrors.furigana_name = 'フリガナは必須です';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'メールアドレスは必須です';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '有効なメールアドレスを入力してください';
    }

    if (!formData.initial_password.trim()) {
      newErrors.initial_password = '初期パスワードは必須です';
    } else if (formData.initial_password.length < 8) {
      newErrors.initial_password = 'パスワードは8文字以上で入力してください';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ランダムパスワード生成
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    updateFormData('initial_password', password);
  };

  // フォーム送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      await onSubmit(formData);
      handleClose();
    } catch (error) {
      console.error('Teacher creation error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // モーダルを閉じる
  const handleClose = () => {
    if (!submitting) {
      setFormData({
        full_name: '',
        furigana_name: '',
        email: '',
        phone_number: '',
        account_status: '有効',
        notes_admin_only: '',
        initial_password: '',
        send_welcome_email: true
      });
      setErrors({});
      onClose();
    }
  };

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
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                      新規講師登録
                    </Dialog.Title>
                    
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        新しい講師アカウントを手動で作成します。詳細プロフィールは講師自身が後で入力できます。
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                      {/* 基本情報 */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                            講師名 <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            id="full_name"
                            value={formData.full_name}
                            onChange={(e) => updateFormData('full_name', e.target.value)}
                            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                              errors.full_name ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="例: 田中太郎"
                          />
                          {errors.full_name && (
                            <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>
                          )}
                        </div>

                        <div>
                          <label htmlFor="furigana_name" className="block text-sm font-medium text-gray-700">
                            フリガナ <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            id="furigana_name"
                            value={formData.furigana_name}
                            onChange={(e) => updateFormData('furigana_name', e.target.value)}
                            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                              errors.furigana_name ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="例: タナカタロウ"
                          />
                          {errors.furigana_name && (
                            <p className="mt-1 text-sm text-red-600">{errors.furigana_name}</p>
                          )}
                        </div>
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
                          placeholder="例: teacher@example.com"
                        />
                        {errors.email && (
                          <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                        )}
                      </div>

                      {/* 電話番号 */}
                      <div>
                        <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700">
                          電話番号
                        </label>
                        <input
                          type="tel"
                          id="phone_number"
                          value={formData.phone_number}
                          onChange={(e) => updateFormData('phone_number', e.target.value)}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="例: 090-1234-5678"
                        />
                      </div>

                      {/* 初期パスワード */}
                      <div>
                        <label htmlFor="initial_password" className="block text-sm font-medium text-gray-700">
                          初期パスワード <span className="text-red-500">*</span>
                        </label>
                        <div className="mt-1 relative">
                          <input
                            type={showPassword ? 'text' : 'password'}
                            id="initial_password"
                            value={formData.initial_password}
                            onChange={(e) => updateFormData('initial_password', e.target.value)}
                            className={`block w-full pr-20 px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                              errors.initial_password ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="8文字以上のパスワード"
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-3">
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              {showPassword ? (
                                <EyeSlashIcon className="h-4 w-4" />
                              ) : (
                                <EyeIcon className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={generateRandomPassword}
                              className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200"
                            >
                              生成
                            </button>
                          </div>
                        </div>
                        {errors.initial_password && (
                          <p className="mt-1 text-sm text-red-600">{errors.initial_password}</p>
                        )}
                      </div>

                      {/* アカウント状態 */}
                      <div>
                        <label htmlFor="account_status" className="block text-sm font-medium text-gray-700">
                          初期アカウント状態
                        </label>
                        <select
                          id="account_status"
                          value={formData.account_status}
                          onChange={(e) => updateFormData('account_status', e.target.value as '有効' | '無効')}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="有効">有効（すぐにログイン可能）</option>
                          <option value="無効">無効（後で有効化）</option>
                        </select>
                      </div>

                      {/* 管理者メモ */}
                      <div>
                        <label htmlFor="notes_admin_only" className="block text-sm font-medium text-gray-700">
                          管理者メモ
                        </label>
                        <textarea
                          id="notes_admin_only"
                          value={formData.notes_admin_only}
                          onChange={(e) => updateFormData('notes_admin_only', e.target.value)}
                          rows={3}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="講師に関する内部メモ（講師からは見えません）"
                        />
                      </div>

                      {/* ウェルカムメール送信 */}
                      <div className="flex items-start">
                        <div className="flex items-center h-5">
                          <input
                            id="send_welcome_email"
                            type="checkbox"
                            checked={formData.send_welcome_email}
                            onChange={(e) => updateFormData('send_welcome_email', e.target.checked)}
                            className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                          />
                        </div>
                        <div className="ml-3 text-sm">
                          <label htmlFor="send_welcome_email" className="font-medium text-gray-700">
                            ウェルカムメールを送信
                          </label>
                          <p className="text-gray-500">
                            講師にログイン情報と初期設定の案内を自動送信します
                          </p>
                        </div>
                      </div>
                    </form>
                  </div>
                </div>

                <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                  <button
                    type="submit"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:col-start-2 disabled:opacity-50"
                  >
                    {submitting ? '作成中...' : '講師を作成'}
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