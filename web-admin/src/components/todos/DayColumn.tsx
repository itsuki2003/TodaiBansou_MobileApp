'use client';

import { useState } from 'react';
import { DayData, TodoPermissions, Task, TeacherComment } from '@/types/todoList';
import { AuthUser } from '@/types/auth';
import { Button } from '@/components/ui/Button';
import TaskItem from './TaskItem';
import TaskInput from './TaskInput';
import CommentSection from './CommentSection';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

// 新システム用インターフェース
interface NewDayColumnProps {
  day: DayData;
  permissions: TodoPermissions;
  todoListId: string;
  onRefresh: () => void;
}

// 既存システム用インターフェース
interface OldDayColumnProps {
  dayData: DayData;
  permissions: TodoPermissions;
  onAddTask: (targetDate: string, content: string) => Promise<void>;
  onUpdateTask: (taskId: string, updates: any) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onSaveComment: (targetDate: string, content: string) => Promise<void>;
  currentUser: AuthUser | null;
  isProcessing: boolean;
  draggedTask?: any;
}

type DayColumnProps = NewDayColumnProps | OldDayColumnProps;

export default function DayColumn(props: DayColumnProps) {
  const [showTaskInput, setShowTaskInput] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // プロパティの型判定
  const isNewInterface = (props: DayColumnProps): props is NewDayColumnProps => {
    return 'day' in props && 'todoListId' in props;
  };

  // 共通データの抽出
  const dayData = isNewInterface(props) ? props.day : props.dayData;
  const permissions = props.permissions;
  const externalIsProcessing = isNewInterface(props) ? false : props.isProcessing;

  // タスク追加
  const handleAddTask = async (content: string) => {
    if (isNewInterface(props)) {
      // 新システム: API経由
      try {
        setIsProcessing(true);

        const response = await fetch('/api/todo-lists/tasks', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            todo_list_id: props.todoListId,
            target_date: dayData.date,
            content: content.trim()
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'タスクの追加に失敗しました');
        }

        setShowTaskInput(false);
        props.onRefresh();

      } catch (error) {
        console.error('タスク追加エラー:', error);
        alert(error instanceof Error ? error.message : 'タスクの追加に失敗しました');
      } finally {
        setIsProcessing(false);
      }
    } else {
      // 既存システム: 親コンポーネントの関数を使用
      try {
        await props.onAddTask(dayData.date, content.trim());
        setShowTaskInput(false);
      } catch (error) {
        console.error('タスク追加エラー:', error);
        alert('タスクの追加に失敗しました');
      }
    }
  };

  // タスク更新
  const handleUpdateTask = async (task: Task) => {
    if (isNewInterface(props)) {
      // 新システム: API経由
      try {
        setIsProcessing(true);

        const response = await fetch('/api/todo-lists/tasks', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(task)
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'タスクの更新に失敗しました');
        }

        props.onRefresh();

      } catch (error) {
        console.error('タスク更新エラー:', error);
        alert(error instanceof Error ? error.message : 'タスクの更新に失敗しました');
      } finally {
        setIsProcessing(false);
      }
    } else {
      // 既存システム: 親コンポーネントの関数を使用
      try {
        await props.onUpdateTask(task.id, task);
      } catch (error) {
        console.error('タスク更新エラー:', error);
        alert('タスクの更新に失敗しました');
      }
    }
  };

  // タスク削除
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('このタスクを削除しますか？')) return;

    if (isNewInterface(props)) {
      // 新システム: API経由
      try {
        setIsProcessing(true);

        const response = await fetch(`/api/todo-lists/tasks?id=${taskId}`, {
          method: 'DELETE'
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'タスクの削除に失敗しました');
        }

        props.onRefresh();

      } catch (error) {
        console.error('タスク削除エラー:', error);
        alert(error instanceof Error ? error.message : 'タスクの削除に失敗しました');
      } finally {
        setIsProcessing(false);
      }
    } else {
      // 既存システム: 親コンポーネントの関数を使用
      try {
        await props.onDeleteTask(taskId);
      } catch (error) {
        console.error('タスク削除エラー:', error);
        alert('タスクの削除に失敗しました');
      }
    }
  };

  // コメント保存
  const handleSaveComment = async (content: string, commentId?: string) => {
    if (isNewInterface(props)) {
      // 新システム: API経由
      try {
        setIsProcessing(true);

        // TODO: AuthContextから実際のユーザーIDを取得
        const currentUserId = 'current-teacher-id';

        const method = commentId ? 'PUT' : 'POST';
        const body = commentId 
          ? { id: commentId, comment_content: content }
          : { 
              todo_list_id: props.todoListId,
              target_date: dayData.date,
              teacher_id: currentUserId,
              comment_content: content
            };

        const response = await fetch('/api/todo-lists/comments', {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'コメントの保存に失敗しました');
        }

        props.onRefresh();

      } catch (error) {
        console.error('コメント保存エラー:', error);
        alert(error instanceof Error ? error.message : 'コメントの保存に失敗しました');
      } finally {
        setIsProcessing(false);
      }
    } else {
      // 既存システム: 親コンポーネントの関数を使用
      try {
        await props.onSaveComment(dayData.date, content);
      } catch (error) {
        console.error('コメント保存エラー:', error);
        alert('コメントの保存に失敗しました');
      }
    }
  };

  // 日付の検証とフォーマット
  const getDayInfo = () => {
    try {
      const date = new Date(dayData.date);
      if (isNaN(date.getTime())) {
        return { name: '不明', display: '不明' };
      }
      return {
        name: format(date, 'E', { locale: ja }),
        display: format(date, 'M/d', { locale: ja })
      };
    } catch (error) {
      console.error('Date formatting error in DayColumn:', error, 'for date:', dayData.date);
      return { name: '不明', display: '不明' };
    }
  };

  const { name: dayName, display: dayDisplay } = getDayInfo();
  
  // 処理中状態の判定
  const effectiveIsProcessing = isProcessing || externalIsProcessing;

  // 新システムの場合はヘッダーを表示、既存システムの場合は省略
  if (isNewInterface(props)) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
        {/* 日付ヘッダー */}
        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
          <div className="text-center">
            <div className="text-sm font-medium text-gray-900">
              {dayDisplay}
            </div>
            <div className="text-xs text-gray-600">
              ({dayName})
            </div>
          </div>
        </div>

        <div className="p-4 min-h-[400px] flex flex-col">
          {/* タスクエリア */}
          <div className="flex-1 mb-4">
            <div className="space-y-2">
              {dayData.tasks.map((task, index) => (
                <TaskItem
                  key={task.id}
                  task={task}
                  index={index}
                  permissions={permissions}
                  onUpdate={handleUpdateTask}
                  onDelete={handleDeleteTask}
                  isProcessing={effectiveIsProcessing}
                />
              ))}

              {/* タスク追加エリア */}
              {permissions.canAddTasks && (
                <div className="pt-2">
                  {showTaskInput ? (
                    <TaskInput
                      onSubmit={handleAddTask}
                      onCancel={() => setShowTaskInput(false)}
                      isProcessing={effectiveIsProcessing}
                    />
                  ) : (
                    <button
                      onClick={() => setShowTaskInput(true)}
                      disabled={effectiveIsProcessing}
                      className="w-full py-2 px-3 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      + タスクを追加
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* コメントエリア */}
          {(permissions.canAddComments || permissions.canEditComments) && (
            <CommentSection
              targetDate={dayData.date}
              comments={dayData.comments}
              onSave={handleSaveComment}
              isProcessing={effectiveIsProcessing}
            />
          )}
        </div>
      </div>
    );
  } else {
    // 既存システム用のシンプルなレイアウト
    return (
      <div className="min-h-[400px] flex flex-col">
        {/* タスクエリア */}
        <div className="flex-1 mb-4">
          <div className="space-y-2">
            {dayData.tasks.map((task, index) => (
              <TaskItem
                key={task.id}
                task={task}
                index={index}
                permissions={permissions}
                onUpdate={handleUpdateTask}
                onDelete={handleDeleteTask}
                isProcessing={effectiveIsProcessing}
              />
            ))}

            {/* タスク追加エリア */}
            {permissions.canAddTasks && (
              <div className="pt-2">
                {showTaskInput ? (
                  <TaskInput
                    onSubmit={handleAddTask}
                    onCancel={() => setShowTaskInput(false)}
                    isProcessing={effectiveIsProcessing}
                  />
                ) : (
                  <button
                    onClick={() => setShowTaskInput(true)}
                    disabled={effectiveIsProcessing}
                    className="w-full py-2 px-3 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    + タスクを追加
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* コメントエリア */}
        {(permissions.canAddComments || permissions.canEditComments) && (
          <CommentSection
            targetDate={dayData.date}
            comments={dayData.comments}
            onSave={handleSaveComment}
            isProcessing={effectiveIsProcessing}
          />
        )}
      </div>
    );
  }
}