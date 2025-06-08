// ADM-006: 生徒・講師 担当割り当て管理画面用の型定義

import { Student, Teacher, Assignment } from './student';

// 担当割り当て管理画面用の拡張された生徒データ
export interface StudentWithAssignmentDetails extends Student {
  // 面談担当講師（リスト編集可）
  interviewTeacher?: {
    id: string;
    assignmentId: string;
    full_name: string;
    account_status: '承認待ち' | '有効' | '無効';
    assignment_start_date?: string;
  };
  // 授業担当講師（コメントのみ）
  lessonTeachers: Array<{
    id: string;
    assignmentId: string;
    full_name: string;
    account_status: '承認待ち' | '有効' | '無効';
    assignment_start_date?: string;
  }>;
  // 担当講師の総数
  totalAssignments: number;
}

// 講師選択用のオプション
export interface TeacherOption {
  id: string;
  full_name: string;
  account_status: '承認待ち' | '有効' | '無効';
  currentAssignments: number; // 現在の担当生徒数
  isAvailable: boolean; // 新規割り当て可能かどうか
}

// 担当割り当ての変更データ
export interface AssignmentChangeData {
  studentId: string;
  studentName: string;
  changeType: 'add' | 'remove' | 'update';
  role: '面談担当（リスト編集可）' | '授業担当（コメントのみ）';
  oldTeacherId?: string;
  oldTeacherName?: string;
  newTeacherId?: string;
  newTeacherName?: string;
  notes?: string;
}

// 一括変更用のデータ
export interface BulkAssignmentUpdate {
  changes: AssignmentChangeData[];
  reason?: string; // 一括変更の理由
}

// 担当割り当て変更履歴
export interface AssignmentHistory {
  id: string;
  student_id: string;
  student_name: string;
  change_type: 'add' | 'remove' | 'update';
  role: '面談担当（リスト編集可）' | '授業担当（コメントのみ）';
  old_teacher_id?: string;
  old_teacher_name?: string;
  new_teacher_id?: string;
  new_teacher_name?: string;
  changed_by: string; // 変更者のID
  changed_by_name: string; // 変更者の名前
  reason?: string;
  created_at: string;
}

// フィルター・検索用の設定
export interface AssignmentFilter {
  search: string; // 生徒名検索
  status: '在籍中' | '休会中' | '退会済み' | 'all';
  grade: string | 'all';
  hasInterviewTeacher: boolean | 'all';
  hasLessonTeacher: boolean | 'all';
  teacherId: string | 'all'; // 特定の講師の担当生徒のみ表示
}

// ソート設定
export interface AssignmentSort {
  field: 'full_name' | 'grade' | 'enrollment_date' | 'total_assignments';
  direction: 'asc' | 'desc';
}

// API レスポンス用の型
export interface AssignmentManagementResponse {
  success: boolean;
  data?: {
    students: StudentWithAssignmentDetails[];
    teachers: TeacherOption[];
    totalCount: number;
  };
  error?: string;
}

export interface AssignmentUpdateResponse {
  success: boolean;
  data?: {
    assignment: Assignment;
    affectedPermissions: string[]; // 影響を受けた権限のリスト
  };
  error?: string;
}

export interface AssignmentHistoryResponse {
  success: boolean;
  data?: AssignmentHistory[];
  error?: string;
}

// 担当割り当て管理画面の状態管理用
export interface AssignmentManagementState {
  students: StudentWithAssignmentDetails[];
  teachers: TeacherOption[];
  filter: AssignmentFilter;
  sort: AssignmentSort;
  selectedStudents: string[]; // 一括操作用の選択された生徒ID
  loading: boolean;
  error: string | null;
  showHistory: boolean;
  history: AssignmentHistory[];
}

// バリデーション用
export interface AssignmentValidation {
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

// 担当割り当てのビジネスルール
export interface AssignmentRules {
  maxInterviewTeachersPerStudent: number; // 1生徒あたりの面談担当講師数上限
  maxLessonTeachersPerStudent: number; // 1生徒あたりの授業担当講師数上限
  maxStudentsPerTeacher: number; // 1講師あたりの担当生徒数上限
  requireInterviewTeacher: boolean; // 面談担当講師の必須設定
  allowSameTeacherBothRoles: boolean; // 同一講師が面談・授業両方を担当することを許可するか
}

// 権限同期用の情報
export interface PermissionSyncInfo {
  studentId: string;
  todoListPermissions: {
    canEdit: string[]; // 編集権限を持つ講師ID一覧
    canComment: string[]; // コメント権限を持つ講師ID一覧
  };
  needsSync: boolean; // 権限同期が必要かどうか
}