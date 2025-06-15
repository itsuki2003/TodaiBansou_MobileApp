import React, { useState, useEffect } from 'react';
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
import { useRouter } from 'expo-router';
import {
  Users,
  UserCheck,
  BookOpen,
  Calendar,
  Bell,
  Settings,
  BarChart3,
  Shield,
  ChevronRight,
  AlertTriangle,
  Clock,
  CheckCircle2,
  TrendingUp,
  Activity,
} from 'lucide-react-native';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { AdminGuard } from '../../components/common/RoleGuard';
import AppHeader from '../../components/ui/AppHeader';

interface AdminStats {
  totalStudents: number;
  activeStudents: number;
  onLeaveStudents: number;
  totalTeachers: number;
  activeTeachers: number;
  pendingTeacherApplications: number;
  activeNotifications: number;
  thisWeekLessons: number;
  todayLessons: number;
  completedTasks: number;
  totalTasks: number;
  pendingAbsenceRequests: number;
  pendingAdditionalLessonRequests: number;
  recentActivities: ActivityItem[];
}

interface ActivityItem {
  id: string;
  type: 'student_registered' | 'teacher_applied' | 'lesson_completed' | 'absence_requested' | 'additional_lesson_requested';
  description: string;
  timestamp: string;
  relatedId?: string;
}

export default function AdminHomeScreen() {
  const router = useRouter();
  const { user, userRole, userRoleLoading, administrator } = useAuth();
  
  const [stats, setStats] = useState<AdminStats>({
    totalStudents: 0,
    activeStudents: 0,
    onLeaveStudents: 0,
    totalTeachers: 0,
    activeTeachers: 0,
    pendingTeacherApplications: 0,
    activeNotifications: 0,
    thisWeekLessons: 0,
    todayLessons: 0,
    completedTasks: 0,
    totalTasks: 0,
    pendingAbsenceRequests: 0,
    pendingAdditionalLessonRequests: 0,
    recentActivities: [],
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // リダイレクト制御
  useEffect(() => {
    if (!userRoleLoading && (!user || userRole !== 'admin')) {
      router.replace('/');
    }
  }, [user, userRole, userRoleLoading]);

  const fetchAdminStats = async () => {
    try {
      setError(null);
      
      const today = new Date().toISOString().split('T')[0];
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1); // 月曜日を週の開始とする
      const weekStartStr = weekStart.toISOString().split('T')[0];
      
      // 基本統計を並行取得
      const [
        // 生徒関連
        totalStudentsResult,
        activeStudentsResult,
        onLeaveStudentsResult,
        
        // 講師関連
        totalTeachersResult,
        activeTeachersResult,
        pendingTeachersResult,
        
        // お知らせ
        notificationsResult,
        
        // 授業関連
        thisWeekLessonsResult,
        todayLessonsResult,
        
        // タスク関連
        tasksResult,
        
        // 申請関連
        absenceRequestsResult,
        additionalLessonRequestsResult,
      ] = await Promise.all([
        // 全生徒数
        supabase
          .from('students')
          .select('id', { count: 'exact', head: true }),
          
        // 在籍中生徒数
        supabase
          .from('students')
          .select('id', { count: 'exact', head: true })
          .eq('status', '在籍中'),
          
        // 休会中生徒数
        supabase
          .from('students')
          .select('id', { count: 'exact', head: true })
          .eq('status', '休会中'),
        
        // 全講師数
        supabase
          .from('teachers')
          .select('id', { count: 'exact', head: true }),
          
        // 有効講師数
        supabase
          .from('teachers')
          .select('id', { count: 'exact', head: true })
          .eq('account_status', '有効'),
          
        // 承認待ち講師数
        supabase
          .from('teachers')
          .select('id', { count: 'exact', head: true })
          .eq('account_status', '承認待ち'),
        
        // 配信済みお知らせ数
        supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('status', '配信済み'),
        
        // 今週の授業数
        supabase
          .from('lesson_slots')
          .select('id', { count: 'exact', head: true })
          .gte('slot_date', weekStartStr)
          .neq('status', '欠席'),
          
        // 今日の授業数
        supabase
          .from('lesson_slots')
          .select('id', { count: 'exact', head: true })
          .eq('slot_date', today)
          .neq('status', '欠席'),
        
        // 全タスク数と完了タスク数
        supabase
          .from('tasks')
          .select('id, is_completed', { count: 'exact' }),
        
        // 未処理の欠席申請
        supabase
          .from('absence_requests')
          .select('id', { count: 'exact', head: true })
          .eq('status', '未振替'),
        
        // 未処理の追加授業申請
        supabase
          .from('additional_lesson_requests')
          .select('id', { count: 'exact', head: true })
          .eq('status', '申請中'),
      ]);

      // タスク統計の計算
      const allTasks = tasksResult.data || [];
      const completedTasks = allTasks.filter(task => task.is_completed).length;
      const totalTasks = allTasks.length;

      // 最近のアクティビティを取得
      const recentActivities = await fetchRecentActivities();

      setStats({
        totalStudents: totalStudentsResult.count || 0,
        activeStudents: activeStudentsResult.count || 0,
        onLeaveStudents: onLeaveStudentsResult.count || 0,
        totalTeachers: totalTeachersResult.count || 0,
        activeTeachers: activeTeachersResult.count || 0,
        pendingTeacherApplications: pendingTeachersResult.count || 0,
        activeNotifications: notificationsResult.count || 0,
        thisWeekLessons: thisWeekLessonsResult.count || 0,
        todayLessons: todayLessonsResult.count || 0,
        completedTasks,
        totalTasks,
        pendingAbsenceRequests: absenceRequestsResult.count || 0,
        pendingAdditionalLessonRequests: additionalLessonRequestsResult.count || 0,
        recentActivities,
      });

    } catch (err) {
      console.error('Admin stats fetch error:', err);
      setError('統計データの取得に失敗しました');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchRecentActivities = async (): Promise<ActivityItem[]> => {
    try {
      const activities: ActivityItem[] = [];
      
      // 最近の生徒登録（過去7日間）
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const { data: recentStudents } = await supabase
        .from('students')
        .select('id, full_name, created_at')
        .gte('created_at', weekAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(5);
      
      recentStudents?.forEach(student => {
        activities.push({
          id: `student_${student.id}`,
          type: 'student_registered',
          description: `${student.full_name}さんが新規登録されました`,
          timestamp: student.created_at,
          relatedId: student.id,
        });
      });

      // 最近の講師申請（過去7日間）
      const { data: recentTeachers } = await supabase
        .from('teachers')
        .select('id, full_name, registration_application_date')
        .not('registration_application_date', 'is', null)
        .gte('registration_application_date', weekAgo.toISOString().split('T')[0])
        .order('registration_application_date', { ascending: false })
        .limit(5);
      
      recentTeachers?.forEach(teacher => {
        if (teacher.registration_application_date) {
          activities.push({
            id: `teacher_${teacher.id}`,
            type: 'teacher_applied',
            description: `${teacher.full_name}さんが講師登録申請しました`,
            timestamp: teacher.registration_application_date + 'T00:00:00.000Z',
            relatedId: teacher.id,
          });
        }
      });

      // 最近の欠席申請（過去7日間）
      const { data: recentAbsences } = await supabase
        .from('absence_requests')
        .select(`
          id, 
          created_at,
          students (full_name)
        `)
        .gte('created_at', weekAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(5);
      
      recentAbsences?.forEach(absence => {
        activities.push({
          id: `absence_${absence.id}`,
          type: 'absence_requested',
          description: `${(absence.students as any)?.full_name}さんから欠席申請がありました`,
          timestamp: absence.created_at,
          relatedId: absence.id,
        });
      });

      // タイムスタンプでソート（有効な日付のみ）
      activities.sort((a, b) => {
        const dateA = new Date(a.timestamp);
        const dateB = new Date(b.timestamp);
        
        // 無効な日付はソートから除外
        if (isNaN(dateA.getTime())) return 1;
        if (isNaN(dateB.getTime())) return -1;
        
        return dateB.getTime() - dateA.getTime();
      });
      
      return activities.slice(0, 10); // 最新10件
    } catch (error) {
      console.error('Recent activities fetch error:', error);
      return [];
    }
  };

  useEffect(() => {
    if (administrator) {
      fetchAdminStats();
      
      // リアルタイム更新の設定（5分間隔）
      const interval = setInterval(() => {
        fetchAdminStats();
      }, 5 * 60 * 1000); // 5分

      return () => clearInterval(interval);
    }
  }, [administrator]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAdminStats();
  };

  const quickActions = [
    {
      title: '生徒管理',
      subtitle: '生徒の登録・編集',
      icon: Users,
      color: '#3B82F6',
      onPress: () => router.push('/(tabs-admin)/students'),
    },
    {
      title: '講師管理',
      subtitle: '講師の管理・承認',
      icon: UserCheck,
      color: '#10B981',
      onPress: () => router.push('/(tabs-admin)/teachers'),
    },
    {
      title: 'やることリスト',
      subtitle: '学習プラン管理',
      icon: BookOpen,
      color: '#F59E0B',
      onPress: () => router.push('/admin/todo-lists' as any),
    },
    {
      title: '担当割り当て管理',
      subtitle: '生徒・講師の担当設定',
      icon: Users,
      color: '#8B5CF6',
      onPress: () => router.push('/admin-assignment-management'),
    },
    {
      title: 'スケジュール管理',
      subtitle: '授業・面談管理',
      icon: Calendar,
      color: '#8B5CF6',
      onPress: () => router.push('/(tabs-admin)/schedule'),
    },
    {
      title: 'お知らせ管理',
      subtitle: 'お知らせの作成・配信',
      icon: Bell,
      color: '#EF4444',
      onPress: () => router.push('/admin-notifications'),
    },
    {
      title: 'システム設定',
      subtitle: '管理者設定',
      icon: Settings,
      color: '#6B7280',
      onPress: () => router.push('/(tabs-admin)/settings'),
    },
  ];

  if (loading && !refreshing) {
    return (
      <AdminGuard>
        <SafeAreaView style={styles.container}>
          <AppHeader title="管理画面" />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#DC2626" />
            <Text style={styles.loadingText}>管理画面を読み込み中...</Text>
          </View>
        </SafeAreaView>
      </AdminGuard>
    );
  }

  if (error) {
    return (
      <AdminGuard>
        <SafeAreaView style={styles.container}>
          <AppHeader title="管理画面" />
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchAdminStats}>
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
        <View style={styles.headerContent}>
          <Text style={styles.greeting}>
            管理画面{administrator?.full_name ? ` - ${administrator.full_name}` : ''}
          </Text>
          <Text style={styles.subtitle}>東大伴走システム</Text>
        </View>
        <View style={styles.adminBadge}>
          <Shield size={16} color="#FFFFFF" />
          <Text style={styles.adminBadgeText}>管理者</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#DC2626']}
            tintColor="#DC2626"
          />
        }
      >
        {/* 主要統計カード */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>システム概要</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statHeader}>
                <Users size={20} color="#3B82F6" />
                <Text style={styles.statNumber}>{stats.activeStudents}</Text>
              </View>
              <Text style={styles.statLabel}>在籍生徒数</Text>
              <Text style={styles.statSubLabel}>総数: {stats.totalStudents} | 休会: {stats.onLeaveStudents}</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={styles.statHeader}>
                <UserCheck size={20} color="#10B981" />
                <Text style={styles.statNumber}>{stats.activeTeachers}</Text>
              </View>
              <Text style={styles.statLabel}>活動講師数</Text>
              <Text style={styles.statSubLabel}>
                {stats.pendingTeacherApplications > 0 ? `承認待ち: ${stats.pendingTeacherApplications}件` : '申請なし'}
              </Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={styles.statHeader}>
                <Calendar size={20} color="#F59E0B" />
                <Text style={styles.statNumber}>{stats.todayLessons}</Text>
              </View>
              <Text style={styles.statLabel}>今日の授業</Text>
              <Text style={styles.statSubLabel}>今週計: {stats.thisWeekLessons}件</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={styles.statHeader}>
                <CheckCircle2 size={20} color="#8B5CF6" />
                <Text style={styles.statNumber}>
                  {stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%
                </Text>
              </View>
              <Text style={styles.statLabel}>タスク完了率</Text>
              <Text style={styles.statSubLabel}>{stats.completedTasks}/{stats.totalTasks} 完了</Text>
            </View>
          </View>
        </View>

        {/* 要対応項目 */}
        {(stats.pendingAbsenceRequests > 0 || stats.pendingAdditionalLessonRequests > 0 || stats.pendingTeacherApplications > 0) && (
          <View style={styles.alertSection}>
            <Text style={styles.sectionTitle}>要対応項目</Text>
            
            {stats.pendingTeacherApplications > 0 && (
              <TouchableOpacity style={styles.alertCard} onPress={() => router.push('/(tabs-admin)/teachers')}>
                <UserCheck size={24} color="#3B82F6" />
                <View style={styles.alertContent}>
                  <Text style={styles.alertTitle}>講師登録申請</Text>
                  <Text style={styles.alertSubtitle}>{stats.pendingTeacherApplications}件の申請が承認待ちです</Text>
                </View>
                <ChevronRight size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
            
            {stats.pendingAbsenceRequests > 0 && (
              <TouchableOpacity style={styles.alertCard}>
                <AlertTriangle size={24} color="#F59E0B" />
                <View style={styles.alertContent}>
                  <Text style={styles.alertTitle}>欠席申請</Text>
                  <Text style={styles.alertSubtitle}>{stats.pendingAbsenceRequests}件の振替処理が必要です</Text>
                </View>
                <ChevronRight size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
            
            {stats.pendingAdditionalLessonRequests > 0 && (
              <TouchableOpacity style={styles.alertCard}>
                <Calendar size={24} color="#8B5CF6" />
                <View style={styles.alertContent}>
                  <Text style={styles.alertTitle}>追加授業申請</Text>
                  <Text style={styles.alertSubtitle}>{stats.pendingAdditionalLessonRequests}件の申請が処理待ちです</Text>
                </View>
                <ChevronRight size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* 最近のアクティビティ */}
        {stats.recentActivities.length > 0 && (
          <View style={styles.activitySection}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Activity size={20} color="#6B7280" />
                <Text style={styles.sectionTitle}>最近のアクティビティ</Text>
              </View>
            </View>
            
            <View style={styles.activityList}>
              {stats.recentActivities.slice(0, 5).map((activity) => (
                <View key={activity.id} style={styles.activityItem}>
                  <View style={styles.activityIcon}>
                    {activity.type === 'student_registered' && <Users size={16} color="#3B82F6" />}
                    {activity.type === 'teacher_applied' && <UserCheck size={16} color="#10B981" />}
                    {activity.type === 'absence_requested' && <AlertTriangle size={16} color="#F59E0B" />}
                    {activity.type === 'additional_lesson_requested' && <Calendar size={16} color="#8B5CF6" />}
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityDescription}>{activity.description}</Text>
                    <Text style={styles.activityTime}>
                      {activity.timestamp && !isNaN(new Date(activity.timestamp).getTime()) ? 
                        format(new Date(activity.timestamp), 'M月d日 HH:mm', { locale: ja }) : 
                        '日時不明'
                      }
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* クイックアクション */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>管理機能</Text>
          <View style={styles.actionsList}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.actionCard, index === quickActions.length - 1 && styles.lastActionCard]}
                onPress={action.onPress}
              >
                <View style={[styles.actionIcon, { backgroundColor: `${action.color}20` }]}>
                  <action.icon size={24} color={action.color} />
                </View>
                <View style={styles.actionContent}>
                  <Text style={styles.actionTitle}>{action.title}</Text>
                  <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                </View>
                <ChevronRight size={20} color="#9CA3AF" />
              </TouchableOpacity>
            ))}
          </View>
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
    marginVertical: 16,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flex: 1,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  adminBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  content: {
    flex: 1,
  },
  statsSection: {
    margin: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
    marginLeft: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
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
  statHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  statLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    marginBottom: 4,
  },
  statSubLabel: {
    fontSize: 12,
    color: '#6B7280',
  },
  alertSection: {
    margin: 16,
    marginTop: 8,
  },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  alertContent: {
    flex: 1,
    marginLeft: 12,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 2,
  },
  alertSubtitle: {
    fontSize: 14,
    color: '#A16207',
  },
  actionsSection: {
    margin: 16,
    marginTop: 8,
  },
  actionsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  lastActionCard: {
    borderBottomWidth: 0,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  activitySection: {
    margin: 16,
    marginTop: 8,
  },
  activityList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityDescription: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  bottomSpacing: {
    height: 20,
  },
});