'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/ui/Header';
import Breadcrumb from '@/components/ui/Breadcrumb';
import PageHeader from '@/components/ui/PageHeader';
import {
  NotificationWithDetails,
  NotificationCategory,
  NotificationFilter,
  NotificationSort,
  NotificationStatistics,
  NotificationFormData,
  BulkNotificationAction
} from '@/types/notifications';
import NotificationTable from './components/NotificationTable';
import NotificationFilters from './components/NotificationFilters';
import NotificationStatisticsCard from './components/NotificationStatisticsCard';
import NotificationCreateModal from './components/NotificationCreateModal';
import NotificationEditModal from './components/NotificationEditModal';
import NotificationPreviewModal from './components/NotificationPreviewModal';
import CategoryManagementModal from './components/CategoryManagementModal';
import BulkNotificationActions from './components/BulkNotificationActions';

export default function NotificationsPage() {
  console.log('🚨🚨🚨 NOTIFICATIONS PAGE LOADED - FILE IS BEING SERVED 🚨🚨🚨');
  const { user, loading: authLoading } = useAuth();
  const [notifications, setNotifications] = useState<NotificationWithDetails[]>([]);
  const [categories, setCategories] = useState<NotificationCategory[]>([]);
  const [statistics, setStatistics] = useState<NotificationStatistics>({
    total: 0,
    published: 0,
    draft: 0,
    scheduled: 0,
    this_month_published: 0,
    this_week_published: 0,
    categories_count: 0,
    recent_activity: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([]);
  
  // モーダル状態
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<NotificationWithDetails | null>(null);

  const [filter, setFilter] = useState<NotificationFilter>({
    search: '',
    status: 'all',
    category_id: 'all',
    creator_id: 'all',
    publish_date_range: null,
    created_date_range: null
  });

  const [sort, setSort] = useState<NotificationSort>({
    field: 'publish_timestamp',
    direction: 'desc'
  });

  const supabase = useMemo(() => createClient(), []);

  // お知らせデータの取得
  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // お知らせデータと関連情報を取得
      const { data: notificationsData, error: notificationsError } = await supabase
        .from('notifications')
        .select(`
          *,
          notification_categories!left (
            id,
            name
          ),
          administrators!left (
            id,
            full_name
          )
        `)
        .order('created_at', { ascending: false });

      if (notificationsError) throw notificationsError;

      // カテゴリーデータを取得
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('notification_categories')
        .select('*')
        .order('name');

      if (categoriesError) throw categoriesError;

      // データを整形
      const formattedNotifications: NotificationWithDetails[] = (notificationsData || []).map(notification => {
        const now = new Date();
        const publishTime = new Date(notification.publish_timestamp);
        const isPublished = notification.status === '配信済み';
        const isScheduled = !isPublished && publishTime > now;
        const isDraft = notification.status === '下書き';

        return {
          ...notification,
          category: notification.notification_categories,
          creator: notification.administrators,
          view_count: 0, // TODO: 実際の閲覧数を取得
          recipient_count: 0, // TODO: 実際の受信者数を取得
          is_published: isPublished,
          is_scheduled: isScheduled,
          is_draft: isDraft,
          time_until_publish: isScheduled ? Math.ceil((publishTime.getTime() - now.getTime()) / (1000 * 60)) : undefined
        };
      });

      // フィルター適用
      const filteredNotifications = formattedNotifications.filter(notification => {
        // 検索フィルター
        if (filter.search) {
          const searchLower = filter.search.toLowerCase();
          const matchesTitle = notification.title.toLowerCase().includes(searchLower);
          const matchesContent = notification.content.toLowerCase().includes(searchLower);
          if (!matchesTitle && !matchesContent) return false;
        }

        // ステータスフィルター
        if (filter.status !== 'all' && notification.status !== filter.status) {
          return false;
        }

        // カテゴリーフィルター
        if (filter.category_id !== 'all' && notification.category_id !== filter.category_id) {
          return false;
        }

        // 作成者フィルター
        if (filter.creator_id !== 'all' && notification.creator_admin_id !== filter.creator_id) {
          return false;
        }

        // 配信日フィルター
        if (filter.publish_date_range) {
          const publishDate = new Date(notification.publish_timestamp);
          if (filter.publish_date_range.start && publishDate < new Date(filter.publish_date_range.start)) {
            return false;
          }
          if (filter.publish_date_range.end && publishDate > new Date(filter.publish_date_range.end)) {
            return false;
          }
        }

        return true;
      });

      // ソート適用
      filteredNotifications.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sort.field) {
          case 'title':
            aValue = a.title;
            bValue = b.title;
            break;
          case 'publish_timestamp':
            aValue = new Date(a.publish_timestamp);
            bValue = new Date(b.publish_timestamp);
            break;
          case 'created_at':
            aValue = new Date(a.created_at);
            bValue = new Date(b.created_at);
            break;
          case 'status':
            aValue = a.status;
            bValue = b.status;
            break;
          case 'category':
            aValue = a.category?.name || '';
            bValue = b.category?.name || '';
            break;
          default:
            aValue = new Date(a.publish_timestamp);
            bValue = new Date(b.publish_timestamp);
        }

        if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1;
        return 0;
      });

      // 統計の計算
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const thisWeekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const stats: NotificationStatistics = {
        total: formattedNotifications.length,
        published: formattedNotifications.filter(n => n.status === '配信済み').length,
        draft: formattedNotifications.filter(n => n.status === '下書き').length,
        scheduled: formattedNotifications.filter(n => n.is_scheduled).length,
        this_month_published: formattedNotifications.filter(n => 
          n.status === '配信済み' && new Date(n.publish_timestamp) >= thisMonthStart
        ).length,
        this_week_published: formattedNotifications.filter(n => 
          n.status === '配信済み' && new Date(n.publish_timestamp) >= thisWeekStart
        ).length,
        categories_count: categoriesData?.length || 0,
        recent_activity: {
          last_published: formattedNotifications
            .filter(n => n.status === '配信済み')
            .sort((a, b) => new Date(b.publish_timestamp).getTime() - new Date(a.publish_timestamp).getTime())[0]?.publish_timestamp,
          last_created: formattedNotifications
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0]?.created_at
        }
      };

      setNotifications(filteredNotifications);
      setCategories(categoriesData || []);
      setStatistics(stats);

    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err instanceof Error ? err.message : 'お知らせデータの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [supabase, filter, sort]);

  // 新規お知らせ作成
  const handleCreateNotification = useCallback(async (formData: NotificationFormData) => {
    try {
      setError(null);

      console.log('🚨🚨🚨 CREATE NOTIFICATION FUNCTION CALLED 🚨🚨🚨');
      console.log('🔍 Debug - User object:', { user });
      console.log('🔍 Debug - user.id:', user?.id);
      console.log('🔍 Debug - user.profile:', user?.profile);
      console.log('🔍 Debug - user.profile.id:', user?.profile?.id);

      const notificationData = {
        title: formData.title,
        content: formData.content,
        category_id: formData.category_id || null,
        creator_admin_id: user?.id, // user?.profile?.id から user?.id に変更してテスト
        publish_timestamp: formData.is_immediate_publish ? new Date().toISOString() : formData.publish_timestamp,
        status: formData.is_immediate_publish ? '配信済み' as const : formData.status
      };

      console.log('🔍 Debug - Notification data to be sent:', notificationData);

      const { data, error } = await supabase
        .from('notifications')
        .insert(notificationData)
        .select()
        .single();

      if (error) throw error;

      // TODO: 即座配信の場合は配信処理を実行
      if (formData.is_immediate_publish) {
        console.log('Sending immediate notification:', data.id);
      }

      await fetchNotifications();
      setShowCreateModal(false);

    } catch (err) {
      console.error('Error creating notification:', err);
      setError(err instanceof Error ? err.message : 'お知らせの作成に失敗しました');
      throw err;
    }
  }, [supabase, user, fetchNotifications]);

  // お知らせ更新
  const handleUpdateNotification = useCallback(async (notificationId: string, updateData: Partial<NotificationFormData>) => {
    try {
      setError(null);

      const { error } = await supabase
        .from('notifications')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', notificationId);

      if (error) throw error;

      await fetchNotifications();
      setShowEditModal(false);

    } catch (err) {
      console.error('Error updating notification:', err);
      setError(err instanceof Error ? err.message : 'お知らせの更新に失敗しました');
      throw err;
    }
  }, [supabase, fetchNotifications]);

  // お知らせ削除
  const handleDeleteNotification = useCallback(async (notificationId: string) => {
    try {
      setError(null);

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      await fetchNotifications();

    } catch (err) {
      console.error('Error deleting notification:', err);
      setError(err instanceof Error ? err.message : 'お知らせの削除に失敗しました');
    }
  }, [supabase, fetchNotifications]);

  // 一括操作処理
  const handleBulkAction = useCallback(async (action: BulkNotificationAction) => {
    try {
      setError(null);

      switch (action.type) {
        case 'publish':
          {
            const { error } = await supabase
              .from('notifications')
              .update({ 
                status: '配信済み',
                publish_timestamp: new Date().toISOString(),
                updated_at: new Date().toISOString()
              })
              .in('id', action.notificationIds);
            
            if (error) throw error;
          }
          break;

        case 'draft':
          {
            const { error } = await supabase
              .from('notifications')
              .update({ 
                status: '下書き',
                updated_at: new Date().toISOString()
              })
              .in('id', action.notificationIds);
            
            if (error) throw error;
          }
          break;

        case 'delete':
          {
            const { error } = await supabase
              .from('notifications')
              .delete()
              .in('id', action.notificationIds);
            
            if (error) throw error;
          }
          break;

        case 'change_category':
          {
            if (!action.newCategoryId) throw new Error('カテゴリーIDが指定されていません');
            
            const { error } = await supabase
              .from('notifications')
              .update({ 
                category_id: action.newCategoryId,
                updated_at: new Date().toISOString()
              })
              .in('id', action.notificationIds);
            
            if (error) throw error;
          }
          break;

        case 'schedule_publish':
          {
            if (!action.publishTimestamp) throw new Error('配信日時が指定されていません');
            
            const { error } = await supabase
              .from('notifications')
              .update({ 
                status: '下書き',
                publish_timestamp: action.publishTimestamp,
                updated_at: new Date().toISOString()
              })
              .in('id', action.notificationIds);
            
            if (error) throw error;
          }
          break;

        default:
          throw new Error('未対応の操作です');
      }

      await fetchNotifications();

    } catch (err) {
      console.error('Bulk action error:', err);
      setError(err instanceof Error ? err.message : '一括操作に失敗しました');
      throw err;
    }
  }, [supabase, fetchNotifications]);

  // お知らせプレビュー
  const handlePreviewNotification = (notification: NotificationWithDetails) => {
    setSelectedNotification(notification);
    setShowPreviewModal(true);
  };

  // お知らせ編集
  const handleEditNotification = (notification: NotificationWithDetails) => {
    setSelectedNotification(notification);
    setShowEditModal(true);
  };

  // 初期データ取得
  useEffect(() => {
    if (user?.role === 'admin') {
      fetchNotifications();
    }
  }, [user, fetchNotifications]);

  // 認証チェック - 認証処理中は待機
  console.log('👤 お知らせ管理ページ - 認証状態:', { user, authLoading });
  console.log('👤 ユーザーロール:', user?.role);
  
  if (authLoading) {
    console.log('👤 認証処理中...');
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
        <Header />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-2 text-gray-600">認証状態を確認中...</span>
        </div>
      </div>
    );
  }
  
  if (!user) {
    console.log('👤 ユーザーがログインしていません');
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900">ログインが必要です</h3>
            <p className="text-gray-500">この機能にアクセスするにはログインしてください</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (user?.role !== 'admin') {
    console.log('👤 アクセス拒否 - ユーザーロールが admin ではありません:', user?.role);
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900">アクセス権限がありません</h3>
            <p className="text-gray-500">この機能は運営者のみ利用可能です</p>
            <p className="text-gray-400 text-sm mt-2">現在のロール: {user?.role || 'undefined'}</p>
          </div>
        </div>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: 'ホーム', href: '/' },
    { label: 'お知らせ管理', href: '/notifications' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
        <Header />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-2 text-gray-600">お知らせデータを読み込み中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={breadcrumbItems} />
        
        <div className="mt-8">
          {/* ヘッダー */}
          <PageHeader
            title="お知らせ管理"
            description="生徒・保護者・講師向けのお知らせの作成と配信管理"
            icon="📢"
            colorTheme="accent"
            actions={
              <>
                <button
                  onClick={() => setShowCategoryModal(true)}
                  className="px-6 py-3 border-2 border-white/30 rounded-xl text-white bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-accent-700 transition-all duration-200 backdrop-blur-sm font-medium"
                >
                  カテゴリー管理
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-accent-700 transition-all duration-200 font-medium shadow-lg"
                >
                  新規お知らせ作成
                </button>
              </>
            }
          />

          {error && (
            <div className="mb-6 bg-gradient-to-r from-error-50 to-error-100 border border-error-200 rounded-xl p-6 shadow-lg">
              <div className="flex items-start space-x-4">
                <div className="w-8 h-8 bg-gradient-to-br from-error-500 to-error-600 rounded-lg flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-bold">!</span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-error-800 mb-2">エラーが発生しました</h3>
                  <p className="text-error-700">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* 統計カード */}
          <NotificationStatisticsCard
            statistics={statistics}
            className="mt-6"
          />

          {/* フィルター */}
          <NotificationFilters
            filter={filter}
            onFilterChange={setFilter}
            categories={categories}
            className="mt-6"
          />

          {/* 一括操作 */}
          {selectedNotifications.length > 0 && (
            <BulkNotificationActions
              selectedNotifications={selectedNotifications}
              notifications={notifications}
              categories={categories}
              onBulkAction={handleBulkAction}
              onClearSelection={() => setSelectedNotifications([])}
              className="mt-4"
            />
          )}

          {/* お知らせ一覧テーブル */}
          <NotificationTable
            notifications={notifications}
            selectedNotifications={selectedNotifications}
            onSelectionChange={setSelectedNotifications}
            onPreview={handlePreviewNotification}
            onEdit={handleEditNotification}
            onDelete={handleDeleteNotification}
            sort={sort}
            onSortChange={setSort}
            className="mt-6"
          />

          <div className="mt-4 text-sm text-gray-500">
            {notifications.length} 件のお知らせ
          </div>
        </div>
      </main>

      {/* モーダル */}
      <NotificationCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateNotification}
        categories={categories}
      />

      <NotificationEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        notification={selectedNotification}
        onSubmit={handleUpdateNotification}
        categories={categories}
      />

      <NotificationPreviewModal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        notification={selectedNotification}
      />

      <CategoryManagementModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        categories={categories}
        onUpdate={fetchNotifications}
      />
    </div>
  );
}