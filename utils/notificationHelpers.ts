import { supabase } from '../lib/supabaseClient';
import type { NotificationData, NotificationType } from '../components/common/NotificationBanner';

// 通知ヘルパー関数
export class NotificationHelper {
  // システム通知を作成
  static async createSystemNotification(
    title: string,
    content: string,
    categoryName: string = 'システム'
  ) {
    try {
      // カテゴリIDを取得
      const { data: categoryData } = await supabase
        .from('notification_categories')
        .select('id')
        .eq('name', categoryName)
        .single();

      if (!categoryData) {
        throw new Error(`Category ${categoryName} not found`);
      }

      // 通知を作成
      const { data, error } = await supabase
        .from('notifications')
        .insert([{
          title,
          content,
          category_id: categoryData.id,
          status: '配信済み',
          publish_timestamp: new Date().toISOString(),
          creator_admin_id: null,
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Failed to create system notification:', error);
      throw error;
    }
  }

  // タスク完了通知
  static createTaskCompletionNotification(studentName: string, taskTitle: string): NotificationData {
    return {
      id: Date.now().toString(),
      type: 'success',
      title: 'タスク完了！',
      message: `${studentName}さんが「${taskTitle}」を完了しました`,
      category: 'タスク',
      timestamp: new Date().toISOString(),
      autoHide: true,
      duration: 3000,
    };
  }

  // 新しいメッセージ通知
  static createNewMessageNotification(senderName: string, content: string): NotificationData {
    return {
      id: Date.now().toString(),
      type: 'message',
      title: `${senderName}からメッセージ`,
      message: content.length > 50 ? content.substring(0, 50) + '...' : content,
      category: 'チャット',
      timestamp: new Date().toISOString(),
      autoHide: false,
      actionUrl: '/chat',
    };
  }

  // 授業リマインダー通知
  static createLessonReminderNotification(lessonTime: string, teacherName: string): NotificationData {
    return {
      id: Date.now().toString(),
      type: 'lesson',
      title: '授業開始リマインダー',
      message: `${lessonTime}から${teacherName}先生との授業が始まります`,
      category: '授業',
      timestamp: new Date().toISOString(),
      autoHide: false,
      actionUrl: '/calendar',
    };
  }

  // エラー通知
  static createErrorNotification(title: string, message: string): NotificationData {
    return {
      id: Date.now().toString(),
      type: 'error',
      title,
      message,
      category: 'エラー',
      timestamp: new Date().toISOString(),
      autoHide: true,
      duration: 5000,
    };
  }

  // 成功通知
  static createSuccessNotification(title: string, message: string): NotificationData {
    return {
      id: Date.now().toString(),
      type: 'success',
      title,
      message,
      category: '成功',
      timestamp: new Date().toISOString(),
      autoHide: true,
      duration: 3000,
    };
  }

  // 警告通知
  static createWarningNotification(title: string, message: string): NotificationData {
    return {
      id: Date.now().toString(),
      type: 'warning',
      title,
      message,
      category: '警告',
      timestamp: new Date().toISOString(),
      autoHide: false,
    };
  }

  // 通知タイプをコンテンツから推定
  static inferNotificationType(title: string, content: string): NotificationType {
    const text = `${title} ${content}`.toLowerCase();
    
    if (text.includes('エラー') || text.includes('失敗') || text.includes('問題')) {
      return 'error';
    }
    if (text.includes('警告') || text.includes('注意') || text.includes('確認')) {
      return 'warning';
    }
    if (text.includes('完了') || text.includes('成功') || text.includes('承認')) {
      return 'success';
    }
    if (text.includes('メッセージ') || text.includes('チャット') || text.includes('返信')) {
      return 'message';
    }
    if (text.includes('授業') || text.includes('レッスン') || text.includes('面談')) {
      return 'lesson';
    }
    if (text.includes('課題') || text.includes('宿題') || text.includes('タスク')) {
      return 'task';
    }
    if (text.includes('担当') || text.includes('割り当て') || text.includes('配属')) {
      return 'assignment';
    }
    
    return 'info';
  }

  // 通知の優先度を計算
  static calculateNotificationPriority(type: NotificationType): 'high' | 'medium' | 'low' {
    switch (type) {
      case 'error':
      case 'warning':
        return 'high';
      case 'message':
      case 'lesson':
        return 'medium';
      default:
        return 'low';
    }
  }

  // 通知の表示時間を計算
  static calculateDisplayDuration(type: NotificationType, contentLength: number): number {
    const baseDuration = type === 'error' || type === 'warning' ? 7000 : 5000;
    const contentMultiplier = Math.min(contentLength / 50, 2); // 最大2倍
    return baseDuration + (contentMultiplier * 1000);
  }
}

// 通知のバッチ処理
export class NotificationBatch {
  private notifications: NotificationData[] = [];

  add(notification: NotificationData): void {
    this.notifications.push(notification);
  }

  addMultiple(notifications: NotificationData[]): void {
    this.notifications.push(...notifications);
  }

  // 優先度でソート
  sort(): NotificationData[] {
    return this.notifications.sort((a, b) => {
      const priorityA = NotificationHelper.calculateNotificationPriority(a.type);
      const priorityB = NotificationHelper.calculateNotificationPriority(b.type);
      
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[priorityB] - priorityOrder[priorityA];
    });
  }

  // 重複を除去
  deduplicate(): NotificationData[] {
    const seen = new Set<string>();
    return this.notifications.filter(notification => {
      const key = `${notification.type}-${notification.title}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  // 古い通知を除去
  removeOld(maxAge: number = 5 * 60 * 1000): NotificationData[] { // 5分
    const now = Date.now();
    return this.notifications.filter(notification => {
      const notificationTime = new Date(notification.timestamp).getTime();
      return now - notificationTime < maxAge;
    });
  }

  // バッチを処理して最終的な通知リストを取得
  process(): NotificationData[] {
    this.notifications = this.removeOld();
    this.notifications = this.deduplicate();
    return this.sort();
  }

  clear(): void {
    this.notifications = [];
  }

  getCount(): number {
    return this.notifications.length;
  }
}

// 通知のローカルストレージ管理
export class NotificationStorage {
  private static readonly STORAGE_KEY = 'app_notifications';
  private static readonly MAX_STORED_NOTIFICATIONS = 100;

  // 通知を保存
  static async saveNotification(notification: NotificationData): Promise<void> {
    try {
      const stored = await this.getStoredNotifications();
      const updated = [notification, ...stored.slice(0, this.MAX_STORED_NOTIFICATIONS - 1)];
      
      // AsyncStorageがある場合のみ保存
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
      }
    } catch (error) {
      console.warn('Failed to save notification to storage:', error);
    }
  }

  // 保存された通知を取得
  static async getStoredNotifications(): Promise<NotificationData[]> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const stored = localStorage.getItem(this.STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
      }
      return [];
    } catch (error) {
      console.warn('Failed to get stored notifications:', error);
      return [];
    }
  }

  // 通知を削除
  static async removeNotification(notificationId: string): Promise<void> {
    try {
      const stored = await this.getStoredNotifications();
      const filtered = stored.filter(n => n.id !== notificationId);
      
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filtered));
      }
    } catch (error) {
      console.warn('Failed to remove notification from storage:', error);
    }
  }

  // 全ての通知をクリア
  static async clearAll(): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem(this.STORAGE_KEY);
      }
    } catch (error) {
      console.warn('Failed to clear notifications from storage:', error);
    }
  }
}