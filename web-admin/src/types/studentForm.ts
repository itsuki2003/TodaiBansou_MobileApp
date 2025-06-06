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

export interface CreateStudentRequest extends StudentFormData {
  // API送信用
}

export interface CreateStudentResponse {
  success: boolean;
  student_id?: string;
  user_id?: string;
  message?: string;
  error?: string;
}