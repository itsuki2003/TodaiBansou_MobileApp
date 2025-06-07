import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  Dimensions,
  Animated,
  PanGestureHandler,
  GestureHandlerRootView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { format, startOfWeek, addWeeks, subWeeks, addDays } from 'date-fns';
import { ja } from 'date-fns/locale';

import { WeeklyTasksData, WeekNavigation, WeeklyTasksError } from '../types/weeklyTasks';
import { useAuth } from '../contexts/AuthContext';
import WeekNavigator from '../components/weekly/WeekNavigator';
import DayTaskCard from '../components/weekly/DayTaskCard';
import ProgressIndicator from '../components/weekly/ProgressIndicator';
import { supabase } from '../lib/supabaseClient';

const { width: screenWidth } = Dimensions.get('window');

export default function WeeklyTasksScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams();
  
  // 初期週の設定（URLパラメータから取得、なければ今週）
  const initialWeek = params.week as string || format(startOfWeek(new Date(), { weekStartsOn: 0 }), 'yyyy-MM-dd');
  
  const [currentWeek, setCurrentWeek] = useState(initialWeek);
  const [weeklyData, setWeeklyData] = useState<WeeklyTasksData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<WeeklyTasksError | null>(null);
  const [navigation, setNavigation] = useState<WeekNavigation | null>(null);

  // アニメーション関連
  const slideAnim = new Animated.Value(0);
  const [animationDirection, setAnimationDirection] = useState<'left' | 'right' | 'none'>('none');

  // 週間データの取得
  const fetchWeeklyData = useCallback(async (weekStartDate: string, showLoading = true) => {
    if (!user) return;

    if (showLoading) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    setError(null);

    try {
      const weekStart = new Date(weekStartDate);
      const weekEnd = addDays(weekStart, 6);

      // todo_listsの取得
      const { data: todoListData, error: todoListError } = await supabase
        .from('todo_lists')
        .select('*')
        .eq('student_id', user.id)
        .eq('target_week_start_date', weekStartDate)
        .maybeSingle();

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
      console.error('週間データ取得エラー:', err);
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
  }, [user]);

  // ナビゲーション情報の更新
  const updateNavigation = useCallback((weekStartDate: string) => {
    const currentDate = new Date(weekStartDate);
    const today = new Date();
    const thisWeekStart = startOfWeek(today, { weekStartsOn: 0 });
    
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

    setAnimationDirection(direction);
    
    // アニメーション実行
    Animated.sequence([
      Animated.timing(slideAnim, {
        toValue: direction === 'left' ? -screenWidth : direction === 'right' ? screenWidth : 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    setCurrentWeek(newWeek);
    updateNavigation(newWeek);
    fetchWeeklyData(newWeek);
  }, [currentWeek, slideAnim, updateNavigation, fetchWeeklyData]);

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
      console.error('タスク更新エラー:', err);
      Alert.alert('エラー', 'タスクの更新に失敗しました');
    }
  }, []);

  // 日別画面への遷移
  const navigateToDay = useCallback((date: string) => {
    router.push(`/(tabs)/?date=${date}`);
  }, [router]);

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
        {/* ヘッダー */}
        <View style={styles.header}>
          <Text style={styles.logo}>東大伴走</Text>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>週間やることリスト</Text>
            <Text style={styles.headerSubtitle}>{weeklyData.weekDisplay}</Text>
          </View>
          <View style={{ width: 60 }} />
        </View>

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
        <Animated.View
          style={[
            styles.contentContainer,
            {
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          <ScrollView
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={handleRefresh}
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
        </Animated.View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  logo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3B82F6',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
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