export interface StudentFormData {
  // 生徒情報
  full_name: string;
  furigana_name: string;
  grade: string;
  school_attended: string;
  enrollment_date: string;
  status: '在籍中' | '休会中' | '退会済み';
  notes: string;
  
  // 保護者情報
  parent_name: string;
  parent_email: string;
  parent_phone_number: string;
}

// API送信用の型（現在はStudentFormDataと同じ構造）
export type CreateStudentRequest = StudentFormData;

export interface CreateStudentResponse {
  success: boolean;
  student_id?: string;
  user_id?: string;
  message?: string;
  error?: string;
}

export interface UpdateStudentRequest extends StudentFormData {
  id: string;
}

export interface UpdateStudentResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface GetStudentResponse {
  success: boolean;
  student?: StudentFormData & { id: string };
  error?: string;
}