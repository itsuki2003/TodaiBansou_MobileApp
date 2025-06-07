// 授業スケジュール管理に関する型定義

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
  original_slot_id_for_reschedule?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface LessonSlotWithDetails extends LessonSlot {
  student_name: string;
  teacher_name?: string;
  absence_request?: AbsenceRequest;
  additional_request?: AdditionalLessonRequest;
}

export interface Student {
  id: string;
  full_name: string;
  grade?: string;
  status: '在籍中' | '休会中' | '退会済み';
}

export interface Teacher {
  id: string;
  full_name: string;
  email: string;
  account_status: '承認待ち' | '有効' | '無効';
}

export interface AbsenceRequest {
  id: string;
  student_id: string;
  lesson_slot_id: string;
  reason: string;
  request_timestamp: string;
  status: '未振替' | '振替済';
  admin_notes?: string;
}

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
}

// react-big-calendar用のイベント型
export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: LessonSlotWithDetails;
  className?: string;
}

// スケジュール管理のフィルタ・検索条件
export interface ScheduleFilter {
  studentId?: string;
  month: string; // YYYY-MM形式
  slotType?: LessonSlot['slot_type'];
  status?: LessonSlot['status'];
}

// モーダル表示用の状態
export interface ModalState {
  isOpen: boolean;
  mode: 'view' | 'edit' | 'create' | 'absence' | 'reschedule';
  selectedEvent?: CalendarEvent;
  selectedDate?: Date;
}

// フォーム用の型
export interface LessonSlotFormData {
  student_id: string;
  teacher_id?: string;
  slot_type: LessonSlot['slot_type'];
  slot_date: string;
  start_time: string;
  end_time: string;
  google_meet_link?: string;
  notes?: string;
}

export interface AbsenceFormData {
  lesson_slot_id: string;
  reason: string;
  admin_notes?: string;
}

export interface RescheduleFormData {
  original_slot_id: string;
  new_date: string;
  new_start_time: string;
  new_end_time: string;
  teacher_id?: string;
  notes?: string;
}

// API レスポンス用の型
export interface ScheduleApiResponse {
  success: boolean;
  data?: LessonSlotWithDetails[];
  error?: string;
}

export interface StudentsApiResponse {
  success: boolean;
  data?: Student[];
  error?: string;
}

export interface TeachersApiResponse {
  success: boolean;
  data?: Teacher[];
  error?: string;
}