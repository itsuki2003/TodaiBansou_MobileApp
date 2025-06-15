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
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Bell,
  BellOff,
  Info,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Filter,
  MoreVertical,
  Trash2,
} from 'lucide-react-native';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

import { useAuth } from '../../contexts/AuthContext';
import { useNotification } from '../../contexts/NotificationContext';
import AppHeader from '../../components/ui/AppHeader';
import type { Database } from '../../types/database.types';

type Notification = Database['public']['Tables']['notifications']['Row'];

interface NotificationWithCategory extends Notification {
  notification_categories?: {
    name: string;
  } | null;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { user, userRole } = useAuth();
  const { 
    dbNotifications, 
    unreadCount, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead,
    showNotification 
  } = useNotification();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showActions, setShowActions] = useState(false);

  const categories = [
    { id: 'all', name: 'すべて', count: dbNotifications.length },
    { id: '重要', name: '重要', count: 0 },
    { id: 'お知らせ', name: 'お知らせ', count: 0 },
    { id: 'システム', name: 'システム', count: 0 },
  ];

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      await fetchNotifications();
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'エラー',
        message: '通知の取得に失敗しました',
        autoHide: true,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadNotifications();
  }, []);

  const handleNotificationPress = (notification: NotificationWithCategory) => {
    // 既読にマーク
    markAsRead(notification.id);
    
    // 詳細画面へ遷移
    router.push({
      pathname: '/notifications/[notificationId]',
      params: { notificationId: notification.id }
    });
  };

  const handleMarkAllAsRead = () => {
    Alert.alert(
      '全て既読にする',
      '全ての通知を既読にしますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        { 
          text: '既読にする', 
          onPress: () => {
            markAllAsRead();
            showNotification({
              type: 'success',
              title: '完了',
              message: '全ての通知を既読にしました',
              autoHide: true,
            });
          }
        },
      ]
    );
  };

  const getNotificationIcon = (notification: NotificationWithCategory) => {
    const title = notification.title.toLowerCase();
    if (title.includes('重要') || title.includes('緊急')) {
      return <AlertTriangle size={20} color="#EF4444" />;
    }
    if (title.includes('完了') || title.includes('成功')) {
      return <CheckCircle2 size={20} color="#10B981" />;
    }
    if (title.includes('授業') || title.includes('スケジュール')) {
      return <Calendar size={20} color="#8B5CF6" />;
    }
    return <Info size={20} color="#3B82F6" />;
  };

  const getNotificationColor = (notification: NotificationWithCategory) => {
    const title = notification.title.toLowerCase();
    if (title.includes('重要') || title.includes('緊急')) {
      return '#FEF2F2';
    }
    if (title.includes('完了') || title.includes('成功')) {
      return '#ECFDF5';
    }
    if (title.includes('授業') || title.includes('スケジュール')) {
      return '#F3E8FF';
    }
    return '#EBF8FF';
  };

  const filteredNotifications = selectedCategory === 'all' 
    ? dbNotifications 
    : dbNotifications.filter(n => 
        n.notification_categories?.name === selectedCategory
      );

  const renderNotificationItem = (notification: NotificationWithCategory) => (
    <TouchableOpacity
      key={notification.id}
      style={[
        styles.notificationCard,
        { backgroundColor: getNotificationColor(notification) }
      ]}
      onPress={() => handleNotificationPress(notification)}
    >
      <View style={styles.notificationHeader}>
        <View style={styles.notificationIcon}>
          {getNotificationIcon(notification)}
        </View>
        <View style={styles.notificationInfo}>
          <Text style={styles.notificationTitle} numberOfLines={1}>
            {notification.title}
          </Text>
          <Text style={styles.notificationTime}>
            {notification.publish_timestamp && !isNaN(new Date(notification.publish_timestamp).getTime()) ? 
              format(new Date(notification.publish_timestamp), 'M月d日 HH:mm', { locale: ja }) : 
              '日時不明'
            }
          </Text>
        </View>
        {notification.notification_categories && (
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>
              {notification.notification_categories.name}
            </Text>
          </View>
        )}
      </View>
      
      <Text style={styles.notificationContent} numberOfLines={2}>
        {notification.content}
      </Text>
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader
          title="お知らせ"
          leftElement={
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft size={24} color="#374151" />
            </TouchableOpacity>
          }
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>お知らせを読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader
        title="お知らせ"
        subtitle={unreadCount > 0 ? `未読 ${unreadCount}件` : ''}
        leftElement={
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color="#374151" />
          </TouchableOpacity>
        }
        rightElement={
          <TouchableOpacity onPress={() => setShowActions(!showActions)}>
            <MoreVertical size={24} color="#374151" />
          </TouchableOpacity>
        }
      />

      {/* アクションメニュー */}
      {showActions && (
        <View style={styles.actionsMenu}>
          <TouchableOpacity
            style={styles.actionItem}
            onPress={handleMarkAllAsRead}
          >
            <CheckCircle2 size={16} color="#10B981" />
            <Text style={styles.actionText}>全て既読にする</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* カテゴリーフィルター */}
      <View style={styles.filterSection}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScrollContainer}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.filterChip,
                selectedCategory === category.id && styles.filterChipActive,
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  selectedCategory === category.id && styles.filterChipTextActive,
                ]}
              >
                {category.name}
              </Text>
              {category.count > 0 && (
                <View style={styles.filterChipBadge}>
                  <Text style={styles.filterChipBadgeText}>
                    {category.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 通知一覧 */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={filteredNotifications.length === 0 ? styles.emptyContainer : undefined}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3B82F6']}
            tintColor="#3B82F6"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredNotifications.length === 0 ? (
          <View style={styles.emptyState}>
            <BellOff size={48} color="#9CA3AF" />
            <Text style={styles.emptyStateText}>
              {selectedCategory === 'all' 
                ? 'お知らせがありません' 
                : `${selectedCategory}のお知らせがありません`
              }
            </Text>
          </View>
        ) : (
          filteredNotifications.map(renderNotificationItem)
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
  actionsMenu: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  actionText: {
    fontSize: 16,
    color: '#374151',
  },
  filterSection: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingVertical: 12,
  },
  filterScrollContainer: {
    paddingHorizontal: 16,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: '#3B82F6',
  },
  filterChipText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  filterChipBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  filterChipBadgeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  content: {
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
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 16,
  },
  notificationCard: {
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
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  notificationTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  categoryBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  categoryText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
  },
  notificationContent: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
});