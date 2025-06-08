'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
  XMarkIcon, 
  LockClosedIcon,
  ShieldCheckIcon,
  ClockIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { AdministratorSecuritySettings } from '@/types/adminManagement';

interface SecuritySettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AdministratorSecuritySettings;
  onUpdate: (settings: AdministratorSecuritySettings) => void;
}

export default function SecuritySettingsModal({
  isOpen,
  onClose,
  settings,
  onUpdate
}: SecuritySettingsModalProps) {
  const [formData, setFormData] = useState<AdministratorSecuritySettings>(settings);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'password' | 'login' | 'audit'>('password');

  // 設定が変更されたときにフォームを更新
  useEffect(() => {
    setFormData(settings);
  }, [settings]);

  // フォームデータの更新
  const updateFormData = (section: keyof AdministratorSecuritySettings, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  // フォーム送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setSubmitting(true);
    try {
      // バリデーション
      if (formData.password_policy.min_length < 8) {
        alert('パスワードの最小文字数は8文字以上に設定してください。');
        return;
      }

      if (formData.login_security.max_failed_attempts < 3) {
        alert('最大ログイン失敗回数は3回以上に設定してください。');
        return;
      }

      if (formData.audit_settings.log_retention_days < 30) {
        alert('ログ保持期間は30日以上に設定してください。');
        return;
      }

      await onUpdate(formData);
      alert('セキュリティ設定を更新しました。');
      onClose();
    } catch (error) {
      console.error('Security settings update error:', error);
      alert('設定の更新に失敗しました。');
    } finally {
      setSubmitting(false);
    }
  };

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(settings);

  const tabConfig = [
    { id: 'password', name: 'パスワードポリシー', icon: LockClosedIcon },
    { id: 'login', name: 'ログインセキュリティ', icon: ShieldCheckIcon },
    { id: 'audit', name: '監査設定', icon: DocumentTextIcon }
  ] as const;

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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6">
                <div className="absolute right-0 top-0 pr-4 pt-4">
                  <button
                    type="button"
                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    onClick={onClose}
                    disabled={submitting}
                  >
                    <span className="sr-only">閉じる</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div className="sm:flex sm:items-start">
                  <div className="mt-3 w-full text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 flex items-center">
                      <ShieldCheckIcon className="h-5 w-5 mr-2 text-red-600" />
                      システムセキュリティ設定
                    </Dialog.Title>
                    
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        運営者アカウントのセキュリティポリシーとシステム全体の監査設定を管理します。
                      </p>
                    </div>

                    {/* セキュリティ警告 */}
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-red-800">重要</h4>
                          <div className="mt-1 text-sm text-red-700">
                            <ul className="list-disc list-inside space-y-1">
                              <li>セキュリティ設定の変更は既存のアカウントにも適用されます</li>
                              <li>厳しすぎる設定は運用に支障をきたす可能性があります</li>
                              <li>変更前に運営チームと相談することを推奨します</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* タブナビゲーション */}
                    <div className="mt-6">
                      <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8">
                          {tabConfig.map((tab) => {
                            const Icon = tab.icon;
                            return (
                              <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                                  activeTab === tab.id
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                              >
                                <Icon className={`-ml-0.5 mr-2 h-5 w-5 ${
                                  activeTab === tab.id ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                                }`} />
                                {tab.name}
                              </button>
                            );
                          })}
                        </nav>
                      </div>
                    </div>

                    {/* タブコンテンツ */}
                    <form onSubmit={handleSubmit} className="mt-6">
                      {/* パスワードポリシータブ */}
                      {activeTab === 'password' && (
                        <div className="space-y-6">
                          <div className="bg-white border border-gray-200 rounded-lg p-6">
                            <h4 className="text-lg font-medium text-gray-900 mb-4">パスワード要件</h4>
                            
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                              <div>
                                <label htmlFor="min_length" className="block text-sm font-medium text-gray-700">
                                  最小文字数
                                </label>
                                <input
                                  type="number"
                                  id="min_length"
                                  min="8"
                                  max="128"
                                  value={formData.password_policy.min_length}
                                  onChange={(e) => updateFormData('password_policy', 'min_length', parseInt(e.target.value))}
                                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                                <p className="mt-1 text-xs text-gray-500">推奨: 12文字以上</p>
                              </div>

                              <div>
                                <label htmlFor="password_expiry_days" className="block text-sm font-medium text-gray-700">
                                  パスワード有効期限（日）
                                </label>
                                <input
                                  type="number"
                                  id="password_expiry_days"
                                  min="0"
                                  max="365"
                                  value={formData.password_policy.password_expiry_days}
                                  onChange={(e) => updateFormData('password_policy', 'password_expiry_days', parseInt(e.target.value))}
                                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                                <p className="mt-1 text-xs text-gray-500">0で無期限、推奨: 90日</p>
                              </div>
                            </div>

                            <div className="mt-6 space-y-4">
                              <div className="flex items-start">
                                <div className="flex items-center h-5">
                                  <input
                                    id="require_uppercase"
                                    type="checkbox"
                                    checked={formData.password_policy.require_uppercase}
                                    onChange={(e) => updateFormData('password_policy', 'require_uppercase', e.target.checked)}
                                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                                  />
                                </div>
                                <div className="ml-3 text-sm">
                                  <label htmlFor="require_uppercase" className="font-medium text-gray-700">
                                    大文字を必須とする
                                  </label>
                                  <p className="text-gray-500">A-Zの文字を少なくとも1文字含む必要があります</p>
                                </div>
                              </div>

                              <div className="flex items-start">
                                <div className="flex items-center h-5">
                                  <input
                                    id="require_lowercase"
                                    type="checkbox"
                                    checked={formData.password_policy.require_lowercase}
                                    onChange={(e) => updateFormData('password_policy', 'require_lowercase', e.target.checked)}
                                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                                  />
                                </div>
                                <div className="ml-3 text-sm">
                                  <label htmlFor="require_lowercase" className="font-medium text-gray-700">
                                    小文字を必須とする
                                  </label>
                                  <p className="text-gray-500">a-zの文字を少なくとも1文字含む必要があります</p>
                                </div>
                              </div>

                              <div className="flex items-start">
                                <div className="flex items-center h-5">
                                  <input
                                    id="require_numbers"
                                    type="checkbox"
                                    checked={formData.password_policy.require_numbers}
                                    onChange={(e) => updateFormData('password_policy', 'require_numbers', e.target.checked)}
                                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                                  />
                                </div>
                                <div className="ml-3 text-sm">
                                  <label htmlFor="require_numbers" className="font-medium text-gray-700">
                                    数字を必須とする
                                  </label>
                                  <p className="text-gray-500">0-9の文字を少なくとも1文字含む必要があります</p>
                                </div>
                              </div>

                              <div className="flex items-start">
                                <div className="flex items-center h-5">
                                  <input
                                    id="require_symbols"
                                    type="checkbox"
                                    checked={formData.password_policy.require_symbols}
                                    onChange={(e) => updateFormData('password_policy', 'require_symbols', e.target.checked)}
                                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                                  />
                                </div>
                                <div className="ml-3 text-sm">
                                  <label htmlFor="require_symbols" className="font-medium text-gray-700">
                                    特殊文字を必須とする
                                  </label>
                                  <p className="text-gray-500">!@#$%^&*などの記号を少なくとも1文字含む必要があります</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* ログインセキュリティタブ */}
                      {activeTab === 'login' && (
                        <div className="space-y-6">
                          <div className="bg-white border border-gray-200 rounded-lg p-6">
                            <h4 className="text-lg font-medium text-gray-900 mb-4">ログイン制御</h4>
                            
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                              <div>
                                <label htmlFor="max_failed_attempts" className="block text-sm font-medium text-gray-700">
                                  最大ログイン失敗回数
                                </label>
                                <input
                                  type="number"
                                  id="max_failed_attempts"
                                  min="3"
                                  max="10"
                                  value={formData.login_security.max_failed_attempts}
                                  onChange={(e) => updateFormData('login_security', 'max_failed_attempts', parseInt(e.target.value))}
                                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                                <p className="mt-1 text-xs text-gray-500">この回数を超えるとアカウントロック</p>
                              </div>

                              <div>
                                <label htmlFor="lockout_duration_minutes" className="block text-sm font-medium text-gray-700">
                                  ロック期間（分）
                                </label>
                                <input
                                  type="number"
                                  id="lockout_duration_minutes"
                                  min="5"
                                  max="1440"
                                  value={formData.login_security.lockout_duration_minutes}
                                  onChange={(e) => updateFormData('login_security', 'lockout_duration_minutes', parseInt(e.target.value))}
                                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                                <p className="mt-1 text-xs text-gray-500">アカウントロック後の解除までの時間</p>
                              </div>

                              <div>
                                <label htmlFor="session_timeout_minutes" className="block text-sm font-medium text-gray-700">
                                  セッションタイムアウト（分）
                                </label>
                                <input
                                  type="number"
                                  id="session_timeout_minutes"
                                  min="30"
                                  max="1440"
                                  value={formData.login_security.session_timeout_minutes}
                                  onChange={(e) => updateFormData('login_security', 'session_timeout_minutes', parseInt(e.target.value))}
                                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                                <p className="mt-1 text-xs text-gray-500">非アクティブ時の自動ログアウト時間</p>
                              </div>
                            </div>

                            <div className="mt-6">
                              <div className="flex items-start">
                                <div className="flex items-center h-5">
                                  <input
                                    id="require_2fa"
                                    type="checkbox"
                                    checked={formData.login_security.require_2fa}
                                    onChange={(e) => updateFormData('login_security', 'require_2fa', e.target.checked)}
                                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                                  />
                                </div>
                                <div className="ml-3 text-sm">
                                  <label htmlFor="require_2fa" className="font-medium text-gray-700">
                                    2要素認証を必須とする
                                  </label>
                                  <p className="text-gray-500">すべての運営者に2要素認証の設定を義務付けます</p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 監査設定タブ */}
                      {activeTab === 'audit' && (
                        <div className="space-y-6">
                          <div className="bg-white border border-gray-200 rounded-lg p-6">
                            <h4 className="text-lg font-medium text-gray-900 mb-4">監査ログ設定</h4>
                            
                            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                              <div>
                                <label htmlFor="log_retention_days" className="block text-sm font-medium text-gray-700">
                                  ログ保持期間（日）
                                </label>
                                <input
                                  type="number"
                                  id="log_retention_days"
                                  min="30"
                                  max="2555"
                                  value={formData.audit_settings.log_retention_days}
                                  onChange={(e) => updateFormData('audit_settings', 'log_retention_days', parseInt(e.target.value))}
                                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                                <p className="mt-1 text-xs text-gray-500">法的要件: 最低30日、推奨: 365日</p>
                              </div>
                            </div>

                            <div className="mt-6 space-y-4">
                              <div className="flex items-start">
                                <div className="flex items-center h-5">
                                  <input
                                    id="log_all_actions"
                                    type="checkbox"
                                    checked={formData.audit_settings.log_all_actions}
                                    onChange={(e) => updateFormData('audit_settings', 'log_all_actions', e.target.checked)}
                                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                                  />
                                </div>
                                <div className="ml-3 text-sm">
                                  <label htmlFor="log_all_actions" className="font-medium text-gray-700">
                                    すべての管理操作をログに記録
                                  </label>
                                  <p className="text-gray-500">運営者の全ての操作（閲覧、作成、更新、削除）を記録します</p>
                                </div>
                              </div>

                              <div className="flex items-start">
                                <div className="flex items-center h-5">
                                  <input
                                    id="alert_on_suspicious_activity"
                                    type="checkbox"
                                    checked={formData.audit_settings.alert_on_suspicious_activity}
                                    onChange={(e) => updateFormData('audit_settings', 'alert_on_suspicious_activity', e.target.checked)}
                                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                                  />
                                </div>
                                <div className="ml-3 text-sm">
                                  <label htmlFor="alert_on_suspicious_activity" className="font-medium text-gray-700">
                                    不審な活動を検知時にアラート
                                  </label>
                                  <p className="text-gray-500">異常なログインパターンや大量操作を検知した際に通知します</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex">
                              <InformationCircleIcon className="h-5 w-5 text-blue-400" />
                              <div className="ml-3">
                                <h5 className="text-sm font-medium text-blue-800">監査ログについて</h5>
                                <div className="mt-1 text-sm text-blue-700">
                                  <ul className="list-disc list-inside space-y-1">
                                    <li>すべての監査ログは暗号化されて保存されます</li>
                                    <li>ログの改ざんは検知・防止される仕組みになっています</li>
                                    <li>定期的にログの整合性チェックが実行されます</li>
                                    <li>保持期間を過ぎたログは自動的に安全に削除されます</li>
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </form>
                  </div>
                </div>

                <div className="mt-6 flex justify-between">
                  <div className="flex items-center text-sm text-gray-500">
                    <ClockIcon className="h-4 w-4 mr-1" />
                    設定変更は即座に反映されます
                  </div>
                  <div className="flex space-x-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:w-auto"
                      onClick={onClose}
                      disabled={submitting}
                    >
                      キャンセル
                    </button>
                    <button
                      type="submit"
                      onClick={handleSubmit}
                      disabled={submitting || !hasChanges}
                      className="inline-flex justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 sm:w-auto disabled:opacity-50"
                    >
                      {submitting ? '更新中...' : hasChanges ? '設定を更新' : '変更なし'}
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