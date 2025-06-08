import React, { useState } from 'react';
import { TodoList, TodoPermissions, WeekData } from '@/types/todoList';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';

// 新システム用インターフェース
interface NewTodoActionsProps {
  todoList: TodoList;
  permissions: TodoPermissions;
  onRefresh: () => void;
}

// 既存システム用インターフェース
interface OldTodoActionsProps {
  weekData: WeekData | null;
  permissions: TodoPermissions;
  saving: boolean;
  onSave: (asPublished: boolean) => Promise<void>;
}

type TodoActionsProps = NewTodoActionsProps | OldTodoActionsProps;

export default function TodoActions(props: TodoActionsProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  // プロパティの型判定
  const isNewInterface = (props: TodoActionsProps): props is NewTodoActionsProps => {
    return 'todoList' in props && 'onRefresh' in props;
  };

  // 既存システムの場合は既存のロジックを使用
  if (!isNewInterface(props)) {
    const { weekData, permissions, saving, onSave } = props;
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

  // 新システムの処理
  const { todoList, permissions, onRefresh } = props;

  // 公開状態の切り替え
  const handlePublishToggle = async () => {
    if (!permissions.canPublish) return;

    try {
      setIsProcessing(true);

      const newStatus = todoList.status === '公開済み' ? '下書き' : '公開済み';

      const response = await fetch(`/api/todo-lists/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          todoListId: todoList.id,
          status: newStatus
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '公開状態の更新に失敗しました');
      }

      onRefresh();

    } catch (error) {
      console.error('公開状態更新エラー:', error);
      alert(error instanceof Error ? error.message : '公開状態の更新に失敗しました');
    } finally {
      setIsProcessing(false);
    }
  };

  // やることリスト削除
  const handleDelete = async () => {
    if (!confirm('このやることリストを削除しますか？\n\n※この操作は取り消せません。')) {
      return;
    }

    try {
      setIsProcessing(true);

      const response = await fetch(`/api/todo-lists/${todoList.id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'やることリストの削除に失敗しました');
      }

      // 削除後は一覧画面に戻る
      window.location.href = '/todo-lists';

    } catch (error) {
      console.error('やることリスト削除エラー:', error);
      alert(error instanceof Error ? error.message : 'やることリストの削除に失敗しました');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusInfo = () => {
    if (todoList.status === '公開済み') {
      return {
        text: '公開中',
        color: 'text-green-700 bg-green-100',
        icon: '✓'
      };
    } else {
      return {
        text: '下書き',
        color: 'text-yellow-700 bg-yellow-100',
        icon: '📝'
      };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {/* 左側：ステータス情報 */}
          <div className="flex items-center gap-4">
            <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${statusInfo.color}`}>
              <span>{statusInfo.icon}</span>
              {statusInfo.text}
            </div>
            
            <div className="text-sm text-gray-600">
              作成日: {new Date(todoList.created_at).toLocaleDateString('ja-JP')}
            </div>

            {todoList.list_creation_date && (
              <div className="text-sm text-gray-600">
                配布日: {new Date(todoList.list_creation_date).toLocaleDateString('ja-JP')}
              </div>
            )}
          </div>

          {/* 右側：アクションボタン */}
          <div className="flex items-center gap-3">
            {/* 公開/非公開切り替え */}
            {permissions.canPublish && (
              <Button
                variant={todoList.status === '公開済み' ? 'secondary' : 'primary'}
                size="sm"
                onClick={handlePublishToggle}
                disabled={isProcessing}
              >
                {isProcessing 
                  ? '更新中...' 
                  : todoList.status === '公開済み' 
                    ? '非公開にする' 
                    : '公開する'
                }
              </Button>
            )}

            {/* リフレッシュボタン */}
            <Button
              variant="secondary"
              size="sm"
              onClick={onRefresh}
              disabled={isProcessing}
            >
              🔄 更新
            </Button>

            {/* 削除ボタン（管理者のみ） */}
            {permissions.role === 'admin' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDelete}
                disabled={isProcessing}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                削除
              </Button>
            )}
          </div>
        </div>

        {/* 権限情報表示 */}
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-6 text-xs text-gray-500">
            <span>
              👤 権限: {
                permissions.role === 'admin' ? '管理者' :
                permissions.role === 'interview_teacher' ? '面談担当講師' :
                '授業担当講師'
              }
            </span>
            
            {permissions.canEditTasks && (
              <span className="text-green-600">
                ✏️ タスク編集可能
              </span>
            )}
            
            {permissions.canAddComments && (
              <span className="text-blue-600">
                💬 コメント投稿可能
              </span>
            )}

            {todoList.status === '公開済み' && (
              <span className="text-purple-600">
                📱 生徒・保護者に表示中
              </span>
            )}
          </div>
        </div>

        {/* 注意事項 */}
        {todoList.status === '下書き' && permissions.canPublish && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <p className="text-sm text-amber-800">
              💡 このやることリストは下書き状態です。「公開する」ボタンを押すと生徒・保護者に表示されます。
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}