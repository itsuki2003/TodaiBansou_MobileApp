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
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { format, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import {
  ArrowLeft,
  Calendar,
  Eye,
  EyeOff,
  CheckCircle2,
  Clock,
  BookOpen,
  Edit3,
} from 'lucide-react-native';

import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { TeacherGuard } from '../components/common/RoleGuard';
import type { Database } from '../types/database.types';

type Student = Database['public']['Tables']['students']['Row'];
type Assignment = Database['public']['Tables']['assignments']['Row'];
type TodoList = Database['public']['Tables']['todo_lists']['Row'];
type Task = Database['public']['Tables']['tasks']['Row'];

interface TodoListWithStats extends TodoList {
  tasks: Task[];
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
}

interface StudentWithHistory {
  student: Student;
  assignment: Assignment;
  todoLists: TodoListWithStats[];
}

export default function StudentTodoHistoryScreen() {
  const router = useRouter();
  const { studentId } = useLocalSearchParams();
  const { selectedTeacher } = useAuth();
  
  // studentIdをstringに変換
  const studentIdString = Array.isArray(studentId) ? studentId[0] : studentId;
  
  const [studentData, setStudentData] = useState<StudentWithHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStudentHistory = useCallback(async () => {
    if (!selectedTeacher || !studentIdString) return;

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
        .eq('student_id', studentIdString)
        .eq('status', '有効')
        .single();

      if (assignmentError) throw assignmentError;

      if (!assignmentData) {
        setError('この生徒を担当していません');
        return;
      }

      const student = assignmentData.students as Student;
      const assignment = assignmentData as Assignment;

      // 生徒のやることリスト履歴取得
      const { data: todoListsData, error: todoListsError } = await supabase
        .from('todo_lists')
        .select(`
          *,
          tasks (*)
        `)
        .eq('student_id', student.id)
        .order('target_week_start_date', { ascending: false });

      if (todoListsError) throw todoListsError;

      // 統計情報を計算
      const todoListsWithStats: TodoListWithStats[] = (todoListsData || []).map(todoList => {
        const tasks = todoList.tasks as Task[];
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(task => task.is_completed).length;
        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        return {
          ...todoList,
          tasks,
          totalTasks,
          completedTasks,
          completionRate,
        };
      });

      setStudentData({
        student,
        assignment,
        todoLists: todoListsWithStats,
      });

    } catch (err) {
      console.error('Student history fetch error:', err);
      setError('履歴データの取得に失敗しました');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedTeacher, studentIdString]);

  useEffect(() => {
    fetchStudentHistory();
  }, [fetchStudentHistory]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStudentHistory();
  }, [fetchStudentHistory]);

  const handleGoBack = () => {
    router.back();
  };

  const handleViewTodoList = (todoList: TodoListWithStats) => {
    router.push({
      pathname: '/teacher-view-todolist',
      params: { studentId: studentIdString, todoListId: todoList.id }
    });
  };

  const handleEditTodoList = (todoList: TodoListWithStats) => {
    router.push({
      pathname: '/teacher-edit-todolist',
      params: { studentId: studentIdString, todoListId: todoList.id }
    });
  };

  const canEditTodoList = studentData?.assignment.role === '面談担当（リスト編集可）';

  if (loading) {
    return (
      <TeacherGuard>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
              <ArrowLeft size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.title}>やることリスト履歴</Text>
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>履歴を読み込み中...</Text>
          </View>
        </SafeAreaView>
      </TeacherGuard>
    );
  }

  if (error || !studentData) {
    return (
      <TeacherGuard>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
              <ArrowLeft size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.title}>やることリスト履歴</Text>
          </View>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error || '履歴データが見つかりません'}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchStudentHistory}>
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
          <Text style={styles.title}>{studentData.student.full_name}の履歴</Text>
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
          {/* 生徒情報サマリー */}
          <View style={styles.section}>
            <Text style={styles.studentName}>{studentData.student.full_name}</Text>
            <Text style={styles.studentMeta}>
              {studentData.student.grade} • {studentData.student.school_attended}
            </Text>
            <Text style={styles.roleText}>
              {studentData.assignment.role === '面談担当（リスト編集可）' ? '面談担当' : '授業担当'}
            </Text>
          </View>

          {/* やることリスト一覧 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>やることリスト履歴</Text>
            
            {studentData.todoLists.length === 0 ? (
              <View style={styles.emptyContainer}>
                <BookOpen size={48} color="#9CA3AF" />
                <Text style={styles.emptyTitle}>やることリストなし</Text>
                <Text style={styles.emptyText}>
                  まだやることリストが作成されていません
                </Text>
              </View>
            ) : (
              studentData.todoLists.map((todoList) => (
                <TouchableOpacity
                  key={todoList.id}
                  style={styles.todoListItem}
                  onPress={() => handleViewTodoList(todoList)}
                >
                  <View style={styles.todoListHeader}>
                    <View style={styles.weekInfo}>
                      <Calendar size={16} color="#6B7280" />
                      <Text style={styles.weekText}>
                        {format(parseISO(todoList.target_week_start_date), 'yyyy年M月d日', { locale: ja })}週
                      </Text>
                    </View>
                    
                    <View style={styles.statusContainer}>
                      <View style={[
                        styles.statusBadge,
                        todoList.status === '公開済み' ? styles.publishedBadge : styles.draftBadge
                      ]}>
                        {todoList.status === '公開済み' ? (
                          <Eye size={12} color="#166534" />
                        ) : (
                          <EyeOff size={12} color="#92400E" />
                        )}
                        <Text style={[
                          styles.statusText,
                          todoList.status === '公開済み' ? styles.publishedText : styles.draftText
                        ]}>
                          {todoList.status}
                        </Text>
                      </View>
                      
                      {canEditTodoList && (
                        <TouchableOpacity
                          style={styles.editIconButton}
                          onPress={() => handleEditTodoList(todoList)}
                        >
                          <Edit3 size={16} color="#3B82F6" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>

                  <View style={styles.todoListStats}>
                    <View style={styles.statItem}>
                      <Text style={styles.statNumber}>{todoList.totalTasks}</Text>
                      <Text style={styles.statLabel}>タスク数</Text>
                    </View>
                    
                    <View style={styles.statItem}>
                      <Text style={styles.statNumber}>{todoList.completedTasks}</Text>
                      <Text style={styles.statLabel}>完了済み</Text>
                    </View>
                    
                    <View style={styles.statItem}>
                      <View style={styles.progressContainer}>
                        <View style={styles.progressBackground}>
                          <View style={[
                            styles.progressBar,
                            { width: `${todoList.completionRate}%` }
                          ]} />
                        </View>
                        <Text style={styles.progressText}>{todoList.completionRate}%</Text>
                      </View>
                    </View>
                  </View>

                  {todoList.list_creation_date && (
                    <View style={styles.dateInfo}>
                      <Clock size={12} color="#9CA3AF" />
                      <Text style={styles.dateText}>
                        作成日: {format(parseISO(todoList.list_creation_date), 'yyyy/MM/dd')}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))
            )}
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
  studentName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  studentMeta: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  roleText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  todoListItem: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#FAFAFA',
  },
  todoListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  weekInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  weekText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 6,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  editIconButton: {
    padding: 4,
  },
  todoListStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
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
    marginTop: 4,
  },
  dateText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  bottomSpacing: {
    height: 20,
  },
});