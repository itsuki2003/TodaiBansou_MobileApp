import React, { useState, useCallback } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import { 
  WeekData, 
  TodoPermissions, 
  Task, 
  DraggedTask,
  CreateTaskRequest,
  UpdateTaskRequest
} from '@/types/todoList';
import { AuthUser } from '@/types/auth';
import { getWeekDates } from '@/utils/dateUtils';
import { supabase } from '@/lib/supabaseClient';
import DayColumn from './DayColumn';

interface WeeklyTodoListProps {
  weekData: WeekData | null;
  permissions: TodoPermissions;
  onDataChange: () => void;
  studentId: string;
  currentUser: AuthUser | null;
}

export default function WeeklyTodoList({
  weekData,
  permissions,
  onDataChange,
  studentId,
  currentUser,
}: WeeklyTodoListProps) {
  const [draggedTask, setDraggedTask] = useState<DraggedTask | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // TodoListが存在しない場合は作成
  const ensureTodoListExists = useCallback(async (): Promise<string> => {
    if (weekData?.todoList) {
      return weekData.todoList.id;
    }

    // 新しいTodoListを作成
    const { data, error } = await supabase
      .from('todo_lists')
      .insert({
        student_id: studentId,
        target_week_start_date: weekData?.weekStartDate || '',
        status: '下書き',
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  }, [weekData, studentId]);

  // タスク追加
  const handleAddTask = async (targetDate: string, content: string) => {
    if (!permissions.canAddTasks || isProcessing) return;

    setIsProcessing(true);
    try {
      const todoListId = await ensureTodoListExists();
      
      // 同じ日付の最大display_orderを取得
      const { data: existingTasks } = await supabase
        .from('tasks')
        .select('display_order')
        .eq('todo_list_id', todoListId)
        .eq('target_date', targetDate)
        .order('display_order', { ascending: false })
        .limit(1);

      const newOrder = (existingTasks?.[0]?.display_order || 0) + 1;

      const { error } = await supabase
        .from('tasks')
        .insert({
          todo_list_id: todoListId,
          target_date: targetDate,
          content: content.trim(),
          display_order: newOrder,
          is_completed: false,
        });

      if (error) throw error;
      onDataChange();
    } catch (error) {
      console.error('Error adding task:', error);
      alert('タスクの追加に失敗しました');
    } finally {
      setIsProcessing(false);
    }
  };

  // タスク更新
  const handleUpdateTask = async (taskId: string, updates: Partial<UpdateTaskRequest>) => {
    if (!permissions.canEditTasks || isProcessing) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId);

      if (error) throw error;
      onDataChange();
    } catch (error) {
      console.error('Error updating task:', error);
      alert('タスクの更新に失敗しました');
    } finally {
      setIsProcessing(false);
    }
  };

  // タスク削除
  const handleDeleteTask = async (taskId: string) => {
    if (!permissions.canDeleteTasks || isProcessing) return;

    if (!confirm('このタスクを削除しますか？')) return;

    setIsProcessing(true);
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      onDataChange();
    } catch (error) {
      console.error('Error deleting task:', error);
      alert('タスクの削除に失敗しました');
    } finally {
      setIsProcessing(false);
    }
  };

  // コメント保存
  const handleSaveComment = async (targetDate: string, content: string) => {
    if (!permissions.canEditComments || !currentUser || isProcessing) return;

    setIsProcessing(true);
    try {
      const todoListId = await ensureTodoListExists();

      // 既存のコメントがあるかチェック
      const { data: existingComment } = await supabase
        .from('teacher_comments')
        .select('id')
        .eq('todo_list_id', todoListId)
        .eq('target_date', targetDate)
        .eq('teacher_id', currentUser.id)
        .single();

      if (existingComment) {
        // 更新
        const { error } = await supabase
          .from('teacher_comments')
          .update({ comment_content: content })
          .eq('id', existingComment.id);

        if (error) throw error;
      } else {
        // 新規作成
        const { error } = await supabase
          .from('teacher_comments')
          .insert({
            todo_list_id: todoListId,
            target_date: targetDate,
            teacher_id: currentUser.id,
            comment_content: content,
          });

        if (error) throw error;
      }

      onDataChange();
    } catch (error) {
      console.error('Error saving comment:', error);
      alert('コメントの保存に失敗しました');
    } finally {
      setIsProcessing(false);
    }
  };

  // ドラッグ開始
  const handleDragStart = (event: DragStartEvent) => {
    if (!permissions.canReorderTasks) return;

    const { active } = event;
    const task = findTaskById(active.id as string);
    if (task) {
      setDraggedTask({
        id: task.id,
        content: task.content,
        originalDate: task.target_date,
        originalOrder: task.display_order,
      });
    }
  };

  // ドラッグ終了
  const handleDragEnd = async (event: DragEndEvent) => {
    if (!permissions.canReorderTasks || !draggedTask) {
      setDraggedTask(null);
      return;
    }

    const { active, over } = event;
    
    if (!over) {
      setDraggedTask(null);
      return;
    }

    // 移動先の解析
    const overId = over.id as string;
    const [targetDate, targetPosition] = overId.split('-');
    
    if (!targetDate || targetPosition === undefined) {
      setDraggedTask(null);
      return;
    }

    await moveTask(active.id as string, targetDate, parseInt(targetPosition));
    setDraggedTask(null);
  };

  // タスク移動処理
  const moveTask = async (taskId: string, newDate: string, newPosition: number) => {
    if (isProcessing) return;

    setIsProcessing(true);
    try {
      // 移動先の日付のタスクを取得
      const { data: targetDateTasks } = await supabase
        .from('tasks')
        .select('id, display_order')
        .eq('todo_list_id', weekData?.todoList?.id)
        .eq('target_date', newDate)
        .order('display_order', { ascending: true });

      if (!targetDateTasks) return;

      // 新しい並び順を計算
      const updates: Array<{ id: string; display_order: number; target_date?: string }> = [];

      // 移動するタスクの新しい並び順
      updates.push({
        id: taskId,
        display_order: newPosition,
        target_date: newDate,
      });

      // 他のタスクの並び順を調整
      targetDateTasks.forEach((task, index) => {
        if (task.id !== taskId) {
          const newOrder = index >= newPosition ? index + 1 : index;
          if (newOrder !== task.display_order) {
            updates.push({
              id: task.id,
              display_order: newOrder,
            });
          }
        }
      });

      // バッチ更新
      for (const update of updates) {
        const { error } = await supabase
          .from('tasks')
          .update(update)
          .eq('id', update.id);

        if (error) throw error;
      }

      onDataChange();
    } catch (error) {
      console.error('Error moving task:', error);
      alert('タスクの移動に失敗しました');
    } finally {
      setIsProcessing(false);
    }
  };

  // ユーティリティ関数
  const findTaskById = (id: string): Task | undefined => {
    if (!weekData) return undefined;
    
    for (const day of weekData.days) {
      const task = day.tasks.find(t => t.id === id);
      if (task) return task;
    }
    return undefined;
  };

  if (!weekData) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <p className="text-gray-500">やることリストを読み込み中...</p>
      </div>
    );
  }

  const weekDates = getWeekDates(weekData.weekStartDate);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* デスクトップ表示: テーブル形式 */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                {weekDates.map((dayInfo) => (
                  <th key={dayInfo.date} className="px-4 py-3 text-left">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">
                        {dayInfo.dayOfWeek}
                      </span>
                      <span className="text-xs text-gray-500">
                        {dayInfo.formattedDate}
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="align-top">
                {weekData.days.map((dayData) => (
                  <td key={dayData.date} className="px-4 py-4 border-r border-gray-200 last:border-r-0">
                    <DayColumn
                      dayData={dayData}
                      permissions={permissions}
                      onAddTask={handleAddTask}
                      onUpdateTask={handleUpdateTask}
                      onDeleteTask={handleDeleteTask}
                      onSaveComment={handleSaveComment}
                      currentUser={currentUser}
                      isProcessing={isProcessing}
                      draggedTask={draggedTask}
                    />
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* モバイル・タブレット表示: カード形式 */}
        <div className="lg:hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
            {weekData.days.map((dayData, index) => {
              const dayInfo = weekDates[index];
              return (
                <div key={dayData.date} className="border border-gray-200 rounded-lg p-4">
                  <div className="mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {dayInfo.dayOfWeek}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {dayInfo.formattedDate}
                    </p>
                  </div>
                  <DayColumn
                    dayData={dayData}
                    permissions={permissions}
                    onAddTask={handleAddTask}
                    onUpdateTask={handleUpdateTask}
                    onDeleteTask={handleDeleteTask}
                    onSaveComment={handleSaveComment}
                    currentUser={currentUser}
                    isProcessing={isProcessing}
                    draggedTask={draggedTask}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </DndContext>
  );
}