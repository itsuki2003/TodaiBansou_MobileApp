'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Header from '@/components/ui/Header';
import Breadcrumb from '@/components/ui/Breadcrumb';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import LoadingState from '@/components/ui/common/LoadingState';
import ErrorState from '@/components/ui/common/ErrorState';
import { supabase } from '@/lib/supabaseClient';
import { Student } from '@/types/todoList';
import { format, startOfWeek, addWeeks, subWeeks, endOfWeek } from 'date-fns';
import { ja } from 'date-fns/locale';

export default function TodoListsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [currentWeek, setCurrentWeek] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 認証チェック
  useEffect(() => {
    if (!authLoading && (!user || (user.role !== 'admin' && user.role !== 'teacher'))) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // 生徒一覧取得
  useEffect(() => {
    if (user && (user.role === 'admin' || user.role === 'teacher')) {
      fetchStudents();
    }
  }, [user]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('students')
        .select('id, full_name, furigana_name, grade, status')
        .eq('status', '在籍中')
        .order('full_name');

      // 講師の場合は担当生徒のみ取得
      if (user?.role === 'teacher') {
        const { data: assignments } = await supabase
          .from('assignments')
          .select('student_id')
          .eq('teacher_id', user.id)
          .eq('status', '有効');

        if (assignments && assignments.length > 0) {
          const studentIds = assignments.map(a => a.student_id);
          query = query.in('id', studentIds);
        } else {
          // 担当生徒がいない場合
          setStudents([]);
          setLoading(false);
          return;
        }
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      setStudents(data || []);
      
      // 最初の生徒を自動選択
      if (data && data.length > 0) {
        setSelectedStudent(data[0]);
      }

    } catch (error) {
      console.error('生徒一覧取得エラー:', error);
      setError(error instanceof Error ? error.message : '予期しないエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentChange = (student: Student) => {
    setSelectedStudent(student);
  };

  const handleWeekChange = (direction: 'prev' | 'next') => {
    setCurrentWeek(prevWeek => {
      try {
        if (!prevWeek || isNaN(prevWeek.getTime())) {
          const today = new Date();
          return startOfWeek(today, { weekStartsOn: 1 });
        }
        
        return direction === 'prev' 
          ? subWeeks(prevWeek, 1)
          : addWeeks(prevWeek, 1);
      } catch (error) {
        console.error('Week change error:', error);
        const today = new Date();
        return startOfWeek(today, { weekStartsOn: 1 });
      }
    });
  };

  const handleTodoListOpen = () => {
    if (selectedStudent) {
      try {
        if (!currentWeek || isNaN(currentWeek.getTime())) {
          console.error('Invalid currentWeek in handleTodoListOpen:', currentWeek);
          return;
        }
        
        const weekStart = format(currentWeek, 'yyyy-MM-dd');
        router.push(`/todo-lists/${selectedStudent.id}/${weekStart}`);
      } catch (error) {
        console.error('Error in handleTodoListOpen:', error);
        alert('日付の処理でエラーが発生しました。ページを再読み込みしてください。');
      }
    }
  };

  const getCurrentWeekDisplay = () => {
    try {
      if (!currentWeek || isNaN(currentWeek.getTime())) {
        return '日付エラー';
      }
      
      const weekEndDate = endOfWeek(currentWeek, { weekStartsOn: 1 }); // 月曜始まりの週の終わり（日曜日）
      
      return `${format(currentWeek, 'yyyy年M月d日', { locale: ja })}〜${format(weekEndDate, 'M月d日', { locale: ja })}の週`;
    } catch (error) {
      console.error('Date formatting error in getCurrentWeekDisplay:', error);
      return '日付エラー';
    }
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
        {/* パンくずリスト */}
        <Breadcrumb 
          items={[
            { label: '生徒管理', href: '/students' },
            { label: 'やることリスト管理' }
          ]}
        />
        
        {/* ページヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            やることリスト管理
          </h1>
          <p className="text-gray-600">
            生徒の週間学習プランを作成・編集できます
          </p>
        </div>

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
        ) : students.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-gray-500 mb-4">
                <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                担当生徒がいません
              </h3>
              <p className="text-gray-600">
                {user.role === 'teacher' 
                  ? '現在担当している生徒がいません。運営者にお問い合わせください。'
                  : '在籍中の生徒がいません。まず生徒を登録してください。'
                }
              </p>
              {user.role === 'admin' && (
                <Button 
                  className="mt-4"
                  onClick={() => router.push('/students/new')}
                >
                  新規生徒登録
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* 生徒選択 */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      生徒を選択
                    </label>
                    <select
                      value={selectedStudent?.id || ''}
                      onChange={(e) => {
                        const student = students.find(s => s.id === e.target.value);
                        if (student) handleStudentChange(student);
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">生徒を選択してください</option>
                      {students.map((student) => (
                        <option key={student.id} value={student.id}>
                          {student.full_name} ({student.grade || '学年未設定'})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 週選択 */}
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      対象週
                    </label>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleWeekChange('prev')}
                      >
                        ← 前週
                      </Button>
                      <span className="text-sm font-medium text-gray-900 px-3">
                        {getCurrentWeekDisplay()}
                      </span>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleWeekChange('next')}
                      >
                        次週 →
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* やることリスト管理パネル */}
            {selectedStudent && (
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {selectedStudent.full_name}さんのやることリスト
                      </h3>
                      <p className="text-sm text-gray-600">
                        {getCurrentWeekDisplay()}
                      </p>
                    </div>
                    <Button
                      variant="primary"
                      onClick={handleTodoListOpen}
                    >
                      編集画面を開く
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 最近のやることリスト一覧 */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  最近作成されたやることリスト
                </h3>
                <div className="text-center text-gray-500 py-8">
                  <p>最近のやることリスト一覧表示機能は実装予定です</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}