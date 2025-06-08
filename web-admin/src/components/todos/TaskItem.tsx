import React, { useState } from 'react';
import { Task, TodoPermissions } from '@/types/todoList';

interface TaskItemProps {
  task: Task;
  index: number;
  permissions: TodoPermissions;
  onUpdate: (task: Task) => void;
  onDelete: (taskId: string) => void;
  isProcessing: boolean;
}

export default function TaskItem({
  task,
  index,
  permissions,
  onUpdate,
  onDelete,
  isProcessing,
}: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(task.content);

  const handleSaveEdit = () => {
    if (editContent.trim() === task.content || !editContent.trim()) {
      setIsEditing(false);
      setEditContent(task.content);
      return;
    }

    onUpdate({
      ...task,
      content: editContent.trim()
    });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(task.content);
  };

  const handleToggleComplete = () => {
    onUpdate({
      ...task,
      is_completed: !task.is_completed
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  return (
    <div className={`
      group relative bg-white border rounded-lg p-3 transition-all
      ${task.is_completed 
        ? 'bg-green-50 border-green-200' 
        : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
      }
      ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
    `}>
      <div className="flex items-start gap-3">
        {/* 完了チェックボックス */}
        <button
          onClick={handleToggleComplete}
          disabled={!permissions.canEditTasks || isProcessing}
          className={`
            flex-shrink-0 w-5 h-5 rounded border-2 transition-colors mt-0.5
            ${task.is_completed
              ? 'bg-green-500 border-green-500 text-white'
              : 'border-gray-300 hover:border-gray-400'
            }
            ${!permissions.canEditTasks ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
          `}
        >
          {task.is_completed && (
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        {/* タスク内容 */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={handleKeyDown}
                className="w-full p-2 text-sm border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
                placeholder="タスク内容を入力..."
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveEdit}
                  disabled={isProcessing || !editContent.trim()}
                  className="px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 rounded-md transition-colors"
                >
                  保存
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={isProcessing}
                  className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 rounded-md transition-colors"
                >
                  キャンセル
                </button>
              </div>
            </div>
          ) : (
            <div className="group">
              <p
                onClick={() => permissions.canEditTasks && !isProcessing && setIsEditing(true)}
                className={`text-sm leading-relaxed ${
                  task.is_completed ? 'line-through text-gray-500' : 'text-gray-900'
                } ${
                  permissions.canEditTasks && !isProcessing
                    ? 'cursor-pointer hover:bg-gray-50 p-1 -m-1 rounded'
                    : ''
                }`}
              >
                {task.content}
              </p>
              
              {/* 編集・削除ボタン */}
              {permissions.canEditTasks && (
                <div className="flex gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => setIsEditing(true)}
                    disabled={isProcessing}
                    className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
                  >
                    編集
                  </button>
                  {permissions.canDeleteTasks && (
                    <>
                      <span className="text-xs text-gray-300">|</span>
                      <button
                        onClick={() => onDelete(task.id)}
                        disabled={isProcessing}
                        className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
                      >
                        削除
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* タスク番号 */}
        <div className="flex-shrink-0 text-xs text-gray-400 font-mono">
          #{index + 1}
        </div>
      </div>

      {/* 備考 */}
      {task.notes && (
        <div className="mt-2 pl-8">
          <p className="text-xs text-gray-500 italic">
            💡 {task.notes}
          </p>
        </div>
      )}
    </div>
  );
}