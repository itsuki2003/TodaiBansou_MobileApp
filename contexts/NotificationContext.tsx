import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { router } from 'expo-router';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from './AuthContext';
import type { NotificationData, NotificationType } from '../components/common/NotificationBanner';
import type { Database } from '../types/database.types';

type Notification = Database['public']['Tables']['notifications']['Row'];

interface NotificationContextType {
  // アプリ内通知
  notifications: NotificationData[];
  showNotification: (notification: Omit<NotificationData, 'id' | 'timestamp'>) => void;
  dismissNotification: (id: string) => void;
  clearAllNotifications: () => void;

  // データベース通知
  dbNotifications: Notification[];
  unreadCount: number;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  
  // 設定
  notificationSettings: {
    pushEnabled: boolean;
    soundEnabled: boolean;
    vibrationEnabled: boolean;
    categories: {
      [key: string]: boolean;
    };
  };
  updateNotificationSettings: (settings: Partial<NotificationContextType['notificationSettings']>) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user, userRole } = useAuth();
  
  // アプリ内通知状態
  const [notifications, setNotifications] = useState<NotificationData[]>([]);
  
  // データベース通知状態
  const [dbNotifications, setDbNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  // 通知設定
  const [notificationSettings, setNotificationSettings] = useState({
    pushEnabled: true,
    soundEnabled: true,
    vibrationEnabled: true,
    categories: {
      'お知らせ': true,
      '授業': true,
      'システム': true,
      '重要': true,
    },
  });

  // アプリ内通知の表示
  const showNotification = useCallback((notification: Omit<NotificationData, 'id' | 'timestamp'>) => {
    const newNotification: NotificationData = {
      ...notification,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
    };

    setNotifications(prev => [newNotification, ...prev.slice(0, 4)]); // 最大5件まで表示
  }, []);

  // アプリ内通知の削除
  const dismissNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // 全てのアプリ内通知をクリア
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // データベース通知の取得
  const fetchNotifications = useCallback(async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          notification_categories (
            name
          )
        `)
        .eq('status', '配信済み')
        .order('publish_timestamp', { ascending: false })
        .limit(50);

      if (error) throw error;

      setDbNotifications(data || []);
      
      // 未読数の計算（実際の実装では separate read status table が必要）
      setUnreadCount(data?.length || 0);

    } catch (err) {
      console.error('Notifications fetch error:', err);
      showNotification({
        type: 'error',
        title: 'エラー',
        message: '通知の取得に失敗しました',
        autoHide: true,
      });
    }
  }, [user, showNotification]);

  // 通知を既読にマーク（実装簡略化）
  const markAsRead = useCallback(async (notificationId: string) => {
    // TODO: 実際の実装では read_status テーブルに記録
    console.log('Mark as read:', notificationId);
  }, []);

  // 全ての通知を既読にマーク
  const markAllAsRead = useCallback(async () => {
    // TODO: 実際の実装では read_status テーブルを更新
    setUnreadCount(0);
  }, []);

  // 通知設定の更新
  const updateNotificationSettings = useCallback((newSettings: Partial<NotificationContextType['notificationSettings']>) => {
    setNotificationSettings(prev => ({
      ...prev,
      ...newSettings,
      categories: {
        ...prev.categories,
        ...newSettings.categories,
      },
    }));
  }, []);

  // リアルタイム通知の監視
  useEffect(() => {
    if (!user) return;

    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `status=eq.配信済み`,
        },
        (payload) => {
          const notification = payload.new as Notification;
          
          // アプリ内通知として表示
          showNotification({
            type: getNotificationTypeFromCategory(notification.title),
            title: notification.title,
            message: notification.content,
            category: 'お知らせ',
            autoHide: false,
            actionUrl: '/notifications',
          });

          // データベース通知リストを更新
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user, showNotification, fetchNotifications]);

  // 初期通知データの取得
  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user, fetchNotifications]);

  // チャットメッセージによる通知
  useEffect(() => {
    if (!user) return;

    let chatSubscription: any = null;

    if (userRole === 'parent' || userRole === 'parent') {
      // 生徒・保護者: 自分のチャットグループのメッセージを監視
      chatSubscription = supabase
        .channel('chat_messages_student')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
          },
          (payload) => {
            const message = payload.new;
            
            // 自分が送信したメッセージは通知しない
            if (message.sender_user_id === user.id) return;

            // 講師・運営からのメッセージのみ通知
            if (message.sender_role === '講師' || message.sender_role === '運営') {
              showNotification({
                type: 'message',
                title: `${message.sender_role}からメッセージ`,
                message: message.content?.substring(0, 50) + (message.content?.length > 50 ? '...' : ''),
                autoHide: false,
                actionUrl: '/chat',
              });
            }
          }
        )
        .subscribe();
    } else if (userRole === 'teacher') {
      // 講師: 担当生徒からのメッセージを監視
      chatSubscription = supabase
        .channel('chat_messages_teacher')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'chat_messages',
          },
          (payload) => {
            const message = payload.new;
            
            // 自分が送信したメッセージは通知しない
            if (message.sender_user_id === user.id) return;

            // 生徒・保護者からのメッセージのみ通知
            if (message.sender_role === '生徒' || message.sender_role === '保護者') {
              showNotification({
                type: 'message',
                title: `${message.sender_role}からメッセージ`,
                message: message.content?.substring(0, 50) + (message.content?.length > 50 ? '...' : ''),
                autoHide: false,
                actionUrl: '/chat',
              });
            }
          }
        )
        .subscribe();
    }

    return () => {
      if (chatSubscription) {
        supabase.removeChannel(chatSubscription);
      }
    };
  }, [user, userRole, showNotification]);

  const value: NotificationContextType = {
    notifications,
    showNotification,
    dismissNotification,
    clearAllNotifications,
    dbNotifications,
    unreadCount,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    notificationSettings,
    updateNotificationSettings,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}

// ユーティリティ関数
function getNotificationTypeFromCategory(title: string): NotificationType {
  if (title.includes('チャット') || title.includes('メッセージ')) return 'message';
  if (title.includes('授業') || title.includes('レッスン')) return 'lesson';
  if (title.includes('課題') || title.includes('宿題')) return 'task';
  if (title.includes('警告') || title.includes('注意')) return 'warning';
  if (title.includes('エラー') || title.includes('失敗')) return 'error';
  if (title.includes('完了') || title.includes('成功')) return 'success';
  return 'info';
}