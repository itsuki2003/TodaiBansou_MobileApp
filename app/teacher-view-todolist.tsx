import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { format, addDays, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Circle,
  Eye,
  EyeOff,
  MessageCircle,
  BookOpen,
  AlertTriangle,
  Edit3,
  Clock,
} from 'lucide-react-native';

import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { TeacherGuard } from '../components/common/RoleGuard';
import type { Database } from '../types/database.types';

type Student = Database['public']['Tables']['students']['Row'];
type Assignment = Database['public']['Tables']['assignments']['Row'];
type TodoList = Database['public']['Tables']['todo_lists']['Row'];
type Task = Database['public']['Tables']['tasks']['Row'];
type TeacherComment = Database['public']['Tables']['teacher_comments']['Row'];

interface TodoListDetails {
  student: Student;
  assignment: Assignment;
  todoList: TodoList & {
    tasks: Task[];
  };
  comments: (TeacherComment & {
    teachers: { full_name: string };
  })[];
}

export default function ViewTodoListScreen() {
  const router = useRouter();
  const { studentId, todoListId } = useLocalSearchParams();
  const { selectedTeacher } = useAuth();
  
  const [todoListDetails, setTodoListDetails] = useState<TodoListDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTodoListDetails = useCallback(async () => {
    if (!selectedTeacher || !studentId || !todoListId) return;

    try {
      setError(null);

      // 生徒と担当情報の取得
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('assignments')
        .select(`
          *,
          students (*)
        `)
        .eq('teacher_id', selectedTeacher.id)
        .eq('student_id', studentId)
        .eq('status', '有効')
        .single();

      if (assignmentError) throw assignmentError;

      if (!assignmentData) {
        setError('この生徒を担当していません');
        return;
      }

      const student = assignmentData.students as Student;
      const assignment = assignmentData as Assignment;

      // やることリストの詳細取得
      const { data: todoListData, error: todoListError } = await supabase
        .from('todo_lists')
        .select(`
          *,
          tasks (*)
        `)
        .eq('id', todoListId)
        .eq('student_id', student.id)
        .single();

      if (todoListError) throw todoListError;

      if (!todoListData) {
        setError('やることリストが見つかりません');
        return;
      }

      // 講師コメント取得
      const weekEnd = format(
        addDays(parseISO(todoListData.target_week_start_date), 6), 
        'yyyy-MM-dd'
      );
      
      const { data: commentsData, error: commentsError } = await supabase
        .from('teacher_comments')
        .select(`
          *,
          teachers (full_name)
        `)
        .eq('todo_list_id', todoListData.id)
        .gte('target_date', todoListData.target_week_start_date)
        .lte('target_date', weekEnd)
        .order('target_date', { ascending: true })
        .order('created_at', { ascending: true });

      if (commentsError && commentsError.code !== 'PGRST116') {
        throw commentsError;
      }

      setTodoListDetails({
        student,
        assignment,
        todoList: todoListData as TodoList & { tasks: Task[] },
        comments: commentsData || [],
      });

    } catch (err) {
      console.error('TodoList details fetch error:', err);
      setError('やることリストの取得に失敗しました');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedTeacher, studentId, todoListId]);

  useEffect(() => {
    fetchTodoListDetails();
  }, [fetchTodoListDetails]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTodoListDetails();
  }, [fetchTodoListDetails]);

  const handleGoBack = () => {
    router.back();
  };

  const handleEditTodoList = () => {
    router.push({
      pathname: '/teacher-edit-todolist',
      params: { studentId: studentId, todoListId: todoListId }
    });
  };

  const canEditTodoList = todoListDetails?.assignment.role === '面談担当（リスト編集可）';

  // 統計情報の計算
  const totalTasks = todoListDetails?.todoList.tasks.length || 0;
  const completedTasks = todoListDetails?.todoList.tasks.filter(task => task.is_completed).length || 0;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  if (loading) {
    return (
      <TeacherGuard>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
              <ArrowLeft size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.title}>やることリスト</Text>
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>読み込み中...</Text>
          </View>
        </SafeAreaView>
      </TeacherGuard>
    );
  }

  if (error || !todoListDetails) {
    return (
      <TeacherGuard>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
              <ArrowLeft size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.title}>やることリスト</Text>
          </View>
          <View style={styles.errorContainer}>
            <AlertTriangle size={64} color="#EF4444" />
            <Text style={styles.errorText}>{error || 'データが見つかりません'}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchTodoListDetails}>
              <Text style={styles.retryButtonText}>再試行</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </TeacherGuard>
    );
  }

  return (
    <TeacherGuard>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <ArrowLeft size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.title}>{todoListDetails.student.full_name}</Text>
          {canEditTodoList && (
            <TouchableOpacity style={styles.editHeaderButton} onPress={handleEditTodoList}>
              <Edit3 size={20} color="#3B82F6" />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#3B82F6']}
              tintColor="#3B82F6"
            />
          }
        >
          {/* やることリスト情報 */}
          <View style={styles.section}>
            <View style={styles.todoListHeader}>
              <View style={styles.weekInfo}>
                <Calendar size={16} color="#6B7280" />
                <Text style={styles.weekText}>
                  {format(parseISO(todoListDetails.todoList.target_week_start_date), 'yyyy年M月d日', { locale: ja })}週
                </Text>
              </View>
              
              <View style={[
                styles.statusBadge,
                todoListDetails.todoList.status === '公開済み' ? styles.publishedBadge : styles.draftBadge
              ]}>
                {todoListDetails.todoList.status === '公開済み' ? (
                  <Eye size={12} color="#166534" />
                ) : (
                  <EyeOff size={12} color="#92400E" />
                )}
                <Text style={[
                  styles.statusText,
                  todoListDetails.todoList.status === '公開済み' ? styles.publishedText : styles.draftText
                ]}>
                  {todoListDetails.todoList.status}
                </Text>
              </View>
            </View>

            {/* 統計情報 */}
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{totalTasks}</Text>
                <Text style={styles.statLabel}>総タスク数</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>{completedTasks}</Text>
                <Text style={styles.statLabel}>完了済み</Text>
              </View>
              
              <View style={styles.statItem}>
                <View style={styles.progressContainer}>
                  <View style={styles.progressBackground}>
                    <View style={[
                      styles.progressBar,
                      { width: `${completionRate}%` }
                    ]} />
                  </View>
                  <Text style={styles.progressText}>{completionRate}%</Text>
                </View>
              </View>
            </View>

            {todoListDetails.todoList.list_creation_date && (
              <View style={styles.dateInfo}>
                <Clock size={12} color="#9CA3AF" />
                <Text style={styles.dateText}>
                  作成日: {format(parseISO(todoListDetails.todoList.list_creation_date), 'yyyy/MM/dd')}
                </Text>
              </View>
            )}
          </View>

          {/* 日別タスク表示 */}
          <View style={styles.section}>
            {Array.from({ length: 7 }, (_, i) => {
              const date = addDays(parseISO(todoListDetails.todoList.target_week_start_date), i);
              const dateStr = format(date, 'yyyy-MM-dd');
              const dayTasks = todoListDetails.todoList.tasks.filter(task => task.target_date === dateStr);
              const dayComments = todoListDetails.comments.filter(comment => comment.target_date === dateStr);

              return (
                <View key={dateStr} style={styles.daySection}>
                  <View style={styles.dayHeader}>
                    <Text style={styles.dayTitle}>
                      {format(date, 'M/d(E)', { locale: ja })}
                    </Text>
                    <Text style={styles.taskCount}>
                      {dayTasks.filter(t => t.is_completed).length}/{dayTasks.length}
                    </Text>
                  </View>

                  {/* タスク一覧 */}
                  {dayTasks.length === 0 ? (
                    <Text style={styles.noTasksText}>タスクなし</Text>
                  ) : (
                    dayTasks
                      .sort((a, b) => a.display_order - b.display_order)
                      .map(task => (
                        <View key={task.id} style={styles.taskItem}>
                          <View style={[
                            styles.taskCheckbox,
                            task.is_completed ? styles.taskCompleted : styles.taskIncomplete
                          ]}>
                            {task.is_completed ? (
                              <CheckCircle2 size={16} color="#10B981" />
                            ) : (
                              <Circle size={16} color="#D1D5DB" />
                            )}
                          </View>
                          <Text style={[
                            styles.taskText,
                            task.is_completed ? styles.taskTextCompleted : styles.taskTextIncomplete
                          ]}>
                            {task.content}
                          </Text>
                        </View>
                      ))
                  )}

                  {/* コメント表示 */}
                  {dayComments.map(comment => (
                    <View key={comment.id} style={styles.commentItem}>
                      <MessageCircle size={14} color="#3B82F6" />
                      <View style={styles.commentContent}>
                        <Text style={styles.commentText}>{comment.comment_content}</Text>
                        <Text style={styles.commentMeta}>
                          {comment.teachers.full_name} • {format(parseISO(comment.created_at), 'MM/dd HH:mm')}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              );
            })}
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>
      </SafeAreaView>
    </TeacherGuard>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  editHeaderButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  todoListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  weekInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weekText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  publishedBadge: {
    backgroundColor: '#DCFCE7',
  },
  draftBadge: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  publishedText: {
    color: '#166534',
  },
  draftText: {
    color: '#92400E',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: 12,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  progressContainer: {
    alignItems: 'center',
    width: '100%',
  },
  progressBackground: {
    width: '100%',
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
  },
  dateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  daySection: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  taskCount: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  noTasksText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  taskCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskCompleted: {
    backgroundColor: '#DCFCE7',
  },
  taskIncomplete: {
    backgroundColor: '#F3F4F6',
  },
  taskText: {
    flex: 1,
    fontSize: 16,
  },
  taskTextCompleted: {
    color: '#6B7280',
    textDecorationLine: 'line-through',
  },
  taskTextIncomplete: {
    color: '#111827',
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
  },
  commentContent: {
    flex: 1,
    marginLeft: 8,
  },
  commentText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  commentMeta: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  bottomSpacing: {
    height: 20,
  },
});