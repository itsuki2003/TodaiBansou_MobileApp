'use client';

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, EyeIcon, EyeSlashIcon, ShieldCheckIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { NewAdministratorFormData } from '@/types/adminManagement';

interface AdministratorCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: NewAdministratorFormData) => Promise<void>;
}

export default function AdministratorCreateModal({
  isOpen,
  onClose,
  onSubmit
}: AdministratorCreateModalProps) {
  const [formData, setFormData] = useState<NewAdministratorFormData>({
    full_name: '',
    email: '',
    account_status: '有効',
    initial_password: '',
    send_welcome_email: true,
    grant_super_admin: false,
    notes: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // フォームデータの更新
  const updateFormData = (field: keyof NewAdministratorFormData, value: any) => {
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

    if (!formData.initial_password.trim()) {
      newErrors.initial_password = '初期パスワードは必須です';
    } else if (formData.initial_password.length < 12) {
      newErrors.initial_password = 'パスワードは12文字以上で入力してください';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(formData.initial_password)) {
      newErrors.initial_password = 'パスワードは大文字・小文字・数字・記号を含む必要があります';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ランダムパスワード生成
  const generateRandomPassword = () => {
    const lowercase = 'abcdefghijkmnpqrstuvwxyz';
    const uppercase = 'ABCDEFGHJKMNPQRSTUVWXYZ';
    const numbers = '23456789';
    const symbols = '!@#$%^&*';
    
    let password = '';
    // 各文字種から最低1文字
    password += lowercase.charAt(Math.floor(Math.random() * lowercase.length));
    password += uppercase.charAt(Math.floor(Math.random() * uppercase.length));
    password += numbers.charAt(Math.floor(Math.random() * numbers.length));
    password += symbols.charAt(Math.floor(Math.random() * symbols.length));
    
    // 残りの文字を追加
    const allChars = lowercase + uppercase + numbers + symbols;
    for (let i = 4; i < 16; i++) {
      password += allChars.charAt(Math.floor(Math.random() * allChars.length));
    }
    
    // シャッフル
    password = password.split('').sort(() => Math.random() - 0.5).join('');
    
    updateFormData('initial_password', password);
  };

  // フォーム送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    // スーパー管理者権限付与の確認
    if (formData.grant_super_admin) {
      if (!confirm('⚠️ 重要な確認\n\nスーパー管理者権限を付与すると、このアカウントはシステムのすべての機能にアクセスできるようになります。\n\n本当にスーパー管理者権限を付与しますか？')) {
        return;
      }
    }

    setSubmitting(true);
    try {
      await onSubmit(formData);
      handleClose();
    } catch (error) {
      console.error('Administrator creation error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // モーダルを閉じる
  const handleClose = () => {
    if (!submitting) {
      setFormData({
        full_name: '',
        email: '',
        account_status: '有効',
        initial_password: '',
        send_welcome_email: true,
        grant_super_admin: false,
        notes: ''
      });
      setErrors({});
      onClose();
    }
  };

  // パスワード強度チェック
  const getPasswordStrength = (password: string) => {
    let score = 0;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[@$!%*?&]/.test(password)) score++;

    if (score <= 2) return { level: 'weak', color: 'text-red-600', text: '弱い' };
    if (score <= 3) return { level: 'medium', color: 'text-yellow-600', text: '普通' };
    if (score <= 4) return { level: 'strong', color: 'text-green-600', text: '強い' };
    return { level: 'very-strong', color: 'text-green-700', text: '非常に強い' };
  };

  const passwordStrength = getPasswordStrength(formData.initial_password);

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
                      新規運営者アカウント作成
                    </Dialog.Title>
                    
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        新しい運営者アカウントを作成します。セキュリティを考慮して強力なパスワードを設定してください。
                      </p>
                    </div>

                    {/* セキュリティ警告 */}
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-red-800">セキュリティ注意事項</h4>
                          <div className="mt-1 text-sm text-red-700">
                            <ul className="list-disc list-inside space-y-1">
                              <li>運営者アカウントはシステムの重要な機能にアクセスできます</li>
                              <li>強力なパスワードを設定し、2要素認証の有効化を推奨します</li>
                              <li>スーパー管理者権限は慎重に付与してください</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                      {/* 基本情報 */}
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
                      </div>

                      {/* パスワード */}
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
                            placeholder="12文字以上の強力なパスワード"
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
                        {formData.initial_password && (
                          <div className="mt-1 flex items-center space-x-2">
                            <span className="text-xs text-gray-500">強度:</span>
                            <span className={`text-xs font-medium ${passwordStrength.color}`}>
                              {passwordStrength.text}
                            </span>
                          </div>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                          大文字・小文字・数字・記号を含む12文字以上を推奨
                        </p>
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

                      {/* 権限設定 */}
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-purple-900 mb-3 flex items-center">
                          <ShieldCheckIcon className="h-4 w-4 mr-2" />
                          権限設定
                        </h4>
                        <div className="flex items-start">
                          <div className="flex items-center h-5">
                            <input
                              id="grant_super_admin"
                              type="checkbox"
                              checked={formData.grant_super_admin}
                              onChange={(e) => updateFormData('grant_super_admin', e.target.checked)}
                              className="focus:ring-purple-500 h-4 w-4 text-purple-600 border-gray-300 rounded"
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label htmlFor="grant_super_admin" className="font-medium text-purple-700">
                              スーパー管理者権限を付与
                            </label>
                            <p className="text-purple-600">
                              すべてのシステム機能とデータへのフルアクセス権限を付与します。
                              <span className="font-medium text-red-600">
                                （慎重に選択してください）
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* 通知設定 */}
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
                            運営者にログイン情報と初期設定の案内を自動送信します
                          </p>
                        </div>
                      </div>

                      {/* 備考 */}
                      <div>
                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                          作成理由・備考
                        </label>
                        <textarea
                          id="notes"
                          value={formData.notes}
                          onChange={(e) => updateFormData('notes', e.target.value)}
                          rows={3}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          placeholder="アカウント作成の理由や特記事項"
                        />
                      </div>
                    </form>
                  </div>
                </div>

                <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                  <button
                    type="submit"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 sm:col-start-2 disabled:opacity-50"
                  >
                    {submitting ? '作成中...' : '運営者を作成'}
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