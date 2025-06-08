// やることリスト管理に関する型定義

export interface TodoList {
  id: string;
  created_at: string;
  updated_at: string;
  student_id: string;
  target_week_start_date: string; // YYYY-MM-DD 形式（月曜日）
  list_creation_date: string | null;
  status: '下書き' | '公開済み';
  notes: string | null;
}

export interface Student {
  id: string;
  full_name: string;
  furigana_name: string | null;
  grade: string | null;
  status: string;
}

export interface Task {
  id: string;
  created_at: string;
  updated_at: string;
  todo_list_id: string;
  target_date: string; // YYYY-MM-DD 形式
  content: string;
  is_completed: boolean;
  display_order: number;
  notes: string | null;
}

export interface TeacherComment {
  id: string;
  created_at: string;
  updated_at: string;
  todo_list_id: string;
  target_date: string; // YYYY-MM-DD 形式
  teacher_id: string;
  comment_content: string;
  notes: string | null;
  teacher?: {
    id: string;
    full_name: string;
  };
}

// 曜日ごとのデータ管理用
export interface DayData {
  date: string; // YYYY-MM-DD 形式
  dayOfWeek: string; // '月', '火', '水', '木', '金', '土', '日'
  tasks: Task[];
  comments: TeacherComment[];
}

// 週間データ（管理画面用に拡張）
export interface WeekData {
  todoList: TodoList | null;
  student: Student | null;
  days: DayData[];
  weekStartDate: string;
  permissions: TodoPermissions;
}

// タスク追加・更新用
export interface CreateTaskRequest {
  todo_list_id: string;
  target_date: string;
  content: string;
  display_order: number;
}

export interface UpdateTaskRequest {
  id: string;
  content?: string;
  is_completed?: boolean;
  display_order?: number;
}

// コメント追加・更新用
export interface CreateCommentRequest {
  todo_list_id: string;
  target_date: string;
  teacher_id: string;
  comment_content: string;
}

export interface UpdateCommentRequest {
  id: string;
  comment_content: string;
}

// やることリスト作成・更新用
export interface CreateTodoListRequest {
  student_id: string;
  target_week_start_date: string;
  status?: '下書き' | '公開済み';
  notes?: string;
}

export interface UpdateTodoListRequest {
  id: string;
  status?: '下書き' | '公開済み';
  notes?: string;
}

// 権限管理用
export interface TodoPermissions {
  canEditTasks: boolean;    // タスク編集権限（面談担当講師・運営）
  canAddTasks: boolean;     // タスク追加権限
  canDeleteTasks: boolean;  // タスク削除権限
  canReorderTasks: boolean; // タスク順序変更権限
  canAddComments: boolean;  // コメント追加権限（全ての担当講師・運営）
  canEditComments: boolean; // コメント編集権限（自分のコメントのみ）
  canPublish: boolean;      // 公開権限
  role: 'admin' | 'interview_teacher' | 'lesson_teacher';
}

// ドラッグ&ドロップ用
export interface DraggedTask {
  id: string;
  content: string;
  originalDate: string;
  originalOrder: number;
}

// APIレスポンス用
export interface TodoListResponse {
  success: boolean;
  data?: WeekData;
  error?: string;
}

export interface TaskOperationResponse {
  success: boolean;
  task?: Task;
  error?: string;
}

export interface CommentOperationResponse {
  success: boolean;
  comment?: TeacherComment;
  error?: string;
}