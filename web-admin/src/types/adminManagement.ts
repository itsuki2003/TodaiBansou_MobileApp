// ADM-S1: 運営者アカウント管理画面用の型定義

// 運営者アカウント基本情報
export interface Administrator {
  id: string;
  user_id?: string;
  full_name: string;
  email: string;
  account_status: '有効' | '無効';
  created_at: string;
  updated_at: string;
}

// 運営者管理画面用の拡張された運営者データ
export interface AdministratorWithManagementInfo extends Administrator {
  // 最終ログイン日時
  last_login_at?: string;
  // アカウント作成方法
  account_creation_method: 'manual' | 'system' | 'import';
  // 活動統計
  activity_stats: {
    // 今月の作成したお知らせ数
    notifications_created_this_month: number;
    // 今月の登録した生徒数
    students_registered_this_month: number;
    // 今月の作成した講師数
    teachers_created_this_month: number;
    // 最終活動日時
    last_activity_at?: string;
  };
  // ログイン頻度
  login_frequency: 'daily' | 'weekly' | 'monthly' | 'rarely' | 'never';
  // セキュリティ情報
  security_info: {
    // 2FA有効フラグ
    two_factor_enabled: boolean;
    // パスワード最終変更日
    password_last_changed?: string;
    // 不正ログイン試行回数
    failed_login_attempts: number;
  };
}

// 運営者フィルター
export interface AdministratorFilter {
  search: string; // 名前・メール検索
  account_status: '有効' | '無効' | 'all';
  account_creation_method: 'manual' | 'system' | 'import' | 'all';
  last_login_period: '7' | '30' | '90' | 'never' | 'all'; // 最終ログイン期間
  login_frequency: 'daily' | 'weekly' | 'monthly' | 'rarely' | 'never' | 'all';
  created_date_range: {
    start?: string;
    end?: string;
  } | null;
}

// 運営者ソート
export interface AdministratorSort {
  field: 'full_name' | 'email' | 'account_status' | 'created_at' | 'last_login_at' | 'login_frequency';
  direction: 'asc' | 'desc';
}

// 新規運営者アカウント作成フォーム
export interface NewAdministratorFormData {
  full_name: string;
  email: string;
  account_status: '有効' | '無効';
  initial_password: string;
  send_welcome_email: boolean;
  grant_super_admin: boolean; // スーパー管理者権限
  notes?: string; // 作成理由・備考
}

// 運営者基本情報編集フォーム
export interface AdministratorBasicEditFormData {
  full_name: string;
  account_status: '有効' | '無効';
  notes?: string;
}

// パスワードリセット
export interface AdministratorPasswordResetData {
  admin_id: string;
  admin_email: string;
  new_password: string;
  send_notification_email: boolean;
  reset_reason: string;
  force_password_change: boolean; // 次回ログイン時に強制変更
}

// 運営者統計
export interface AdministratorStatistics {
  total: number;
  active: number;
  inactive: number;
  super_admins: number; // スーパー管理者数
  regular_admins: number; // 一般管理者数
  recent_logins: number; // 過去7日のログイン数
  never_logged_in: number; // 未ログイン数
  this_month_created: number; // 今月の新規作成数
  security_alerts: {
    // セキュリティ警告数
    accounts_with_weak_passwords: number;
    accounts_without_2fa: number;
    accounts_with_failed_logins: number;
  };
}

// 運営者活動ログ
export interface AdministratorActivity {
  admin_id: string;
  admin_name: string;
  activity_type: 'login' | 'logout' | 'create_user' | 'delete_user' | 'password_reset' | 'settings_change' | 'data_export';
  activity_description: string;
  activity_timestamp: string;
  ip_address?: string;
  user_agent?: string;
  target_user_id?: string; // 操作対象のユーザーID
  target_user_type?: 'student' | 'teacher' | 'admin';
}

// 一括操作用
export interface BulkAdministratorAction {
  type: 'activate' | 'deactivate' | 'reset_password' | 'send_notification' | 'delete' | 'enable_2fa';
  adminIds: string[];
  notes?: string;
  newPassword?: string; // パスワードリセット用
  notificationMessage?: string; // 通知メッセージ用
  force_password_change?: boolean; // 強制パスワード変更
}

// セキュリティ設定
export interface AdministratorSecuritySettings {
  password_policy: {
    min_length: number;
    require_uppercase: boolean;
    require_lowercase: boolean;
    require_numbers: boolean;
    require_symbols: boolean;
    password_expiry_days: number;
  };
  login_security: {
    max_failed_attempts: number;
    lockout_duration_minutes: number;
    require_2fa: boolean;
    session_timeout_minutes: number;
  };
  audit_settings: {
    log_all_actions: boolean;
    log_retention_days: number;
    alert_on_suspicious_activity: boolean;
  };
}

// API レスポンス用
export interface AdministratorManagementResponse {
  success: boolean;
  data?: {
    administrators: AdministratorWithManagementInfo[];
    statistics: AdministratorStatistics;
    security_settings: AdministratorSecuritySettings;
    totalCount: number;
  };
  error?: string;
}

export interface AdministratorCreateResponse {
  success: boolean;
  data?: {
    administrator: Administrator;
    auth_user_id?: string;
    welcome_email_sent: boolean;
    initial_password_sent: boolean;
  };
  error?: string;
}

export interface AdministratorUpdateResponse {
  success: boolean;
  data?: Administrator;
  error?: string;
}

export interface AdministratorPasswordResetResponse {
  success: boolean;
  data?: {
    reset_email_sent: boolean;
    new_password_hash: string;
    force_change_required: boolean;
  };
  error?: string;
}

// 運営者管理画面の状態
export interface AdministratorManagementState {
  administrators: AdministratorWithManagementInfo[];
  statistics: AdministratorStatistics;
  securitySettings: AdministratorSecuritySettings;
  filter: AdministratorFilter;
  sort: AdministratorSort;
  selectedAdministrators: string[];
  loading: boolean;
  error: string | null;
  showCreateModal: boolean;
  showEditModal: boolean;
  showDetailModal: boolean;
  showSecurityModal: boolean;
  selectedAdministrator: AdministratorWithManagementInfo | null;
}

// バリデーション
export interface AdministratorFormValidation {
  isValid: boolean;
  errors: {
    field: keyof (NewAdministratorFormData | AdministratorBasicEditFormData);
    message: string;
  }[];
  warnings: {
    field: string;
    message: string;
  }[];
  security_warnings: {
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }[];
}

// 監査ログ
export interface AdministratorAuditLog {
  id: string;
  admin_id: string;
  admin_name: string;
  action: string;
  target_type: 'user' | 'system' | 'data';
  target_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address: string;
  user_agent: string;
  timestamp: string;
  success: boolean;
  error_message?: string;
}

// アクセス権限管理
export interface AdministratorPermissions {
  can_create_admins: boolean;
  can_delete_admins: boolean;
  can_modify_permissions: boolean;
  can_access_audit_logs: boolean;
  can_export_data: boolean;
  can_modify_security_settings: boolean;
  can_reset_passwords: boolean;
  can_view_sensitive_data: boolean;
}

// セキュリティアラート
export interface AdministratorSecurityAlert {
  id: string;
  alert_type: 'suspicious_login' | 'multiple_failed_attempts' | 'unusual_activity' | 'security_policy_violation';
  admin_id: string;
  admin_name: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  resolved: boolean;
  resolved_by?: string;
  resolved_at?: string;
}

// エクスポート設定
export interface AdministratorExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  include_fields: (keyof AdministratorWithManagementInfo)[];
  include_activity_stats: boolean;
  include_security_info: boolean;
  include_audit_logs: boolean;
  date_range?: {
    start: string;
    end: string;
  };
  anonymize_sensitive_data: boolean;
}