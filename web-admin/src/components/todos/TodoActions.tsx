import React from 'react';
import { WeekData, TodoPermissions } from '@/types/todoList';

interface TodoActionsProps {
  weekData: WeekData | null;
  permissions: TodoPermissions;
  saving: boolean;
  onSave: (asPublished: boolean) => Promise<void>;
}

export default function TodoActions({ 
  weekData, 
  permissions, 
  saving, 
  onSave 
}: TodoActionsProps) {
  const canSaveDraft = permissions.canEditTasks || permissions.canEditComments;
  const canPublish = permissions.canPublish;
  const isPublished = weekData?.todoList?.status === '公開済み';

  if (!canSaveDraft && !canPublish) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex flex-col sm:flex-row gap-4 sm:justify-end">
        {/* 下書き保存ボタン */}
        {canSaveDraft && (
          <button
            onClick={() => onSave(false)}
            disabled={saving}
            className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 rounded-md font-medium transition-colors inline-flex items-center justify-center"
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                保存中...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                下書き保存
              </>
            )}
          </button>
        )}

        {/* 公開ボタン */}
        {canPublish && (
          <button
            onClick={() => onSave(true)}
            disabled={saving}
            className={`px-6 py-2 rounded-md font-medium transition-colors inline-flex items-center justify-center ${
              isPublished
                ? 'text-green-700 bg-green-100 hover:bg-green-200 disabled:bg-green-50'
                : 'text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300'
            }`}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                処理中...
              </>
            ) : (
              <>
                {isPublished ? (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    更新して再公開
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    公開する
                  </>
                )}
              </>
            )}
          </button>
        )}
      </div>

      {/* ステータス表示 */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">現在のステータス:</span>
          <span className={`font-medium ${
            isPublished ? 'text-green-600' : 'text-gray-600'
          }`}>
            {weekData?.todoList?.status || '未作成'}
          </span>
        </div>
        
        {isPublished && (
          <p className="text-xs text-gray-500 mt-2">
            このリストは既に生徒に公開されています。変更内容を反映するには「更新して再公開」を押してください。
          </p>
        )}
        
        {!canPublish && canSaveDraft && (
          <p className="text-xs text-amber-600 mt-2">
            ※ あなたの権限では下書き保存のみ可能です。公開には面談担当講師または管理者の操作が必要です。
          </p>
        )}
      </div>
    </div>
  );
}