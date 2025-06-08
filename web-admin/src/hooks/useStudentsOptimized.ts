/**
 * 最適化された生徒データ管理フック
 * - メモ化による不要な再レンダリング防止
 * - ページネーション対応
 * - キャッシュ機能
 * - 仮想スクロール対応
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabaseOptimized } from '@/lib/supabaseOptimized';
import type { Student, Assignment, Teacher } from '@/types/student';

// フィルター状態の型定義
export interface StudentFilters {
  search: string;
  status: '在籍中' | '休会中' | '退会済み' | 'all';
  grade: string | 'all';
  hasAssignments: boolean | 'all';
  teacherId: string | 'all';
}

// ページネーション設定
export interface PaginationConfig {
  page: number;
  pageSize: number;
  totalCount: number;
  hasMore: boolean;
}

// ソート設定
export interface SortConfig {
  field: 'full_name' | 'grade' | 'enrollment_date' | 'status';
  direction: 'asc' | 'desc';
}

// 生徒詳細データ（担当講師情報付き）
export interface StudentWithDetails extends Student {
  assignments: Assignment[];
  mentorTeachers: string[];
  lessonTeachers: string[];
  totalAssignments: number;
}

// フック戻り値の型定義
interface UseStudentsOptimizedReturn {
  // データ
  students: StudentWithDetails[];
  teachers: Teacher[];
  
  // 状態
  loading: boolean;
  error: string | null;
  
  // ページネーション
  pagination: PaginationConfig;
  
  // フィルター・ソート
  filters: StudentFilters;
  sort: SortConfig;
  
  // アクション
  setFilters: (filters: Partial<StudentFilters>) => void;
  setSort: (sort: SortConfig) => void;
  setPage: (page: number) => void;
  refreshData: () => void;
  
  // パフォーマンス情報
  performanceStats: {
    lastFetchTime: number;
    cacheHitRate: number;
    fromCache: boolean;
  };
}

export function useStudentsOptimized(): UseStudentsOptimizedReturn {
  // 状態管理
  const [students, setStudents] = useState<StudentWithDetails[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const [fromCache, setFromCache] = useState(false);

  // フィルター状態
  const [filters, setFiltersState] = useState<StudentFilters>({
    search: '',
    status: 'all',
    grade: 'all',
    hasAssignments: 'all',
    teacherId: 'all',
  });

  // ソート状態
  const [sort, setSortState] = useState<SortConfig>({
    field: 'full_name',
    direction: 'asc',
  });

  // ページネーション状態
  const [pagination, setPagination] = useState<PaginationConfig>({
    page: 0,
    pageSize: 50,
    totalCount: 0,
    hasMore: false,
  });

  // メモ化されたフィルター適用関数
  const applyFilters = useCallback((data: StudentWithDetails[], currentFilters: StudentFilters): StudentWithDetails[] => {
    return data.filter(student => {
      // 検索フィルター
      if (currentFilters.search) {
        const searchTerm = currentFilters.search.toLowerCase();
        const matchesName = student.full_name.toLowerCase().includes(searchTerm);
        const matchesFurigana = student.furigana_name?.toLowerCase().includes(searchTerm) || false;
        if (!matchesName && !matchesFurigana) return false;
      }

      // ステータスフィルター
      if (currentFilters.status !== 'all' && student.status !== currentFilters.status) {
        return false;
      }

      // 学年フィルター
      if (currentFilters.grade !== 'all' && student.grade !== currentFilters.grade) {
        return false;
      }

      // 担当講師有無フィルター
      if (currentFilters.hasAssignments !== 'all') {
        const hasAssignments = student.assignments.length > 0;
        if (currentFilters.hasAssignments !== hasAssignments) return false;
      }

      // 特定講師フィルター
      if (currentFilters.teacherId !== 'all') {
        const hasThisTeacher = student.assignments.some(a => a.teacher_id === currentFilters.teacherId);
        if (!hasThisTeacher) return false;
      }

      return true;
    });
  }, []);

  // メモ化されたソート適用関数
  const applySorting = useCallback((data: StudentWithDetails[], currentSort: SortConfig): StudentWithDetails[] => {
    return [...data].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (currentSort.field) {
        case 'full_name':
          aValue = a.full_name;
          bValue = b.full_name;
          break;
        case 'grade':
          aValue = a.grade || '';
          bValue = b.grade || '';
          break;
        case 'enrollment_date':
          aValue = new Date(a.enrollment_date);
          bValue = new Date(b.enrollment_date);
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = a.full_name;
          bValue = b.full_name;
      }

      const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      return currentSort.direction === 'asc' ? comparison : -comparison;
    });
  }, []);

  // 講師データの処理（メモ化）
  const processStudentDetails = useCallback((rawStudents: any[]): StudentWithDetails[] => {
    return rawStudents.map(student => {
      const assignments = student.assignments || [];
      
      // 面談担当講師と授業担当講師を分離
      const mentorAssignments = assignments.filter((a: any) => 
        a.role === '面談担当（リスト編集可）' && a.status === '有効'
      );
      const lessonAssignments = assignments.filter((a: any) => 
        a.role === '授業担当（コメントのみ）' && a.status === '有効'
      );

      return {
        ...student,
        assignments,
        mentorTeachers: mentorAssignments.map((a: any) => a.teachers?.full_name || '').filter(Boolean),
        lessonTeachers: lessonAssignments.map((a: any) => a.teachers?.full_name || '').filter(Boolean),
        totalAssignments: assignments.length,
      };
    });
  }, []);

  // 生徒データ取得
  const fetchStudents = useCallback(async () => {
    const startTime = performance.now();
    setLoading(true);
    setError(null);

    try {
      // キャッシュキーの生成
      const cacheKey = `students_${JSON.stringify({ filters, sort, page: pagination.page })}`;
      
      const result = await supabaseOptimized.cachedQuery(
        cacheKey,
        async () => {
          const { data, error } = await supabaseOptimized.getClient()
            .from('students')
            .select(`
              *,
              assignments!left(
                id,
                teacher_id,
                role,
                status,
                assignment_start_date,
                teachers!inner(
                  id,
                  full_name,
                  account_status
                )
              )
            `)
            .order(sort.field, { ascending: sort.direction === 'asc' });

          return { data, error };
        },
        2 * 60 * 1000 // 2分キャッシュ
      );

      if (result.error) throw result.error;

      const processedStudents = processStudentDetails(result.data || []);
      const filteredStudents = applyFilters(processedStudents, filters);
      const sortedStudents = applySorting(filteredStudents, sort);

      // ページネーション適用
      const startIndex = pagination.page * pagination.pageSize;
      const endIndex = startIndex + pagination.pageSize;
      const paginatedStudents = sortedStudents.slice(startIndex, endIndex);

      setStudents(paginatedStudents);
      setPagination(prev => ({
        ...prev,
        totalCount: sortedStudents.length,
        hasMore: endIndex < sortedStudents.length,
      }));

      setLastFetchTime(performance.now() - startTime);
      setFromCache(result.fromCache);

    } catch (err) {
      console.error('生徒データ取得エラー:', err);
      setError(err instanceof Error ? err.message : '生徒データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [filters, sort, pagination.page, pagination.pageSize, processStudentDetails, applyFilters, applySorting]);

  // 講師データ取得
  const fetchTeachers = useCallback(async () => {
    try {
      const result = await supabaseOptimized.cachedQuery(
        'active_teachers',
        async () => {
          const { data, error } = await supabaseOptimized.getClient()
            .from('teachers')
            .select('id, full_name, account_status')
            .eq('account_status', '有効')
            .order('full_name');

          return { data, error };
        },
        5 * 60 * 1000 // 5分キャッシュ
      );

      if (result.error) throw result.error;
      setTeachers(result.data || []);

    } catch (err) {
      console.error('講師データ取得エラー:', err);
    }
  }, []);

  // フィルター更新（メモ化）
  const setFilters = useCallback((newFilters: Partial<StudentFilters>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 0 })); // ページをリセット
  }, []);

  // ソート更新（メモ化）
  const setSort = useCallback((newSort: SortConfig) => {
    setSortState(newSort);
    setPagination(prev => ({ ...prev, page: 0 })); // ページをリセット
  }, []);

  // ページ更新（メモ化）
  const setPage = useCallback((page: number) => {
    setPagination(prev => ({ ...prev, page }));
  }, []);

  // データ再取得（メモ化）
  const refreshData = useCallback(() => {
    supabaseOptimized.clearCache('students');
    fetchStudents();
    fetchTeachers();
  }, [fetchStudents, fetchTeachers]);

  // パフォーマンス統計（メモ化）
  const performanceStats = useMemo(() => ({
    lastFetchTime,
    cacheHitRate: fromCache ? 1 : 0,
    fromCache,
  }), [lastFetchTime, fromCache]);

  // 初回データ取得
  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  useEffect(() => {
    fetchTeachers();
  }, [fetchTeachers]);

  return {
    students,
    teachers,
    loading,
    error,
    pagination,
    filters,
    sort,
    setFilters,
    setSort,
    setPage,
    refreshData,
    performanceStats,
  };
}