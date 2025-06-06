import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { ArrowLeft, Bell } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabaseClient';

interface NotificationCategory {
  id: string;
  name: string;
}

interface Notification {
  id: string;
  title: string;
  content: string;
  publish_timestamp: string;
  category_id: string;
  status: string;
  target_audience: string;
  category?: NotificationCategory;
  is_read?: boolean;
}

export default function NotificationListScreen() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      setError(null);
      
      // Fetch notifications with category information
      const { data: notificationsData, error: notificationsError } = await supabase
        .from('notifications')
        .select(`
          id,
          title,
          content,
          publish_timestamp,
          category_id,
          status,
          target_audience,
          notification_categories:category_id (
            id,
            name
          )
        `)
        .eq('status', '配信済み')
        .order('publish_timestamp', { ascending: false });

      if (notificationsError) {
        throw notificationsError;
      }

      // TODO: Fetch read status for current user
      // For now, we'll mark all as unread
      const notificationsWithReadStatus = notificationsData?.map(notification => ({
        ...notification,
        category: notification.notification_categories,
        is_read: false, // TODO: Implement read status check
      })) || [];

      setNotifications(notificationsWithReadStatus);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('お知らせの取得に失敗しました');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, [fetchNotifications]);

  const handleNotificationPress = (notificationId: string) => {
    router.push(`/notifications/${notificationId}`);
  };

  const handleGoBack = () => {
    router.back();
  };

  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      style={styles.notificationItem}
      onPress={() => handleNotificationPress(item.id)}
    >
      <View style={styles.notificationHeader}>
        <View style={[
          styles.categoryBadge,
          { backgroundColor: item.category?.color || '#EFF6FF' }
        ]}>
          <Text style={[
            styles.categoryText,
            { color: item.category?.color ? '#FFFFFF' : '#3B82F6' }
          ]}>
            {item.category?.name || 'お知らせ'}
          </Text>
        </View>
        <Text style={styles.notificationDate}>
          {new Date(item.publish_timestamp).toLocaleDateString('ja-JP')}
        </Text>
      </View>
      
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle} numberOfLines={2}>
          {item.title}
        </Text>
        {!item.is_read && (
          <View style={styles.unreadDot} />
        )}
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Bell size={48} color="#94A3B8" />
      <Text style={styles.emptyStateText}>現在、お知らせはありません</Text>
    </View>
  );

  const renderErrorState = () => (
    <View style={styles.errorState}>
      <Text style={styles.errorText}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={fetchNotifications}>
        <Text style={styles.retryButtonText}>再試行</Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
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
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <ArrowLeft size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.title}>お知らせ</Text>
      </View>
      
      {error ? (
        renderErrorState()
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotificationItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
          contentContainerStyle={notifications.length === 0 ? styles.emptyContainer : undefined}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#3B82F6']}
              tintColor="#3B82F6"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
  },
  list: {
    flex: 1,
  },
  notificationItem: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
  },
  notificationDate: {
    fontSize: 12,
    color: '#64748B',
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationTitle: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
    lineHeight: 22,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
    marginLeft: 12,
    marginTop: 7,
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
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateText: {
    marginTop: 16,
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
  },
  errorState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
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
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
});