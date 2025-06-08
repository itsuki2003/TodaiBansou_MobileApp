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
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabaseClient';
import TaskItem from '@/components/ui/TaskItem';
import TeacherCommentComponent from '@/components/ui/TeacherComment';
import DateHeader from '@/components/ui/DateHeader';
import { useAuth } from '@/contexts/AuthContext';

// Supabaseのテーブルカラム名に合わせた型定義に変更
type Task = {
  id: string; // UUIDなのでstring
  content: string;
  is_completed: boolean;
  todo_list_id: string; // UUIDなのでstring
  // display_order: number; // 必要であれば追加
  // target_date: string; // 必要であれば追加
};

type TeacherComment = {
  id: string; // UUIDなのでstring
  comment_content: string;
  todo_list_id: string; // UUIDなのでstring
  target_date: string;
  teacher_id: string;
  created_at: string;
};

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
  const [teacherComment, setTeacherComment] = useState<TeacherComment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentStudentId, setCurrentStudentId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

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
      console.log('🚀 fetchTodayData: Starting...', {
        user: !!user,
        userRole,
        selectedStudent: selectedStudent ? selectedStudent.full_name : 'null'
      });
      
      setError(null);
      setLoading(true);

      // AuthContextからuser情報を使用
      if (!user) {
        throw new Error('認証エラー: Auth session missing!');
      }

      // ユーザーロールが学生でない場合は何もしない
      if (userRole !== 'student') {
        console.log('⏸️ fetchTodayData: User role is not student:', userRole);
        setTasks([]);
        setTeacherComment(null);
        setLoading(false);
        return;
      }

      // 選択された生徒の情報を確認
      if (!selectedStudent) {
        console.log('⏸️ fetchTodayData: No student selected yet');
        setTasks([]);
        setTeacherComment(null);
        setLoading(false);
        return;
      }

      console.log('✅ fetchTodayData: Using selected student:', selectedStudent.full_name, 'ID:', selectedStudent.id);
      setCurrentStudentId(selectedStudent.id);

      const dateString = selectedDate.toISOString().split('T')[0];
      const weekStartDate = getWeekStartDate(selectedDate);

      console.log('📅 fetchTodayData: Date info', {
        dateString,
        weekStartDate,
        studentId: selectedStudent.id
      });

      // 今日の日付が含まれる週のtodo_listを取得
      const { data: todoList, error: todoListError } = await supabase
        .from('todo_lists')
        .select('id, status') // statusも取得して公開済みか確認
        .eq('student_id', selectedStudent.id)
        .eq('target_week_start_date', weekStartDate)
        .single();

      console.log('📋 fetchTodayData: Todo list query result', {
        todoList,
        todoListError
      });

      if (todoListError) {
        // PGRST116はレコードが見つからない場合のエラーコード
        if (todoListError.code === 'PGRST116') {
          setTasks([]);
          setTeacherComment(null);
          // throw new Error('今週のやることリストが見つかりません。'); // エラーにするか、タスクなしとするか
          console.log('今週のやることリストが見つかりません。');
          return; // リストがなければタスクもコメントもない
        }
        throw new Error(`やることリストの取得に失敗: ${todoListError.message}`);
      }
      
      if (!todoList) {
        setTasks([]);
        setTeacherComment(null);
        // throw new Error('今週のやることリストデータがありません。');
        console.log('今週のやることリストデータがありません。');
        return;
      }

      if (todoList.status !== '公開済み') {
        setTasks([]);
        setTeacherComment(null);
        // throw new Error('今週のやることリストはまだ公開されていません。');
        console.log('今週のやることリストはまだ公開されていません。');
        Alert.alert('お知らせ', '今週のやることリストはまだ公開されていません。');
        return;
      }


      // デバッグ: このtodo_listに含まれる全てのタスクを確認
      const { data: allTasks, error: allTasksError } = await supabase
        .from('tasks')
        .select('id, content, target_date, is_completed')
        .eq('todo_list_id', todoList.id);

      console.log('🔍 fetchTodayData: All tasks in this todo_list', {
        allTasks,
        allTasksError,
        todoListId: todoList.id
      });

      // 今日のタスクを取得
      const { data: fetchedTasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id, content, is_completed, todo_list_id') // contentとis_completedを明示
        .eq('todo_list_id', todoList.id)
        .eq('target_date', dateString) // tasksテーブルのtarget_dateで選択された日付を検索
        .order('display_order'); // display_orderで並び替え

      console.log('📝 fetchTodayData: Tasks query result', {
        fetchedTasks,
        tasksError,
        taskCount: fetchedTasks?.length || 0,
        searchingForDate: dateString
      });

      if (tasksError) throw new Error(`タスクの取得に失敗: ${tasksError.message}`);
      
      setTasks(fetchedTasks || []);
      
      console.log('✅ fetchTodayData: Tasks set successfully, count:', (fetchedTasks?.length || 0) + (allTasks?.length || 0));

      // 今日の講師コメントを取得
      const { data: comment, error: commentError } = await supabase
        .from('teacher_comments')
        .select('id, comment_content, todo_list_id, target_date, teacher_id, created_at') // comment_contentを明示
        .eq('todo_list_id', todoList.id)
        .eq('target_date', dateString)
        .order('created_at', { ascending: false }) // 最新のコメントを優先する場合
        .limit(1) // 1日に1コメントを想定、または最新1件
        .single(); // 1件取得を期待、なければエラーかnull

      console.log('💬 fetchTodayData: Teacher comment query result', {
        comment,
        commentError
      });

      if (commentError && commentError.code !== 'PGRST116') { // PGRST116 は結果0行のエラー
        throw new Error(`講師コメントの取得に失敗: ${commentError.message}`);
      }
      setTeacherComment(comment as TeacherComment | null); // 型アサーション
      
      console.log('🎉 fetchTodayData: All data fetched successfully!');

    } catch (err: any) {
      const errorMessage = err.message || '予期せぬエラーが発生しました';
      setError(errorMessage);
      console.error('fetchTodayData Error:', err);
      Alert.alert('データ取得エラー', errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user, userRole, selectedStudent, selectedDate]);

  useEffect(() => {
    console.log('🔄 index.tsx: useEffect triggered', {
      userRoleLoading,
      user: !!user,
      selectedStudent: selectedStudent ? selectedStudent.full_name : 'null',
      userRole
    });
    
    // ユーザーロールのローディングが完了し、かつユーザーが存在し、生徒が選択されている場合にのみデータを取得
    if (!userRoleLoading && user && selectedStudent) {
      console.log('✅ index.tsx: Conditions met, calling fetchTodayData');
      fetchTodayData();
    } else {
      console.log('⏸️ index.tsx: Conditions not met, skipping fetchTodayData');
    }
    // Supabaseのリアルタイムリスナーを設定することも検討 (オプション)
    // 例: tasksテーブルの変更をリッスン
    // const taskListener = supabase.channel('public:tasks')
    //   .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, payload => {
    //     console.log('Task change received!', payload);
    //     fetchTodayData(); // データ再取得
    //   })
    //   .subscribe();
    // return () => {
    //   supabase.removeChannel(taskListener);
    // };
  }, [fetchTodayData, userRoleLoading, user, selectedStudent, selectedDate]);

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

  // 日付操作関数
  const goToPreviousDay = () => {
    const prevDay = new Date(selectedDate);
    prevDay.setDate(prevDay.getDate() - 1);
    setSelectedDate(prevDay);
  };

  const goToNextDay = () => {
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    setSelectedDate(nextDay);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  // より確実な日付比較
  const today = new Date();
  const isToday = selectedDate.getFullYear() === today.getFullYear() && 
                  selectedDate.getMonth() === today.getMonth() && 
                  selectedDate.getDate() === today.getDate();

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
          <Text style={styles.logo}>東大伴走</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>データを読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !tasks.length && !teacherComment) { // データが何もない場合のエラー表示
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.logo}>東大伴走</Text>
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
        <Text style={styles.logo}>東大伴走</Text>
        <Text style={styles.headerTitle}>ホーム</Text>
      </View>
      
      {/* 日付選択セクション */}
      <View style={styles.dateSection}>
        <TouchableOpacity onPress={goToPreviousDay} style={styles.dateButton}>
          <ChevronLeft size={24} color="#3B82F6" />
        </TouchableOpacity>
        
        <View style={styles.dateCenterContainer}>
          <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.dateContainer}>
            <Calendar size={16} color="#3B82F6" />
            <Text style={styles.dateText}>
              {selectedDate.toLocaleDateString('ja-JP', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                weekday: 'short'
              })}
            </Text>
          </TouchableOpacity>
          {isToday && (
            <View style={styles.todayIndicator}>
              <Text style={styles.todayIndicatorText}>今日</Text>
            </View>
          )}
          {!isToday && (
            <TouchableOpacity onPress={goToToday} style={styles.todayButton}>
              <Text style={styles.todayButtonText}>今日へ</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity onPress={goToNextDay} style={styles.dateButton}>
          <ChevronRight size={24} color="#3B82F6" />
        </TouchableOpacity>
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
          <Text style={styles.sectionTitle}>
            {isToday ? '今日のやることリスト' : 'やることリスト'}
          </Text>
          {tasks.length === 0 && !loading && !error && ( // ローディング中でもエラーでもないのにタスク0の場合
            <Text style={styles.emptyText}>
              {isToday ? '今日のタスクはありません' : 'この日のタスクはありません'}
            </Text>
          )}
          {tasks.map(task => (
            <TaskItem
              key={task.id}
              title={task.content}
              isCompleted={task.is_completed}
              onToggle={() => handleTaskToggle(task.id)}
              onCelebration={triggerFullScreenCelebration}
            />
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>講師からのコメント</Text>
          {teacherComment ? (
            <TeacherCommentComponent
              content={teacherComment.comment_content}
              createdAt={teacherComment.created_at}
            />
          ) : (
            <Text style={styles.noCommentText}>
              まだコメントはありません
            </Text>
          )}
        </View>

        {/* クイックアクション */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>クイックアクション</Text>
          
          {/* 週間やることリスト */}
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/weekly-tasks' as any)}
          >
            <View style={styles.actionCardHeader}>
              <Text style={styles.actionCardEmoji}>📅</Text>
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
            onPress={() => router.push('/calendar')}
          >
            <View style={styles.actionCardHeader}>
              <Text style={styles.actionCardEmoji}>🏥</Text>
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
            onPress={() => router.push('/additional-lesson-request' as any)}
          >
            <View style={styles.actionCardHeader}>
              <Text style={styles.actionCardEmoji}>📚</Text>
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
              <Text style={styles.celebrationMessageEmoji}>🎉</Text>
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
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  logo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3B82F6',
    position: 'absolute',
    left: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
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
  dateSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  dateButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  dateCenterContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginLeft: 8,
  },
  todayButton: {
    marginLeft: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
  },
  todayButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  todayIndicator: {
    marginLeft: 12,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#10B981',
    borderRadius: 12,
  },
  todayIndicatorText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
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
  actionCardEmoji: {
    fontSize: 24,
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
  celebrationMessageEmoji: {
    fontSize: 48,
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
  noCommentText: {
    color: '#94A3B8',
    fontSize: 16,
    textAlign: 'center',
    paddingVertical: 24,
    fontStyle: 'italic',
  },
});