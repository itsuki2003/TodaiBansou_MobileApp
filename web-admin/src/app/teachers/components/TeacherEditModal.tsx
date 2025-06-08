'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { TeacherWithManagementInfo, TeacherBasicEditFormData } from '@/types/teacherManagement';

interface TeacherEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: TeacherWithManagementInfo | null;
  onSubmit: (teacherId: string, formData: TeacherBasicEditFormData) => Promise<void>;
}

export default function TeacherEditModal({
  isOpen,
  onClose,
  teacher,
  onSubmit
}: TeacherEditModalProps) {
  const [formData, setFormData] = useState<TeacherBasicEditFormData>({
    full_name: '',
    furigana_name: '',
    account_status: '有効',
    phone_number: '',
    notes_admin_only: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // teacherが変更されたときにフォームデータを初期化
  useEffect(() => {
    if (teacher) {
      setFormData({
        full_name: teacher.full_name,
        furigana_name: teacher.furigana_name,
        account_status: teacher.account_status,
        phone_number: teacher.phone_number || '',
        notes_admin_only: teacher.notes_admin_only || ''
      });
      setErrors({});
    }
  }, [teacher]);

  // フォームデータの更新
  const updateFormData = (field: keyof TeacherBasicEditFormData, value: any) => {
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // フォーム送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!teacher || !validateForm()) return;

    setSubmitting(true);
    try {
      await onSubmit(teacher.id, formData);
      handleClose();
    } catch (error) {
      console.error('Teacher update error:', error);
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

  if (!teacher) return null;

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
                      講師情報編集
                    </Dialog.Title>
                    
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        {teacher.full_name} 先生の基本情報を編集します。
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                      {/* メールアドレス（変更不可） */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          メールアドレス（ログインID）
                        </label>
                        <div className="mt-1 px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-sm text-gray-500">
                          {teacher.email}
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          ※ メールアドレスは変更できません
                        </p>
                      </div>

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

                      {/* アカウント状態 */}
                      <div>
                        <label htmlFor="account_status" className="block text-sm font-medium text-gray-700">
                          アカウント状態
                        </label>
                        <select
                          id="account_status"
                          value={formData.account_status}
                          onChange={(e) => updateFormData('account_status', e.target.value as '承認待ち' | '有効' | '無効')}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="承認待ち">承認待ち</option>
                          <option value="有効">有効</option>
                          <option value="無効">無効</option>
                        </select>
                        
                        {/* 状態変更の影響についての説明 */}
                        <div className="mt-2 text-xs text-gray-500">
                          {formData.account_status === '有効' && (
                            <p>✅ ログイン可能、すべての機能が利用できます</p>
                          )}
                          {formData.account_status === '無効' && (
                            <p>❌ ログイン不可、すべての機能が利用できません</p>
                          )}
                          {formData.account_status === '承認待ち' && (
                            <p>⏳ 審査中、ログイン不可</p>
                          )}
                        </div>
                      </div>

                      {/* 担当生徒情報の表示 */}
                      {teacher.assigned_students_count > 0 && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <h4 className="text-sm font-medium text-blue-900">担当割り当て情報</h4>
                          <div className="mt-1 text-sm text-blue-700">
                            <p>担当生徒数: {teacher.assigned_students_count}人</p>
                            <p>やることリスト編集権限: {teacher.permissions.can_edit_todo_lists}件</p>
                            <p>コメント権限: {teacher.permissions.can_comment_todo_lists}件</p>
                          </div>
                          {formData.account_status === '無効' && (
                            <div className="mt-2 text-xs text-orange-700">
                              ⚠️ アカウントを無効にすると、担当生徒への指導に影響します
                            </div>
                          )}
                        </div>
                      )}

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

                      {/* 登録日情報 */}
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <h4 className="text-sm font-medium text-gray-700">登録情報</h4>
                        <div className="mt-1 text-sm text-gray-600">
                          <p>登録日: {teacher.registration_application_date ? 
                            new Date(teacher.registration_application_date).toLocaleDateString('ja-JP') :
                            new Date(teacher.created_at).toLocaleDateString('ja-JP')
                          }</p>
                          {teacher.account_approval_date && (
                            <p>承認日: {new Date(teacher.account_approval_date).toLocaleDateString('ja-JP')}</p>
                          )}
                          <p>作成方法: {teacher.account_creation_method === 'manual' ? '手動登録' : '申請による登録'}</p>
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
                    {submitting ? '更新中...' : '更新'}
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