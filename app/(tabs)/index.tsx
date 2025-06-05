import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TouchableOpacity,
  SafeAreaView, // SafeAreaViewを追加
} from 'react-native';
import { supabase } from '../../lib/supabaseClient'; // supabaseClientのパスを確認してください
import TaskItem from '../../components/ui/TaskItem'; // TaskItemのパスを確認してください
import TeacherCommentComponent from '../../components/ui/TeacherComment'; // TeacherCommentコンポーネントのインポート名変更とパス確認
import DateHeader from '../../components/ui/DateHeader'; // DateHeaderのパスを確認してください

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
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teacherComment, setTeacherComment] = useState<TeacherComment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentStudentId, setCurrentStudentId] = useState<string | null>(null);

  // アニメーション関連のstate (TaskItem側で個別管理も検討)
  const [celebrateTaskId, setCelebrateTaskId] = useState<string | null>(null);


  const fetchTodayData = useCallback(async () => {
    try {
      setError(null);
      setLoading(true); // fetch開始時にローディングをtrueに

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw new Error(`認証エラー: ${userError.message}`);
      if (!user) throw new Error('ユーザーが見つかりません。ログインしてください。');

      // ログインユーザーに紐づく生徒IDを取得 (1保護者1生徒をまず想定)
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id) // studentsテーブルのuser_id（保護者のauth.uid）で検索
        .single(); // 1保護者1生徒を想定、複数生徒の場合は .limit(1).single() や別途選択ロジック

      if (studentError) throw new Error(`生徒情報の取得に失敗: ${studentError.message}`);
      if (!studentData) throw new Error('生徒情報が見つかりません。');
      setCurrentStudentId(studentData.id);

      const todayString = getTodayDateString();
      const weekStartDate = getWeekStartDate(new Date());

      // 今日の日付が含まれる週のtodo_listを取得
      const { data: todoList, error: todoListError } = await supabase
        .from('todo_lists')
        .select('id, status') // statusも取得して公開済みか確認
        .eq('student_id', studentData.id)
        .eq('target_week_start_date', weekStartDate)
        .single();

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


      // 今日のタスクを取得
      const { data: fetchedTasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id, content, is_completed, todo_list_id') // contentとis_completedを明示
        .eq('todo_list_id', todoList.id)
        .eq('target_date', todayString) // tasksテーブルのtarget_dateで今日の日付を検索
        .order('display_order'); // display_orderで並び替え

      if (tasksError) throw new Error(`タスクの取得に失敗: ${tasksError.message}`);
      setTasks(fetchedTasks || []);

      // 今日の講師コメントを取得
      const { data: comment, error: commentError } = await supabase
        .from('teacher_comments')
        .select('id, comment_content, todo_list_id, target_date, teacher_id, created_at') // comment_contentを明示
        .eq('todo_list_id', todoList.id)
        .eq('target_date', todayString)
        .order('created_at', { ascending: false }) // 最新のコメントを優先する場合
        .limit(1) // 1日に1コメントを想定、または最新1件
        .single(); // 1件取得を期待、なければエラーかnull

      if (commentError && commentError.code !== 'PGRST116') { // PGRST116 は結果0行のエラー
        throw new Error(`講師コメントの取得に失敗: ${commentError.message}`);
      }
      setTeacherComment(comment as TeacherComment | null); // 型アサーション

    } catch (err: any) {
      const errorMessage = err.message || '予期せぬエラーが発生しました';
      setError(errorMessage);
      console.error('fetchTodayData Error:', err);
      Alert.alert('データ取得エラー', errorMessage);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTodayData();
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
  }, [fetchTodayData]);

  const handleTaskToggle = async (taskId: string) => { // taskIdをstringに
    const originalTasks = [...tasks];
    const taskToToggle = tasks.find(t => t.id === taskId);
    if (!taskToToggle) return;

    const newCompletedStatus = !taskToToggle.is_completed;

    // UIを先に更新（楽観的更新）
    setTasks(prevTasks => prevTasks.map(task =>
      task.id === taskId ? { ...task, is_completed: newCompletedStatus } : task
    ));

    // 完了時にアニメーション用IDをセット
    if (newCompletedStatus) {
      setCelebrateTaskId(taskId);
      // アニメーションのロジックはTaskItem側かHomeScreen側で管理
      // HomeScreen側で管理する場合は、ここでアニメーションを開始する
      // 例:
      // Animated.sequence([...]).start(() => setCelebrateTaskId(null));
    }


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
        {/* DateHeaderコンポーネントをここに配置するか、ScrollViewの外に配置するか検討 */}
      </View>
      <DateHeader date={new Date()} /> 
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
          <Text style={styles.sectionTitle}>今日のやることリスト</Text>
          {tasks.length === 0 && !loading && !error && ( // ローディング中でもエラーでもないのにタスク0の場合
            <Text style={styles.emptyText}>今日のタスクはありません</Text>
          )}
          {tasks.map(task => (
            <TaskItem
              key={task.id}
              task={{ // TaskItemのPropsに合わせて調整
                id: task.id,
                content: task.content, // `title`から`content`へ
                completed: task.is_completed, // `isCompleted`から`completed`へ
              }}
              onToggle={() => handleTaskToggle(task.id)} // isCompletedは内部で反転させる
            />
          ))}
        </View>

        {teacherComment && (
          // TeacherCommentComponentのPropsに合わせて修正
          <TeacherCommentComponent
            comment={teacherComment.comment_content} 
            // createdAtが必要な場合はTeacherCommentComponent側で対応し、データを渡す
          />
        )}
        {!teacherComment && !loading && !error && (
             <TeacherCommentComponent comment={null} /> // コメントがない場合の表示
        )}
      </ScrollView>
      {/* タスク完了時のアニメーションOverlayは、TaskItem内で個別に表示するか、
          あるいは celebrateTaskId を使ってHomeScreen全体に表示するかを選択できます。
          現状の HomeScreen のコードでは celebrateTaskId は使われていないようです。
          TaskItem.tsx 側でアニメーションを完結させるのがシンプルかもしれません。
      */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF', // 全体の背景色
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16, // SafeAreaViewを使うので paddingTop を調整
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF', // ヘッダーの背景色
    // borderBottomWidth: 1, // 必要であれば境界線
    // borderBottomColor: '#E2E8F0',
  },
  logo: {
    fontSize: 18, // 要件定義に合わせて調整
    fontWeight: '700',
    color: '#3B82F6', // ブランドカラー
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
    marginBottom: 24, // セクション間のマージン調整
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
});