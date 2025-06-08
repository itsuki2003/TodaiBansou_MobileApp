// 講師登録申請フォーム用の型定義

export interface TeacherApplicationFormData {
  // 基本情報
  full_name: string;
  furigana_name: string;
  email: string;
  phone_number?: string;

  // プロフィール写真
  profile_formal_photo?: File;
  profile_casual_photo?: File;

  // アピール・趣味
  appeal_points?: string;
  hobbies_special_skills?: string;
  referrer_info?: string;

  // 学歴情報
  education_background_cram_school?: string;
  education_background_middle_school?: string;
  education_background_high_school?: string;
  education_background_university?: string;
  education_background_faculty?: string;
}

export interface TeacherApplicationResponse {
  success: boolean;
  teacher_id?: string;
  message?: string;
  error?: string;
}

export interface PhotoUploadProgress {
  formal?: {
    uploading: boolean;
    progress: number;
    url?: string;
    error?: string;
  };
  casual?: {
    uploading: boolean;
    progress: number;
    url?: string;
    error?: string;
  };
}

// バリデーション用
export interface FormValidationErrors {
  full_name?: string;
  furigana_name?: string;
  email?: string;
  phone_number?: string;
  appeal_points?: string;
  hobbies_special_skills?: string;
  referrer_info?: string;
  education_background_cram_school?: string;
  education_background_middle_school?: string;
  education_background_high_school?: string;
  education_background_university?: string;
  education_background_faculty?: string;
  profile_formal_photo?: string;
  profile_casual_photo?: string;
}

// フォームの各セクション
export type FormSection = 
  | 'basic_info'
  | 'profile_photos'
  | 'appeal_hobbies'
  | 'education_background';

// ファイルアップロード用
export interface FileUploadOptions {
  bucket: string;
  folder: string;
  maxSizeBytes: number;
  allowedTypes: string[];
}

// 申請一覧用の型定義
export interface TeacherApplicationListItem {
  id: string;
  created_at: string;
  updated_at: string;
  full_name: string;
  furigana_name: string;
  email: string;
  phone_number?: string;
  account_status: '承認待ち' | '有効' | '無効';
  appeal_points?: string;
  hobbies_special_skills?: string;
  referrer_info?: string;
  education_background_cram_school?: string;
  education_background_middle_school?: string;
  education_background_high_school?: string;
  education_background_university?: string;
  education_background_faculty?: string;
  registration_application_date?: string;
  account_approval_date?: string;
  notes_admin_only?: string;
  profile_formal_photo_url?: string;
  profile_casual_photo_url?: string;
}

export interface TeacherApplicationFilters {
  status: 'all' | '承認待ち' | '有効' | '無効';
  searchQuery: string;
  dateFrom?: string;
  dateTo?: string;
}

export interface TeacherApplicationListResponse {
  success: boolean;
  data?: TeacherApplicationListItem[];
  error?: string;
  total?: number;
}

export interface TeacherApplicationStatusUpdateRequest {
  applicationId: string;
  status: '有効' | '無効';
  reason?: string;
  notes?: string;
}

export interface TeacherApplicationStatusUpdateResponse {
  success: boolean;
  message?: string;
  error?: string;
}