'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/ui/Header';
import Breadcrumb, { breadcrumbPaths } from '@/components/ui/Breadcrumb';
import { PageLoader } from '@/components/ui/common/AppLoader';
import { ErrorDisplay } from '@/components/ui/common/ErrorDisplay';
import WeekNavigator from '@/components/todos/WeekNavigator';
import WeeklyTodoList from '@/components/todos/WeeklyTodoList';
import TodoActions from '@/components/todos/TodoActions';
import { 
  WeekData, 
  TodoList, 
  Task, 
  TeacherComment, 
  DayData,
  TodoPermissions 
} from '@/types/todoList';
import { 
  getWeekStartDate, 
  getWeekDates, 
  parseWeekFromQuery,
  getCurrentWeekStart 
} from '@/utils/dateUtils';
import { getTodoPermissions } from '@/utils/todoPermissions';

interface Student {
  id: string;
  full_name: string;
  furigana_name?: string;
}

export default function TodoListPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();

  const studentId = params.id as string;
  const weekParam = searchParams.get('week');
  const currentWeekStart = parseWeekFromQuery(weekParam) || getCurrentWeekStart();

  // State
  const [student, setStudent] = useState<Student | null>(null);
  const [weekData, setWeekData] = useState<WeekData | null>(null);
  const [permissions, setPermissions] = useState<TodoPermissions>({
    canEditTasks: false,
    canAddTasks: false,
    canDeleteTasks: false,
    canReorderTasks: false,
    canEditComments: false,
    canPublish: false,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // 権限設定
  useEffect(() => {
    setPermissions(getTodoPermissions(user));
  }, [user]);

  // 生徒情報取得
  const fetchStudent = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, full_name, furigana_name')
        .eq('id', studentId)
        .single();

      if (error) throw error;
      setStudent(data);
    } catch (err) {
      console.error('Error fetching student:', err);
      setError('生徒情報の取得に失敗しました');
    }
  }, [studentId]);

  // 週間データ取得
  const fetchWeekData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // TodoListの取得
      const { data: todoListData, error: todoListError } = await supabase
        .from('todo_lists')
        .select('*')
        .eq('student_id', studentId)
        .eq('target_week_start_date', currentWeekStart)
        .single();

      if (todoListError && todoListError.code !== 'PGRST116') {
        throw todoListError;
      }

      const todoList: TodoList | null = todoListData || null;

      // 週の7日分の日付を生成
      const weekDates = getWeekDates(currentWeekStart);
      const days: DayData[] = [];

      for (const dayInfo of weekDates) {
        // その日のタスクを取得
        let tasks: Task[] = [];
        let comments: TeacherComment[] = [];

        if (todoList) {
          // タスク取得
          const { data: tasksData, error: tasksError } = await supabase
            .from('tasks')
            .select('*')
            .eq('todo_list_id', todoList.id)
            .eq('target_date', dayInfo.date)
            .order('display_order', { ascending: true });

          if (tasksError) throw tasksError;
          tasks = tasksData || [];

          // 講師コメント取得
          const { data: commentsData, error: commentsError } = await supabase
            .from('teacher_comments')
            .select(`
              *,
              teacher:teachers(id, full_name)
            `)
            .eq('todo_list_id', todoList.id)
            .eq('target_date', dayInfo.date);

          if (commentsError) throw commentsError;
          comments = commentsData || [];
        }

        days.push({
          date: dayInfo.date,
          dayOfWeek: dayInfo.dayOfWeek,
          tasks,
          comments,
        });
      }

      setWeekData({
        todoList,
        days,
        weekStartDate: currentWeekStart,
      });
    } catch (err) {
      console.error('Error fetching week data:', err);
      setError('やることリストの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [studentId, currentWeekStart]);

  // 初期データ取得
  useEffect(() => {
    if (studentId) {
      fetchStudent();
      fetchWeekData();
    }
  }, [studentId, fetchStudent, fetchWeekData]);

  // 週変更ハンドラー
  const handleWeekChange = (newWeekStart: string) => {
    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set('week', newWeekStart);
    router.push(currentUrl.pathname + currentUrl.search);
  };

  // データ再取得
  const handleDataRefresh = () => {
    fetchWeekData();
  };

  if (loading) {
    return <PageLoader message="やることリストを読み込み中..." />;
  }

  if (error) {
    return (
      <ErrorDisplay 
        errorMessage={error}
        onRetry={() => {
          fetchStudent();
          fetchWeekData();
        }}
      />
    );
  }

  if (!student) {
    return (
      <ErrorDisplay 
        errorMessage="生徒が見つかりません"
        onRetry={() => {
          fetchStudent();
          fetchWeekData();
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* パンくずリスト */}
        <div className="mb-6">
          <Breadcrumb 
            items={[
              breadcrumbPaths.home,
              breadcrumbPaths.students,
              {
                label: student.full_name,
                href: `/students/${student.id}`,
              },
              {
                label: 'やることリスト',
                href: `/students/${student.id}/todos`,
              },
            ]}
          />
        </div>

        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            やることリスト管理
          </h1>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-lg text-gray-700 font-medium">
                {student.full_name}
                {student.furigana_name && (
                  <span className="text-sm text-gray-500 ml-2">
                    ({student.furigana_name})
                  </span>
                )}
              </p>
              <p className="text-sm text-gray-600">
                リストステータス: {weekData?.todoList?.status || '未作成'}
              </p>
            </div>
            
            {/* 週ナビゲーター */}
            <WeekNavigator
              currentWeekStart={currentWeekStart}
              onWeekChange={handleWeekChange}
            />
          </div>
        </div>

        {/* メインコンテンツ */}
        <div className="space-y-6">
          {/* 週間やることリスト */}
          <WeeklyTodoList
            weekData={weekData}
            permissions={permissions}
            onDataChange={handleDataRefresh}
            studentId={studentId}
            currentUser={user}
          />

          {/* アクションボタン */}
          <TodoActions
            weekData={weekData}
            permissions={permissions}
            saving={saving}
            onSave={async (asPublished: boolean) => {
              setSaving(true);
              try {
                // 保存処理は WeeklyTodoList コンポーネント内で管理
                // ここではローディング状態のみ管理
                await new Promise(resolve => setTimeout(resolve, 1000));
                handleDataRefresh();
              } finally {
                setSaving(false);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}