'use client';

import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { ExclamationTriangleIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { AssignmentChangeData } from '@/types/assignment';

interface AssignmentConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  changeData: AssignmentChangeData | null;
}

export default function AssignmentConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  changeData
}: AssignmentConfirmDialogProps) {
  
  if (!changeData) return null;

  const getTitle = () => {
    switch (changeData.changeType) {
      case 'add':
        return '担当割り当て追加の確認';
      case 'remove':
        return '担当割り当て削除の確認';
      case 'update':
        return '担当割り当て変更の確認';
      default:
        return '担当割り当て変更の確認';
    }
  };

  const getDescription = () => {
    const roleText = changeData.role === '面談担当（リスト編集可）' ? '面談担当講師' : '授業担当講師';
    
    switch (changeData.changeType) {
      case 'add':
        return (
          <div>
            <p>以下の内容で担当割り当てを追加します。</p>
            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <UserGroupIcon className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="font-medium text-blue-900">
                    {changeData.studentName} さんの{roleText}
                  </div>
                  <div className="text-blue-700">
                    → {changeData.newTeacherName} 先生
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'remove':
        return (
          <div>
            <p>以下の担当割り当てを削除します。</p>
            <div className="mt-3 p-3 bg-red-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <UserGroupIcon className="h-5 w-5 text-red-600" />
                <div>
                  <div className="font-medium text-red-900">
                    {changeData.studentName} さんの{roleText}
                  </div>
                  <div className="text-red-700">
                    {changeData.oldTeacherName} 先生 → 削除
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      case 'update':
        return (
          <div>
            <p>以下の内容で担当割り当てを変更します。</p>
            <div className="mt-3 p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <UserGroupIcon className="h-5 w-5 text-yellow-600" />
                <div>
                  <div className="font-medium text-yellow-900">
                    {changeData.studentName} さんの{roleText}
                  </div>
                  <div className="text-yellow-700">
                    {changeData.oldTeacherName} 先生 → {changeData.newTeacherName} 先生
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  const getWarnings = () => {
    const warnings = [];
    
    if (changeData.role === '面談担当（リスト編集可）') {
      if (changeData.changeType === 'add' || changeData.changeType === 'update') {
        warnings.push('この講師には、やることリストの編集権限が付与されます。');
      }
      if (changeData.changeType === 'remove') {
        warnings.push('やることリストの編集権限が削除されます。');
      }
    }
    
    if (changeData.role === '授業担当（コメントのみ）') {
      if (changeData.changeType === 'add' || changeData.changeType === 'update') {
        warnings.push('この講師には、やることリストのコメント権限が付与されます。');
      }
      if (changeData.changeType === 'remove') {
        warnings.push('やることリストのコメント権限が削除されます。');
      }
    }

    return warnings;
  };

  const warnings = getWarnings();

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
              <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                <div>
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
                    <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600" aria-hidden="true" />
                  </div>
                  <div className="mt-3 text-center sm:mt-5">
                    <Dialog.Title as="h3" className="text-base font-semibold leading-6 text-gray-900">
                      {getTitle()}
                    </Dialog.Title>
                    <div className="mt-2 text-left">
                      <div className="text-sm text-gray-500">
                        {getDescription()}
                      </div>
                      
                      {warnings.length > 0 && (
                        <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                          <div className="flex">
                            <ExclamationTriangleIcon className="h-5 w-5 text-amber-400 mt-0.5" />
                            <div className="ml-3">
                              <h4 className="text-sm font-medium text-amber-800">
                                権限への影響
                              </h4>
                              <ul className="mt-1 text-sm text-amber-700">
                                {warnings.map((warning, index) => (
                                  <li key={index} className="mt-1">
                                    • {warning}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="mt-4 text-xs text-gray-400">
                        ※ この変更は即座に反映され、関連する権限も自動的に更新されます。
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                  <button
                    type="button"
                    className="inline-flex w-full justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 sm:col-start-2"
                    onClick={onConfirm}
                  >
                    確認
                  </button>
                  <button
                    type="button"
                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
                    onClick={onClose}
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