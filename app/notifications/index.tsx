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
} from 'react-native';
import { ArrowLeft, Bell } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';

type NotificationCategory = {
  id: string;
  name: string;
  color: string;
};

type Notification = {
  id: string;
  title: string;
  content: string;
  publish_timestamp: string;
  category_id: string;
  status: string;
  target_audience: string;
  category?: NotificationCategory;
};

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [categories, setCategories] = useState<NotificationCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('notification_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (err) {
      console.error('Error fetching categories:', err);
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      setError(null);
      
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          id,
          title,
          content,
          publish_timestamp,
          category_id,
          status,
          target_audience
        `)
        .eq('status', 'published')
        .order('publish_timestamp', { ascending: false });

      if (error) throw error;

      const notificationsWithCategories = (data || []).map(notification => {
        const category = categories.find(cat => cat.id === notification.category_id);
        return {
          ...notification,
          category
        };
      });

      setNotifications(notificationsWithCategories);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('お知らせの取得に失敗しました。');
    }
  }, [user, categories]);

  const loadData = useCallback(async () => {
    setLoading(true);
    await fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    loadData().finally(() => setLoading(false));
  }, [loadData]);

  useEffect(() => {
    if (categories.length > 0) {
      fetchNotifications();
    }
  }, [categories, fetchNotifications]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCategories();
    await fetchNotifications();
    setRefreshing(false);
  }, [fetchCategories, fetchNotifications]);

  const handleNotificationPress = (notificationId: string) => {
    router.push(`/notifications/${notificationId}`);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text style={styles.title}>お知らせ</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.title}>お知らせ</Text>
      </View>

      <ScrollView 
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={onRefresh}>
              <Text style={styles.retryText}>再試行</Text>
            </TouchableOpacity>
          </View>
        ) : notifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Bell size={48} color="#94A3B8" />
            <Text style={styles.emptyText}>現在、お知らせはありません</Text>
          </View>
        ) : (
          <View style={styles.notificationsList}>
            {notifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                style={styles.notificationItem}
                onPress={() => handleNotificationPress(notification.id)}
              >
                <View style={styles.notificationHeader}>
                  <View style={styles.categoryContainer}>
                    <Text style={[
                      styles.categoryText,
                      { backgroundColor: notification.category?.color || '#EFF6FF' }
                    ]}>
                      {notification.category?.name || 'お知らせ'}
                    </Text>
                  </View>
                  <Text style={styles.dateText}>
                    {formatDate(notification.publish_timestamp)}
                  </Text>
                </View>
                
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle} numberOfLines={2}>
                    {notification.title}
                  </Text>
                  <View style={styles.unreadIndicator}>
                    <View style={styles.unreadDot} />
                  </View>
                </View>
                
                <Text style={styles.notificationPreview} numberOfLines={2}>
                  {notification.content}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
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
    marginTop: 12,
    fontSize: 16,
    color: '#64748B',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 16,
  },
  notificationsList: {
    padding: 16,
  },
  notificationItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryContainer: {
    flex: 1,
  },
  categoryText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  dateText: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 8,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  notificationTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: 20,
  },
  unreadIndicator: {
    marginLeft: 8,
    paddingTop: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
  },
  notificationPreview: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 18,
  },
});