// ADM-009: 生徒申請一覧画面用の型定義

// 欠席申請の型定義
export interface AbsenceRequest {
  id: string;
  student_id: string;
  lesson_slot_id: string;
  reason: string;
  request_timestamp: string;
  status: '未振替' | '振替済';
  admin_notes?: string;
  created_at: string;
  updated_at: string;
  // JOIN結果として含まれる関連データ
  student: {
    id: string;
    full_name: string;
    grade?: string;
  };
  lesson_slot: {
    id: string;
    slot_date: string;
    start_time: string;
    end_time: string;
    slot_type: '通常授業' | '固定面談' | '振替授業' | '追加授業';
    teacher: {
      full_name: string;
    };
  };
}

// 追加授業申請の型定義
export interface AdditionalLessonRequest {
  id: string;
  student_id: string;
  requested_date: string;
  requested_start_time: string;
  requested_end_time: string;
  teacher_id?: string;
  notes?: string;
  request_timestamp: string;
  status: '申請中' | '承認済み・授業登録済み';
  admin_notes?: string;
  created_lesson_slot_id?: string;
  created_at: string;
  updated_at: string;
  // JOIN結果として含まれる関連データ
  student: {
    id: string;
    full_name: string;
    grade?: string;
  };
  teacher?: {
    id: string;
    full_name: string;
  };
}

// 統合申請型（一覧表示用）
export interface UnifiedRequest {
  id: string;
  type: 'absence' | 'additional';
  student_id: string;
  student_name: string;
  student_grade?: string;
  request_date: string; // 申請日時
  target_date: string; // 対象日
  target_time: string; // 対象時間
  teacher_name?: string;
  status: string;
  reason?: string;
  notes?: string;
  admin_notes?: string;
  created_at: string;
  // 元データへの参照
  originalData: AbsenceRequest | AdditionalLessonRequest;
}

// 申請フィルター
export interface RequestFilter {
  search: string; // 生徒名検索
  type: 'all' | 'absence' | 'additional';
  status: 'all' | 'pending' | 'processed';
  dateRange: '7' | '30' | '90'; // 申請日の範囲（日）
  targetDateFrom?: string; // 対象日の範囲開始
  targetDateTo?: string; // 対象日の範囲終了
  studentId?: string; // 特定生徒の申請のみ
}

// 申請ソート
export interface RequestSort {
  field: 'request_date' | 'target_date' | 'student_name' | 'status';
  direction: 'asc' | 'desc';
}

// 申請統計
export interface RequestStatistics {
  total: number;
  pending: number;
  processed: number;
  absenceRequests: {
    total: number;
    pending: number;
    processed: number;
  };
  additionalRequests: {
    total: number;
    pending: number;
    processed: number;
  };
  thisWeek: {
    total: number;
    absence: number;
    additional: number;
  };
  thisMonth: {
    total: number;
    absence: number;
    additional: number;
  };
}

// 申請詳細ダイアログ用
export interface RequestDetail {
  request: UnifiedRequest;
  relatedLessons?: {
    id: string;
    slot_date: string;
    start_time: string;
    end_time: string;
    teacher_name: string;
    status: string;
  }[];
  availableTimeSlots?: {
    date: string;
    start_time: string;
    end_time: string;
    teacher_id?: string;
    teacher_name?: string;
  }[];
}

// 申請処理アクション
export interface RequestAction {
  type: 'approve' | 'reject' | 'reschedule' | 'note';
  requestId: string;
  requestType: 'absence' | 'additional';
  notes?: string;
  // 追加授業承認用
  lessonData?: {
    slot_date: string;
    start_time: string;
    end_time: string;
    teacher_id: string;
    slot_type: '追加授業';
    google_meet_link?: string;
    notes?: string;
  };
  // 欠席振替用
  rescheduleData?: {
    new_date: string;
    new_start_time: string;
    new_end_time: string;
    teacher_id?: string;
    notes?: string;
  };
}

// 一括処理用
export interface BulkRequestAction {
  requestIds: string[];
  action: 'approve' | 'reject' | 'mark_processed';
  notes?: string;
  reason?: string;
}

// API レスポンス用
export interface RequestListResponse {
  success: boolean;
  data?: {
    requests: UnifiedRequest[];
    statistics: RequestStatistics;
    totalCount: number;
  };
  error?: string;
}

export interface RequestActionResponse {
  success: boolean;
  data?: {
    updatedRequest: UnifiedRequest;
    createdLessonSlot?: any; // 追加授業承認時に作成されたレッスンスロット
    affectedLessons?: any[]; // 影響を受けた他のレッスン
  };
  error?: string;
}

export interface BulkActionResponse {
  success: boolean;
  data?: {
    processedCount: number;
    failedCount: number;
    errors?: string[];
  };
  error?: string;
}

// 申請管理画面の状態
export interface RequestManagementState {
  requests: UnifiedRequest[];
  statistics: RequestStatistics;
  filter: RequestFilter;
  sort: RequestSort;
  selectedRequests: string[];
  loading: boolean;
  error: string | null;
  showDetail: boolean;
  selectedRequest: RequestDetail | null;
}

// 申請通知設定
export interface RequestNotificationSettings {
  enableNewRequestNotification: boolean;
  enableUrgentNotification: boolean; // 授業開始直前の欠席申請など
  urgentThresholdHours: number; // 何時間前を緊急とするか
  notificationRecipients: string[]; // 通知先ユーザーID
}

// 申請バリデーション
export interface RequestValidation {
  isValid: boolean;
  errors: {
    field: string;
    message: string;
  }[];
  warnings: {
    field: string;
    message: string;
  }[];
}

// 申請処理ログ
export interface RequestProcessLog {
  id: string;
  request_id: string;
  request_type: 'absence' | 'additional';
  action: string;
  performed_by: string;
  performed_by_name: string;
  notes?: string;
  created_at: string;
}

// ダッシュボード用の申請サマリー
export interface RequestSummary {
  pendingCount: number;
  urgentCount: number; // 緊急対応が必要な申請数
  todayRequestsCount: number;
  recentRequests: UnifiedRequest[];
  trendData: {
    date: string;
    absenceCount: number;
    additionalCount: number;
  }[];
}