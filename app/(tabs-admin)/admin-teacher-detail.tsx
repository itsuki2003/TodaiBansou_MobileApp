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
  Image,
  Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  UserCheck,
  User,
  Mail,
  Phone,
  GraduationCap,
  MapPin,
  Calendar,
  Edit3,
  Trash2,
  CheckCircle2,
  X,
  Users,
  BookOpen,
  MessageCircle,
  Eye,
  Award,
  Star,
} from 'lucide-react-native';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { AdminGuard } from '@/components/common/RoleGuard';
import type { Database } from '@/types/database.types';

type Teacher = Database['public']['Tables']['teachers']['Row'];
type Assignment = Database['public']['Tables']['assignments']['Row'];
type Student = Database['public']['Tables']['students']['Row'];

interface TeacherWithDetails extends Teacher {
  assignedStudents: Array<{
    student: Student;
    role: string;
    assignment_start_date: string | null;
    assignment_id: string;
  }>;
  totalAssignments: number;
  activeAssignments: number;
  recentActivity?: {
    lastComment?: string;
    lastLogin?: string;
  };
}

export default function AdminTeacherDetailScreen() {
  const router = useRouter();
  const { teacherId } = useLocalSearchParams<{ teacherId: string }>();
  const { administrator } = useAuth();

  const [teacher, setTeacher] = useState<TeacherWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTeacherDetails = useCallback(async () => {
    if (!teacherId) return;

    try {
      setError(null);

      // 講師基本情報を取得
      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .select('*')
        .eq('id', teacherId)
        .single();

      if (teacherError) throw teacherError;
      if (!teacherData) throw new Error('講師が見つかりません');

      // 担当生徒の詳細情報を取得
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select(`
          id,
          role,
          assignment_start_date,
          assignment_end_date,
          status,
          students (*)
        `)
        .eq('teacher_id', teacherId);

      if (assignmentsError) throw assignmentsError;

      const activeAssignments = assignmentsData?.filter(a => a.status === '有効') || [];
      const assignedStudents = activeAssignments.map(assignment => ({
        student: assignment.students as Student,
        role: assignment.role,
        assignment_start_date: assignment.assignment_start_date,
        assignment_id: assignment.id,
      }));

      const teacherWithDetails: TeacherWithDetails = {
        ...teacherData,
        assignedStudents,
        totalAssignments: assignmentsData?.length || 0,
        activeAssignments: activeAssignments.length,
        recentActivity: {
          // TODO: 実装
          lastComment: undefined,
          lastLogin: undefined,
        },
      };

      setTeacher(teacherWithDetails);

    } catch (err) {
      console.error('Teacher details fetch error:', err);
      setError('講師情報の取得に失敗しました');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [teacherId]);

  useEffect(() => {
    fetchTeacherDetails();
  }, [fetchTeacherDetails]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTeacherDetails();
  }, [fetchTeacherDetails]);

  const handleApproval = async (approve: boolean) => {
    if (!teacher) return;

    try {
      const status = approve ? '有効' : '無効';
      const approvalDate = approve ? new Date().toISOString().split('T')[0] : null;
      
      const { error } = await supabase
        .from('teachers')
        .update({ 
          account_status: status,
          account_approval_date: approvalDate 
        })
        .eq('id', teacher.id);

      if (error) throw error;

      Alert.alert(
        '処理完了',
        approve ? '講師を承認しました' : '講師を承認しませんでした',
        [{ text: 'OK' }]
      );
      
      fetchTeacherDetails();
    } catch (err) {
      console.error('Teacher approval error:', err);
      Alert.alert('エラー', '処理に失敗しました');
    }
  };

  const handleContactPress = (type: 'email' | 'phone', value: string) => {
    if (type === 'email') {
      Linking.openURL(`mailto:${value}`);
    } else if (type === 'phone') {
      Linking.openURL(`tel:${value}`);
    }
  };

  const handleStudentPress = (studentId: string) => {
    router.push({
      pathname: '/(tabs-admin)/admin-student-detail',
      params: { studentId }
    });
  };

  const handleEditPress = () => {
    router.push({
      pathname: '/admin-teacher-edit',
      params: { teacherId: teacher?.id }
    });
  };

  const handleDeletePress = () => {
    Alert.alert(
      '講師アカウント削除',
      '本当に削除しますか？この操作は取り消せません。',
      [
        { text: 'キャンセル', style: 'cancel' },
        { 
          text: '削除', 
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: 削除処理の実装
              Alert.alert('注意', '削除機能は開発中です');
            } catch (err) {
              Alert.alert('エラー', '削除に失敗しました');
            }
          }
        },
      ]
    );
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

  if (loading) {
    return (
      <AdminGuard>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>講師詳細</Text>
            <View style={{ width: 24 }} />
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#DC2626" />
            <Text style={styles.loadingText}>講師情報を読み込み中...</Text>
          </View>
        </SafeAreaView>
      </AdminGuard>
    );
  }

  if (error || !teacher) {
    return (
      <AdminGuard>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>講師詳細</Text>
            <View style={{ width: 24 }} />
          </View>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error || '講師が見つかりません'}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchTeacherDetails}>
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
          <Text style={styles.headerTitle}>講師詳細</Text>
          <TouchableOpacity onPress={handleEditPress}>
            <Edit3 size={24} color="#374151" />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
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
          {/* 基本情報カード */}
          <View style={styles.profileCard}>
            <View style={styles.profileHeader}>
              <View style={styles.profileImageContainer}>
                {teacher.profile_formal_photo_url ? (
                  <Image 
                    source={{ uri: teacher.profile_formal_photo_url }} 
                    style={styles.profileImage}
                  />
                ) : (
                  <UserCheck size={32} color="#10B981" />
                )}
              </View>
              <View style={styles.profileInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.teacherName}>{teacher.full_name}</Text>
                  <View style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusBgColor(teacher.account_status) }
                  ]}>
                    <Text style={[
                      styles.statusText,
                      { color: getStatusColor(teacher.account_status) }
                    ]}>
                      {teacher.account_status}
                    </Text>
                  </View>
                </View>
                {teacher.furigana_name && (
                  <Text style={styles.furiganaName}>{teacher.furigana_name}</Text>
                )}
              </View>
            </View>

            {/* 承認待ちの場合のアクションボタン */}
            {teacher.account_status === '承認待ち' && (
              <View style={styles.approvalSection}>
                <TouchableOpacity
                  style={styles.approveButton}
                  onPress={() => handleApproval(true)}
                >
                  <CheckCircle2 size={20} color="#FFFFFF" />
                  <Text style={styles.approveButtonText}>承認</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.rejectButton}
                  onPress={() => handleApproval(false)}
                >
                  <X size={20} color="#FFFFFF" />
                  <Text style={styles.rejectButtonText}>否認</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* 連絡先情報 */}
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>連絡先情報</Text>
            
            <TouchableOpacity 
              style={styles.infoRow}
              onPress={() => handleContactPress('email', teacher.email)}
            >
              <Mail size={20} color="#6B7280" />
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>メールアドレス</Text>
                <Text style={styles.infoValue}>{teacher.email}</Text>
              </View>
            </TouchableOpacity>

            {teacher.phone_number && (
              <TouchableOpacity 
                style={styles.infoRow}
                onPress={() => handleContactPress('phone', teacher.phone_number!)}
              >
                <Phone size={20} color="#6B7280" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>電話番号</Text>
                  <Text style={styles.infoValue}>{teacher.phone_number}</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>

          {/* 学歴情報 */}
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>学歴情報</Text>
            
            {teacher.education_background_university && (
              <View style={styles.infoRow}>
                <GraduationCap size={20} color="#6B7280" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>大学</Text>
                  <Text style={styles.infoValue}>{teacher.education_background_university}</Text>
                </View>
              </View>
            )}

            {teacher.education_background_faculty && (
              <View style={styles.infoRow}>
                <BookOpen size={20} color="#6B7280" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>学部</Text>
                  <Text style={styles.infoValue}>{teacher.education_background_faculty}</Text>
                </View>
              </View>
            )}

            {teacher.education_background_cram_school && (
              <View style={styles.infoRow}>
                <Award size={20} color="#6B7280" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>塾歴</Text>
                  <Text style={styles.infoValue}>{teacher.education_background_cram_school}</Text>
                </View>
              </View>
            )}
          </View>

          {/* アピールポイント */}
          {teacher.appeal_points && (
            <View style={styles.infoCard}>
              <Text style={styles.cardTitle}>アピールポイント</Text>
              <Text style={styles.appealText}>{teacher.appeal_points}</Text>
            </View>
          )}

          {/* 趣味・特技 */}
          {teacher.hobbies_special_skills && (
            <View style={styles.infoCard}>
              <Text style={styles.cardTitle}>趣味・特技</Text>
              <Text style={styles.appealText}>{teacher.hobbies_special_skills}</Text>
            </View>
          )}

          {/* 担当生徒情報 */}
          <View style={styles.infoCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>担当生徒</Text>
              <Text style={styles.studentCount}>
                {teacher.activeAssignments}名 / 全{teacher.totalAssignments}名
              </Text>
            </View>

            {teacher.assignedStudents.length === 0 ? (
              <View style={styles.emptyStudents}>
                <Users size={32} color="#9CA3AF" />
                <Text style={styles.emptyStudentsText}>担当生徒がいません</Text>
              </View>
            ) : (
              teacher.assignedStudents.map((assignment) => (
                <TouchableOpacity
                  key={assignment.assignment_id}
                  style={styles.studentItem}
                  onPress={() => handleStudentPress(assignment.student.id)}
                >
                  <View style={styles.studentIcon}>
                    <User size={16} color="#3B82F6" />
                  </View>
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>{assignment.student.full_name}</Text>
                    <Text style={styles.studentRole}>{assignment.role}</Text>
                    {assignment.assignment_start_date && (
                      <Text style={styles.assignmentDate}>
                        {assignment.assignment_start_date && !isNaN(new Date(assignment.assignment_start_date).getTime()) ? 
                          format(new Date(assignment.assignment_start_date), 'yyyy年M月d日', { locale: ja }) + 'から担当' : 
                          '担当開始日不明'
                        }
                      </Text>
                    )}
                  </View>
                  <ChevronRight size={16} color="#9CA3AF" />
                </TouchableOpacity>
              ))
            )}
          </View>

          {/* 管理者用メモ */}
          {teacher.notes_admin_only && (
            <View style={styles.infoCard}>
              <Text style={styles.cardTitle}>管理者メモ</Text>
              <Text style={styles.notesText}>{teacher.notes_admin_only}</Text>
            </View>
          )}

          {/* 登録・承認日時 */}
          <View style={styles.infoCard}>
            <Text style={styles.cardTitle}>登録情報</Text>
            
            {teacher.registration_application_date && (
              <View style={styles.infoRow}>
                <Calendar size={20} color="#6B7280" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>登録申請日</Text>
                  <Text style={styles.infoValue}>
                    {teacher.registration_application_date && !isNaN(new Date(teacher.registration_application_date).getTime()) ? 
                      format(new Date(teacher.registration_application_date), 'yyyy年M月d日', { locale: ja }) : 
                      '日付不明'
                    }
                  </Text>
                </View>
              </View>
            )}

            {teacher.account_approval_date && (
              <View style={styles.infoRow}>
                <CheckCircle2 size={20} color="#10B981" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>アカウント承認日</Text>
                  <Text style={styles.infoValue}>
                    {teacher.account_approval_date && !isNaN(new Date(teacher.account_approval_date).getTime()) ? 
                      format(new Date(teacher.account_approval_date), 'yyyy年M月d日', { locale: ja }) : 
                      '日付不明'
                    }
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* 危険エリア */}
          <View style={styles.dangerCard}>
            <Text style={styles.dangerTitle}>危険エリア</Text>
            <TouchableOpacity style={styles.deleteButton} onPress={handleDeletePress}>
              <Trash2 size={20} color="#EF4444" />
              <Text style={styles.deleteButtonText}>講師アカウントを削除</Text>
            </TouchableOpacity>
          </View>

          {/* 底部余白 */}
          <View style={styles.bottomSpacing} />
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
  content: {
    flex: 1,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 20,
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
    marginBottom: 16,
  },
  profileImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  teacherName: {
    fontSize: 22,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginLeft: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  furiganaName: {
    fontSize: 16,
    color: '#6B7280',
  },
  approvalSection: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  approveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  rejectButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  studentCount: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  appealText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  emptyStudents: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyStudentsText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 8,
  },
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  studentIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EBF8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  studentRole: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
    marginBottom: 2,
  },
  assignmentDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  notesText: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: 8,
  },
  dangerCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  dangerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 12,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
    gap: 8,
  },
  deleteButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '500',
  },
  bottomSpacing: {
    height: 20,
  },
});