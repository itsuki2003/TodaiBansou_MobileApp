// 週間やることリスト画面（SCR-002）関連の型定義

export interface Task {
  id: string;
  todo_list_id: string;
  target_date: string; // YYYY-MM-DD形式
  content: string;
  is_completed: boolean;
  display_order: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface TodoList {
  id: string;
  student_id: string;
  target_week_start_date: string; // YYYY-MM-DD形式
  list_creation_date: string;
  status: '下書き' | '公開済み';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface TeacherComment {
  id: string;
  todo_list_id: string;
  target_date: string; // YYYY-MM-DD形式
  teacher_id: string;
  comment_content: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  teacher_name?: string;
}

export interface DayTasks {
  date: string; // YYYY-MM-DD形式
  dayOfWeek: string; // 月、火、水...
  dateDisplay: string; // MM/DD形式
  tasks: Task[];
  comments: TeacherComment[];
  completionRate: number; // 0-100
  hasComments: boolean;
}

export interface WeeklyTasksData {
  weekStartDate: string; // YYYY-MM-DD形式
  weekEndDate: string; // YYYY-MM-DD形式
  weekDisplay: string; // "2025年1月第2週" のような表示形式
  todoList?: TodoList;
  days: DayTasks[];
  totalTasks: number;
  completedTasks: number;
  overallCompletionRate: number;
  hasTeacherComments: boolean;
}

// ナビゲーション用
export interface WeekNavigation {
  currentWeek: string; // YYYY-MM-DD (週の開始日)
  previousWeek: string;
  nextWeek: string;
  canGoNext: boolean; // 未来の週には行けない制限
}

// 週間統計情報
export interface WeeklyStatistics {
  totalTasksThisWeek: number;
  completedTasksThisWeek: number;
  completionRateThisWeek: number;
  streakDays: number; // 連続達成日数
  bestDay: {
    date: string;
    completionRate: number;
  } | null;
}

// API関連
export interface WeeklyTasksApiResponse {
  success: boolean;
  data?: WeeklyTasksData;
  error?: string;
}

export interface TaskUpdateRequest {
  taskId: string;
  isCompleted: boolean;
}

export interface TaskUpdateResponse {
  success: boolean;
  task?: Task;
  error?: string;
}

// カレンダー遷移用
export interface CalendarTransition {
  targetDate: string;
  animationDirection: 'left' | 'right' | 'none';
}

// フィルタリング・ソート用
export interface TaskFilter {
  showCompleted: boolean;
  showIncomplete: boolean;
  sortBy: 'order' | 'created' | 'completion';
  sortDirection: 'asc' | 'desc';
}

// アニメーション用
export interface TaskAnimation {
  taskId: string;
  type: 'complete' | 'incomplete' | 'added' | 'removed';
  duration: number;
}

// プログレス表示用
export interface ProgressInfo {
  current: number;
  total: number;
  percentage: number;
  color: 'green' | 'yellow' | 'red' | 'gray';
  label: string;
}

// エラーハンドリング用
export interface WeeklyTasksError {
  type: 'network' | 'permission' | 'data' | 'unknown';
  message: string;
  details?: string;
  recoverable: boolean;
}

// ローディング状態
export interface LoadingState {
  isLoading: boolean;
  isRefreshing: boolean;
  isUpdatingTask: boolean;
  loadingMessage?: string;
}