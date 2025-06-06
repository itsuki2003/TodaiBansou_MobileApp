export interface Student {
  id: string;
  created_at: string;
  updated_at: string;
  user_id?: string;
  full_name: string;
  furigana_name?: string;
  grade?: string;
  school_attended?: string;
  enrollment_date: string;
  status: '在籍中' | '休会中' | '退会済み';
  parent_name: string;
  parent_phone_number?: string;
  notes?: string;
}

export interface Teacher {
  id: string;
  full_name: string;
  account_status: '承認待ち' | '有効' | '無効';
}

export interface Assignment {
  id: string;
  student_id: string;
  teacher_id: string;
  role: '面談担当（リスト編集可）' | '授業担当（コメントのみ）';
  assignment_start_date?: string;
  assignment_end_date?: string;
  status: '有効' | '終了済み';
  teacher: Teacher;
}

export interface StudentWithAssignments extends Student {
  assignments: Assignment[];
}