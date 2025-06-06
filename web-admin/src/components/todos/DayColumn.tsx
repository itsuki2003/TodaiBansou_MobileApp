import React, { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { 
  DayData, 
  TodoPermissions, 
  DraggedTask 
} from '@/types/todoList';
import { AuthUser } from '@/types/auth';
import TaskItem from './TaskItem';
import TaskInput from './TaskInput';
import CommentSection from './CommentSection';

interface DayColumnProps {
  dayData: DayData;
  permissions: TodoPermissions;
  onAddTask: (targetDate: string, content: string) => Promise<void>;
  onUpdateTask: (taskId: string, updates: any) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
  onSaveComment: (targetDate: string, content: string) => Promise<void>;
  currentUser: AuthUser | null;
  isProcessing: boolean;
  draggedTask: DraggedTask | null;
}

export default function DayColumn({
  dayData,
  permissions,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onSaveComment,
  currentUser,
  isProcessing,
  draggedTask,
}: DayColumnProps) {
  const [showTaskInput, setShowTaskInput] = useState(false);

  const { setNodeRef, isOver } = useDroppable({
    id: `${dayData.date}-${dayData.tasks.length}`,
  });

  const handleAddTask = async (content: string) => {
    await onAddTask(dayData.date, content);
    setShowTaskInput(false);
  };

  // 現在のユーザーのコメントを取得
  const currentUserComment = currentUser 
    ? dayData.comments.find(c => c.teacher_id === currentUser.id)
    : null;

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
              onUpdate={onUpdateTask}
              onDelete={onDeleteTask}
              isProcessing={isProcessing}
            />
          ))}

          {/* ドロップエリア */}
          {permissions.canReorderTasks && (
            <div
              ref={setNodeRef}
              className={`min-h-[2rem] border-2 border-dashed rounded-md transition-colors ${
                isOver
                  ? 'border-blue-400 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {isOver && draggedTask && (
                <div className="p-2 text-sm text-blue-600 text-center">
                  「{draggedTask.content}」をここに移動
                </div>
              )}
            </div>
          )}

          {/* タスク追加エリア */}
          {permissions.canAddTasks && (
            <div className="pt-2">
              {showTaskInput ? (
                <TaskInput
                  onSubmit={handleAddTask}
                  onCancel={() => setShowTaskInput(false)}
                  isProcessing={isProcessing}
                />
              ) : (
                <button
                  onClick={() => setShowTaskInput(true)}
                  disabled={isProcessing}
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
      {permissions.canEditComments && (
        <CommentSection
          targetDate={dayData.date}
          comments={dayData.comments}
          currentUserComment={currentUserComment}
          onSave={onSaveComment}
          isProcessing={isProcessing}
        />
      )}
    </div>
  );
}