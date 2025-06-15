import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { format, startOfWeek } from 'date-fns';
import {
  Search,
  User,
  CheckCircle2,
  Clock,
  MessageCircle,
  ChevronRight,
  BookOpen,
  AlertTriangle,
} from 'lucide-react-native';

import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { TeacherGuard } from '../../components/common/RoleGuard';
import AppHeader from '../../components/ui/AppHeader';
import type { Database } from '../../types/database.types';

type Student = Database['public']['Tables']['students']['Row'];
type Assignment = Database['public']['Tables']['assignments']['Row'];
type TodoList = Database['public']['Tables']['todo_lists']['Row'];
type Task = Database['public']['Tables']['tasks']['Row'];

interface StudentWithDetails {
  student: Student;
  assignment: Assignment;
  currentTodoList?: TodoList & {
    tasks: Task[];
  };
  completionRate: number;
  pendingComments: number;
  lastActivity?: string;
}

export default function TeacherStudentsScreen() {
  const router = useRouter();
  const { selectedTeacher } = useAuth();
  
  const [students, setStudents] = useState<StudentWithDetails[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchStudents = useCallback(async () => {
    if (!selectedTeacher) return;

    try {
      setError(null);

      // 担当生徒の取得
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select(`
          *,
          students (*)
        `)
        .eq('teacher_id', selectedTeacher.id)
        .eq('status', '有効');

      if (assignmentsError) throw assignmentsError;

      // 各生徒の詳細情報を取得
      const studentsWithDetails = await Promise.all(
        (assignmentsData || []).map(async (assignment): Promise<StudentWithDetails> => {
          const student = assignment.students as Student;
          
          // 現在の週のやることリスト取得
          const currentWeekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
          const { data: todoListData } = await supabase
            .from('todo_lists')
            .select(`
              *,
              tasks (*)
            `)
            .eq('student_id', student.id)
            .eq('target_week_start_date', currentWeekStart)
            .eq('status', '公開済み')
            .single();

          // 完了率の計算
          let completionRate = 0;
          if (todoListData?.tasks && todoListData.tasks.length > 0) {
            const completedTasks = todoListData.tasks.filter(task => task.is_completed);
            completionRate = Math.round((completedTasks.length / todoListData.tasks.length) * 100);
          }

          // TODO: 未読コメント数の取得
          const pendingComments = 0;

          // TODO: 最後のアクティビティ取得
          const lastActivity = undefined;

          return {
            student,
            assignment: assignment as Assignment,
            currentTodoList: todoListData || undefined,
            completionRate,
            pendingComments,
            lastActivity,
          };
        })
      );

      // 名前順でソート
      studentsWithDetails.sort((a, b) => 
        a.student.full_name.localeCompare(b.student.full_name, 'ja')
      );

      setStudents(studentsWithDetails);
      setFilteredStudents(studentsWithDetails);

    } catch (err) {
      console.error('Students fetch error:', err);
      setError('担当生徒情報の取得に失敗しました');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedTeacher]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // 検索フィルタリング
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter(item =>
        item.student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.student.furigana_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.student.grade?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredStudents(filtered);
    }
  }, [searchQuery, students]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStudents();
  }, [fetchStudents]);

  const handleStudentPress = (studentId: string) => {
    router.push({
      pathname: '/teacher-student-detail',
      params: { studentId: studentId }
    });
  };

  const renderStudentItem = ({ item }: { item: StudentWithDetails }) => {
    const hasCurrentTodoList = !!item.currentTodoList;
    const isInterviewTeacher = item.assignment.role === '面談担当（リスト編集可）';

    return (
      <TouchableOpacity
        style={styles.studentCard}
        onPress={() => handleStudentPress(item.student.id)}
      >
        <View style={styles.studentHeader}>
          <View style={styles.studentIconContainer}>
            <User size={24} color="#3B82F6" />
          </View>
          <View style={styles.studentInfo}>
            <View style={styles.studentNameRow}>
              <Text style={styles.studentName}>{item.student.full_name}</Text>
              {isInterviewTeacher && (
                <View style={styles.roleTag}>
                  <Text style={styles.roleTagText}>面談担当</Text>
                </View>
              )}
            </View>
            {item.student.furigana_name && (
              <Text style={styles.studentFurigana}>{item.student.furigana_name}</Text>
            )}
            <View style={styles.studentDetails}>
              <Text style={styles.studentGrade}>{item.student.grade}</Text>
              {item.student.school_attended && (
                <Text style={styles.studentSchool}>• {item.student.school_attended}</Text>
              )}
            </View>
          </View>
          <ChevronRight size={20} color="#9CA3AF" />
        </View>

        <View style={styles.studentStats}>
          {hasCurrentTodoList ? (
            <View style={styles.statItem}>
              <CheckCircle2 size={16} color="#10B981" />
              <Text style={styles.statText}>
                今週の進捗: {item.completionRate}%
              </Text>
            </View>
          ) : (
            <View style={styles.statItem}>
              <AlertTriangle size={16} color="#F59E0B" />
              <Text style={styles.statTextWarning}>
                今週のリストなし
              </Text>
            </View>
          )}

          {item.currentTodoList && (
            <View style={styles.statItem}>
              <BookOpen size={16} color="#6B7280" />
              <Text style={styles.statText}>
                タスク: {item.currentTodoList.tasks?.filter(t => t.is_completed).length || 0}/
                {item.currentTodoList.tasks?.length || 0}
              </Text>
            </View>
          )}

          {item.pendingComments > 0 && (
            <View style={styles.statItem}>
              <MessageCircle size={16} color="#3B82F6" />
              <Text style={styles.statText}>
                未返答コメント: {item.pendingComments}
              </Text>
            </View>
          )}
        </View>

        {item.lastActivity && (
          <View style={styles.lastActivity}>
            <Clock size={14} color="#9CA3AF" />
            <Text style={styles.lastActivityText}>
              最終活動: {item.lastActivity}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <User size={48} color="#9CA3AF" />
      <Text style={styles.emptyStateText}>
        {searchQuery ? '該当する生徒が見つかりません' : '担当生徒がいません'}
      </Text>
      {searchQuery && (
        <TouchableOpacity
          style={styles.clearSearchButton}
          onPress={() => setSearchQuery('')}
        >
          <Text style={styles.clearSearchText}>検索をクリア</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <TeacherGuard>
        <SafeAreaView style={styles.container}>
          <AppHeader title="担当生徒" />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>生徒情報を読み込み中...</Text>
          </View>
        </SafeAreaView>
      </TeacherGuard>
    );
  }

  if (error) {
    return (
      <TeacherGuard>
        <SafeAreaView style={styles.container}>
          <AppHeader title="担当生徒" />
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchStudents}>
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
        <AppHeader title="担当生徒" />

        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Search size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="生徒名で検索..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
          </View>
        </View>

        <FlatList
          data={filteredStudents}
          renderItem={renderStudentItem}
          keyExtractor={(item) => item.student.id}
          style={styles.list}
          contentContainerStyle={filteredStudents.length === 0 ? styles.emptyContainer : undefined}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#3B82F6']}
              tintColor="#3B82F6"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </TeacherGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    marginLeft: 8,
  },
  list: {
    flex: 1,
  },
  studentCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 8,
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
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  studentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EBF8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  studentInfo: {
    flex: 1,
  },
  studentNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  studentName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginRight: 8,
  },
  roleTag: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleTagText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  studentFurigana: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  studentDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  studentGrade: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  studentSchool: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  studentStats: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
    gap: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 6,
  },
  statTextWarning: {
    fontSize: 14,
    color: '#F59E0B',
    marginLeft: 6,
    fontWeight: '500',
  },
  lastActivity: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  lastActivityText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
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
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
  },
  clearSearchButton: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
  },
  clearSearchText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
});