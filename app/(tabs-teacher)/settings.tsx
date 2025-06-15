import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { 
  User, 
  FileText, 
  Shield, 
  LogOut, 
  ChevronRight,
  GraduationCap,
  Users,
  Calendar,
  Bell,
  Settings as SettingsIcon,
  BookOpen,
  Clock,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { TeacherGuard } from '../../components/common/RoleGuard';
import AppHeader from '../../components/ui/AppHeader';
import type { Database } from '../../types/database.types';

type Student = Database['public']['Tables']['students']['Row'];
type Teacher = Database['public']['Tables']['teachers']['Row'];

export default function TeacherSettingsScreen() {
  const { user, userRole, signOut } = useAuth();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [assignedStudents, setAssignedStudents] = useState<Student[]>([]);
  const [notificationSettings, setNotificationSettings] = useState({
    lessonReminders: true,
    newMessages: true,
    scheduleChanges: true,
    systemNotifications: true,
  });

  // 講師情報と担当生徒を取得
  useEffect(() => {
    const fetchTeacherData = async () => {
      if (!user || userRole !== 'teacher') return;

      try {
        setLoading(true);

        // 講師情報を取得
        const { data: teacherData, error: teacherError } = await supabase
          .from('teachers')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (teacherError) throw teacherError;
        setTeacher(teacherData);

        // 担当生徒を取得
        if (teacherData) {
          const { data: assignmentsData, error: assignmentsError } = await supabase
            .from('assignments')
            .select(`
              student_id,
              role,
              students (
                id,
                full_name,
                grade,
                school_attended,
                enrollment_date
              )
            `)
            .eq('teacher_id', teacherData.id)
            .eq('status', '有効');

          if (assignmentsError) throw assignmentsError;

          const students = assignmentsData
            ?.map(a => a.students)
            .filter(Boolean) as Student[];
          
          setAssignedStudents(students || []);
        }

      } catch (error) {
        console.error('Error fetching teacher data:', error);
        showNotification({
          type: 'error',
          title: 'エラー',
          message: '講師情報の取得に失敗しました',
          autoHide: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherData();
  }, [user, userRole, showNotification]);

  const handleProfile = () => {
    router.push('/(tabs-teacher)/teacher-profile');
  };

  const handleStudentList = () => {
    // 担当生徒一覧画面に遷移（この画面は既存のホーム画面で実装済み）
    router.push('/(tabs-teacher)');
  };

  const handleScheduleSettings = () => {
    router.push('/(tabs-teacher)/teacher-schedule-settings');
  };

  const handleTerms = () => {
    router.push('/(tabs-teacher)/terms-of-service');
  };

  const handlePrivacy = () => {
    router.push('/(tabs-teacher)/privacy-policy');
  };

  const handleNotificationToggle = (setting: keyof typeof notificationSettings) => {
    setNotificationSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
    
    showNotification({
      type: 'success',
      title: '設定を更新しました',
      message: '通知設定が変更されました',
      autoHide: true,
    });
  };

  const handleLogout = () => {
    Alert.alert(
      'ログアウト',
      'ログアウトしますか？',
      [
        {
          text: 'キャンセル',
          style: 'cancel',
        },
        {
          text: 'ログアウト',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              // SignOut成功時は自動的にログイン画面にリダイレクトされる
            } catch (error) {
              // エラーはAlertで表示
              Alert.alert('エラー', 'ログアウトに失敗しました。もう一度お試しください。');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  if (loading) {
    return (
      <TeacherGuard>
        <SafeAreaView style={styles.container}>
          <AppHeader title="設定" />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>設定を読み込み中...</Text>
          </View>
        </SafeAreaView>
      </TeacherGuard>
    );
  }

  return (
    <TeacherGuard>
      <SafeAreaView style={styles.container}>
        <AppHeader title="設定" />
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 講師情報 */}
          <View style={styles.section}>
            <View style={styles.teacherInfo}>
              <View style={styles.teacherIconContainer}>
                <GraduationCap size={32} color="#3B82F6" />
              </View>
              <View style={styles.teacherDetails}>
                <Text style={styles.teacherName}>
                  {teacher?.full_name || '講師'}
                </Text>
                <Text style={styles.teacherRole}>講師</Text>
                {teacher?.education_background_university && (
                  <Text style={styles.teacherUniversity}>
                    {teacher.education_background_university}
                  </Text>
                )}
                <Text style={styles.studentCount}>
                  担当生徒: {assignedStudents.length}名
                </Text>
              </View>
            </View>
          </View>

          {/* メイン機能 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>講師機能</Text>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={handleProfile}
            >
              <View style={styles.menuIconContainer}>
                <User size={20} color="#3B82F6" />
              </View>
              <Text style={styles.menuText}>プロフィール編集</Text>
              <ChevronRight size={18} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={handleStudentList}
            >
              <View style={styles.menuIconContainer}>
                <Users size={20} color="#3B82F6" />
              </View>
              <View style={styles.menuItemContent}>
                <Text style={styles.menuText}>担当生徒一覧</Text>
                <Text style={styles.menuSubtext}>{assignedStudents.length}名</Text>
              </View>
              <ChevronRight size={18} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={handleScheduleSettings}
            >
              <View style={styles.menuIconContainer}>
                <Calendar size={20} color="#3B82F6" />
              </View>
              <Text style={styles.menuText}>スケジュール設定</Text>
              <ChevronRight size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* 通知設定 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>通知設定</Text>
            
            <View style={styles.notificationItem}>
              <View style={styles.notificationInfo}>
                <Bell size={20} color="#3B82F6" />
                <View style={styles.notificationText}>
                  <Text style={styles.notificationTitle}>授業リマインダー</Text>
                  <Text style={styles.notificationSubtitle}>授業開始前の通知</Text>
                </View>
              </View>
              <Switch
                value={notificationSettings.lessonReminders}
                onValueChange={() => handleNotificationToggle('lessonReminders')}
                trackColor={{ false: '#E5E7EB', true: '#93C5FD' }}
                thumbColor={notificationSettings.lessonReminders ? '#3B82F6' : '#F3F4F6'}
              />
            </View>

            <View style={styles.notificationItem}>
              <View style={styles.notificationInfo}>
                <BookOpen size={20} color="#3B82F6" />
                <View style={styles.notificationText}>
                  <Text style={styles.notificationTitle}>新しいメッセージ</Text>
                  <Text style={styles.notificationSubtitle}>チャット通知</Text>
                </View>
              </View>
              <Switch
                value={notificationSettings.newMessages}
                onValueChange={() => handleNotificationToggle('newMessages')}
                trackColor={{ false: '#E5E7EB', true: '#93C5FD' }}
                thumbColor={notificationSettings.newMessages ? '#3B82F6' : '#F3F4F6'}
              />
            </View>

            <View style={styles.notificationItem}>
              <View style={styles.notificationInfo}>
                <Clock size={20} color="#3B82F6" />
                <View style={styles.notificationText}>
                  <Text style={styles.notificationTitle}>スケジュール変更</Text>
                  <Text style={styles.notificationSubtitle}>授業時間の変更通知</Text>
                </View>
              </View>
              <Switch
                value={notificationSettings.scheduleChanges}
                onValueChange={() => handleNotificationToggle('scheduleChanges')}
                trackColor={{ false: '#E5E7EB', true: '#93C5FD' }}
                thumbColor={notificationSettings.scheduleChanges ? '#3B82F6' : '#F3F4F6'}
              />
            </View>

            <View style={styles.notificationItem}>
              <View style={styles.notificationInfo}>
                <SettingsIcon size={20} color="#3B82F6" />
                <View style={styles.notificationText}>
                  <Text style={styles.notificationTitle}>システム通知</Text>
                  <Text style={styles.notificationSubtitle}>重要なお知らせ</Text>
                </View>
              </View>
              <Switch
                value={notificationSettings.systemNotifications}
                onValueChange={() => handleNotificationToggle('systemNotifications')}
                trackColor={{ false: '#E5E7EB', true: '#93C5FD' }}
                thumbColor={notificationSettings.systemNotifications ? '#3B82F6' : '#F3F4F6'}
              />
            </View>
          </View>

          {/* その他 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>その他</Text>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={handleTerms}
            >
              <View style={styles.menuIconContainer}>
                <FileText size={20} color="#6B7280" />
              </View>
              <Text style={styles.menuText}>利用規約</Text>
              <ChevronRight size={18} color="#94A3B8" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={handlePrivacy}
            >
              <View style={styles.menuIconContainer}>
                <Shield size={20} color="#6B7280" />
              </View>
              <Text style={styles.menuText}>プライバシーポリシー</Text>
              <ChevronRight size={18} color="#94A3B8" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.menuItem, styles.logoutItem]}
              onPress={handleLogout}
            >
              <View style={[styles.menuIconContainer, styles.logoutIcon]}>
                <LogOut size={20} color="#EF4444" />
              </View>
              <Text style={styles.logoutText}>ログアウト</Text>
            </TouchableOpacity>
          </View>

          {/* バージョン情報 */}
          <View style={styles.section}>
            <Text style={styles.versionInfo}>
              東大伴走講師アプリ v1.0.0
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </TeacherGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
    paddingBottom: 20,
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
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  teacherInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  teacherIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EBF8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  teacherDetails: {
    flex: 1,
  },
  teacherName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  teacherRole: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
    marginBottom: 2,
  },
  teacherUniversity: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  studentCount: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '500',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuItemContent: {
    flex: 1,
  },
  menuText: {
    fontSize: 16,
    color: '#1E293B',
  },
  menuSubtext: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  notificationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  notificationText: {
    marginLeft: 12,
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '500',
  },
  notificationSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  logoutItem: {
    borderBottomWidth: 0,
  },
  logoutIcon: {
    backgroundColor: '#FEE2E2',
  },
  logoutText: {
    flex: 1,
    fontSize: 16,
    color: '#EF4444',
  },
  versionInfo: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    padding: 20,
  },
});