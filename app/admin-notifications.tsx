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
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Bell,
  Plus,
  Search,
  Filter,
  Edit3,
  Trash2,
  Send,
  Eye,
  Clock,
  CheckCircle2,
  X,
  Tag,
  FileText,
} from 'lucide-react-native';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { AdminGuard } from '../components/common/RoleGuard';
import type { Database } from '../types/database.types';

type Notification = Database['public']['Tables']['notifications']['Row'];
type NotificationCategory = Database['public']['Tables']['notification_categories']['Row'];

interface NotificationWithDetails extends Notification {
  category: NotificationCategory | null;
}

interface NewNotification {
  title: string;
  content: string;
  category_id: string | null;
  status: '下書き' | '配信済み';
  publish_timestamp: string;
}

type StatusFilter = 'all' | '下書き' | '配信済み';

export default function AdminNotificationsScreen() {
  const router = useRouter();
  const { administrator } = useAuth();

  const [notifications, setNotifications] = useState<NotificationWithDetails[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<NotificationWithDetails[]>([]);
  const [categories, setCategories] = useState<NotificationCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [editingNotification, setEditingNotification] = useState<NotificationWithDetails | null>(null);
  const [newNotification, setNewNotification] = useState<NewNotification>({
    title: '',
    content: '',
    category_id: null,
    status: '下書き',
    publish_timestamp: new Date().toISOString(),
  });
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);

      // お知らせ一覧を取得
      const { data: notificationsData, error: notificationsError } = await supabase
        .from('notifications')
        .select(`
          *,
          notification_categories (*)
        `)
        .order('created_at', { ascending: false });

      if (notificationsError) throw notificationsError;

      // カテゴリー一覧を取得
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('notification_categories')
        .select('*')
        .order('name', { ascending: true });

      if (categoriesError) throw categoriesError;

      const notificationsWithDetails = (notificationsData || []).map(notification => ({
        ...notification,
        category: notification.notification_categories as NotificationCategory | null,
      }));

      setNotifications(notificationsWithDetails);
      setFilteredNotifications(notificationsWithDetails);
      setCategories(categoriesData || []);

    } catch (err) {
      console.error('Notifications fetch error:', err);
      setError('データの取得に失敗しました');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // フィルタリング
  useEffect(() => {
    let filtered = notifications;

    // 検索フィルター
    if (searchQuery.trim()) {
      filtered = filtered.filter(notification =>
        notification.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notification.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // ステータスフィルター
    if (statusFilter !== 'all') {
      filtered = filtered.filter(notification => notification.status === statusFilter);
    }

    // カテゴリーフィルター
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(notification => notification.category_id === categoryFilter);
    }

    setFilteredNotifications(filtered);
  }, [notifications, searchQuery, statusFilter, categoryFilter]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const handleCreateOrUpdateNotification = async () => {
    try {
      if (!newNotification.title || !newNotification.content) {
        Alert.alert('エラー', 'タイトルと本文を入力してください');
        return;
      }

      if (editingNotification) {
        // 更新
        const { error } = await supabase
          .from('notifications')
          .update({
            title: newNotification.title,
            content: newNotification.content,
            category_id: newNotification.category_id,
            status: newNotification.status,
            publish_timestamp: newNotification.publish_timestamp,
          })
          .eq('id', editingNotification.id);

        if (error) throw error;

        Alert.alert('成功', 'お知らせを更新しました');
      } else {
        // 新規作成
        const { error } = await supabase
          .from('notifications')
          .insert([{
            title: newNotification.title,
            content: newNotification.content,
            category_id: newNotification.category_id,
            creator_admin_id: administrator?.id || null,
            status: newNotification.status,
            publish_timestamp: newNotification.publish_timestamp,
          }]);

        if (error) throw error;

        Alert.alert('成功', 'お知らせを作成しました');
      }

      setCreateModalVisible(false);
      setEditingNotification(null);
      setNewNotification({
        title: '',
        content: '',
        category_id: null,
        status: '下書き',
        publish_timestamp: new Date().toISOString(),
      });
      fetchData();

    } catch (err) {
      console.error('Notification save error:', err);
      Alert.alert('エラー', 'お知らせの保存に失敗しました');
    }
  };

  const handleEditNotification = (notification: NotificationWithDetails) => {
    setEditingNotification(notification);
    setNewNotification({
      title: notification.title,
      content: notification.content,
      category_id: notification.category_id,
      status: notification.status,
      publish_timestamp: notification.publish_timestamp,
    });
    setCreateModalVisible(true);
  };

  const handleDeleteNotification = async (notificationId: string) => {
    Alert.alert(
      'お知らせ削除',
      '本当に削除しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('notifications')
                .delete()
                .eq('id', notificationId);

              if (error) throw error;

              Alert.alert('成功', 'お知らせを削除しました');
              fetchData();
            } catch (err) {
              console.error('Notification deletion error:', err);
              Alert.alert('エラー', 'お知らせの削除に失敗しました');
            }
          }
        },
      ]
    );
  };

  const handlePublishNotification = async (notificationId: string) => {
    Alert.alert(
      'お知らせ配信',
      '本当に配信しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '配信',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('notifications')
                .update({
                  status: '配信済み',
                  publish_timestamp: new Date().toISOString(),
                })
                .eq('id', notificationId);

              if (error) throw error;

              Alert.alert('成功', 'お知らせを配信しました');
              fetchData();
            } catch (err) {
              console.error('Notification publish error:', err);
              Alert.alert('エラー', 'お知らせの配信に失敗しました');
            }
          }
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '下書き': return '#6B7280';
      case '配信済み': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case '下書き': return '#F9FAFB';
      case '配信済み': return '#ECFDF5';
      default: return '#F9FAFB';
    }
  };

  const renderNotificationItem = (notification: NotificationWithDetails) => (
    <TouchableOpacity
      key={notification.id}
      style={styles.notificationCard}
      onPress={() => router.push({
        pathname: '/admin-notification-detail',
        params: { notificationId: notification.id }
      })}
    >
      <View style={styles.notificationHeader}>
        <View style={styles.notificationInfo}>
          <Text style={styles.notificationTitle}>{notification.title}</Text>
          <View style={styles.notificationMeta}>
            <View style={[
              styles.statusBadge,
              { backgroundColor: getStatusBgColor(notification.status) }
            ]}>
              <Text style={[
                styles.statusBadgeText,
                { color: getStatusColor(notification.status) }
              ]}>
                {notification.status}
              </Text>
            </View>
            
            {notification.category && (
              <View style={styles.categoryBadge}>
                <Tag size={12} color="#6B7280" />
                <Text style={styles.categoryText}>{notification.category.name}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.notificationActions}>
          {notification.status === '下書き' && (
            <TouchableOpacity
              style={styles.publishButton}
              onPress={(e) => {
                e.stopPropagation();
                handlePublishNotification(notification.id);
              }}
            >
              <Send size={16} color="#10B981" />
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              handleEditNotification(notification);
            }}
          >
            <Edit3 size={16} color="#6B7280" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              handleDeleteNotification(notification.id);
            }}
          >
            <Trash2 size={16} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={styles.notificationContent} numberOfLines={2}>
        {notification.content}
      </Text>

      <View style={styles.notificationFooter}>
        <Clock size={14} color="#9CA3AF" />
        <Text style={styles.notificationDate}>
          {notification.status === '配信済み' ? '配信日: ' : '作成日: '}
          {(() => {
            const dateStr = notification.status === '配信済み' ? notification.publish_timestamp : notification.created_at;
            if (!dateStr || isNaN(new Date(dateStr).getTime())) {
              return '日時不明';
            }
            return format(new Date(dateStr), 'yyyy年M月d日 HH:mm', { locale: ja });
          })()}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <AdminGuard>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>お知らせ管理</Text>
            <View style={{ width: 24 }} />
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#DC2626" />
            <Text style={styles.loadingText}>お知らせを読み込み中...</Text>
          </View>
        </SafeAreaView>
      </AdminGuard>
    );
  }

  if (error) {
    return (
      <AdminGuard>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>お知らせ管理</Text>
            <View style={{ width: 24 }} />
          </View>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
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
          <Text style={styles.headerTitle}>お知らせ管理</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => router.push('/admin-notification-categories')}>
              <Tag size={24} color="#374151" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => {
              setEditingNotification(null);
              setNewNotification({
                title: '',
                content: '',
                category_id: null,
                status: '下書き',
                publish_timestamp: new Date().toISOString(),
              });
              setCreateModalVisible(true);
            }}>
              <Plus size={24} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 検索・フィルターバー */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Search size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="タイトル、本文で検索..."
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
            全{notifications.length}件 | 表示中{filteredNotifications.length}件
          </Text>
          <Text style={styles.filterInfo}>
            {statusFilter !== 'all' && `${statusFilter} | `}
            {categoryFilter !== 'all' && categories.find(c => c.id === categoryFilter)?.name}
          </Text>
        </View>

        {/* お知らせ一覧 */}
        <ScrollView
          style={styles.list}
          contentContainerStyle={filteredNotifications.length === 0 ? styles.emptyContainer : undefined}
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
          {filteredNotifications.length === 0 ? (
            <View style={styles.emptyState}>
              <Bell size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>
                {searchQuery || statusFilter !== 'all' || categoryFilter !== 'all'
                  ? '該当するお知らせが見つかりません'
                  : 'お知らせがありません'
                }
              </Text>
              {!searchQuery && statusFilter === 'all' && categoryFilter === 'all' && (
                <TouchableOpacity
                  style={styles.addButton}
                  onPress={() => {
                    setEditingNotification(null);
                    setNewNotification({
                      title: '',
                      content: '',
                      category_id: null,
                      status: '下書き',
                      publish_timestamp: new Date().toISOString(),
                    });
                    setCreateModalVisible(true);
                  }}
                >
                  <Plus size={16} color="#FFFFFF" />
                  <Text style={styles.addButtonText}>お知らせを作成</Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            filteredNotifications.map(renderNotificationItem)
          )}
        </ScrollView>

        {/* 作成・編集モーダル */}
        <Modal
          visible={createModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => {
                setCreateModalVisible(false);
                setEditingNotification(null);
              }}>
                <Text style={styles.modalCancelText}>キャンセル</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {editingNotification ? 'お知らせ編集' : '新規お知らせ'}
              </Text>
              <TouchableOpacity onPress={handleCreateOrUpdateNotification}>
                <Text style={styles.modalDoneText}>
                  {editingNotification ? '更新' : '作成'}
                </Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              {/* タイトル */}
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>タイトル</Text>
                <TextInput
                  style={styles.input}
                  value={newNotification.title}
                  onChangeText={(text) => setNewNotification({...newNotification, title: text})}
                  placeholder="お知らせのタイトル"
                />
              </View>

              {/* 本文 */}
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>本文</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={newNotification.content}
                  onChangeText={(text) => setNewNotification({...newNotification, content: text})}
                  placeholder="お知らせの内容"
                  multiline
                  numberOfLines={6}
                  textAlignVertical="top"
                />
              </View>

              {/* カテゴリー */}
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>カテゴリー（任意）</Text>
                <ScrollView style={styles.optionsContainer} nestedScrollEnabled>
                  <TouchableOpacity
                    style={[
                      styles.optionItem,
                      newNotification.category_id === null && styles.selectedOption
                    ]}
                    onPress={() => setNewNotification({...newNotification, category_id: null})}
                  >
                    <Text style={[
                      styles.optionText,
                      newNotification.category_id === null && styles.selectedOptionText
                    ]}>
                      なし
                    </Text>
                    {newNotification.category_id === null && (
                      <CheckCircle2 size={20} color="#DC2626" />
                    )}
                  </TouchableOpacity>
                  {categories.map(category => (
                    <TouchableOpacity
                      key={category.id}
                      style={[
                        styles.optionItem,
                        newNotification.category_id === category.id && styles.selectedOption
                      ]}
                      onPress={() => setNewNotification({...newNotification, category_id: category.id})}
                    >
                      <Text style={[
                        styles.optionText,
                        newNotification.category_id === category.id && styles.selectedOptionText
                      ]}>
                        {category.name}
                      </Text>
                      {newNotification.category_id === category.id && (
                        <CheckCircle2 size={20} color="#DC2626" />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* ステータス */}
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>ステータス</Text>
                {(['下書き', '配信済み'] as const).map(status => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.optionItem,
                      newNotification.status === status && styles.selectedOption
                    ]}
                    onPress={() => setNewNotification({...newNotification, status})}
                  >
                    <Text style={[
                      styles.optionText,
                      newNotification.status === status && styles.selectedOptionText
                    ]}>
                      {status}
                    </Text>
                    {newNotification.status === status && (
                      <CheckCircle2 size={20} color="#DC2626" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>

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
              <Text style={styles.modalTitle}>フィルター</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Text style={styles.modalDoneText}>完了</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalContent}>
              {/* ステータスフィルター */}
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>ステータス</Text>
                {(['all', '下書き', '配信済み'] as const).map(status => (
                  <TouchableOpacity
                    key={status}
                    style={styles.optionItem}
                    onPress={() => setStatusFilter(status)}
                  >
                    <Text style={styles.optionText}>
                      {status === 'all' ? 'すべて' : status}
                    </Text>
                    {statusFilter === status && (
                      <CheckCircle2 size={20} color="#DC2626" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* カテゴリーフィルター */}
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>カテゴリー</Text>
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => setCategoryFilter('all')}
                >
                  <Text style={styles.optionText}>すべて</Text>
                  {categoryFilter === 'all' && (
                    <CheckCircle2 size={20} color="#DC2626" />
                  )}
                </TouchableOpacity>
                {categories.map(category => (
                  <TouchableOpacity
                    key={category.id}
                    style={styles.optionItem}
                    onPress={() => setCategoryFilter(category.id)}
                  >
                    <Text style={styles.optionText}>{category.name}</Text>
                    {categoryFilter === category.id && (
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
    marginBottom: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 6,
  },
  notificationMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  categoryText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  notificationActions: {
    flexDirection: 'row',
    gap: 8,
  },
  publishButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#ECFDF5',
  },
  actionButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#F9FAFB',
  },
  notificationContent: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    marginBottom: 12,
  },
  notificationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  notificationDate: {
    fontSize: 12,
    color: '#9CA3AF',
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
  formSection: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
  },
  textArea: {
    minHeight: 120,
  },
  optionsContainer: {
    maxHeight: 150,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectedOption: {
    backgroundColor: '#FEF2F2',
  },
  optionText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  selectedOptionText: {
    color: '#DC2626',
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});