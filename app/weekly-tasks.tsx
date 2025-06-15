import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { PanGestureHandler, GestureHandlerRootView } from 'react-native-gesture-handler';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { format, startOfWeek, addWeeks, subWeeks, addDays } from 'date-fns';
import { ja } from 'date-fns/locale';

import { WeeklyTasksData, WeekNavigation, WeeklyTasksError } from '../types/weeklyTasks';
import { useAuth } from '../contexts/AuthContext';
import WeekNavigator from '../components/weekly/WeekNavigator';
import DayTaskCard from '../components/weekly/DayTaskCard';
import ProgressIndicator from '../components/weekly/ProgressIndicator';
import AppHeader from '../components/ui/AppHeader';
import { supabase } from '../lib/supabaseClient';

const { width: screenWidth } = Dimensions.get('window');

export default function WeeklyTasksScreen() {
  const router = useRouter();
  const { user, selectedStudent } = useAuth();
  const params = useLocalSearchParams();
  
  // 初期週の設定（URLパラメータから取得、なければ今週）
  // ホーム画面と同じ週開始日計算を使用（月曜日始まり）
  const getWeekStartDate = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay(); // 0 (Sunday) - 6 (Saturday)
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
    return new Date(d.setDate(diff)).toISOString().split('T')[0];
  };
  
  const initialWeek = params.week as string || getWeekStartDate(new Date());
  
  const [currentWeek, setCurrentWeek] = useState(initialWeek);
  const [weeklyData, setWeeklyData] = useState<WeeklyTasksData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<WeeklyTasksError | null>(null);
  const [navigation, setNavigation] = useState<WeekNavigation | null>(null);


  // 週間データの取得
  const fetchWeeklyData = useCallback(async (weekStartDate: string, showLoading = true) => {
    if (!user || !selectedStudent) return;

    if (showLoading) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setError(null);

    try {
      console.log('DEBUG Weekly: Fetching data for:', {
        student_id: selectedStudent.id,
        weekStartDate,
        user: user?.id
      });

      const weekStart = new Date(weekStartDate);
      const weekEnd = addDays(weekStart, 6);

      // todo_listsの取得
      const { data: todoListData, error: todoListError } = await supabase
        .from('todo_lists')
        .select('*')
        .eq('student_id', selectedStudent.id)
        .eq('target_week_start_date', weekStartDate)
        .maybeSingle();

      console.log('DEBUG Weekly: Todo list result:', { todoListData, todoListError });

      if (todoListError && todoListError.code !== 'PGRST116') {
        throw todoListError;
      }

      if (!todoListData) {
        // やることリストが存在しない場合
        setWeeklyData({
          weekStartDate,
          weekEndDate: format(weekEnd, 'yyyy-MM-dd'),
          weekDisplay: `${format(weekStart, 'yyyy年M月', { locale: ja })}第${Math.ceil(weekStart.getDate() / 7)}週`,
          days: Array.from({ length: 7 }, (_, i) => {
            const date = addDays(weekStart, i);
            return {
              date: format(date, 'yyyy-MM-dd'),
              dayOfWeek: format(date, 'E', { locale: ja }),
              dateDisplay: format(date, 'M/d'),
              tasks: [],
              comments: [],
              completionRate: 0,
              hasComments: false,
            };
          }),
          totalTasks: 0,
          completedTasks: 0,
          overallCompletionRate: 0,
          hasTeacherComments: false,
        });
        return;
      }

      // tasksとteacher_commentsの並行取得
      const [tasksResult, commentsResult] = await Promise.all([
        supabase
          .from('tasks')
          .select('*')
          .eq('todo_list_id', todoListData.id)
          .gte('target_date', weekStartDate)
          .lte('target_date', format(weekEnd, 'yyyy-MM-dd'))
          .order('target_date')
          .order('display_order'),
        
        supabase
          .from('teacher_comments')
          .select(`
            *,
            teachers (full_name)
          `)
          .eq('todo_list_id', todoListData.id)
          .gte('target_date', weekStartDate)
          .lte('target_date', format(weekEnd, 'yyyy-MM-dd'))
          .order('target_date')
          .order('created_at')
      ]);

      if (tasksResult.error) throw tasksResult.error;
      if (commentsResult.error) throw commentsResult.error;

      const tasks = tasksResult.data || [];
      const comments = (commentsResult.data || []).map(comment => ({
        ...comment,
        teacher_name: comment.teachers?.full_name
      }));

      console.log('DEBUG Weekly: Tasks and comments:', {
        tasks: tasks.length,
        comments: comments.length,
        taskList: tasks.slice(0, 3),
        commentList: comments.slice(0, 3)
      });

      // 日付ごとにデータを整理
      const daysData = Array.from({ length: 7 }, (_, i) => {
        const date = addDays(weekStart, i);
        const dateStr = format(date, 'yyyy-MM-dd');
        const dayTasks = tasks.filter(task => task.target_date === dateStr);
        const dayComments = comments.filter(comment => comment.target_date === dateStr);
        
        const completedTasks = dayTasks.filter(task => task.is_completed).length;
        const completionRate = dayTasks.length > 0 ? Math.round((completedTasks / dayTasks.length) * 100) : 0;

        return {
          date: dateStr,
          dayOfWeek: format(date, 'E', { locale: ja }),
          dateDisplay: format(date, 'M/d'),
          tasks: dayTasks,
          comments: dayComments,
          completionRate,
          hasComments: dayComments.length > 0,
        };
      });

      const totalTasks = tasks.length;
      const completedTasks = tasks.filter(task => task.is_completed).length;
      const overallCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

      setWeeklyData({
        weekStartDate,
        weekEndDate: format(weekEnd, 'yyyy-MM-dd'),
        weekDisplay: `${format(weekStart, 'yyyy年M月', { locale: ja })}第${Math.ceil(weekStart.getDate() / 7)}週`,
        todoList: todoListData,
        days: daysData,
        totalTasks,
        completedTasks,
        overallCompletionRate,
        hasTeacherComments: comments.length > 0,
      });

    } catch (err) {
      // エラーハンドリング: 週間データ取得エラー
      setError({
        type: 'data',
        message: 'やることリストの取得に失敗しました',
        details: err instanceof Error ? err.message : '不明なエラー',
        recoverable: true,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, selectedStudent]);

  // ナビゲーション情報の更新
  const updateNavigation = useCallback((weekStartDate: string) => {
    const currentDate = new Date(weekStartDate);
    const today = new Date();
    const thisWeekStart = new Date(getWeekStartDate(today));
    
    const previousWeek = format(subWeeks(currentDate, 1), 'yyyy-MM-dd');
    const nextWeek = format(addWeeks(currentDate, 1), 'yyyy-MM-dd');
    
    // 未来の週には行けない制限
    const canGoNext = addWeeks(currentDate, 1) <= addWeeks(thisWeekStart, 2); // 最大2週間先まで

    setNavigation({
      currentWeek: weekStartDate,
      previousWeek,
      nextWeek,
      canGoNext,
    });
  }, []);

  // 週の変更
  const changeWeek = useCallback((newWeek: string, direction: 'left' | 'right' = 'none') => {
    if (newWeek === currentWeek) return;

    setCurrentWeek(newWeek);
    updateNavigation(newWeek);
    fetchWeeklyData(newWeek);
  }, [currentWeek, updateNavigation, fetchWeeklyData]);

  // タスクの完了状態切り替え
  const toggleTaskCompletion = useCallback(async (taskId: string, isCompleted: boolean) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({
          is_completed: isCompleted,
          updated_at: new Date().toISOString(),
        })
        .eq('id', taskId);

      if (error) throw error;

      // ローカル状態を即座に更新
      setWeeklyData(prev => {
        if (!prev) return prev;

        const updatedDays = prev.days.map(day => ({
          ...day,
          tasks: day.tasks.map(task => 
            task.id === taskId ? { ...task, is_completed: isCompleted } : task
          ),
        }));

        // 完了率の再計算
        const allTasks = updatedDays.flatMap(day => day.tasks);
        const completedTasks = allTasks.filter(task => task.is_completed).length;
        const overallCompletionRate = allTasks.length > 0 ? Math.round((completedTasks / allTasks.length) * 100) : 0;

        return {
          ...prev,
          days: updatedDays.map(day => {
            const dayCompletedTasks = day.tasks.filter(task => task.is_completed).length;
            const dayCompletionRate = day.tasks.length > 0 ? Math.round((dayCompletedTasks / day.tasks.length) * 100) : 0;
            return {
              ...day,
              completionRate: dayCompletionRate,
            };
          }),
          completedTasks,
          overallCompletionRate,
        };
      });

    } catch (err) {
      // エラーはAlertで表示するため、console.errorは削除
      Alert.alert('エラー', 'タスクの更新に失敗しました');
    }
  }, []);

  // 日別画面への遷移（タップ時は何もしない、または詳細画面を作成する場合はここを変更）
  const navigateToDay = useCallback((date: string) => {
    // 現在は何もしない（タップ無効化）
    // 将来的に日別詳細画面を作成する場合はここを変更
    console.log('Tapped on date:', date);
  }, []);

  // リフレッシュ
  const handleRefresh = useCallback(() => {
    fetchWeeklyData(currentWeek, false);
  }, [currentWeek, fetchWeeklyData]);

  // 初期データ取得
  useEffect(() => {
    updateNavigation(currentWeek);
    fetchWeeklyData(currentWeek);
  }, [currentWeek, updateNavigation, fetchWeeklyData]);

  // エラー表示
  if (error && !weeklyData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>エラーが発生しました</Text>
          <Text style={styles.errorMessage}>{error.message}</Text>
          {error.recoverable && (
            <Text style={styles.retryButton} onPress={() => fetchWeeklyData(currentWeek)}>
              再試行
            </Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  // ローディング表示
  if (loading && !weeklyData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>やることリストを読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!weeklyData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>データが見つかりません</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaView style={styles.container}>
        <AppHeader 
          title="週間やることリスト" 
          subtitle={weeklyData.weekDisplay}
          showBackButton={true}
          onBackPress={() => router.back()}
        />

        {/* 週ナビゲーター */}
        {navigation && (
          <WeekNavigator
            navigation={navigation}
            onWeekChange={changeWeek}
            currentWeek={currentWeek}
          />
        )}

        {/* 全体進捗 */}
        <ProgressIndicator
          current={weeklyData.completedTasks}
          total={weeklyData.totalTasks}
          percentage={weeklyData.overallCompletionRate}
          hasComments={weeklyData.hasTeacherComments}
        />

        {/* 日別カード一覧 */}
        <View style={styles.contentContainer}>
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor="#3B82F6"
                colors={["#3B82F6"]}
              />
            }
          >
            <View style={styles.daysContainer}>
              {weeklyData.days.map((day, index) => (
                <DayTaskCard
                  key={day.date}
                  day={day}
                  onTaskToggle={toggleTaskCompletion}
                  onPress={() => navigateToDay(day.date)}
                  index={index}
                />
              ))}
            </View>

            {/* 空の状態 */}
            {weeklyData.totalTasks === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateTitle}>やることがありません</Text>
                <Text style={styles.emptyStateMessage}>
                  {weeklyData.todoList?.status === '下書き' 
                    ? '講師がやることリストを作成中です'
                    : 'この週のやることリストはまだ作成されていません'
                  }
                </Text>
              </View>
            )}

            {/* 底部余白 */}
            <View style={styles.bottomSpacing} />
          </ScrollView>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  contentContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  daysContainer: {
    padding: 16,
    gap: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
    textAlign: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomSpacing: {
    height: 20,
  },
});

export default WeeklyTasksScreen;