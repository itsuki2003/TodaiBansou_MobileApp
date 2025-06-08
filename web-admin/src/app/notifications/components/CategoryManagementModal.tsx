'use client';

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
  XMarkIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  TagIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { NotificationCategory, CategoryFormData } from '@/types/notifications';
import { createClient } from '@/lib/supabaseClient';

interface CategoryManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: NotificationCategory[];
  onUpdate: () => Promise<void>;
}

export default function CategoryManagementModal({
  isOpen,
  onClose,
  categories,
  onUpdate
}: CategoryManagementModalProps) {
  const [formData, setFormData] = useState<CategoryFormData>({ name: '' });
  const [editingCategory, setEditingCategory] = useState<NotificationCategory | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // フォームリセット
  const resetForm = () => {
    setFormData({ name: '' });
    setEditingCategory(null);
    setError(null);
  };

  // 新規作成
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('カテゴリー名を入力してください');
      return;
    }

    // 重複チェック
    if (categories.some(cat => cat.name === formData.name.trim())) {
      setError('このカテゴリー名は既に存在します');
      return;
    }

    setSubmitting(true);
    try {
      const { error: createError } = await supabase
        .from('notification_categories')
        .insert({ name: formData.name.trim() });

      if (createError) throw createError;

      await onUpdate();
      resetForm();
    } catch (err) {
      console.error('Error creating category:', err);
      setError(err instanceof Error ? err.message : 'カテゴリーの作成に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  // 編集開始
  const startEdit = (category: NotificationCategory) => {
    setEditingCategory(category);
    setFormData({ name: category.name });
    setError(null);
  };

  // 編集保存
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingCategory || !formData.name.trim()) {
      setError('カテゴリー名を入力してください');
      return;
    }

    // 重複チェック（自分以外）
    if (categories.some(cat => cat.id !== editingCategory.id && cat.name === formData.name.trim())) {
      setError('このカテゴリー名は既に存在します');
      return;
    }

    setSubmitting(true);
    try {
      const { error: updateError } = await supabase
        .from('notification_categories')
        .update({ 
          name: formData.name.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', editingCategory.id);

      if (updateError) throw updateError;

      await onUpdate();
      resetForm();
    } catch (err) {
      console.error('Error updating category:', err);
      setError(err instanceof Error ? err.message : 'カテゴリーの更新に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  // 削除
  const handleDelete = async (categoryId: string) => {
    if (!confirm('このカテゴリーを削除してもよろしいですか？\n\n※ このカテゴリーを使用しているお知らせは「カテゴリーなし」になります。')) {
      return;
    }

    setDeletingId(categoryId);
    try {
      // まず、このカテゴリーを使用しているお知らせのカテゴリーをnullに更新
      const { error: updateNotificationsError } = await supabase
        .from('notifications')
        .update({ category_id: null })
        .eq('category_id', categoryId);

      if (updateNotificationsError) throw updateNotificationsError;

      // カテゴリーを削除
      const { error: deleteError } = await supabase
        .from('notification_categories')
        .delete()
        .eq('id', categoryId);

      if (deleteError) throw deleteError;

      await onUpdate();
    } catch (err) {
      console.error('Error deleting category:', err);
      setError(err instanceof Error ? err.message : 'カテゴリーの削除に失敗しました');
    } finally {
      setDeletingId(null);
    }
  };

  // モーダルを閉じる
  const handleClose = () => {
    if (!submitting) {
      resetForm();
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
                      カテゴリー管理
                    </Dialog.Title>
                    
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        お知らせのカテゴリーを作成・編集・削除できます。
                      </p>
                    </div>

                    {error && (
                      <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3">
                        <div className="flex">
                          <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                          <div className="ml-3">
                            <p className="text-sm text-red-700">{error}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* カテゴリー作成・編集フォーム */}
                    <form 
                      onSubmit={editingCategory ? handleUpdate : handleCreate} 
                      className="mt-6"
                    >
                      <div className="flex space-x-3">
                        <div className="flex-1">
                          <label htmlFor="category_name" className="sr-only">
                            カテゴリー名
                          </label>
                          <input
                            type="text"
                            id="category_name"
                            value={formData.name}
                            onChange={(e) => {
                              setFormData({ name: e.target.value });
                              setError(null);
                            }}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            placeholder="カテゴリー名を入力"
                            maxLength={50}
                            disabled={submitting}
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={submitting || !formData.name.trim()}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                          {submitting ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : editingCategory ? (
                            <>
                              <PencilIcon className="h-4 w-4 mr-1" />
                              更新
                            </>
                          ) : (
                            <>
                              <PlusIcon className="h-4 w-4 mr-1" />
                              追加
                            </>
                          )}
                        </button>
                      </div>
                      {editingCategory && (
                        <button
                          type="button"
                          onClick={resetForm}
                          className="mt-2 text-sm text-gray-500 hover:text-gray-700"
                        >
                          編集をキャンセル
                        </button>
                      )}
                    </form>

                    {/* カテゴリー一覧 */}
                    <div className="mt-6">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">
                        登録済みカテゴリー ({categories.length}個)
                      </h4>
                      
                      {categories.length === 0 ? (
                        <div className="text-center py-6 text-sm text-gray-500">
                          カテゴリーがまだ登録されていません
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                          {categories.map((category) => (
                            <div
                              key={category.id}
                              className={`flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 ${
                                editingCategory?.id === category.id ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                              }`}
                            >
                              <div className="flex items-center space-x-2">
                                <TagIcon className="h-4 w-4 text-gray-400" />
                                <span className="text-sm font-medium text-gray-900">
                                  {category.name}
                                </span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <button
                                  onClick={() => startEdit(category)}
                                  disabled={submitting}
                                  className="p-1 text-blue-600 hover:text-blue-900 disabled:opacity-50"
                                  title="編集"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(category.id)}
                                  disabled={submitting || deletingId === category.id}
                                  className="p-1 text-red-600 hover:text-red-900 disabled:opacity-50"
                                  title="削除"
                                >
                                  {deletingId === category.id ? (
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                  ) : (
                                    <TrashIcon className="h-4 w-4" />
                                  )}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* 使用上の注意 */}
                    <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <h5 className="text-sm font-medium text-blue-900 mb-2">使用上の注意</h5>
                      <ul className="text-sm text-blue-700 space-y-1">
                        <li>• カテゴリー名は50文字以内で入力してください</li>
                        <li>• 同じ名前のカテゴリーは作成できません</li>
                        <li>• カテゴリーを削除すると、そのカテゴリーを使用しているお知らせは「カテゴリーなし」になります</li>
                        <li>• カテゴリーは後から名前を変更できます</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="mt-5 sm:mt-6">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
                    onClick={handleClose}
                    disabled={submitting}
                  >
                    閉じる
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