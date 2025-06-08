// ADM-007: お知らせ作成・管理画面用の型定義

// お知らせカテゴリー
export interface NotificationCategory {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

// お知らせ基本情報
export interface Notification {
  id: string;
  title: string;
  content: string;
  category_id?: string;
  creator_admin_id?: string;
  publish_timestamp: string;
  status: '下書き' | '配信済み';
  created_at: string;
  updated_at: string;
}

// お知らせ管理画面用の拡張されたお知らせデータ
export interface NotificationWithDetails extends Notification {
  // カテゴリー情報
  category: NotificationCategory | null;
  // 作成者情報
  creator: {
    id: string;
    full_name: string;
  } | null;
  // 統計情報
  view_count?: number;
  recipient_count?: number;
  // 公開・下書き判定
  is_published: boolean;
  is_scheduled: boolean;
  is_draft: boolean;
  // 配信までの残り時間（分）
  time_until_publish?: number;
}

// お知らせフィルター
export interface NotificationFilter {
  search: string; // タイトル・内容検索
  status: '下書き' | '配信済み' | 'all';
  category_id: string | 'all';
  creator_id: string | 'all';
  publish_date_range: {
    start?: string;
    end?: string;
  } | null;
  created_date_range: {
    start?: string;
    end?: string;
  } | null;
}

// お知らせソート
export interface NotificationSort {
  field: 'title' | 'publish_timestamp' | 'created_at' | 'status' | 'category';
  direction: 'asc' | 'desc';
}

// お知らせ作成・編集フォーム
export interface NotificationFormData {
  title: string;
  content: string;
  category_id?: string;
  publish_timestamp: string;
  status: '下書き' | '配信済み';
  is_immediate_publish: boolean; // 即座に配信するかどうか
}

// カテゴリー作成・編集フォーム
export interface CategoryFormData {
  name: string;
}

// お知らせ統計
export interface NotificationStatistics {
  total: number;
  published: number;
  draft: number;
  scheduled: number; // 予約配信
  this_month_published: number;
  this_week_published: number;
  categories_count: number;
  recent_activity: {
    last_published?: string;
    last_created?: string;
  };
}

// お知らせ一括操作
export interface BulkNotificationAction {
  type: 'publish' | 'draft' | 'delete' | 'change_category' | 'schedule_publish';
  notificationIds: string[];
  newCategoryId?: string; // カテゴリー変更用
  publishTimestamp?: string; // 予約配信用
  notes?: string;
}

// お知らせプレビュー
export interface NotificationPreview {
  title: string;
  content: string;
  category_name?: string;
  publish_timestamp: string;
  formatted_content: string; // HTMLレンダリング済み
}

// お知らせテンプレート（将来拡張用）
export interface NotificationTemplate {
  id: string;
  name: string;
  title_template: string;
  content_template: string;
  category_id?: string;
  created_at: string;
  created_by: string;
}

// API レスポンス用
export interface NotificationManagementResponse {
  success: boolean;
  data?: {
    notifications: NotificationWithDetails[];
    categories: NotificationCategory[];
    statistics: NotificationStatistics;
    totalCount: number;
  };
  error?: string;
}

export interface NotificationCreateResponse {
  success: boolean;
  data?: {
    notification: Notification;
    published_immediately: boolean;
  };
  error?: string;
}

export interface NotificationUpdateResponse {
  success: boolean;
  data?: Notification;
  error?: string;
}

export interface CategoryManagementResponse {
  success: boolean;
  data?: NotificationCategory[];
  error?: string;
}

// お知らせ管理画面の状態
export interface NotificationManagementState {
  notifications: NotificationWithDetails[];
  categories: NotificationCategory[];
  statistics: NotificationStatistics;
  filter: NotificationFilter;
  sort: NotificationSort;
  selectedNotifications: string[];
  loading: boolean;
  error: string | null;
  showCreateModal: boolean;
  showEditModal: boolean;
  showPreviewModal: boolean;
  showCategoryModal: boolean;
  selectedNotification: NotificationWithDetails | null;
}

// バリデーション
export interface NotificationFormValidation {
  isValid: boolean;
  errors: {
    field: keyof NotificationFormData;
    message: string;
  }[];
  warnings: {
    field: string;
    message: string;
  }[];
}

// お知らせ配信履歴（将来拡張用）
export interface NotificationDeliveryHistory {
  id: string;
  notification_id: string;
  recipient_type: 'all' | 'students' | 'teachers' | 'specific';
  recipient_count: number;
  delivered_count: number;
  read_count: number;
  delivery_started_at: string;
  delivery_completed_at?: string;
  delivery_status: 'pending' | 'in_progress' | 'completed' | 'failed';
  error_message?: string;
}

// 配信設定
export interface NotificationDeliverySettings {
  default_publish_time: string; // HH:mm形式
  auto_publish_enabled: boolean;
  notification_retention_days: number;
  max_notifications_per_day: number;
  emergency_notification_enabled: boolean;
}

// エクスポート設定
export interface NotificationExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  include_fields: (keyof NotificationWithDetails)[];
  include_content: boolean;
  include_statistics: boolean;
  date_range?: {
    start: string;
    end: string;
  };
}