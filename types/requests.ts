// 欠席・追加授業申請機能 (SCR-008, SCR-009) 関連の型定義

export interface LessonSlot {
  id: string;
  student_id: string;
  teacher_id?: string;
  slot_type: '通常授業' | '固定面談' | '振替授業' | '追加授業';
  slot_date: string; // YYYY-MM-DD形式
  start_time: string; // HH:MM形式
  end_time: string; // HH:MM形式
  google_meet_link?: string;
  status: '予定通り' | '実施済み' | '欠席' | '振替済み（振替元）';
  notes?: string;
  teacher_name?: string;
  created_at: string;
  updated_at: string;
}

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
}

export interface AdditionalLessonRequest {
  id: string;
  student_id: string;
  requested_date: string; // YYYY-MM-DD形式
  requested_start_time: string; // HH:MM形式
  requested_end_time: string; // HH:MM形式
  teacher_id?: string;
  notes?: string;
  request_timestamp: string;
  status: '申請中' | '承認済み・授業登録済み';
  admin_notes?: string;
  created_lesson_slot_id?: string;
  created_at: string;
  updated_at: string;
}

// 欠席申請フォーム用
export interface AbsenceRequestFormData {
  lesson_slot_id: string;
  reason: string;
}

// 追加授業申請フォーム用
export interface AdditionalLessonRequestFormData {
  requested_date: string;
  requested_start_time: string;
  requested_end_time: string;
  teacher_id?: string;
  notes?: string;
}

// 申請の検証結果
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

// 欠席申請の時間制限チェック
export interface AbsenceTimeCheck {
  canRequest: boolean;
  timeRemaining?: {
    hours: number;
    minutes: number;
  };
  deadlineMessage: string;
}

// 追加授業の空き時間情報
export interface AvailableTimeSlot {
  date: string;
  start_time: string;
  end_time: string;
  teacher_id?: string;
  teacher_name?: string;
  isRecommended: boolean;
}

// 申請状況の統計
export interface RequestStatistics {
  totalAbsenceRequests: number;
  pendingAbsenceRequests: number;
  totalAdditionalRequests: number;
  pendingAdditionalRequests: number;
  thisMonthAbsences: number;
  thisMonthAdditionalLessons: number;
}

// エラーハンドリング用
export interface RequestError {
  type: 'validation' | 'network' | 'permission' | 'time_limit' | 'conflict' | 'unknown';
  message: string;
  details?: string;
  field?: string;
  recoverable: boolean;
}

// ローディング状態
export interface RequestLoadingState {
  isSubmitting: boolean;
  isLoadingLessons: boolean;
  isValidating: boolean;
  operation?: 'absence' | 'additional';
}

// 申請成功レスポンス
export interface RequestSubmissionResponse {
  success: boolean;
  request_id?: string;
  message: string;
  next_steps?: string[];
}

// カレンダー用の授業表示
export interface LessonForCalendar extends LessonSlot {
  canRequestAbsence: boolean;
  absenceDeadline?: string;
  hasAbsenceRequest: boolean;
  absenceRequestStatus?: '未振替' | '振替済';
}

// 時間帯選択用
export interface TimeSlotOption {
  label: string;
  value: string;
  isPopular: boolean;
  isAvailable: boolean;
  conflictReason?: string;
}

// 講師選択用
export interface TeacherOption {
  id: string;
  name: string;
  isAssigned: boolean; // 担当講師かどうか
  availability: 'available' | 'busy' | 'unknown';
  specialties?: string[];
}

// 申請確認画面用
export interface RequestConfirmation {
  type: 'absence' | 'additional';
  formData: AbsenceRequestFormData | AdditionalLessonRequestFormData;
  lessonInfo?: LessonSlot;
  warnings: string[];
  estimatedProcessingTime: string;
}

// 申請履歴用
export interface RequestHistory {
  id: string;
  type: 'absence' | 'additional';
  date: string;
  status: string;
  title: string;
  description: string;
  created_at: string;
}

// 通知設定用
export interface RequestNotificationSettings {
  enableAbsenceReminders: boolean;
  enableStatusUpdates: boolean;
  reminderHours: number; // 申請期限何時間前に通知するか
}

// API レスポンス用
export interface UpcomingLessonsResponse {
  success: boolean;
  lessons?: LessonForCalendar[];
  error?: string;
}

export interface TeachersResponse {
  success: boolean;
  teachers?: TeacherOption[];
  error?: string;
}

export interface AvailableTimeSlotsResponse {
  success: boolean;
  timeSlots?: AvailableTimeSlot[];
  error?: string;
}

export interface RequestHistoryResponse {
  success: boolean;
  requests?: RequestHistory[];
  statistics?: RequestStatistics;
  error?: string;
}