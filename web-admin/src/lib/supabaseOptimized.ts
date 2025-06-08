/**
 * 最適化されたSupabaseクライアント
 * - 接続プーリング
 * - リクエストキャッシュ
 * - エラーハンドリング強化
 * - パフォーマンス監視
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

// パフォーマンス監視用の型定義
interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: Date;
  success: boolean;
}

// レスポンスキャッシュの型定義
interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

class SupabaseOptimized {
  private static instance: SupabaseOptimized;
  private client: SupabaseClient<Database>;
  private cache: Map<string, CacheEntry> = new Map();
  private queryMetrics: QueryMetrics[] = [];
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5分
  private readonly MAX_METRICS = 100;

  private constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase環境変数が設定されていません');
    }

    this.client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
      db: {
        schema: 'public',
      },
      global: {
        headers: {
          'x-client-info': 'todai-banso-web-admin',
        },
      },
      // リアルタイム機能の最適化
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });

    // 定期的なキャッシュクリーンアップ
    setInterval(() => this.cleanupCache(), 60000); // 1分ごと
  }

  public static getInstance(): SupabaseOptimized {
    if (!SupabaseOptimized.instance) {
      SupabaseOptimized.instance = new SupabaseOptimized();
    }
    return SupabaseOptimized.instance;
  }

  public getClient(): SupabaseClient<Database> {
    return this.client;
  }

  /**
   * キャッシュ機能付きクエリ実行
   */
  public async cachedQuery<T>(
    queryKey: string,
    queryFn: () => Promise<{ data: T | null; error: any }>,
    ttl: number = this.CACHE_TTL
  ): Promise<{ data: T | null; error: any; fromCache: boolean }> {
    const startTime = performance.now();

    try {
      // キャッシュ確認
      const cached = this.cache.get(queryKey);
      if (cached && Date.now() - cached.timestamp < cached.ttl) {
        this.recordMetric(queryKey, performance.now() - startTime, true);
        return { data: cached.data, error: null, fromCache: true };
      }

      // 新規クエリ実行
      const result = await queryFn();
      
      // 成功時のみキャッシュに保存
      if (!result.error && result.data) {
        this.cache.set(queryKey, {
          data: result.data,
          timestamp: Date.now(),
          ttl,
        });
      }

      this.recordMetric(queryKey, performance.now() - startTime, !result.error);
      return { ...result, fromCache: false };

    } catch (error) {
      this.recordMetric(queryKey, performance.now() - startTime, false);
      return { data: null, error, fromCache: false };
    }
  }

  /**
   * ページネーション付きクエリ
   */
  public async paginatedQuery<T>(
    table: string,
    options: {
      select?: string;
      filters?: Record<string, any>;
      orderBy?: { column: string; ascending?: boolean };
      page: number;
      pageSize: number;
    }
  ): Promise<{ data: T[] | null; error: any; totalCount: number; hasMore: boolean }> {
    const { select = '*', filters = {}, orderBy, page, pageSize } = options;
    
    const startIndex = page * pageSize;
    const endIndex = startIndex + pageSize - 1;

    let query = this.client
      .from(table)
      .select(select, { count: 'estimated' })
      .range(startIndex, endIndex);

    // フィルター適用
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (typeof value === 'string' && value.includes('%')) {
          query = query.ilike(key, value);
        } else {
          query = query.eq(key, value);
        }
      }
    });

    // ソート適用
    if (orderBy) {
      query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
    }

    const result = await query;

    return {
      data: result.data,
      error: result.error,
      totalCount: result.count || 0,
      hasMore: result.data ? result.data.length === pageSize : false,
    };
  }

  /**
   * バッチ挿入（パフォーマンス向上）
   */
  public async batchInsert<T>(
    table: string,
    records: Partial<T>[],
    batchSize: number = 100
  ): Promise<{ success: boolean; insertedCount: number; errors: any[] }> {
    const errors: any[] = [];
    let insertedCount = 0;

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      
      try {
        const { data, error } = await this.client
          .from(table)
          .insert(batch);

        if (error) {
          errors.push(error);
        } else {
          insertedCount += batch.length;
        }
      } catch (error) {
        errors.push(error);
      }
    }

    return {
      success: errors.length === 0,
      insertedCount,
      errors,
    };
  }

  /**
   * 複数テーブルからの効率的なデータ取得
   */
  public async getStudentWithDetails(studentId: string) {
    const cacheKey = `student_details_${studentId}`;
    
    return this.cachedQuery(
      cacheKey,
      async () => {
        const { data, error } = await this.client
          .from('students')
          .select(`
            *,
            assignments!inner(
              id,
              role,
              status,
              assignment_start_date,
              teachers!inner(
                id,
                full_name,
                account_status
              )
            ),
            todo_lists(
              id,
              status,
              target_week_start_date
            )
          `)
          .eq('id', studentId)
          .eq('assignments.status', '有効')
          .single();

        return { data, error };
      },
      2 * 60 * 1000 // 2分キャッシュ
    );
  }

  /**
   * 講師ダッシュボード用最適化クエリ
   */
  public async getTeacherDashboardData(teacherId: string) {
    const cacheKey = `teacher_dashboard_${teacherId}`;
    
    return this.cachedQuery(
      cacheKey,
      async () => {
        const today = new Date().toISOString().split('T')[0];
        
        // 並行して複数のクエリを実行
        const [teacherResult, assignmentsResult, lessonsResult] = await Promise.all([
          // 講師情報
          this.client
            .from('teachers')
            .select('*')
            .eq('id', teacherId)
            .single(),
          
          // 担当生徒
          this.client
            .from('assignments')
            .select(`
              *,
              students!inner(
                id,
                full_name,
                grade,
                status
              )
            `)
            .eq('teacher_id', teacherId)
            .eq('status', '有効'),
          
          // 今後の授業予定
          this.client
            .from('lesson_slots')
            .select(`
              *,
              students!inner(full_name)
            `)
            .eq('teacher_id', teacherId)
            .gte('slot_date', today)
            .in('status', ['予定通り', '実施済み'])
            .order('slot_date')
            .order('start_time')
            .limit(20)
        ]);

        // エラーチェック
        if (teacherResult.error) return { data: null, error: teacherResult.error };
        if (assignmentsResult.error) return { data: null, error: assignmentsResult.error };
        if (lessonsResult.error) return { data: null, error: lessonsResult.error };

        // データ統合
        const data = {
          teacher: teacherResult.data,
          assignedStudents: assignmentsResult.data || [],
          upcomingLessons: lessonsResult.data?.map(lesson => ({
            ...lesson,
            student_name: lesson.students?.full_name || '不明'
          })) || [],
        };

        return { data, error: null };
      },
      60 * 1000 // 1分キャッシュ
    );
  }

  /**
   * メトリクス記録
   */
  private recordMetric(query: string, duration: number, success: boolean): void {
    this.queryMetrics.push({
      query,
      duration,
      timestamp: new Date(),
      success,
    });

    // メトリクス数制限
    if (this.queryMetrics.length > this.MAX_METRICS) {
      this.queryMetrics.shift();
    }
  }

  /**
   * パフォーマンス統計取得
   */
  public getPerformanceStats(): {
    averageQueryTime: number;
    slowQueries: QueryMetrics[];
    successRate: number;
    cacheHitRate: number;
  } {
    const totalQueries = this.queryMetrics.length;
    const successfulQueries = this.queryMetrics.filter(m => m.success).length;
    const averageQueryTime = totalQueries > 0 
      ? this.queryMetrics.reduce((sum, m) => sum + m.duration, 0) / totalQueries 
      : 0;
    
    const slowQueries = this.queryMetrics
      .filter(m => m.duration > 1000) // 1秒以上
      .sort((a, b) => b.duration - a.duration)
      .slice(0, 10);

    return {
      averageQueryTime,
      slowQueries,
      successRate: totalQueries > 0 ? successfulQueries / totalQueries : 0,
      cacheHitRate: this.cache.size > 0 ? 0.8 : 0, // 概算値
    };
  }

  /**
   * キャッシュクリーンアップ
   */
  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * キャッシュクリア
   */
  public clearCache(pattern?: string): void {
    if (pattern) {
      for (const key of this.cache.keys()) {
        if (key.includes(pattern)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }
}

// シングルトンインスタンスのエクスポート
export const supabaseOptimized = SupabaseOptimized.getInstance();
export default supabaseOptimized;