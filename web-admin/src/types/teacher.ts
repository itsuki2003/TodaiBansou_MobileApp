// 講師ダッシュボード・マイページに関する型定義

export interface TeacherProfile {
  id: string;
  user_id?: string;
  full_name: string;
  furigana_name: string;
  email: string;
  phone_number?: string;
  account_status: '承認待ち' | '有効' | '無効';
  profile_formal_photo_url?: string;
  profile_casual_photo_url?: string;
  appeal_points?: string;
  hobbies_special_skills?: string;
  referrer_info?: string;
  education_background_cram_school?: string;
  education_background_junior_high?: string;
  education_background_high_school?: string;
  education_background_university?: string;
  education_background_faculty?: string;
  registration_application_date?: string;
  account_approval_date?: string;
  notes_admin_only?: string;
  created_at: string;
  updated_at: string;
}

export interface AssignedStudent {
  id: string;
  student_id: string;
  teacher_id: string;
  role: '面談担当（リスト編集可）' | '授業担当（コメントのみ）';
  assignment_start_date?: string;
  assignment_end_date?: string;
  status: '有効' | '終了済み';
  notes?: string;
  student: {
    id: string;
    full_name: string;
    grade?: string;
    status: '在籍中' | '休会中' | '退会済み';
  };
}

export interface UpcomingLesson {
  id: string;
  student_id: string;
  teacher_id: string;
  slot_type: '通常授業' | '固定面談' | '振替授業' | '追加授業';
  slot_date: string;
  start_time: string;
  end_time: string;
  google_meet_link?: string;
  status: '予定通り' | '実施済み' | '欠席' | '振替済み（振替元）';
  notes?: string;
  student_name: string;
}

export interface TeacherDashboardData {
  teacher: TeacherProfile;
  assignedStudents: AssignedStudent[];
  upcomingLessons: UpcomingLesson[];
  weeklyStats: {
    totalLessons: number;
    completedLessons: number;
    upcomingLessons: number;
    cancelledLessons: number;
  };
}

// プロフィール編集用フォームデータ
export interface TeacherProfileFormData {
  phone_number?: string;
  profile_formal_photo_url?: string;
  profile_casual_photo_url?: string;
  appeal_points?: string;
  hobbies_special_skills?: string;
  education_background_cram_school?: string;
  education_background_junior_high?: string;
  education_background_high_school?: string;
  education_background_university?: string;
  education_background_faculty?: string;
}

// レッスン統計用の型
export interface LessonStatistics {
  thisWeek: {
    total: number;
    completed: number;
    upcoming: number;
    cancelled: number;
  };
  thisMonth: {
    total: number;
    completed: number;
    upcoming: number;
    cancelled: number;
  };
}

// クイックアクション用の型
export interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  href: string;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}

// ファイルアップロード関連
export interface PhotoUploadData {
  file: File;
  type: 'formal' | 'casual';
  preview?: string;
}

export interface UploadResponse {
  success: boolean;
  url?: string;
  error?: string;
}

// API レスポンス用の型
export interface TeacherDashboardApiResponse {
  success: boolean;
  data?: TeacherDashboardData;
  error?: string;
}

export interface TeacherProfileUpdateResponse {
  success: boolean;
  data?: TeacherProfile;
  error?: string;
}