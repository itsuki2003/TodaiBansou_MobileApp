// ADM-001: 講師アカウント管理画面用の型定義

import { TeacherProfile } from './teacher';

// 講師管理画面用の拡張された講師データ
export interface TeacherWithManagementInfo extends TeacherProfile {
  // 担当生徒数
  assigned_students_count: number;
  // 今月の授業数
  this_month_lessons: number;
  // 最終ログイン日時
  last_login_at?: string;
  // アカウント作成方法
  account_creation_method: 'application' | 'manual' | 'import';
  // 権限情報
  permissions: {
    can_edit_todo_lists: number; // 編集可能なやることリスト数
    can_comment_todo_lists: number; // コメント可能なやることリスト数
  };
}

// 講師フィルター
export interface TeacherFilter {
  search: string; // 名前・メール検索
  account_status: '承認待ち' | '有効' | '無効' | 'all';
  account_creation_method: 'application' | 'manual' | 'import' | 'all';
  has_assignments: boolean | 'all'; // 担当生徒の有無
  last_login_period: '7' | '30' | '90' | 'never' | 'all'; // 最終ログイン期間
  registration_period: '7' | '30' | '90' | '365' | 'all'; // 登録期間
}

// 講師ソート
export interface TeacherSort {
  field: 'full_name' | 'email' | 'account_status' | 'assigned_students_count' | 'registration_application_date' | 'last_login_at';
  direction: 'asc' | 'desc';
}

// 新規講師登録フォーム（手動登録用）
export interface NewTeacherFormData {
  full_name: string;
  furigana_name: string;
  email: string;
  phone_number?: string;
  account_status: '有効' | '無効';
  notes_admin_only?: string;
  // 初期パスワード
  initial_password: string;
  send_welcome_email: boolean;
}

// 講師基本情報編集フォーム
export interface TeacherBasicEditFormData {
  full_name: string;
  furigana_name: string;
  account_status: '承認待ち' | '有効' | '無効';
  phone_number?: string;
  notes_admin_only?: string;
}

// 講師詳細プロフィール編集フォーム（管理者による軽微修正用）
export interface TeacherProfileEditFormData {
  appeal_points?: string;
  hobbies_special_skills?: string;
  education_background_cram_school?: string;
  education_background_junior_high?: string;
  education_background_high_school?: string;
  education_background_university?: string;
  education_background_faculty?: string;
  referrer_info?: string;
}

// パスワードリセット
export interface PasswordResetData {
  teacher_id: string;
  teacher_email: string;
  new_password: string;
  send_notification_email: boolean;
  reset_reason?: string;
}

// 講師統計
export interface TeacherStatistics {
  total: number;
  active: number;
  inactive: number;
  pending: number;
  with_assignments: number;
  without_assignments: number;
  recent_registrations: number; // 過去30日の新規登録数
  recent_logins: number; // 過去7日のログイン数
}

// 講師アクティビティ
export interface TeacherActivity {
  teacher_id: string;
  teacher_name: string;
  activity_type: 'login' | 'todo_edit' | 'comment_add' | 'profile_update';
  activity_description: string;
  activity_timestamp: string;
  related_student_name?: string;
}

// 講師の担当生徒詳細
export interface TeacherAssignmentDetail {
  assignment_id: string;
  student_id: string;
  student_name: string;
  student_grade?: string;
  role: '面談担当（リスト編集可）' | '授業担当（コメントのみ）';
  assignment_start_date?: string;
  assignment_end_date?: string;
  status: '有効' | '終了済み';
  recent_activities: {
    last_todo_edit?: string;
    last_comment?: string;
    last_lesson?: string;
  };
}

// 一括操作用
export interface BulkTeacherAction {
  type: 'activate' | 'deactivate' | 'approve' | 'reset_password' | 'send_welcome' | 'delete';
  teacherIds: string[];
  notes?: string;
  newPassword?: string; // パスワードリセット用
  emailTemplate?: string; // 通知メール用
}

// API レスポンス用
export interface TeacherManagementResponse {
  success: boolean;
  data?: {
    teachers: TeacherWithManagementInfo[];
    statistics: TeacherStatistics;
    totalCount: number;
  };
  error?: string;
}

export interface TeacherDetailResponse {
  success: boolean;
  data?: {
    teacher: TeacherWithManagementInfo;
    assignments: TeacherAssignmentDetail[];
    recent_activities: TeacherActivity[];
  };
  error?: string;
}

export interface TeacherCreateResponse {
  success: boolean;
  data?: {
    teacher: TeacherProfile;
    auth_user_id?: string;
    welcome_email_sent: boolean;
  };
  error?: string;
}

export interface TeacherUpdateResponse {
  success: boolean;
  data?: TeacherProfile;
  error?: string;
}

export interface PasswordResetResponse {
  success: boolean;
  data?: {
    reset_email_sent: boolean;
    new_password_hash: string;
  };
  error?: string;
}

// 講師管理画面の状態
export interface TeacherManagementState {
  teachers: TeacherWithManagementInfo[];
  statistics: TeacherStatistics;
  filter: TeacherFilter;
  sort: TeacherSort;
  selectedTeachers: string[];
  loading: boolean;
  error: string | null;
  showCreateModal: boolean;
  showEditModal: boolean;
  showDetailModal: boolean;
  selectedTeacher: TeacherWithManagementInfo | null;
}

// バリデーション
export interface TeacherFormValidation {
  isValid: boolean;
  errors: {
    field: keyof (NewTeacherFormData | TeacherBasicEditFormData);
    message: string;
  }[];
  warnings: {
    field: string;
    message: string;
  }[];
}

// 講師インポート用（将来拡張）
export interface TeacherImportData {
  import_id: string;
  file_name: string;
  total_records: number;
  successful_imports: number;
  failed_imports: number;
  errors: {
    row: number;
    field: string;
    message: string;
  }[];
  import_timestamp: string;
  imported_by: string;
}

// 通知設定
export interface TeacherNotificationSettings {
  welcome_email_template: string;
  password_reset_email_template: string;
  account_status_change_notification: boolean;
  assignment_change_notification: boolean;
  bulk_operation_notification: boolean;
}

// エクスポート設定
export interface TeacherExportOptions {
  format: 'csv' | 'excel' | 'pdf';
  include_fields: (keyof TeacherWithManagementInfo)[];
  include_assignments: boolean;
  include_statistics: boolean;
  date_range?: {
    start: string;
    end: string;
  };
}