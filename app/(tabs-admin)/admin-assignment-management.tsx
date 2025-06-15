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
  Modal,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Users,
  UserCheck,
  Plus,
  Search,
  Filter,
  Edit3,
  Trash2,
  Calendar,
  ChevronRight,
  User,
  BookOpen,
  MessageCircle,
  X,
  CheckCircle2,
} from 'lucide-react-native';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { AdminGuard } from '@/components/common/RoleGuard';
import type { Database } from '@/types/database.types';

type Assignment = Database['public']['Tables']['assignments']['Row'];
type Student = Database['public']['Tables']['students']['Row'];
type Teacher = Database['public']['Tables']['teachers']['Row'];

interface AssignmentWithDetails extends Assignment {
  student: Student;
  teacher: Teacher;
}

interface NewAssignment {
  student_id: string;
  teacher_id: string;
  role: '面談担当（リスト編集可）' | '授業担当（コメントのみ）';
  assignment_start_date: string;
}

export default function AdminAssignmentManagementScreen() {
  const router = useRouter();
  const { administrator } = useAuth();

  const [assignments, setAssignments] = useState<AssignmentWithDetails[]>([]);
  const [filteredAssignments, setFilteredAssignments] = useState<AssignmentWithDetails[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | '有効' | '終了済み'>('all');
  const [roleFilter, setRoleFilter] = useState<'all' | '面談担当（リスト編集可）' | '授業担当（コメントのみ）'>('all');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [newAssignment, setNewAssignment] = useState<NewAssignment>({
    student_id: '',
    teacher_id: '',
    role: '面談担当（リスト編集可）',
    assignment_start_date: new Date().toISOString().split('T')[0],
  });
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);

      // 担当割り当て一覧を取得
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select(`
          *,
          students (*),
          teachers (*)
        `)
        .order('created_at', { ascending: false });

      if (assignmentsError) throw assignmentsError;

      // 生徒一覧を取得
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .eq('status', '在籍中')
        .order('full_name', { ascending: true });

      if (studentsError) throw studentsError;

      // 講師一覧を取得
      const { data: teachersData, error: teachersError } = await supabase
        .from('teachers')
        .select('*')
        .eq('account_status', '有効')
        .order('full_name', { ascending: true });

      if (teachersError) throw teachersError;

      const assignmentsWithDetails = (assignmentsData || []).map(assignment => ({
        ...assignment,
        student: assignment.students as Student,
        teacher: assignment.teachers as Teacher,
      }));

      setAssignments(assignmentsWithDetails);
      setFilteredAssignments(assignmentsWithDetails);
      setStudents(studentsData || []);
      setTeachers(teachersData || []);

    } catch (err) {
      console.error('Assignment data fetch error:', err);
      setError('データの取得に失敗しました');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // フィルタリング
  useEffect(() => {
    let filtered = assignments;

    // 検索フィルター
    if (searchQuery.trim()) {
      filtered = filtered.filter(assignment =>
        assignment.student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        assignment.teacher.full_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // ステータスフィルター
    if (statusFilter !== 'all') {
      filtered = filtered.filter(assignment => assignment.status === statusFilter);
    }

    // 役割フィルター
    if (roleFilter !== 'all') {
      filtered = filtered.filter(assignment => assignment.role === roleFilter);
    }

    setFilteredAssignments(filtered);
  }, [assignments, searchQuery, statusFilter, roleFilter]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const handleCreateAssignment = async () => {
    try {
      if (!newAssignment.student_id || !newAssignment.teacher_id) {
        Alert.alert('エラー', '生徒と講師を選択してください');
        return;
      }

      // 重複チェック
      const existingAssignment = assignments.find(a => 
        a.student_id === newAssignment.student_id && 
        a.teacher_id === newAssignment.teacher_id &&
        a.role === newAssignment.role &&
        a.status === '有効'
      );

      if (existingAssignment) {
        Alert.alert('エラー', '同じ生徒・講師・役割の有効な割り当てが既に存在します');
        return;
      }

      const { error } = await supabase
        .from('assignments')
        .insert([{
          student_id: newAssignment.student_id,
          teacher_id: newAssignment.teacher_id,
          role: newAssignment.role,
          assignment_start_date: newAssignment.assignment_start_date,
          status: '有効',
          notes: null,
        }]);

      if (error) throw error;

      Alert.alert('成功', '担当割り当てを作成しました');
      setCreateModalVisible(false);
      setNewAssignment({
        student_id: '',
        teacher_id: '',
        role: '面談担当（リスト編集可）',
        assignment_start_date: new Date().toISOString().split('T')[0],
      });
      fetchData();

    } catch (err) {
      console.error('Assignment creation error:', err);
      Alert.alert('エラー', '担当割り当ての作成に失敗しました');
    }
  };

  const handleEndAssignment = async (assignmentId: string) => {
    Alert.alert(
      '担当終了',
      '本当に担当を終了しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '終了',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('assignments')
                .update({
                  status: '終了済み',
                  assignment_end_date: new Date().toISOString().split('T')[0],
                })
                .eq('id', assignmentId);

              if (error) throw error;

              Alert.alert('成功', '担当を終了しました');
              fetchData();
            } catch (err) {
              console.error('Assignment end error:', err);
              Alert.alert('エラー', '担当終了に失敗しました');
            }
          }
        },
      ]
    );
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case '面談担当（リスト編集可）': return '#3B82F6';
      case '授業担当（コメントのみ）': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getRoleBgColor = (role: string) => {
    switch (role) {
      case '面談担当（リスト編集可）': return '#EBF8FF';
      case '授業担当（コメントのみ）': return '#ECFDF5';
      default: return '#F9FAFB';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '有効': return '#10B981';
      case '終了済み': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const renderAssignmentItem = (assignment: AssignmentWithDetails) => (
    <View key={assignment.id} style={styles.assignmentCard}>
      <View style={styles.assignmentHeader}>
        <View style={styles.assignmentInfo}>
          <Text style={styles.studentName}>{assignment.student.full_name}</Text>
          <Text style={styles.teacherName}>講師: {assignment.teacher.full_name}</Text>
          
          <View style={styles.badgeRow}>
            <View style={[
              styles.roleBadge,
              { backgroundColor: getRoleBgColor(assignment.role) }
            ]}>
              <Text style={[
                styles.roleBadgeText,
                { color: getRoleColor(assignment.role) }
              ]}>
                {assignment.role}
              </Text>
            </View>
            
            <View style={[
              styles.statusBadge,
              { backgroundColor: assignment.status === '有効' ? '#ECFDF5' : '#F9FAFB' }
            ]}>
              <Text style={[
                styles.statusBadgeText,
                { color: getStatusColor(assignment.status) }
              ]}>
                {assignment.status}
              </Text>
            </View>
          </View>
        </View>

        {assignment.status === '有効' && (
          <TouchableOpacity
            style={styles.endButton}
            onPress={() => handleEndAssignment(assignment.id)}
          >
            <X size={16} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.assignmentDetails}>
        <View style={styles.detailRow}>
          <Calendar size={16} color="#6B7280" />
          <Text style={styles.detailText}>
            開始: {assignment.assignment_start_date && !isNaN(new Date(assignment.assignment_start_date).getTime()) ? 
              format(new Date(assignment.assignment_start_date), 'yyyy年M月d日', { locale: ja }) : 
              '未設定'
            }
          </Text>
        </View>
        
        {assignment.assignment_end_date && (
          <View style={styles.detailRow}>
            <Calendar size={16} color="#6B7280" />
            <Text style={styles.detailText}>
              終了: {assignment.assignment_end_date && !isNaN(new Date(assignment.assignment_end_date).getTime()) ? 
                format(new Date(assignment.assignment_end_date), 'yyyy年M月d日', { locale: ja }) : 
                '日付不明'
              }
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <AdminGuard>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>担当割り当て管理</Text>
            <View style={{ width: 24 }} />
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#DC2626" />
            <Text style={styles.loadingText}>データを読み込み中...</Text>
          </View>
        </SafeAreaView>
      </AdminGuard>
    );
  }

  if (error) {
    return (
      <AdminGuard>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>担当割り当て管理</Text>
            <View style={{ width: 24 }} />
          </View>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
              <Text style={styles.retryButtonText}>再試行</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <SafeAreaView style={styles.container}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>担当割り当て管理</Text>
          <TouchableOpacity onPress={() => setCreateModalVisible(true)}>
            <Plus size={24} color="#374151" />
          </TouchableOpacity>
        </View>

        {/* 検索・フィルターバー */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Search size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="生徒名、講師名で検索..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
          
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setFilterModalVisible(true)}
          >
            <Filter size={20} color="#374151" />
          </TouchableOpacity>
        </View>

        {/* 統計情報 */}
        <View style={styles.statsBar}>
          <Text style={styles.statsText}>
            全{assignments.length}件 | 表示中{filteredAssignments.length}件
          </Text>
          <Text style={styles.filterInfo}>
            {statusFilter !== 'all' && `${statusFilter} | `}
            {roleFilter !== 'all' && roleFilter}
          </Text>
        </View>

        {/* 担当割り当て一覧 */}
        <ScrollView
          style={styles.list}
          contentContainerStyle={filteredAssignments.length === 0 ? styles.emptyContainer : undefined}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#DC2626']}
              tintColor="#DC2626"
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {filteredAssignments.length === 0 ? (
            <View style={styles.emptyState}>
              <Users size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>
                {searchQuery || statusFilter !== 'all' || roleFilter !== 'all'
                  ? '該当する担当割り当てが見つかりません'
                  : '担当割り当てがありません'
                }
              </Text>
            </View>
          ) : (
            filteredAssignments.map(renderAssignmentItem)
          )}
        </ScrollView>

        {/* 新規作成モーダル */}
        <Modal
          visible={createModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <Text style={styles.modalCancelText}>キャンセル</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>新規担当割り当て</Text>
              <TouchableOpacity onPress={handleCreateAssignment}>
                <Text style={styles.modalDoneText}>作成</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              {/* 生徒選択 */}
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>生徒</Text>
                <ScrollView style={styles.optionsContainer} nestedScrollEnabled>
                  {students.map(student => (
                    <TouchableOpacity
                      key={student.id}
                      style={[
                        styles.optionItem,
                        newAssignment.student_id === student.id && styles.selectedOption
                      ]}
                      onPress={() => setNewAssignment({...newAssignment, student_id: student.id})}
                    >
                      <Text style={[
                        styles.optionText,
                        newAssignment.student_id === student.id && styles.selectedOptionText
                      ]}>
                        {student.full_name} ({student.grade})
                      </Text>
                      {newAssignment.student_id === student.id && (
                        <CheckCircle2 size={20} color="#DC2626" />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* 講師選択 */}
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>講師</Text>
                <ScrollView style={styles.optionsContainer} nestedScrollEnabled>
                  {teachers.map(teacher => (
                    <TouchableOpacity
                      key={teacher.id}
                      style={[
                        styles.optionItem,
                        newAssignment.teacher_id === teacher.id && styles.selectedOption
                      ]}
                      onPress={() => setNewAssignment({...newAssignment, teacher_id: teacher.id})}
                    >
                      <Text style={[
                        styles.optionText,
                        newAssignment.teacher_id === teacher.id && styles.selectedOptionText
                      ]}>
                        {teacher.full_name}
                      </Text>
                      {newAssignment.teacher_id === teacher.id && (
                        <CheckCircle2 size={20} color="#DC2626" />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* 役割選択 */}
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>担当役割</Text>
                {(['面談担当（リスト編集可）', '授業担当（コメントのみ）'] as const).map(role => (
                  <TouchableOpacity
                    key={role}
                    style={[
                      styles.optionItem,
                      newAssignment.role === role && styles.selectedOption
                    ]}
                    onPress={() => setNewAssignment({...newAssignment, role})}
                  >
                    <Text style={[
                      styles.optionText,
                      newAssignment.role === role && styles.selectedOptionText
                    ]}>
                      {role}
                    </Text>
                    {newAssignment.role === role && (
                      <CheckCircle2 size={20} color="#DC2626" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* 開始日 */}
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>担当開始日</Text>
                <TextInput
                  style={styles.dateInput}
                  value={newAssignment.assignment_start_date}
                  onChangeText={(text) => setNewAssignment({...newAssignment, assignment_start_date: text})}
                  placeholder="YYYY-MM-DD"
                />
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* フィルターモーダル */}
        <Modal
          visible={filterModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Text style={styles.modalCancelText}>キャンセル</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>フィルター</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Text style={styles.modalDoneText}>完了</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalContent}>
              {/* ステータスフィルター */}
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>ステータス</Text>
                {(['all', '有効', '終了済み'] as const).map(status => (
                  <TouchableOpacity
                    key={status}
                    style={styles.optionItem}
                    onPress={() => setStatusFilter(status)}
                  >
                    <Text style={styles.optionText}>
                      {status === 'all' ? 'すべて' : status}
                    </Text>
                    {statusFilter === status && (
                      <CheckCircle2 size={20} color="#DC2626" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* 役割フィルター */}
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>担当役割</Text>
                {(['all', '面談担当（リスト編集可）', '授業担当（コメントのみ）'] as const).map(role => (
                  <TouchableOpacity
                    key={role}
                    style={styles.optionItem}
                    onPress={() => setRoleFilter(role)}
                  >
                    <Text style={styles.optionText}>
                      {role === 'all' ? 'すべて' : role}
                    </Text>
                    {roleFilter === role && (
                      <CheckCircle2 size={20} color="#DC2626" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </AdminGuard>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
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
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 12,
  },
  searchContainer: {
    flex: 1,
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
  filterButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
  },
  statsText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  filterInfo: {
    fontSize: 12,
    color: '#6B7280',
  },
  list: {
    flex: 1,
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
  assignmentCard: {
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
  assignmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  assignmentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  teacherName: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  endButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#FEF2F2',
  },
  assignmentDetails: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#6B7280',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalDoneText: {
    fontSize: 16,
    color: '#DC2626',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  formSection: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  optionsContainer: {
    maxHeight: 200,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectedOption: {
    backgroundColor: '#FEF2F2',
  },
  optionText: {
    fontSize: 16,
    color: '#374151',
    flex: 1,
  },
  selectedOptionText: {
    color: '#DC2626',
    fontWeight: '500',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
});