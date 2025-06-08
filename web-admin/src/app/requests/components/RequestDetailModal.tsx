'use client';

import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
  XMarkIcon,
  ClockIcon,
  UserIcon,
  CalendarIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { UnifiedRequest } from '@/types/requests';

interface RequestDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: UnifiedRequest | null;
  onProcessRequest: (requestId: string, action: string, notes?: string) => Promise<void>;
}

export default function RequestDetailModal({
  isOpen,
  onClose,
  request,
  onProcessRequest
}: RequestDetailModalProps) {
  const [processing, setProcessing] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');

  if (!request) return null;

  const handleProcess = async (action: string) => {
    setProcessing(true);
    try {
      await onProcessRequest(request.id, action, adminNotes);
      onClose();
    } finally {
      setProcessing(false);
    }
  };

  const isUrgent = () => {
    const targetDate = new Date(request.target_date);
    const now = new Date();
    const diffHours = (targetDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    return diffHours <= 24 && diffHours > 0;
  };

  const canProcess = () => {
    return (
      (request.type === 'absence' && request.status === '未振替') ||
      (request.type === 'additional' && request.status === '申請中')
    );
  };

  const getStatusColor = () => {
    if (request.type === 'absence') {
      return request.status === '未振替' ? 'text-yellow-600' : 'text-green-600';
    } else {
      return request.status === '申請中' ? 'text-blue-600' : 'text-green-600';
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
                    {/* ヘッダー */}
                    <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900">
                      <div className="flex items-center space-x-3">
                        <span>
                          {request.type === 'absence' ? '欠席申請' : '追加授業申請'}詳細
                        </span>
                        {isUrgent() && (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                            緊急
                          </span>
                        )}
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor()} bg-gray-100`}>
                          {request.status}
                        </span>
                      </div>
                    </Dialog.Title>

                    {/* 基本情報 */}
                    <div className="mt-6 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* 生徒情報 */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                            <UserIcon className="h-4 w-4 mr-2" />
                            生徒情報
                          </h4>
                          <div className="space-y-2">
                            <div>
                              <span className="text-sm font-medium text-gray-700">氏名:</span>
                              <span className="ml-2 text-sm text-gray-900">{request.student_name}</span>
                            </div>
                            {request.student_grade && (
                              <div>
                                <span className="text-sm font-medium text-gray-700">学年:</span>
                                <span className="ml-2 text-sm text-gray-900">{request.student_grade}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 日時情報 */}
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                            <CalendarIcon className="h-4 w-4 mr-2" />
                            日時情報
                          </h4>
                          <div className="space-y-2">
                            <div>
                              <span className="text-sm font-medium text-gray-700">対象日:</span>
                              <span className="ml-2 text-sm text-gray-900">
                                {new Date(request.target_date).toLocaleDateString('ja-JP')}
                              </span>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-700">時間:</span>
                              <span className="ml-2 text-sm text-gray-900">{request.target_time}</span>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-700">申請日時:</span>
                              <span className="ml-2 text-sm text-gray-900">
                                {new Date(request.request_date).toLocaleString('ja-JP')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 講師情報 */}
                      {request.teacher_name && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-3">担当講師</h4>
                          <div className="text-sm text-gray-900">{request.teacher_name}</div>
                        </div>
                      )}

                      {/* 申請内容 */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                          <DocumentTextIcon className="h-4 w-4 mr-2" />
                          申請内容
                        </h4>
                        <div className="space-y-2">
                          {request.type === 'absence' && request.reason && (
                            <div>
                              <span className="text-sm font-medium text-gray-700">欠席理由:</span>
                              <div className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                                {request.reason}
                              </div>
                            </div>
                          )}
                          {request.type === 'additional' && request.notes && (
                            <div>
                              <span className="text-sm font-medium text-gray-700">備考:</span>
                              <div className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">
                                {request.notes}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 管理者ノート */}
                      {request.admin_notes && (
                        <div className="bg-blue-50 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-blue-900 mb-3">管理者ノート</h4>
                          <div className="text-sm text-blue-800 whitespace-pre-wrap">
                            {request.admin_notes}
                          </div>
                        </div>
                      )}

                      {/* 緊急警告 */}
                      {isUrgent() && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                          <div className="flex">
                            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                            <div className="ml-3">
                              <h4 className="text-sm font-medium text-red-800">緊急対応が必要</h4>
                              <p className="mt-1 text-sm text-red-700">
                                対象の授業まで24時間を切っています。早急な対応をお願いします。
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* 処理操作 */}
                      {canProcess() && (
                        <div className="bg-gray-50 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-3">処理操作</h4>
                          
                          <div className="mb-4">
                            <label htmlFor="adminNotes" className="block text-sm font-medium text-gray-700 mb-1">
                              管理者ノート（任意）
                            </label>
                            <textarea
                              id="adminNotes"
                              value={adminNotes}
                              onChange={(e) => setAdminNotes(e.target.value)}
                              rows={3}
                              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              placeholder="処理に関するメモを記入してください"
                            />
                          </div>

                          <div className="flex space-x-3">
                            <button
                              onClick={() => handleProcess('approve')}
                              disabled={processing}
                              className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                            >
                              {processing ? '処理中...' : 
                               request.type === 'absence' ? '対応済みにする' : '承認する'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
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