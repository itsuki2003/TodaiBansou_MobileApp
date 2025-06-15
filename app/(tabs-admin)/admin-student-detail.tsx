import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  User,
  Phone,
  Mail,
  School,
  Calendar,
  Users,
  Edit3,
  MoreVertical,
  CheckCircle2,
  Clock,
  FileText,
  ChevronRight,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { supabase } from '@/lib/supabaseClient';
import { AdminGuard } from '@/components/common/RoleGuard';
import AppHeader from '@/components/ui/AppHeader';
import type { Database } from '@/types/database.types';

type Student = Database['public']['Tables']['students']['Row'];
type Teacher = Database['public']['Tables']['teachers']['Row'];
type Assignment = Database['public']['Tables']['assignments']['Row'];
type TodoList = Database['public']['Tables']['todo_lists']['Row'];

interface StudentWithDetails extends Student {
  assignments: Array<Assignment & {
    teachers: Teacher;
  }>;
  todoLists: Array<TodoList & {
    tasks: Array<{ is_completed: boolean }>;
  }>;
}

export default function AdminStudentDetailScreen() {
  const router = useRouter();
  const { studentId } = useLocalSearchParams();
  const { showNotification } = useNotification();
  const [student, setStudent] = useState<StudentWithDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentDetails = async () => {
      if (!studentId) return;

      try {
        setLoading(true);
        
        // 生徒基本情報を取得
        const { data: studentData, error: studentError } = await supabase
          .from('students')
          .select('*')
          .eq('id', studentId)
          .single();

        if (studentError) throw studentError;

        // 担当講師情報を取得
        const { data: assignmentsData, error: assignmentsError } = await supabase
          .from('assignments')
          .select(`
            *,
            teachers (*)
          `)
          .eq('student_id', studentId)
          .eq('status', '有効');

        if (assignmentsError) throw assignmentsError;

        // やることリスト情報を取得
        const { data: todoListsData, error: todoListsError } = await supabase
          .from('todo_lists')
          .select(`
            *,
            tasks (is_completed)
          `)
          .eq('student_id', studentId)
          .order('target_week_start_date', { ascending: false })
          .limit(5);

        if (todoListsError) throw todoListsError;

        setStudent({
          ...studentData,
          assignments: assignmentsData || [],
          todoLists: todoListsData || [],
        });
      } catch (error) {
        console.error('Error fetching student details:', error);
        showNotification({
          type: 'error',
          title: 'エラー',
          message: '生徒情報の取得に失敗しました',
          autoHide: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStudentDetails();
  }, [studentId, showNotification]);

  const handleEditStudent = () => {
    router.push({
      pathname: '/admin-student-form',
      params: { studentId }
    });
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!student) return;

    Alert.alert(
      '確認',
      `生徒のステータスを「${newStatus}」に変更しますか？`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '変更',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('students')
                .update({ 
                  status: newStatus,
                  updated_at: new Date().toISOString()
                })
                .eq('id', student.id);

              if (error) throw error;

              showNotification({
                type: 'success',
                title: '更新完了',
                message: 'ステータスを変更しました',
                autoHide: true,
              });

              setStudent({ ...student, status: newStatus });
            } catch (error) {
              console.error('Error updating status:', error);
              showNotification({
                type: 'error',
                title: 'エラー',
                message: 'ステータスの更新に失敗しました',
                autoHide: true,
              });
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '在籍中': return '#10B981';
      case '休会中': return '#F59E0B';
      case '退会済み': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case '在籍中': return '#ECFDF5';
      case '休会中': return '#FFFBEB';
      case '退会済み': return '#FEF2F2';
      default: return '#F9FAFB';
    }
  };

  if (loading) {
    return (
      <AdminGuard>
        <SafeAreaView style={styles.container}>
          <AppHeader
            title="生徒詳細"
            leftElement={
              <TouchableOpacity onPress={() => router.back()}>
                <ArrowLeft size={24} color="#374151" />
              </TouchableOpacity>
            }
          />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#DC2626" />
            <Text style={styles.loadingText}>読み込み中...</Text>
          </View>
        </SafeAreaView>
      </AdminGuard>
    );
  }

  if (!student) {
    return (
      <AdminGuard>
        <SafeAreaView style={styles.container}>
          <AppHeader
            title="生徒詳細"
            leftElement={
              <TouchableOpacity onPress={() => router.back()}>
                <ArrowLeft size={24} color="#374151" />
              </TouchableOpacity>
            }
          />
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>生徒情報が見つかりません</Text>
            <TouchableOpacity style={styles.retryButton} onPress={() => router.back()}>
              <Text style={styles.retryButtonText}>戻る</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </AdminGuard>
    );
  }

  const calculateCompletionRate = (tasks: Array<{ is_completed: boolean }>) => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(task => task.is_completed).length;
    return Math.round((completed / tasks.length) * 100);
  };

  return (
    <AdminGuard>
      <SafeAreaView style={styles.container}>
        <AppHeader
          title="生徒詳細"
          leftElement={
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft size={24} color="#374151" />
            </TouchableOpacity>
          }
          rightElement={
            <TouchableOpacity onPress={handleEditStudent}>
              <Edit3 size={24} color="#374151" />
            </TouchableOpacity>
          }
        />

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 基本情報 */}
          <View style={styles.section}>
            <View style={styles.profileHeader}>
              <View style={styles.profileIconContainer}>
                <User size={40} color="#3B82F6" />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.studentName}>{student.full_name}</Text>
                {student.furigana_name && (
                  <Text style={styles.studentFurigana}>{student.furigana_name}</Text>
                )}
                <View style={styles.statusContainer}>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusBgColor(student.status) }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: getStatusColor(student.status) }
                    ]}>
                      {student.status}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>学年</Text>
                <Text style={styles.infoValue}>{student.grade || '未設定'}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>通塾先</Text>
                <Text style={styles.infoValue}>{student.school_attended || '未設定'}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>入会日</Text>
                <Text style={styles.infoValue}>
                  {new Date(student.enrollment_date).toLocaleDateString('ja-JP')}
                </Text>
              </View>
            </View>
          </View>

          {/* 保護者情報 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>保護者情報</Text>
            <View style={styles.parentInfo}>
              <View style={styles.parentItem}>
                <User size={16} color="#6B7280" />
                <Text style={styles.parentText}>{student.parent_name}</Text>
              </View>
              {student.parent_phone_number && (
                <View style={styles.parentItem}>
                  <Phone size={16} color="#6B7280" />
                  <Text style={styles.parentText}>{student.parent_phone_number}</Text>
                </View>
              )}
            </View>
          </View>

          {/* 担当講師 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>担当講師</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs-admin)/admin-assignment-management')}>
                <Text style={styles.sectionAction}>編集</Text>
              </TouchableOpacity>
            </View>
            
            {student.assignments.length === 0 ? (
              <Text style={styles.emptyText}>担当講師が割り当てられていません</Text>
            ) : (
              student.assignments.map((assignment) => (
                <View key={assignment.id} style={styles.assignmentItem}>
                  <View style={styles.assignmentInfo}>
                    <Text style={styles.teacherName}>{assignment.teachers.full_name}</Text>
                    <Text style={styles.assignmentRole}>{assignment.role}</Text>
                  </View>
                  <ChevronRight size={16} color="#9CA3AF" />
                </View>
              ))
            )}
          </View>

          {/* 学習進捗 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>最近の学習進捗</Text>
            
            {student.todoLists.length === 0 ? (
              <Text style={styles.emptyText}>やることリストがありません</Text>
            ) : (
              student.todoLists.map((todoList) => (
                <View key={todoList.id} style={styles.todoListItem}>
                  <View style={styles.todoListHeader}>
                    <Text style={styles.todoListWeek}>
                      {new Date(todoList.target_week_start_date).toLocaleDateString('ja-JP')} の週
                    </Text>
                    <View style={styles.completionBadge}>
                      <CheckCircle2 size={14} color="#10B981" />
                      <Text style={styles.completionText}>
                        {calculateCompletionRate(todoList.tasks)}%
                      </Text>
                    </View>
                  </View>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill,
                        { width: `${calculateCompletionRate(todoList.tasks)}%` }
                      ]} 
                    />
                  </View>
                </View>
              ))
            )}
          </View>

          {/* ステータス変更 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>ステータス変更</Text>
            <View style={styles.statusButtons}>
              <TouchableOpacity
                style={[
                  styles.statusButton,
                  student.status === '在籍中' && styles.statusButtonActive
                ]}
                onPress={() => handleStatusChange('在籍中')}
                disabled={student.status === '在籍中'}
              >
                <Text style={[
                  styles.statusButtonText,
                  student.status === '在籍中' && styles.statusButtonTextActive
                ]}>
                  在籍中
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.statusButton,
                  student.status === '休会中' && styles.statusButtonActive
                ]}
                onPress={() => handleStatusChange('休会中')}
                disabled={student.status === '休会中'}
              >
                <Text style={[
                  styles.statusButtonText,
                  student.status === '休会中' && styles.statusButtonTextActive
                ]}>
                  休会中
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.statusButton,
                  student.status === '退会済み' && styles.statusButtonActive
                ]}
                onPress={() => handleStatusChange('退会済み')}
                disabled={student.status === '退会済み'}
              >
                <Text style={[
                  styles.statusButtonText,
                  student.status === '退会済み' && styles.statusButtonTextActive
                ]}>
                  退会済み
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 備考 */}
          {student.notes && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>備考</Text>
              <View style={styles.notesContainer}>
                <Text style={styles.notesText}>{student.notes}</Text>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </AdminGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
    backgroundColor: '#DC2626',
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
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EBF8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  studentFurigana: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  statusContainer: {
    flexDirection: 'row',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  infoItem: {
    width: '50%',
    paddingHorizontal: 8,
    marginBottom: 16,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  sectionAction: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  parentInfo: {
    gap: 12,
  },
  parentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  parentText: {
    fontSize: 15,
    color: '#374151',
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    paddingVertical: 16,
  },
  assignmentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  assignmentInfo: {
    flex: 1,
  },
  teacherName: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
    marginBottom: 2,
  },
  assignmentRole: {
    fontSize: 14,
    color: '#6B7280',
  },
  todoListItem: {
    marginBottom: 16,
  },
  todoListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  todoListWeek: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  completionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  completionText: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 4,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  statusButtonActive: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  statusButtonTextActive: {
    color: '#FFFFFF',
  },
  notesContainer: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
});