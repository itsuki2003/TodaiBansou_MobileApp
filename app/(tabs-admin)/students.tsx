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
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Users,
  Search,
  Filter,
  Plus,
  ChevronRight,
  User,
  Eye,
  Edit3,
  MoreVertical,
  CheckCircle2,
  Pause,
  X,
  School,
  Phone,
} from 'lucide-react-native';

import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { AdminGuard } from '../../components/common/RoleGuard';
import AppHeader from '../../components/ui/AppHeader';
import type { Database } from '../../types/database.types';

type Student = Database['public']['Tables']['students']['Row'];
type Assignment = Database['public']['Tables']['assignments']['Row'];

interface StudentWithDetails extends Student {
  assignedTeachers: Array<{
    teacher: {
      full_name: string;
      id: string;
    };
    role: string;
  }>;
  currentTodoList?: {
    id: string;
    target_week_start_date: string;
    tasks: Array<{
      is_completed: boolean;
    }>;
  };
  completionRate: number;
  lastActivity?: string;
}

type StatusFilter = 'all' | '在籍中' | '休会中' | '退会済み';
type SortOption = 'name' | 'enrollment_date' | 'grade';

export default function AdminStudentsScreen() {
  const router = useRouter();
  const { administrator } = useAuth();
  
  const [students, setStudents] = useState<StudentWithDetails[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStudents = useCallback(async () => {
    try {
      setError(null);

      // 生徒一覧を取得
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });

      if (studentsError) throw studentsError;

      // 各生徒の詳細情報を取得
      const studentsWithDetails = await Promise.all(
        (studentsData || []).map(async (student): Promise<StudentWithDetails> => {
          // 担当講師の取得
          const { data: assignmentsData } = await supabase
            .from('assignments')
            .select(`
              role,
              teachers (
                id,
                full_name
              )
            `)
            .eq('student_id', student.id)
            .eq('status', '有効');

          const assignedTeachers = assignmentsData?.map(assignment => ({
            teacher: assignment.teachers as { full_name: string; id: string },
            role: assignment.role,
          })) || [];

          // 最新のやることリストと進捗取得
          const { data: todoListData } = await supabase
            .from('todo_lists')
            .select(`
              id,
              target_week_start_date,
              tasks (is_completed)
            `)
            .eq('student_id', student.id)
            .eq('status', '公開済み')
            .order('target_week_start_date', { ascending: false })
            .limit(1)
            .single();

          let completionRate = 0;
          if (todoListData?.tasks && todoListData.tasks.length > 0) {
            const completedTasks = todoListData.tasks.filter(task => task.is_completed);
            completionRate = Math.round((completedTasks.length / todoListData.tasks.length) * 100);
          }

          return {
            ...student,
            assignedTeachers,
            currentTodoList: todoListData || undefined,
            completionRate,
            lastActivity: undefined, // TODO: 実装
          };
        })
      );

      setStudents(studentsWithDetails);
      setFilteredStudents(studentsWithDetails);

    } catch (err) {
      console.error('Students fetch error:', err);
      setError('生徒データの取得に失敗しました');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // フィルタリングとソート
  useEffect(() => {
    let filtered = students;

    // 検索フィルター
    if (searchQuery.trim()) {
      filtered = filtered.filter(student =>
        student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.furigana_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.parent_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.school_attended?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // ステータスフィルター
    if (statusFilter !== 'all') {
      filtered = filtered.filter(student => student.status === statusFilter);
    }

    // ソート
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.full_name.localeCompare(b.full_name, 'ja');
        case 'enrollment_date':
          return new Date(b.enrollment_date).getTime() - new Date(a.enrollment_date).getTime();
        case 'grade':
          return (a.grade || '').localeCompare(b.grade || '', 'ja');
        default:
          return 0;
      }
    });

    setFilteredStudents(filtered);
  }, [students, searchQuery, statusFilter, sortBy]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStudents();
  }, [fetchStudents]);

  const handleStudentPress = (studentId: string) => {
    router.push({
      pathname: '/admin-student-detail',
      params: { studentId }
    });
  };

  const handleAddStudent = () => {
    router.push('/(tabs-admin)/admin-student-form');
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

  const renderStudentItem = ({ item }: { item: StudentWithDetails }) => (
    <TouchableOpacity
      style={styles.studentCard}
      onPress={() => handleStudentPress(item.id)}
    >
      <View style={styles.studentHeader}>
        <View style={styles.studentIconContainer}>
          <User size={24} color="#3B82F6" />
        </View>
        <View style={styles.studentInfo}>
          <View style={styles.studentNameRow}>
            <Text style={styles.studentName}>{item.full_name}</Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: getStatusBgColor(item.status) }
            ]}>
              <Text style={[
                styles.statusText,
                { color: getStatusColor(item.status) }
              ]}>
                {item.status}
              </Text>
            </View>
          </View>
          {item.furigana_name && (
            <Text style={styles.studentFurigana}>{item.furigana_name}</Text>
          )}
          <View style={styles.studentMeta}>
            <Text style={styles.studentGrade}>{item.grade}</Text>
            {item.school_attended && (
              <View style={styles.schoolInfo}>
                <School size={12} color="#6B7280" />
                <Text style={styles.schoolText}>{item.school_attended}</Text>
              </View>
            )}
          </View>
        </View>
        <ChevronRight size={20} color="#9CA3AF" />
      </View>

      <View style={styles.studentStats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>担当講師</Text>
          <Text style={styles.statValue}>
            {item.assignedTeachers.length > 0 
              ? `${item.assignedTeachers.length}名`
              : '未割当'
            }
          </Text>
        </View>
        
        {item.currentTodoList && (
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>今週の進捗</Text>
            <View style={styles.progressContainer}>
              <Text style={styles.statValue}>{item.completionRate}%</Text>
              <CheckCircle2 size={14} color="#10B981" />
            </View>
          </View>
        )}
        
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>保護者</Text>
          <Text style={styles.statValue}>{item.parent_name}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Users size={48} color="#9CA3AF" />
      <Text style={styles.emptyStateText}>
        {searchQuery || statusFilter !== 'all' 
          ? '該当する生徒が見つかりません' 
          : '登録されている生徒がいません'
        }
      </Text>
      {!searchQuery && statusFilter === 'all' && (
        <TouchableOpacity style={styles.addButton} onPress={handleAddStudent}>
          <Plus size={16} color="#FFFFFF" />
          <Text style={styles.addButtonText}>生徒を追加</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <AdminGuard>
        <SafeAreaView style={styles.container}>
          <AppHeader title="生徒管理" />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#DC2626" />
            <Text style={styles.loadingText}>生徒データを読み込み中...</Text>
          </View>
        </SafeAreaView>
      </AdminGuard>
    );
  }

  if (error) {
    return (
      <AdminGuard>
        <SafeAreaView style={styles.container}>
          <AppHeader title="生徒管理" />
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchStudents}>
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
        <AppHeader
          title="生徒管理"
          rightElement={
            <TouchableOpacity onPress={handleAddStudent}>
              <Plus size={24} color="#374151" />
            </TouchableOpacity>
          }
        />

        {/* 検索・フィルターバー */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Search size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="生徒名、保護者名、塾名で検索..."
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
            全{students.length}名 | 表示中{filteredStudents.length}名
          </Text>
          <Text style={styles.filterInfo}>
            {statusFilter !== 'all' && `${statusFilter} | `}
            {sortBy === 'name' && '名前順'}
            {sortBy === 'enrollment_date' && '入会日順'}
            {sortBy === 'grade' && '学年順'}
          </Text>
        </View>

        {/* 生徒一覧 */}
        <ScrollView
          style={styles.list}
          contentContainerStyle={filteredStudents.length === 0 ? styles.emptyContainer : undefined}
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
          {filteredStudents.length === 0 ? (
            renderEmptyState()
          ) : (
            filteredStudents.map(student => (
              <View key={student.id}>
                {renderStudentItem({ item: student })}
              </View>
            ))
          )}
        </ScrollView>

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
              <Text style={styles.modalTitle}>フィルター・ソート</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Text style={styles.modalDoneText}>完了</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalContent}>
              {/* ステータスフィルター */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>在籍状況</Text>
                {(['all', '在籍中', '休会中', '退会済み'] as const).map(status => (
                  <TouchableOpacity
                    key={status}
                    style={styles.filterOption}
                    onPress={() => setStatusFilter(status)}
                  >
                    <Text style={styles.filterOptionText}>
                      {status === 'all' ? 'すべて' : status}
                    </Text>
                    {statusFilter === status && (
                      <CheckCircle2 size={20} color="#DC2626" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* ソートオプション */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>並び順</Text>
                {[
                  { key: 'name', label: '名前順' },
                  { key: 'enrollment_date', label: '入会日順' },
                  { key: 'grade', label: '学年順' },
                ].map(option => (
                  <TouchableOpacity
                    key={option.key}
                    style={styles.filterOption}
                    onPress={() => setSortBy(option.key as SortOption)}
                  >
                    <Text style={styles.filterOptionText}>{option.label}</Text>
                    {sortBy === option.key && (
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
    marginBottom: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
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
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  studentName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  studentFurigana: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  studentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  studentGrade: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  schoolInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  schoolText: {
    fontSize: 12,
    color: '#6B7280',
  },
  studentStats: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
    gap: 16,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  statValue: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
  },
  filterOptionText: {
    fontSize: 16,
    color: '#374151',
  },
});