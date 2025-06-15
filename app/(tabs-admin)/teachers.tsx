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
  UserCheck,
  Search,
  Filter,
  Plus,
  ChevronRight,
  User,
  Users,
  Eye,
  Edit3,
  MoreVertical,
  CheckCircle2,
  Clock,
  X,
  Mail,
  Phone,
  GraduationCap,
  MessageCircle,
} from 'lucide-react-native';

import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { AdminGuard } from '../../components/common/RoleGuard';
import AppHeader from '../../components/ui/AppHeader';
import type { Database } from '../../types/database.types';

type Teacher = Database['public']['Tables']['teachers']['Row'];
type Assignment = Database['public']['Tables']['assignments']['Row'];

interface TeacherWithDetails extends Teacher {
  assignedStudents: Array<{
    student: {
      full_name: string;
      id: string;
    };
    role: string;
  }>;
  totalAssignments: number;
  activeAssignments: number;
  lastLoginAt?: string;
}

type StatusFilter = 'all' | '有効' | '承認待ち' | '無効';
type SortOption = 'name' | 'registration_date' | 'last_activity';

export default function AdminTeachersScreen() {
  const router = useRouter();
  const { administrator } = useAuth();
  
  const [teachers, setTeachers] = useState<TeacherWithDetails[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<TeacherWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTeachers = useCallback(async () => {
    try {
      setError(null);

      // 講師一覧を取得
      const { data: teachersData, error: teachersError } = await supabase
        .from('teachers')
        .select('*')
        .order('created_at', { ascending: false });

      if (teachersError) throw teachersError;

      // 各講師の詳細情報を取得
      const teachersWithDetails = await Promise.all(
        (teachersData || []).map(async (teacher): Promise<TeacherWithDetails> => {
          // 担当生徒の取得
          const { data: assignmentsData } = await supabase
            .from('assignments')
            .select(`
              role,
              status,
              students (
                id,
                full_name
              )
            `)
            .eq('teacher_id', teacher.id);

          const activeAssignments = assignmentsData?.filter(a => a.status === '有効') || [];
          const assignedStudents = activeAssignments.map(assignment => ({
            student: assignment.students as { full_name: string; id: string },
            role: assignment.role,
          }));

          return {
            ...teacher,
            assignedStudents,
            totalAssignments: assignmentsData?.length || 0,
            activeAssignments: activeAssignments.length,
            lastLoginAt: undefined, // TODO: 実装
          };
        })
      );

      setTeachers(teachersWithDetails);
      setFilteredTeachers(teachersWithDetails);

    } catch (err) {
      console.error('Teachers fetch error:', err);
      setError('講師データの取得に失敗しました');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  // フィルタリングとソート
  useEffect(() => {
    let filtered = teachers;

    // 検索フィルター
    if (searchQuery.trim()) {
      filtered = filtered.filter(teacher =>
        teacher.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teacher.furigana_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teacher.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        teacher.education_background_university?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // ステータスフィルター
    if (statusFilter !== 'all') {
      filtered = filtered.filter(teacher => teacher.account_status === statusFilter);
    }

    // ソート
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.full_name.localeCompare(b.full_name, 'ja');
        case 'registration_date':
          const aDate = a.registration_application_date || a.created_at.split('T')[0];
          const bDate = b.registration_application_date || b.created_at.split('T')[0];
          return new Date(bDate).getTime() - new Date(aDate).getTime();
        case 'last_activity':
          // TODO: 最終ログイン日時でソート
          return a.full_name.localeCompare(b.full_name, 'ja');
        default:
          return 0;
      }
    });

    setFilteredTeachers(filtered);
  }, [teachers, searchQuery, statusFilter, sortBy]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTeachers();
  }, [fetchTeachers]);

  const handleTeacherPress = (teacherId: string) => {
    router.push({
      pathname: '/admin-teacher-detail',
      params: { teacherId }
    });
  };

  const handleTeacherApproval = async (teacherId: string, approve: boolean) => {
    try {
      const status = approve ? '有効' : '無効';
      const approvalDate = approve ? new Date().toISOString().split('T')[0] : null;
      
      const { error } = await supabase
        .from('teachers')
        .update({ 
          account_status: status,
          account_approval_date: approvalDate 
        })
        .eq('id', teacherId);

      if (error) throw error;

      Alert.alert(
        '処理完了',
        approve ? '講師を承認しました' : '講師を承認しませんでした',
        [{ text: 'OK' }]
      );
      
      fetchTeachers();
    } catch (err) {
      console.error('Teacher approval error:', err);
      Alert.alert('エラー', '処理に失敗しました');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '有効': return '#10B981';
      case '承認待ち': return '#F59E0B';
      case '無効': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case '有効': return '#ECFDF5';
      case '承認待ち': return '#FFFBEB';
      case '無効': return '#FEF2F2';
      default: return '#F9FAFB';
    }
  };

  const renderTeacherItem = ({ item }: { item: TeacherWithDetails }) => (
    <TouchableOpacity
      style={styles.teacherCard}
      onPress={() => handleTeacherPress(item.id)}
    >
      <View style={styles.teacherHeader}>
        <View style={styles.teacherIconContainer}>
          <UserCheck size={24} color="#10B981" />
        </View>
        <View style={styles.teacherInfo}>
          <View style={styles.teacherNameRow}>
            <Text style={styles.teacherName}>{item.full_name}</Text>
            <View style={[
              styles.statusBadge,
              { backgroundColor: getStatusBgColor(item.account_status) }
            ]}>
              <Text style={[
                styles.statusText,
                { color: getStatusColor(item.account_status) }
              ]}>
                {item.account_status}
              </Text>
            </View>
          </View>
          {item.furigana_name && (
            <Text style={styles.teacherFurigana}>{item.furigana_name}</Text>
          )}
          <View style={styles.teacherMeta}>
            <View style={styles.universityInfo}>
              <GraduationCap size={12} color="#6B7280" />
              <Text style={styles.universityText}>
                {item.education_background_university || '大学情報なし'}
              </Text>
            </View>
          </View>
        </View>
        
        {item.account_status === '承認待ち' && (
          <View style={styles.approvalActions}>
            <TouchableOpacity
              style={styles.approveButton}
              onPress={() => handleTeacherApproval(item.id, true)}
            >
              <CheckCircle2 size={16} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.rejectButton}
              onPress={() => handleTeacherApproval(item.id, false)}
            >
              <X size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        )}
        
        <ChevronRight size={20} color="#9CA3AF" />
      </View>

      <View style={styles.teacherStats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>担当生徒</Text>
          <Text style={styles.statValue}>
            {item.activeAssignments > 0 
              ? `${item.activeAssignments}名`
              : '未割当'
            }
          </Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>連絡先</Text>
          <View style={styles.contactInfo}>
            <Mail size={12} color="#6B7280" />
            <Text style={styles.statValue} numberOfLines={1}>{item.email}</Text>
          </View>
        </View>
        
        {item.phone_number && (
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>電話</Text>
            <View style={styles.contactInfo}>
              <Phone size={12} color="#6B7280" />
              <Text style={styles.statValue}>{item.phone_number}</Text>
            </View>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <UserCheck size={48} color="#9CA3AF" />
      <Text style={styles.emptyStateText}>
        {searchQuery || statusFilter !== 'all' 
          ? '該当する講師が見つかりません' 
          : '登録されている講師がいません'
        }
      </Text>
    </View>
  );

  if (loading) {
    return (
      <AdminGuard>
        <SafeAreaView style={styles.container}>
          <AppHeader title="講師管理" />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#DC2626" />
            <Text style={styles.loadingText}>講師データを読み込み中...</Text>
          </View>
        </SafeAreaView>
      </AdminGuard>
    );
  }

  if (error) {
    return (
      <AdminGuard>
        <SafeAreaView style={styles.container}>
          <AppHeader title="講師管理" />
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchTeachers}>
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
          title="講師管理"
          rightElement={
            <View style={styles.headerActions}>
              <TouchableOpacity onPress={() => router.push('/admin-assignment-management')}>
                <Users size={24} color="#374151" />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/admin-teacher-applications' as any)}>
                <Plus size={24} color="#374151" />
              </TouchableOpacity>
            </View>
          }
        />

        {/* 検索・フィルターバー */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Search size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="講師名、メール、大学名で検索..."
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
            全{teachers.length}名 | 表示中{filteredTeachers.length}名
          </Text>
          <Text style={styles.filterInfo}>
            {statusFilter !== 'all' && `${statusFilter} | `}
            {sortBy === 'name' && '名前順'}
            {sortBy === 'registration_date' && '登録日順'}
            {sortBy === 'last_activity' && '活動順'}
          </Text>
        </View>

        {/* 講師一覧 */}
        <ScrollView
          style={styles.list}
          contentContainerStyle={filteredTeachers.length === 0 ? styles.emptyContainer : undefined}
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
          {filteredTeachers.length === 0 ? (
            renderEmptyState()
          ) : (
            filteredTeachers.map(teacher => (
              <View key={teacher.id}>
                {renderTeacherItem({ item: teacher })}
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
                <Text style={styles.filterSectionTitle}>アカウント状況</Text>
                {(['all', '有効', '承認待ち', '無効'] as const).map(status => (
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
                  { key: 'registration_date', label: '登録日順' },
                  { key: 'last_activity', label: '最終活動順' },
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
  },
  teacherCard: {
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
  teacherHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  teacherIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  teacherInfo: {
    flex: 1,
  },
  teacherNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  teacherName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  teacherFurigana: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  teacherMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  universityInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  universityText: {
    fontSize: 12,
    color: '#6B7280',
  },
  approvalActions: {
    flexDirection: 'row',
    gap: 8,
    marginRight: 8,
  },
  approveButton: {
    backgroundColor: '#10B981',
    padding: 8,
    borderRadius: 6,
  },
  rejectButton: {
    backgroundColor: '#EF4444',
    padding: 8,
    borderRadius: 6,
  },
  teacherStats: {
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
  contactInfo: {
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});