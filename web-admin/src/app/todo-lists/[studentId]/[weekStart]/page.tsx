'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Header from '@/components/ui/Header';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import LoadingState from '@/components/ui/common/LoadingState';
import ErrorState from '@/components/ui/common/ErrorState';
import WeekNavigator from '@/components/todos/WeekNavigator';
import DayColumn from '@/components/todos/DayColumn';
import TodoActions from '@/components/todos/TodoActions';
import { WeekData, TodoListResponse } from '@/types/todoList';
import { format, addWeeks, subWeeks, startOfWeek } from 'date-fns';
import { ja } from 'date-fns/locale';

interface TodoListDetailPageProps {
  params: {
    studentId: string;
    weekStart: string;
  };
}

export default function TodoListDetailPage({ params }: TodoListDetailPageProps) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { studentId, weekStart } = params;

  // weekStartパラメータの検証
  const validateWeekStart = (weekStartParam: string): string => {
    try {
      const date = new Date(weekStartParam);
      if (isNaN(date.getTime())) {
        // 無効な日付の場合は今週の月曜日を返す
        const today = new Date();
        const monday = startOfWeek(today, { weekStartsOn: 1 });
        return format(monday, 'yyyy-MM-dd');
      }
      return weekStartParam;
    } catch (error) {
      console.warn('Invalid weekStart parameter:', weekStartParam);
      const today = new Date();
      const monday = startOfWeek(today, { weekStartsOn: 1 });
      return format(monday, 'yyyy-MM-dd');
    }
  };

  const validatedWeekStart = validateWeekStart(weekStart);
  
  const [weekData, setWeekData] = useState<WeekData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // 認証チェック
  useEffect(() => {
    if (!authLoading && (!user || (user.role !== 'admin' && user.role !== 'teacher'))) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // やることリストデータ取得
  const fetchTodoListData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/todo-lists/${studentId}/${validatedWeekStart}`);
      const result: TodoListResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'やることリストの取得に失敗しました');
      }

      setWeekData(result.data || null);

    } catch (error) {
      console.error('やることリスト取得エラー:', error);
      setError(error instanceof Error ? error.message : '予期しないエラーが発生しました');
    } finally {
      setLoading(false);
    }
  }, [studentId, validatedWeekStart]);

  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'teacher')) {
      fetchTodoListData();
    }
  }, [user, fetchTodoListData]);

  // やることリスト作成
  const handleCreateTodoList = async () => {
    try {
      setSaving(true);
      setError(null);

      const response = await fetch(`/api/todo-lists/${studentId}/${validatedWeekStart}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: '下書き'
        })
      });

      const result: TodoListResponse = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'やることリストの作成に失敗しました');
      }

      // データを再取得
      await fetchTodoListData();

    } catch (error) {
      console.error('やることリスト作成エラー:', error);
      setError(error instanceof Error ? error.message : '予期しないエラーが発生しました');
    } finally {
      setSaving(false);
    }
  };

  // 週移動
  const handleWeekChange = (direction: 'prev' | 'next') => {
    const currentDate = new Date(validatedWeekStart);
    const newDate = direction === 'prev' 
      ? subWeeks(currentDate, 1)
      : addWeeks(currentDate, 1);
    
    const newWeekStart = format(newDate, 'yyyy-MM-dd');
    router.push(`/todo-lists/${studentId}/${newWeekStart}`);
  };

  const getWeekDisplay = () => {
    const date = new Date(validatedWeekStart);
    return format(date, 'yyyy年M月d日', { locale: ja }) + '〜の週';
  };

  // 認証中
  if (authLoading || !user) {
    return <LoadingState />;
  }

  // 権限なし
  if (user.role !== 'admin' && user.role !== 'teacher') {
    return <ErrorState message="この機能にアクセスする権限がありません" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />
      
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* ページヘッダー */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {weekData?.student?.full_name || '生徒'}さんのやることリスト
              </h1>
              <p className="text-gray-600">
                {getWeekDisplay()}
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => router.push('/todo-lists')}
            >
              一覧に戻る
            </Button>
          </div>
        </div>

        {/* 週ナビゲーション */}
        <WeekNavigator
          currentWeek={validatedWeekStart}
          onWeekChange={handleWeekChange}
          studentName={weekData?.student?.full_name || ''}
        />

        {/* エラー表示 */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="text-red-600 text-sm">{error}</div>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <LoadingState />
        ) : !weekData?.todoList ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-gray-500 mb-4">
                <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                この週のやることリストはまだ作成されていません
              </h3>
              <p className="text-gray-600 mb-6">
                新しいやることリストを作成して、週間学習プランを立てましょう
              </p>
              <Button
                onClick={handleCreateTodoList}
                disabled={saving}
                className="px-6 py-2"
              >
                {saving ? '作成中...' : 'やることリストを作成'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* アクションパネル */}
            <TodoActions
              todoList={weekData.todoList}
              permissions={weekData.permissions}
              onRefresh={fetchTodoListData}
            />

            {/* 週間カレンダー */}
            <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
              {weekData.days.map((day, index) => (
                <DayColumn
                  key={day.date}
                  day={day}
                  permissions={weekData.permissions}
                  todoListId={weekData.todoList!.id}
                  onRefresh={fetchTodoListData}
                />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}