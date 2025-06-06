import React, { useState } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Task, TodoPermissions } from '@/types/todoList';

interface TaskItemProps {
  task: Task;
  index: number;
  permissions: TodoPermissions;
  onUpdate: (taskId: string, updates: any) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
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

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: task.id,
    disabled: !permissions.canReorderTasks || isProcessing,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const handleSaveEdit = async () => {
    if (editContent.trim() === task.content || !editContent.trim()) {
      setIsEditing(false);
      setEditContent(task.content);
      return;
    }

    await onUpdate(task.id, { content: editContent.trim() });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditContent(task.content);
  };

  const handleToggleComplete = async () => {
    await onUpdate(task.id, { is_completed: !task.is_completed });
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
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative bg-white border rounded-lg p-3 transition-all ${
        isDragging
          ? 'shadow-lg border-blue-300 rotate-3 z-50'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
      } ${task.is_completed ? 'bg-gray-50' : ''}`}
    >
      {/* ドラッグハンドル */}
      {permissions.canReorderTasks && !isEditing && (
        <div
          {...attributes}
          {...listeners}
          className="absolute left-1 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        >
          <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 6h2v2H8V6zm0 4h2v2H8v-2zm0 4h2v2H8v-2zm6-8h2v2h-2V6zm0 4h2v2h-2v-2zm0 4h2v2h-2v-2z"/>
          </svg>
        </div>
      )}

      <div className={`flex items-start gap-3 ${permissions.canReorderTasks ? 'pl-6' : ''}`}>
        {/* 完了チェックボックス */}
        <div className="flex-shrink-0 pt-1">
          <input
            type="checkbox"
            checked={task.is_completed}
            onChange={handleToggleComplete}
            disabled={isProcessing}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50"
          />
        </div>

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
            <div
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
            </div>
          )}
        </div>

        {/* 削除ボタン */}
        {permissions.canDeleteTasks && !isEditing && (
          <button
            onClick={() => onDelete(task.id)}
            disabled={isProcessing}
            className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 transition-all disabled:opacity-50"
            title="削除"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {/* インデックス表示（デバッグ用、本番では非表示） */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute -top-2 -right-2 w-5 h-5 bg-gray-200 text-xs text-gray-600 rounded-full flex items-center justify-center">
          {index + 1}
        </div>
      )}
    </div>
  );
}