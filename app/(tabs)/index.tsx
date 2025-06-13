import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  Dimensions,
  Image,
} from 'react-native';
import { ChevronLeft, ChevronRight, Calendar, CalendarDays, UserX, BookOpen, PartyPopper } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabaseClient';
import TaskItem from '@/components/ui/TaskItem';
import TeacherCommentComponent from '@/components/ui/TeacherComment';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import type { Task, TeacherComment, TodoList } from '@/types/database.types';

// 今日の日付を 'YYYY-MM-DD' 形式で取得するヘルパー関数
const getTodayDateString = () => {
  return new Date().toISOString().split('T')[0];
};

// 指定された日付が属する週の開始日（月曜日）を取得するヘルパー関数
const getWeekStartDate = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay(); // 0 (Sunday) - 6 (Saturday)
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is Sunday
  return new Date(d.setDate(diff)).toISOString().split('T')[0];
};

export default function HomeScreen() {
  const router = useRouter();
  const { user, userRole, userRoleLoading, selectedStudent } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teacherComments, setTeacherComments] = useState<TeacherComment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [todoList, setTodoList] = useState<TodoList | null>(null);

  // 全画面お祝いアニメーション関連のstate
  const [showFullScreenCelebration, setShowFullScreenCelebration] = useState(false);
  const [celebrationMessage, setCelebrationMessage] = useState('');
  
  // アニメーション用の値
  const confettiAnim = useRef(new Animated.Value(0)).current;
  const celebrationOpacity = useRef(new Animated.Value(0)).current;
  const celebrationScale = useRef(new Animated.Value(0.5)).current;
  const backgroundAnim = useRef(new Animated.Value(0)).current;

  // 全画面お祝いアニメーションを実行する関数
  const triggerFullScreenCelebration = useCallback((message: string) => {
    setCelebrationMessage(message);
    setShowFullScreenCelebration(true);

    // 背景の色変更アニメーション
    Animated.timing(backgroundAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: false, // backgroundColor は useNativeDriver に対応していない
    }).start();

    // 紙吹雪アニメーション
    Animated.timing(confettiAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // メッセージのアニメーション
    Animated.parallel([
      Animated.timing(celebrationOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(celebrationScale, {
        toValue: 1,
        tension: 200,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // 3秒後にアニメーションを終了
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(celebrationOpacity, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(backgroundAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: false,
        }),
        Animated.timing(confettiAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowFullScreenCelebration(false);
        celebrationOpacity.setValue(0);
        celebrationScale.setValue(0.5);
        backgroundAnim.setValue(0);
        confettiAnim.setValue(0);
      });
    }, 3000);
  }, [backgroundAnim, confettiAnim, celebrationOpacity, celebrationScale]);

  const fetchTodayData = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      // AuthContextからuser情報を使用
      if (!user) {
        throw new Error('認証エラー: Auth session missing!');
      }

      // 保護者ロールでない場合は何もしない
      if (userRole !== 'parent') {
        setTasks([]);
        setTeacherComments([]);
        setTodoList(null);
        setLoading(false);
        return;
      }

      // 選択された生徒の情報を確認
      if (!selectedStudent) {
        setTasks([]);
        setTeacherComments([]);
        setTodoList(null);
        setLoading(false);
        return;
      }

      const today = new Date();
      const dateString = today.toISOString().split('T')[0];
      const weekStartDate = getWeekStartDate(today);

      // 今日の日付が含まれる週のtodo_listを取得
      const { data: todoListData, error: todoListError } = await supabase
        .from('todo_lists')
        .select('*')
        .eq('student_id', selectedStudent.id)
        .eq('target_week_start_date', weekStartDate)
        .eq('status', '公開済み')
        .single();

      if (todoListError) {
        if (todoListError.code === 'PGRST116') {
          setTasks([]);
          setTeacherComments([]);
          setTodoList(null);
          setLoading(false);
          return;
        }
        throw new Error(`やることリストの取得に失敗: ${todoListError.message}`);
      }

      setTodoList(todoListData);

      // 今日のタスクを取得
      const { data: fetchedTasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('todo_list_id', todoListData.id)
        .eq('target_date', dateString)
        .order('display_order');

      if (tasksError) throw new Error(`タスクの取得に失敗: ${tasksError.message}`);
      
      setTasks(fetchedTasks || []);

      // 今日の講師コメントを取得
      const { data: comments, error: commentError } = await supabase
        .from('teacher_comments')
        .select(`
          *,
          teachers!inner(full_name)
        `)
        .eq('todo_list_id', todoListData.id)
        .eq('target_date', dateString)
        .order('created_at', { ascending: false });

      if (commentError && commentError.code !== 'PGRST116') {
        throw new Error(`講師コメントの取得に失敗: ${commentError.message}`);
      }
      setTeacherComments(comments || []);

    } catch (err: any) {
      const errorMessage = err.message || '予期せぬエラーが発生しました';
      setError(errorMessage);
      // エラーはAlertで表示するため、console.errorは削除
      Alert.alert('データ取得エラー', errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, userRole, selectedStudent]);

  useEffect(() => {
    // ユーザーロールのローディングが完了し、かつユーザーが存在し、生徒が選択されている場合にのみデータを取得
    if (!userRoleLoading && user && selectedStudent) {
      fetchTodayData();
    }
  }, [fetchTodayData, userRoleLoading, user, selectedStudent]);

  const handleTaskToggle = async (taskId: string) => { // taskIdをstringに
    const originalTasks = [...tasks];
    const taskToToggle = tasks.find(t => t.id === taskId);
    if (!taskToToggle) return;

    const newCompletedStatus = !taskToToggle.is_completed;

    // UIを先に更新（楽観的更新）
    setTasks(prevTasks => prevTasks.map(task =>
      task.id === taskId ? { ...task, is_completed: newCompletedStatus } : task
    ));



    try {
      const { error: updateError } = await supabase
        .from('tasks')
        .update({ is_completed: newCompletedStatus })
        .eq('id', taskId);

      if (updateError) {
        // エラー発生時はUIを元に戻す
        setTasks(originalTasks);
        throw new Error(`タスクの更新に失敗: ${updateError.message}`);
      }
    } catch (err: any) {
      Alert.alert('エラー', err.message || 'タスクの更新に失敗しました');
      setTasks(originalTasks); // エラー時にもUIを元に戻す
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTodayData();
  }, [fetchTodayData]);

  // タスク完了時のメッセージ (TaskItem側で表示するかHomeScreenでOverlay表示するか)
  const getCelebrationMessage = () => {
    const messages = [
      'クリア！',
      'よくできました！',
      'すごい！',
      'がんばりました！',
      'えらいね！'
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };


  if (loading && !refreshing) { // 初回ロード時のみフルスクリーンローディング
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Image source={require('../../logo.png')} style={styles.logo} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>データを読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !tasks.length && !teacherComments.length) { // データが何もない場合のエラー表示
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Image source={require('../../logo.png')} style={styles.logo} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchTodayData}>
            <Text style={styles.retryButtonText}>再試行</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Image source={require('../../logo.png')} style={styles.logo} />
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>今日のやることリスト</Text>
          <Text style={styles.dateText}>
            {format(new Date(), 'M月d日 (E)', { locale: ja })}
          </Text>
        </View>
      </View> 
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3B82F6']} // スピナーの色
            tintColor={'#3B82F6'} // iOS用のスピナーの色
          />
        }
      >
        <View style={styles.section}>
          {tasks.length === 0 && !loading && !error ? (
            <Text style={styles.emptyText}>今日のタスクはありません</Text>
          ) : (
            tasks.map(task => (
              <TaskItem
                key={task.id}
                title={task.content}
                isCompleted={task.is_completed}
                onToggle={() => handleTaskToggle(task.id)}
                onCelebration={triggerFullScreenCelebration}
              />
            ))
          )}
        </View>

        {teacherComments.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>講師からのコメント</Text>
            {teacherComments.map(comment => (
              <TeacherCommentComponent
                key={comment.id}
                content={comment.comment_content}
                createdAt={comment.created_at}
                teacherName={(comment as any).teachers?.full_name}
              />
            ))}
          </View>
        )}

        {/* クイックアクション */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>クイックアクション</Text>
          
          {/* 週間やることリスト */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/weekly-tasks' as any)}
          >
            <View style={styles.actionCardHeader}>
              <View style={styles.actionCardIconContainer}>
                <CalendarDays size={24} color="#3B82F6" />
              </View>
              <View style={styles.actionCardContent}>
                <Text style={styles.actionCardTitle}>週間やることリスト</Text>
                <Text style={styles.actionCardDescription}>
                  今週の学習計画を確認しよう
                </Text>
              </View>
              <Text style={styles.actionCardArrow}>›</Text>
            </View>
          </TouchableOpacity>

          {/* 欠席申請 */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/absence-request')}
          >
            <View style={styles.actionCardHeader}>
              <View style={styles.actionCardIconContainer}>
                <UserX size={24} color="#EF4444" />
              </View>
              <View style={styles.actionCardContent}>
                <Text style={styles.actionCardTitle}>欠席申請</Text>
                <Text style={styles.actionCardDescription}>
                  授業を欠席する場合はこちら
                </Text>
              </View>
              <Text style={styles.actionCardArrow}>›</Text>
            </View>
          </TouchableOpacity>

          {/* 追加授業申請 */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/additional-lesson-request')}
          >
            <View style={styles.actionCardHeader}>
              <View style={styles.actionCardIconContainer}>
                <BookOpen size={24} color="#10B981" />
              </View>
              <View style={styles.actionCardContent}>
                <Text style={styles.actionCardTitle}>追加授業申請</Text>
                <Text style={styles.actionCardDescription}>
                  追加で授業を受けたい場合はこちら
                </Text>
              </View>
              <Text style={styles.actionCardArrow}>›</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 全画面お祝いアニメーション */}
      {showFullScreenCelebration && (
        <Animated.View
          style={[
            styles.fullScreenCelebration,
            {
              backgroundColor: backgroundAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['rgba(0, 0, 0, 0)', 'rgba(59, 130, 246, 0.1)'],
              }),
            },
          ]}
          pointerEvents="none"
        >
          {/* 紙吹雪エフェクト */}
          {Array.from({ length: 20 }, (_, i) => (
            <Animated.View
              key={i}
              style={[
                styles.confetti,
                {
                  left: `${(i * 5) % 100}%`,
                  transform: [
                    {
                      translateY: confettiAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [-100, Dimensions.get('window').height + 100],
                      }),
                    },
                    {
                      rotate: confettiAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      }),
                    },
                  ],
                },
              ]}
            />
          ))}

          {/* メインのお祝いメッセージ */}
          <View style={styles.celebrationCenter}>
            <Animated.View
              style={[
                styles.celebrationMessageContainer,
                {
                  opacity: celebrationOpacity,
                  transform: [{ scale: celebrationScale }],
                },
              ]}
            >
              <View style={styles.celebrationIconContainer}>
                <PartyPopper size={48} color="#F59E0B" />
              </View>
              <Text style={styles.celebrationMessageText}>{celebrationMessage}</Text>
              <Text style={styles.celebrationSubText}>タスク完了！</Text>
            </Animated.View>
          </View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // 全体の背景色
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  logo: {
    width: 40,
    height: 40,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  dateText: {
    fontSize: 14,
    color: '#64748B',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    marginTop: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20, // 少し大きめに
    fontWeight: '600', // 太さを調整
    color: '#1E293B',
    marginBottom: 16, // タイトルとリスト間のマージン
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 16,
    textAlign: 'center',
    paddingVertical: 24, // 上下にもパディング
    fontStyle: 'italic',
  },
  actionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionCardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionCardContent: {
    flex: 1,
  },
  actionCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  actionCardDescription: {
    fontSize: 14,
    color: '#64748B',
  },
  actionCardArrow: {
    fontSize: 20,
    color: '#94A3B8',
    fontWeight: '300',
  },
  // 全画面お祝いアニメーション用スタイル
  fullScreenCelebration: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  confetti: {
    position: 'absolute',
    width: 10,
    height: 10,
    backgroundColor: '#F59E0B',
    borderRadius: 5,
  },
  celebrationCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  celebrationMessageContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
    borderWidth: 3,
    borderColor: '#F59E0B',
  },
  celebrationIconContainer: {
    marginBottom: 16,
  },
  celebrationMessageText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
    textAlign: 'center',
  },
  celebrationSubText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
});