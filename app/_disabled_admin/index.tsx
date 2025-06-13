import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
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
} from 'lucide-react-native';

import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { AdminGuard } from '../../components/common/RoleGuard';
import ScreenWrapper from '../../components/common/ScreenWrapper';

interface AdminStats {
  totalStudents: number;
  activeTeachers: number;
  pendingApplications: number;
  activeNotifications: number;
  upcomingLessons: number;
}

export default function AdminHomeScreen() {
  const router = useRouter();
  const { user, userRole, userRoleLoading, administrator } = useAuth();
  
  const [stats, setStats] = useState<AdminStats>({
    totalStudents: 0,
    activeTeachers: 0,
    pendingApplications: 0,
    activeNotifications: 0,
    upcomingLessons: 0,
  });
  const [loading, setLoading] = useState(true);

  // リダイレクト制御
  useEffect(() => {
    if (!userRoleLoading && (!user || userRole !== 'admin')) {
      router.replace('/');
    }
  }, [user, userRole, userRoleLoading]);

  useEffect(() => {
    if (administrator) {
      fetchAdminStats();
    }
  }, [administrator]);

  const fetchAdminStats = async () => {
    try {
      // 基本統計を並行取得
      const [
        studentsResult,
        teachersResult,
        notificationsResult,
        lessonsResult,
      ] = await Promise.all([
        // 生徒数
        supabase
          .from('students')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'في籍中'),
        
        // 講師数
        supabase
          .from('teachers')
          .select('id', { count: 'exact', head: true })
          .eq('account_status', '有効'),
        
        // お知らせ数
        supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('status', '配信済み'),
        
        // 今日以降の授業数
        supabase
          .from('lesson_slots')
          .select('id', { count: 'exact', head: true })
          .gte('slot_date', new Date().toISOString().split('T')[0])
          .neq('status', '欠席'),
      ]);

      setStats({
        totalStudents: studentsResult.count || 0,
        activeTeachers: teachersResult.count || 0,
        pendingApplications: 0, // TODO: 実装
        activeNotifications: notificationsResult.count || 0,
        upcomingLessons: lessonsResult.count || 0,
      });

    } catch (error) {
      console.error('Admin stats fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: '生徒管理',
      subtitle: '生徒の登録・編集',
      icon: Users,
      color: '#3B82F6',
      onPress: () => router.push('/admin/students'),
    },
    {
      title: '講師管理',
      subtitle: '講師の管理・承認',
      icon: UserCheck,
      color: '#10B981',
      onPress: () => router.push('/admin/teachers'),
    },
    {
      title: 'やることリスト',
      subtitle: '学習プラン管理',
      icon: BookOpen,
      color: '#F59E0B',
      onPress: () => router.push('/admin/todo-lists'),
    },
    {
      title: 'スケジュール管理',
      subtitle: '授業・面談管理',
      icon: Calendar,
      color: '#8B5CF6',
      onPress: () => router.push('/admin/schedule'),
    },
    {
      title: 'お知らせ管理',
      subtitle: 'お知らせの作成・配信',
      icon: Bell,
      color: '#EF4444',
      onPress: () => router.push('/admin/notifications'),
    },
    {
      title: 'システム設定',
      subtitle: '管理者設定',
      icon: Settings,
      color: '#6B7280',
      onPress: () => router.push('/admin/settings'),
    },
  ];

  return (
    <AdminGuard>
      <ScreenWrapper 
        loading={userRoleLoading || loading}
        loadingMessage="管理画面を読み込み中..."
      >
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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 統計カード */}
        <View style={styles.statsSection}>
          <Text style={styles.sectionTitle}>システム概要</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.totalStudents}</Text>
              <Text style={styles.statLabel}>在籍生徒数</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.activeTeachers}</Text>
              <Text style={styles.statLabel}>活動講師数</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.upcomingLessons}</Text>
              <Text style={styles.statLabel}>今後の授業</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{stats.activeNotifications}</Text>
              <Text style={styles.statLabel}>配信済みお知らせ</Text>
            </View>
          </View>
        </View>

        {/* クイックアクション */}
        <View style={styles.actionsSection}>
          <Text style={styles.sectionTitle}>管理機能</Text>
          <View style={styles.actionsList}>
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={index}
                style={styles.actionCard}
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

        {/* 最近のアクティビティ */}
        <View style={styles.activitySection}>
          <Text style={styles.sectionTitle}>最近のアクティビティ</Text>
          <View style={styles.activityCard}>
            <Text style={styles.activityPlaceholder}>
              アクティビティログ機能は今後実装予定です
            </Text>
          </View>
        </View>

        {/* 底部余白 */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
      </ScreenWrapper>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
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
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#3B82F6',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
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
  activityCard: {
    backgroundColor: '#FFFFFF',
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
  activityPlaceholder: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  bottomSpacing: {
    height: 20,
  },
});