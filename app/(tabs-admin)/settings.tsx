import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  User, 
  FileText, 
  Shield, 
  LogOut, 
  ChevronRight,
  Settings as SettingsIcon,
  Database,
  Users,
  GraduationCap,
  BarChart3,
  Bell,
  RefreshCw,
  Download,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import { AdminGuard } from '../../components/common/RoleGuard';
import AppHeader from '../../components/ui/AppHeader';
import type { Database as DB } from '../../types/database.types';

type Administrator = DB['public']['Tables']['administrators']['Row'];

export default function AdminSettingsScreen() {
  const { user, userRole, signOut } = useAuth();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState<Administrator | null>(null);
  const [systemStats, setSystemStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalLessons: 0,
    activeAssignments: 0,
  });
  const [systemSettings, setSystemSettings] = useState({
    maintenanceMode: false,
    autoBackup: true,
    emailNotifications: true,
    debugMode: false,
  });

  // AsyncStorageキー
  const SYSTEM_SETTINGS_KEY = 'admin_system_settings';

  // システム設定を読み込む
  const loadSystemSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem(SYSTEM_SETTINGS_KEY);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSystemSettings(prev => ({ ...prev, ...parsed }));
      }
    } catch (error) {
      console.error('Error loading system settings:', error);
    }
  };

  // システム設定を保存する
  const saveSystemSettings = async (newSettings: typeof systemSettings) => {
    try {
      await AsyncStorage.setItem(SYSTEM_SETTINGS_KEY, JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error saving system settings:', error);
      showNotification({
        type: 'error',
        title: 'エラー',
        message: 'システム設定の保存に失敗しました',
        autoHide: true,
      });
    }
  };

  // 管理者情報と統計データを取得
  useEffect(() => {
    const fetchAdminData = async () => {
      if (!user || userRole !== 'admin') return;

      try {
        setLoading(true);

        // システム設定を読み込み
        await loadSystemSettings();

        // 管理者情報を取得
        const { data: adminData, error: adminError } = await supabase
          .from('administrators')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (adminError) throw adminError;
        setAdmin(adminData);

        // システム統計を取得
        const [studentsRes, teachersRes, lessonsRes, assignmentsRes] = await Promise.all([
          supabase.from('students').select('id', { count: 'exact' }),
          supabase.from('teachers').select('id', { count: 'exact' }).eq('account_status', '有効'),
          supabase.from('lesson_slots').select('id', { count: 'exact' }),
          supabase.from('assignments').select('id', { count: 'exact' }).eq('status', '有効'),
        ]);

        setSystemStats({
          totalStudents: studentsRes.count || 0,
          totalTeachers: teachersRes.count || 0,
          totalLessons: lessonsRes.count || 0,
          activeAssignments: assignmentsRes.count || 0,
        });

      } catch (error) {
        console.error('Error fetching admin data:', error);
        showNotification({
          type: 'error',
          title: 'エラー',
          message: '管理者情報の取得に失敗しました',
          autoHide: true,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [user, userRole, showNotification]);

  const handleProfile = () => {
    router.push('/(tabs-admin)/admin-profile' as any);
  };


  const handleDataExport = () => {
    router.push('/(tabs-admin)/admin-data-export');
  };

  const handleBackup = () => {
    router.push('/(tabs-admin)/admin-backup');
  };

  const handleTerms = () => {
    router.push('/(tabs-admin)/terms-of-service');
  };

  const handlePrivacy = () => {
    router.push('/(tabs-admin)/privacy-policy');
  };

  const handleSystemSettingToggle = async (setting: keyof typeof systemSettings) => {
    const newSettings = {
      ...systemSettings,
      [setting]: !systemSettings[setting]
    };
    
    setSystemSettings(newSettings);
    
    // AsyncStorageに保存
    await saveSystemSettings(newSettings);
    
    showNotification({
      type: 'success',
      title: '設定を更新しました',
      message: `${getSettingDisplayName(setting)}の設定が変更されました`,
      autoHide: true,
    });
  };

  // 設定項目の表示名を取得
  const getSettingDisplayName = (setting: keyof typeof systemSettings) => {
    switch (setting) {
      case 'maintenanceMode': return 'メンテナンスモード';
      case 'autoBackup': return '自動バックアップ';
      case 'emailNotifications': return 'メール通知';
      case 'debugMode': return 'デバッグモード';
      default: return '設定';
    }
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
      <AdminGuard>
        <SafeAreaView style={styles.container}>
          <AppHeader title="設定" />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#DC2626" />
            <Text style={styles.loadingText}>設定を読み込み中...</Text>
          </View>
        </SafeAreaView>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <SafeAreaView style={styles.container}>
        <AppHeader title="設定" />
        
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 管理者情報 */}
          <View style={styles.section}>
            <View style={styles.adminInfo}>
              <View style={styles.adminIconContainer}>
                <Shield size={32} color="#DC2626" />
              </View>
              <View style={styles.adminDetails}>
                <Text style={styles.adminName}>
                  {admin?.full_name || '管理者'}
                </Text>
                <Text style={styles.adminRole}>システム管理者</Text>
                <Text style={styles.adminEmail}>
                  {admin?.email}
                </Text>
              </View>
            </View>
          </View>

          {/* システム統計 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>システム統計</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <View style={styles.statIconContainer}>
                  <Users size={20} color="#3B82F6" />
                </View>
                <Text style={styles.statValue}>{systemStats.totalStudents}</Text>
                <Text style={styles.statLabel}>生徒数</Text>
              </View>
              <View style={styles.statItem}>
                <View style={styles.statIconContainer}>
                  <GraduationCap size={20} color="#10B981" />
                </View>
                <Text style={styles.statValue}>{systemStats.totalTeachers}</Text>
                <Text style={styles.statLabel}>講師数</Text>
              </View>
              <View style={styles.statItem}>
                <View style={styles.statIconContainer}>
                  <BarChart3 size={20} color="#F59E0B" />
                </View>
                <Text style={styles.statValue}>{systemStats.totalLessons}</Text>
                <Text style={styles.statLabel}>授業数</Text>
              </View>
              <View style={styles.statItem}>
                <View style={styles.statIconContainer}>
                  <RefreshCw size={20} color="#8B5CF6" />
                </View>
                <Text style={styles.statValue}>{systemStats.activeAssignments}</Text>
                <Text style={styles.statLabel}>担当割当</Text>
              </View>
            </View>
          </View>

          {/* 管理機能 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>管理機能</Text>
            
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={handleProfile}
            >
              <View style={styles.menuIconContainer}>
                <User size={20} color="#DC2626" />
              </View>
              <Text style={styles.menuText}>プロフィール編集</Text>
              <ChevronRight size={18} color="#94A3B8" />
            </TouchableOpacity>


            <TouchableOpacity 
              style={styles.menuItem}
              onPress={handleDataExport}
            >
              <View style={styles.menuIconContainer}>
                <Download size={20} color="#DC2626" />
              </View>
              <Text style={styles.menuText}>データエクスポート</Text>
              <ChevronRight size={18} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuItem}
              onPress={handleBackup}
            >
              <View style={styles.menuIconContainer}>
                <Database size={20} color="#DC2626" />
              </View>
              <Text style={styles.menuText}>手動バックアップ</Text>
              <ChevronRight size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* システム設定 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>システム設定</Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <SettingsIcon size={20} color="#DC2626" />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>メンテナンスモード</Text>
                  <Text style={styles.settingSubtitle}>システムメンテナンス中</Text>
                </View>
              </View>
              <Switch
                value={systemSettings.maintenanceMode}
                onValueChange={() => handleSystemSettingToggle('maintenanceMode')}
                trackColor={{ false: '#E5E7EB', true: '#FCA5A5' }}
                thumbColor={systemSettings.maintenanceMode ? '#DC2626' : '#F3F4F6'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Database size={20} color="#DC2626" />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>自動バックアップ</Text>
                  <Text style={styles.settingSubtitle}>毎日自動でバックアップ</Text>
                </View>
              </View>
              <Switch
                value={systemSettings.autoBackup}
                onValueChange={() => handleSystemSettingToggle('autoBackup')}
                trackColor={{ false: '#E5E7EB', true: '#FCA5A5' }}
                thumbColor={systemSettings.autoBackup ? '#DC2626' : '#F3F4F6'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Bell size={20} color="#DC2626" />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>メール通知</Text>
                  <Text style={styles.settingSubtitle}>重要な通知をメールで受信</Text>
                </View>
              </View>
              <Switch
                value={systemSettings.emailNotifications}
                onValueChange={() => handleSystemSettingToggle('emailNotifications')}
                trackColor={{ false: '#E5E7EB', true: '#FCA5A5' }}
                thumbColor={systemSettings.emailNotifications ? '#DC2626' : '#F3F4F6'}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <BarChart3 size={20} color="#DC2626" />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>デバッグモード</Text>
                  <Text style={styles.settingSubtitle}>開発者向け詳細ログ</Text>
                </View>
              </View>
              <Switch
                value={systemSettings.debugMode}
                onValueChange={() => handleSystemSettingToggle('debugMode')}
                trackColor={{ false: '#E5E7EB', true: '#FCA5A5' }}
                thumbColor={systemSettings.debugMode ? '#DC2626' : '#F3F4F6'}
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
              東大伴走管理システム v1.0.0
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </AdminGuard>
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
  adminInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  adminIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  adminDetails: {
    flex: 1,
  },
  adminName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  adminRole: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '500',
    marginBottom: 2,
  },
  adminEmail: {
    fontSize: 14,
    color: '#6B7280',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  statItem: {
    width: '50%',
    paddingVertical: 12,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
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
    backgroundColor: '#FEE2E2',
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
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '500',
  },
  settingSubtitle: {
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