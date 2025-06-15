import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { 
  Bell, 
  User, 
  FileText, 
  Shield, 
  LogOut,
  ChevronRight,
  Users,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import AppHeader from '@/components/ui/AppHeader';

interface RecentNotification {
  id: string;
  title: string;
  category: string;
  date: string;
  read: boolean;
}

export default function SettingsScreen() {
  const { students, selectedStudent, selectStudent, signOut, user } = useAuth();
  const { unreadCount, dbNotifications } = useNotification();
  const [recentNotifications, setRecentNotifications] = useState<RecentNotification[]>([]);
  
  // AsyncStorage key for read notifications
  const getReadNotificationsKey = (userId: string) => `read_notifications_${userId}`;
  
  // Get read notification IDs from AsyncStorage
  const getReadNotifications = async (): Promise<string[]> => {
    try {
      if (!user?.id) return [];
      const key = getReadNotificationsKey(user.id);
      const storedReadIds = await AsyncStorage.getItem(key);
      return storedReadIds ? JSON.parse(storedReadIds) : [];
    } catch (error) {
      // エラーハンドリング: AsyncStorageエラーは無視
      return [];
    }
  };
  
  // Mark notification as read
  const markNotificationAsRead = async (notificationId: string) => {
    try {
      if (!user?.id) return;
      const key = getReadNotificationsKey(user.id);
      const readIds = await getReadNotifications();
      if (!readIds.includes(notificationId)) {
        const updatedReadIds = [...readIds, notificationId];
        await AsyncStorage.setItem(key, JSON.stringify(updatedReadIds));
        // Update state to reflect the change
        setRecentNotifications(prev => 
          prev.map(notif => 
            notif.id === notificationId ? { ...notif, read: true } : notif
          )
        );
      }
    } catch (error) {
      // エラーハンドリング: 通知の既読マークエラーは無視
    }
  };
  
  const fetchRecentNotifications = useCallback(async () => {
    try {
      // Fetch recent notifications (limit to 3 for settings preview)
      const { data: notificationsData, error: notificationsError } = await supabase
        .from('notifications')
        .select(`
          id,
          title,
          publish_timestamp,
          notification_categories!category_id (
            name
          )
        `)
        .eq('status', '配信済み')
        .order('publish_timestamp', { ascending: false })
        .limit(3);

      if (notificationsError) {
        // エラーハンドリング: 通知取得エラーは無視
        return;
      }

      // Get read status for current user
      const readNotificationIds = await getReadNotifications();
      const formattedNotifications: RecentNotification[] = notificationsData?.map(notification => ({
        id: notification.id,
        title: notification.title,
        category: (notification.notification_categories as any)?.name || 'お知らせ',
        date: notification.publish_timestamp,
        read: readNotificationIds.includes(notification.id),
      })) || [];

      setRecentNotifications(formattedNotifications);
    } catch (err) {
      // エラーハンドリング: 通知取得エラーは無視
    }
  }, [user]);

  useEffect(() => {
    fetchRecentNotifications();
  }, [fetchRecentNotifications]);

  const handleNotificationPress = async (notification: RecentNotification) => {
    // Mark as read when notification is tapped
    await markNotificationAsRead(notification.id);
    router.push(`/notifications/${notification.id}`);
  };
  
  const handleProfile = () => {
    // Navigate to profile screen
    router.push('/(tabs)/profile');
  };

  const handleStudentSwitch = () => {
    if (students.length > 1) {
      router.push('/student-selection');
    }
  };

  
  const handleTerms = () => {
    router.push('/(tabs)/terms-of-service');
  };
  
  const handlePrivacy = () => {
    router.push('/(tabs)/privacy-policy');
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

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="設定" />
      
      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/notifications')}
          >
            <View style={styles.menuIconContainer}>
              <Bell size={20} color="#3B82F6" />
            </View>
            <Text style={styles.menuText}>おしらせ一覧</Text>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={handleProfile}
          >
            <View style={styles.menuIconContainer}>
              <User size={20} color="#3B82F6" />
            </View>
            <Text style={styles.menuText}>プロフィール</Text>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>

          {students.length > 1 && (
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={handleStudentSwitch}
            >
              <View style={styles.menuIconContainer}>
                <Users size={20} color="#3B82F6" />
              </View>
              <View style={styles.studentSwitchContainer}>
                <Text style={styles.menuText}>生徒の切り替え</Text>
                <Text style={styles.currentStudentText}>
                  現在: {selectedStudent?.full_name || '未選択'}
                </Text>
              </View>
              <ChevronRight size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}

          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={handleTerms}
          >
            <View style={styles.menuIconContainer}>
              <FileText size={20} color="#3B82F6" />
            </View>
            <Text style={styles.menuText}>利用規約</Text>
            <ChevronRight size={18} color="#94A3B8" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={handlePrivacy}
          >
            <View style={styles.menuIconContainer}>
              <Shield size={20} color="#3B82F6" />
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
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>最近のお知らせ</Text>
          
          {recentNotifications.length > 0 ? (
            <>
              {recentNotifications.map((notification) => (
                <TouchableOpacity
                  key={notification.id}
                  style={styles.notificationItem}
                  onPress={() => handleNotificationPress(notification)}
                >
                  <View style={styles.notificationHeader}>
                    <Text style={styles.notificationCategory}>
                      {notification.category}
                    </Text>
                    <Text style={styles.notificationDate}>
                      {new Date(notification.date).toLocaleDateString('ja-JP')}
                    </Text>
                  </View>
                  
                  <View style={styles.notificationContent}>
                    <Text style={styles.notificationTitle}>
                      {notification.title}
                    </Text>
                    {!notification.read && (
                      <View style={styles.unreadDot} />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
              
              <TouchableOpacity 
                style={styles.viewAllButton}
                onPress={() => router.push('/notifications')}
              >
                <Text style={styles.viewAllText}>すべて表示する</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.noNotificationsText}>
              現在、お知らせはありません
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 8,
    borderBottomColor: '#F1F5F9',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 12,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
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
  menuText: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
  },
  badge: {
    backgroundColor: '#EF4444',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  logoutItem: {
    borderBottomWidth: 0,
    marginTop: 8,
  },
  logoutIcon: {
    backgroundColor: '#FEE2E2',
  },
  logoutText: {
    flex: 1,
    fontSize: 16,
    color: '#EF4444',
  },
  notificationItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notificationCategory: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  notificationDate: {
    fontSize: 12,
    color: '#64748B',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notificationTitle: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    marginLeft: 8,
  },
  viewAllButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  noNotificationsText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    paddingVertical: 20,
  },
  studentSwitchContainer: {
    flex: 1,
  },
  currentStudentText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
});