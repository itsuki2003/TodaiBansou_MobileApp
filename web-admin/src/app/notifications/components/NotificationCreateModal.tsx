'use client';

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, ClockIcon, BellIcon, CalendarIcon } from '@heroicons/react/24/outline';
import { NotificationFormData, NotificationCategory } from '@/types/notifications';

interface NotificationCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: NotificationFormData) => Promise<void>;
  categories: NotificationCategory[];
}

export default function NotificationCreateModal({
  isOpen,
  onClose,
  onSubmit,
  categories
}: NotificationCreateModalProps) {
  const [formData, setFormData] = useState<NotificationFormData>({
    title: '',
    content: '',
    category_id: '',
    publish_timestamp: '',
    status: '下書き',
    is_immediate_publish: false
  });

  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // フォームデータの更新
  const updateFormData = (field: keyof NotificationFormData, value: any) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [field]: value
      };

      // 即座配信が選択された場合の処理
      if (field === 'is_immediate_publish' && value === true) {
        newData.status = '配信済み';
        newData.publish_timestamp = new Date().toISOString();
      } else if (field === 'is_immediate_publish' && value === false) {
        newData.status = '下書き';
        newData.publish_timestamp = '';
      }

      return newData;
    });

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

    if (!formData.title.trim()) {
      newErrors.title = 'タイトルは必須です';
    }

    if (!formData.content.trim()) {
      newErrors.content = '内容は必須です';
    }

    if (!formData.is_immediate_publish && !formData.publish_timestamp) {
      newErrors.publish_timestamp = '配信日時を設定してください';
    }

    if (formData.publish_timestamp) {
      const publishTime = new Date(formData.publish_timestamp);
      const now = new Date();
      
      if (publishTime <= now && !formData.is_immediate_publish) {
        newErrors.publish_timestamp = '配信日時は現在時刻より後に設定してください';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
      console.error('Notification creation error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  // モーダルを閉じる
  const handleClose = () => {
    if (!submitting) {
      setFormData({
        title: '',
        content: '',
        category_id: '',
        publish_timestamp: '',
        status: '下書き',
        is_immediate_publish: false
      });
      setErrors({});
      onClose();
    }
  };

  // 日時フォーマット（input[type="datetime-local"]用）
  const formatDateTimeLocal = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };

  // デフォルト配信時刻を設定（翌日の朝9時）
  const setDefaultPublishTime = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    updateFormData('publish_timestamp', formatDateTimeLocal(tomorrow));
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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-2xl sm:p-6">
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
                    <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-gray-900">
                      新規お知らせ作成
                    </Dialog.Title>
                    
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        生徒・保護者・講師に配信するお知らせを作成します。
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                      {/* タイトル */}
                      <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                          タイトル <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="title"
                          value={formData.title}
                          onChange={(e) => updateFormData('title', e.target.value)}
                          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                            errors.title ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="お知らせのタイトルを入力"
                          maxLength={100}
                        />
                        {errors.title && (
                          <p className="mt-1 text-sm text-red-600">{errors.title}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                          {formData.title.length}/100文字
                        </p>
                      </div>

                      {/* カテゴリー */}
                      <div>
                        <label htmlFor="category_id" className="block text-sm font-medium text-gray-700">
                          カテゴリー
                        </label>
                        <select
                          id="category_id"
                          value={formData.category_id}
                          onChange={(e) => updateFormData('category_id', e.target.value)}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">カテゴリーなし</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* 内容 */}
                      <div>
                        <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                          内容 <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          id="content"
                          value={formData.content}
                          onChange={(e) => updateFormData('content', e.target.value)}
                          rows={8}
                          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                            errors.content ? 'border-red-300' : 'border-gray-300'
                          }`}
                          placeholder="お知らせの内容を入力してください"
                          maxLength={2000}
                        />
                        {errors.content && (
                          <p className="mt-1 text-sm text-red-600">{errors.content}</p>
                        )}
                        <p className="mt-1 text-xs text-gray-500">
                          {formData.content.length}/2000文字
                        </p>
                      </div>

                      {/* 配信設定 */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">配信設定</h4>
                        
                        {/* 即座配信 */}
                        <div className="flex items-start mb-4">
                          <div className="flex items-center h-5">
                            <input
                              id="is_immediate_publish"
                              type="checkbox"
                              checked={formData.is_immediate_publish}
                              onChange={(e) => updateFormData('is_immediate_publish', e.target.checked)}
                              className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label htmlFor="is_immediate_publish" className="font-medium text-gray-700 flex items-center">
                              <BellIcon className="h-4 w-4 mr-1 text-blue-600" />
                              今すぐ配信
                            </label>
                            <p className="text-gray-500">
                              チェックすると、作成と同時にお知らせが配信されます
                            </p>
                          </div>
                        </div>

                        {/* 配信日時設定 */}
                        {!formData.is_immediate_publish && (
                          <div>
                            <label htmlFor="publish_timestamp" className="block text-sm font-medium text-gray-700 mb-2">
                              配信日時 <span className="text-red-500">*</span>
                            </label>
                            <div className="flex space-x-2">
                              <div className="flex-1 relative">
                                <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                  type="datetime-local"
                                  id="publish_timestamp"
                                  value={formData.publish_timestamp ? formData.publish_timestamp.substring(0, 16) : ''}
                                  onChange={(e) => updateFormData('publish_timestamp', e.target.value ? new Date(e.target.value).toISOString() : '')}
                                  className={`block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                                    errors.publish_timestamp ? 'border-red-300' : 'border-gray-300'
                                  }`}
                                  min={formatDateTimeLocal(new Date())}
                                />
                              </div>
                              <button
                                type="button"
                                onClick={setDefaultPublishTime}
                                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                              >
                                明日9時
                              </button>
                            </div>
                            {errors.publish_timestamp && (
                              <p className="mt-1 text-sm text-red-600">{errors.publish_timestamp}</p>
                            )}
                            
                            {formData.publish_timestamp && !formData.is_immediate_publish && (
                              <div className="mt-2 p-2 bg-purple-50 border border-purple-200 rounded text-sm">
                                <div className="flex items-center text-purple-700">
                                  <ClockIcon className="h-4 w-4 mr-1" />
                                  <span>
                                    予約配信: {new Date(formData.publish_timestamp).toLocaleString('ja-JP')}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* プレビュー */}
                      {(formData.title || formData.content) && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-blue-900 mb-2">プレビュー</h4>
                          <div className="bg-white border rounded p-3">
                            {formData.title && (
                              <h5 className="text-lg font-semibold text-gray-900 mb-2">
                                {formData.title}
                              </h5>
                            )}
                            {formData.content && (
                              <div className="text-sm text-gray-700 whitespace-pre-wrap">
                                {formData.content}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </form>
                  </div>
                </div>

                <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                  <button
                    type="submit"
                    onClick={handleSubmit}
                    disabled={submitting}
                    className={`inline-flex w-full justify-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 sm:col-start-2 disabled:opacity-50 ${
                      formData.is_immediate_publish
                        ? 'bg-green-600 hover:bg-green-500 focus-visible:outline-green-600'
                        : 'bg-blue-600 hover:bg-blue-500 focus-visible:outline-blue-600'
                    }`}
                  >
                    {submitting ? (
                      formData.is_immediate_publish ? '配信中...' : '作成中...'
                    ) : (
                      formData.is_immediate_publish ? '今すぐ配信' : '作成'
                    )}
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