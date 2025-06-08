'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
  XMarkIcon, 
  CalendarIcon, 
  UserIcon, 
  TagIcon,
  ClockIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { NotificationWithDetails } from '@/types/notifications';

interface NotificationPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  notification: NotificationWithDetails | null;
}

export default function NotificationPreviewModal({
  isOpen,
  onClose,
  notification
}: NotificationPreviewModalProps) {
  
  if (!notification) return null;

  // ステータスアイコンの取得
  const getStatusIcon = () => {
    if (notification.is_published) {
      return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
    } else if (notification.is_scheduled) {
      return <ClockIcon className="h-5 w-5 text-purple-500" />;
    } else {
      return <DocumentTextIcon className="h-5 w-5 text-yellow-500" />;
    }
  };

  // ステータスバッジの取得
  const getStatusBadge = () => {
    if (notification.is_published) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircleIcon className="h-3 w-3 mr-1" />
          配信済み
        </span>
      );
    } else if (notification.is_scheduled) {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          <ClockIcon className="h-3 w-3 mr-1" />
          予約配信
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <DocumentTextIcon className="h-3 w-3 mr-1" />
          下書き
        </span>
      );
    }
  };

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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-3xl sm:p-6">
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

                <div>
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="flex-shrink-0">
                      {getStatusIcon()}
                    </div>
                    <div className="flex-1">
                      <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-gray-900">
                        お知らせプレビュー
                      </Dialog.Title>
                      <div className="mt-1 flex items-center space-x-2">
                        {getStatusBadge()}
                        <span className="text-sm text-gray-500">
                          ID: {notification.id.substring(0, 8)}...
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* お知らせ詳細情報 */}
                  <div className="space-y-6">
                    {/* メタ情報 */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">お知らせ情報</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <dt className="text-sm font-medium text-gray-500 flex items-center">
                            <TagIcon className="h-4 w-4 mr-1" />
                            カテゴリー
                          </dt>
                          <dd className="text-sm text-gray-900 mt-1">
                            {notification.category?.name || 'カテゴリーなし'}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500 flex items-center">
                            <UserIcon className="h-4 w-4 mr-1" />
                            作成者
                          </dt>
                          <dd className="text-sm text-gray-900 mt-1">
                            {notification.creator?.full_name || '不明'}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500 flex items-center">
                            <BellIcon className="h-4 w-4 mr-1" />
                            配信日時
                          </dt>
                          <dd className="text-sm text-gray-900 mt-1">
                            {notification.is_published ? (
                              <span className="text-green-600">
                                {new Date(notification.publish_timestamp).toLocaleString('ja-JP')}
                              </span>
                            ) : notification.is_scheduled ? (
                              <span className="text-purple-600">
                                {new Date(notification.publish_timestamp).toLocaleString('ja-JP')}
                                {notification.time_until_publish && (
                                  <span className="block text-xs">
                                    (あと{
                                      notification.time_until_publish > 60 
                                        ? `約${Math.ceil(notification.time_until_publish / 60)}時間`
                                        : `約${notification.time_until_publish}分`
                                    })
                                  </span>
                                )}
                              </span>
                            ) : (
                              <span className="text-gray-500">未設定</span>
                            )}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-500 flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-1" />
                            作成日時
                          </dt>
                          <dd className="text-sm text-gray-900 mt-1">
                            {new Date(notification.created_at).toLocaleString('ja-JP')}
                          </dd>
                        </div>
                      </div>
                    </div>

                    {/* お知らせ本文のプレビュー */}
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-4">お知らせ内容</h4>
                      
                      {/* 実際の表示イメージ */}
                      <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 bg-white">
                        <div className="max-w-2xl mx-auto">
                          {/* タイトル */}
                          <div className="text-center mb-6">
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">
                              {notification.title}
                            </h1>
                            
                            {/* カテゴリーバッジ */}
                            {notification.category && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                                {notification.category.name}
                              </span>
                            )}
                            
                            {/* 配信日 */}
                            <div className="mt-3 text-sm text-gray-500">
                              {notification.is_published ? (
                                <>配信日: {new Date(notification.publish_timestamp).toLocaleDateString('ja-JP')}</>
                              ) : notification.is_scheduled ? (
                                <>配信予定: {new Date(notification.publish_timestamp).toLocaleDateString('ja-JP')}</>
                              ) : (
                                <>下書き（未配信）</>
                              )}
                            </div>
                          </div>

                          {/* 区切り線 */}
                          <div className="border-t border-gray-200 my-6"></div>

                          {/* 本文 */}
                          <div className="prose prose-sm max-w-none">
                            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                              {notification.content}
                            </div>
                          </div>

                          {/* フッター */}
                          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                            <div className="text-xs text-gray-500">
                              東大伴走 運営チーム
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="mt-3 text-xs text-gray-500 text-center">
                        ↑ 実際の配信時の表示イメージです
                      </div>
                    </div>

                    {/* 統計情報（将来実装予定） */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-blue-900 mb-2">配信統計（参考値）</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-blue-600 font-medium">受信対象</div>
                          <div className="text-blue-800">全ユーザー</div>
                        </div>
                        <div>
                          <div className="text-blue-600 font-medium">受信者数</div>
                          <div className="text-blue-800">{notification.recipient_count || 0}人</div>
                        </div>
                        <div>
                          <div className="text-blue-600 font-medium">閲覧数</div>
                          <div className="text-blue-800">{notification.view_count || 0}回</div>
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-blue-700">
                        ※ 統計データは実装予定の機能です
                      </div>
                    </div>

                    {/* 配信設定の詳細 */}
                    {(notification.is_scheduled || notification.is_published) && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-3">配信設定詳細</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">配信状態:</span>
                            <span className="font-medium">
                              {notification.is_published ? '配信完了' : 
                               notification.is_scheduled ? '配信予約中' : 
                               '未配信'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">配信方式:</span>
                            <span className="font-medium">自動配信</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">配信対象:</span>
                            <span className="font-medium">全ユーザー（生徒・保護者・講師）</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 閉じるボタン */}
                  <div className="mt-8 flex justify-end">
                    <button
                      type="button"
                      onClick={onClose}
                      className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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