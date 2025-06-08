'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
  XMarkIcon, 
  UserIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  AcademicCapIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { TeacherWithManagementInfo } from '@/types/teacherManagement';

interface TeacherDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: TeacherWithManagementInfo | null;
  onEdit: (teacher: TeacherWithManagementInfo) => void;
  onPasswordReset: (teacherId: string) => void;
}

export default function TeacherDetailModal({
  isOpen,
  onClose,
  teacher,
  onEdit,
  onPasswordReset
}: TeacherDetailModalProps) {
  
  if (!teacher) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case '有効':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case '無効':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case '承認待ち':
        return <ClockIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <UserIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case '有効':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            有効
          </span>
        );
      case '無効':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            無効
          </span>
        );
      case '承認待ち':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
            承認待ち
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
                  >
                    <span className="sr-only">閉じる</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                <div>
                  <div className="flex items-center space-x-3 mb-6">
                    <div className="flex-shrink-0">
                      {getStatusIcon(teacher.account_status)}
                    </div>
                    <div className="flex-1">
                      <Dialog.Title as="h3" className="text-xl font-semibold leading-6 text-gray-900">
                        {teacher.full_name} 先生
                      </Dialog.Title>
                      <div className="mt-1 flex items-center space-x-2">
                        {getStatusBadge(teacher.account_status)}
                        <span className="text-sm text-gray-500">
                          作成方法: {teacher.account_creation_method === 'manual' ? '手動登録' : '申請による登録'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 基本情報 */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* 左列: 基本情報 */}
                    <div className="space-y-6">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                          <UserIcon className="h-4 w-4 mr-2 text-blue-600" />
                          基本情報
                        </h4>
                        <dl className="grid grid-cols-1 gap-x-4 gap-y-3">
                          <div>
                            <dt className="text-sm font-medium text-gray-500">講師名</dt>
                            <dd className="text-sm text-gray-900">{teacher.full_name}</dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">フリガナ</dt>
                            <dd className="text-sm text-gray-900">{teacher.furigana_name || '-'}</dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">メールアドレス</dt>
                            <dd className="text-sm text-gray-900 flex items-center">
                              <EnvelopeIcon className="h-4 w-4 mr-1 text-gray-400" />
                              {teacher.email}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">電話番号</dt>
                            <dd className="text-sm text-gray-900 flex items-center">
                              <PhoneIcon className="h-4 w-4 mr-1 text-gray-400" />
                              {teacher.phone_number || '-'}
                            </dd>
                          </div>
                        </dl>
                      </div>

                      {/* 教育背景 */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                          <AcademicCapIcon className="h-4 w-4 mr-2 text-purple-600" />
                          教育背景
                        </h4>
                        <dl className="grid grid-cols-1 gap-x-4 gap-y-3">
                          <div>
                            <dt className="text-sm font-medium text-gray-500">出身塾</dt>
                            <dd className="text-sm text-gray-900">{teacher.education_background_cram_school || '-'}</dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">出身中学</dt>
                            <dd className="text-sm text-gray-900">{teacher.education_background_junior_high || '-'}</dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">出身高校</dt>
                            <dd className="text-sm text-gray-900">{teacher.education_background_high_school || '-'}</dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">大学・学部</dt>
                            <dd className="text-sm text-gray-900">
                              {teacher.education_background_university && teacher.education_background_faculty ? 
                                `${teacher.education_background_university} ${teacher.education_background_faculty}` : 
                                '-'
                              }
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </div>

                    {/* 右列: 活動情報 */}
                    <div className="space-y-6">
                      {/* 担当生徒情報 */}
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                          <UserGroupIcon className="h-4 w-4 mr-2 text-blue-600" />
                          担当生徒・権限情報
                        </h4>
                        <dl className="grid grid-cols-1 gap-x-4 gap-y-3">
                          <div>
                            <dt className="text-sm font-medium text-gray-500">担当生徒数</dt>
                            <dd className="text-sm text-gray-900">{teacher.assigned_students_count}人</dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">やることリスト編集権限</dt>
                            <dd className="text-sm text-gray-900">{teacher.permissions.can_edit_todo_lists}件</dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">コメント権限</dt>
                            <dd className="text-sm text-gray-900">{teacher.permissions.can_comment_todo_lists}件</dd>
                          </div>
                        </dl>

                        {teacher.assigned_students_count === 0 && (
                          <div className="mt-3 p-2 bg-orange-100 border border-orange-200 rounded text-xs text-orange-700">
                            ⚠️ この講師には担当生徒が割り当てられていません
                          </div>
                        )}
                      </div>

                      {/* 登録・承認情報 */}
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
                          <CalendarDaysIcon className="h-4 w-4 mr-2 text-green-600" />
                          登録・承認情報
                        </h4>
                        <dl className="grid grid-cols-1 gap-x-4 gap-y-3">
                          <div>
                            <dt className="text-sm font-medium text-gray-500">登録申請日</dt>
                            <dd className="text-sm text-gray-900">
                              {teacher.registration_application_date ? 
                                new Date(teacher.registration_application_date).toLocaleString('ja-JP') :
                                '-'
                              }
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">アカウント承認日</dt>
                            <dd className="text-sm text-gray-900">
                              {teacher.account_approval_date ? 
                                new Date(teacher.account_approval_date).toLocaleString('ja-JP') :
                                '-'
                              }
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">作成日時</dt>
                            <dd className="text-sm text-gray-900">
                              {new Date(teacher.created_at).toLocaleString('ja-JP')}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">最終更新</dt>
                            <dd className="text-sm text-gray-900">
                              {new Date(teacher.updated_at).toLocaleString('ja-JP')}
                            </dd>
                          </div>
                        </dl>
                      </div>

                      {/* プロフィール情報 */}
                      {(teacher.appeal_points || teacher.hobbies_special_skills || teacher.referrer_info) && (
                        <div className="bg-purple-50 rounded-lg p-4">
                          <h4 className="text-sm font-medium text-gray-900 mb-3">プロフィール情報</h4>
                          <dl className="grid grid-cols-1 gap-x-4 gap-y-3">
                            {teacher.appeal_points && (
                              <div>
                                <dt className="text-sm font-medium text-gray-500">アピールポイント</dt>
                                <dd className="text-sm text-gray-900 whitespace-pre-wrap">{teacher.appeal_points}</dd>
                              </div>
                            )}
                            {teacher.hobbies_special_skills && (
                              <div>
                                <dt className="text-sm font-medium text-gray-500">趣味・特技</dt>
                                <dd className="text-sm text-gray-900 whitespace-pre-wrap">{teacher.hobbies_special_skills}</dd>
                              </div>
                            )}
                            {teacher.referrer_info && (
                              <div>
                                <dt className="text-sm font-medium text-gray-500">紹介元情報</dt>
                                <dd className="text-sm text-gray-900 whitespace-pre-wrap">{teacher.referrer_info}</dd>
                              </div>
                            )}
                          </dl>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 管理者メモ */}
                  {teacher.notes_admin_only && (
                    <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">管理者メモ</h4>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{teacher.notes_admin_only}</p>
                    </div>
                  )}

                  {/* アクションボタン */}
                  <div className="mt-8 flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3">
                    <button
                      type="button"
                      onClick={() => onPasswordReset(teacher.id)}
                      className="inline-flex justify-center rounded-md border border-orange-300 bg-white px-4 py-2 text-sm font-medium text-orange-700 shadow-sm hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
                    >
                      パスワードリセット
                    </button>
                    <button
                      type="button"
                      onClick={() => onEdit(teacher)}
                      className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      編集
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
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