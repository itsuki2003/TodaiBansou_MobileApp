import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { supabase } from '../../lib/supabaseClient';
import TaskItem from '../../components/ui/TaskItem';
import TeacherComment from '../../components/ui/TeacherComment';

type Task = {
  id: number;
  title: string;
  is_completed: boolean;
  todo_list_id: number;
};

type TeacherComment = {
  id: number;
  content: string;
  todo_list_id: number;
  created_at: string;
};

export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [teacherComment, setTeacherComment] = useState<TeacherComment | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTodayData();
  }, []);

  const fetchTodayData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 現在のユーザーIDを取得
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('ユーザーが見つかりません');

      // 生徒IDを取得
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('parent_id', user.id)
        .single();

      if (studentError) throw studentError;
      if (!student) throw new Error('生徒情報が見つかりません');

      // 今日の日付のtodo_listを取得
      const today = new Date().toISOString().split('T')[0];
      const { data: todoList, error: todoListError } = await supabase
        .from('todo_lists')
        .select('id')
        .eq('student_id', student.id)
        .eq('date', today)
        .single();

      if (todoListError) throw todoListError;
      if (!todoList) throw new Error('今日のやることリストが見つかりません');

      // タスクを取得
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('*')
        .eq('todo_list_id', todoList.id)
        .order('created_at');

      if (tasksError) throw tasksError;
      setTasks(tasks || []);

      // 講師コメントを取得
      const { data: comment, error: commentError } = await supabase
        .from('teacher_comments')
        .select('*')
        .eq('todo_list_id', todoList.id)
        .eq('date', today)
        .single();

      if (commentError && commentError.code !== 'PGRST116') throw commentError;
      setTeacherComment(comment);

    } catch (err: any) {
      setError(err.message);
      Alert.alert('エラー', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskToggle = async (taskId: number, isCompleted: boolean) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ is_completed: isCompleted })
        .eq('id', taskId);

      if (error) throw error;

      setTasks(tasks.map(task =>
        task.id === taskId ? { ...task, is_completed: isCompleted } : task
      ));
    } catch (err: any) {
      Alert.alert('エラー', 'タスクの更新に失敗しました');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>今日のやることリスト</Text>
        {tasks.length === 0 ? (
          <Text style={styles.emptyText}>今日のタスクはありません</Text>
        ) : (
          tasks.map(task => (
            <TaskItem
              key={task.id}
              title={task.title}
              isCompleted={task.is_completed}
              onToggle={(isCompleted) => handleTaskToggle(task.id, isCompleted)}
            />
          ))
        )}
      </View>

      {teacherComment && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>講師からのコメント</Text>
          <TeacherComment
            content={teacherComment.content}
            createdAt={teacherComment.created_at}
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 16,
  },
  emptyText: {
    color: '#64748B',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
  },
});