'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { 
  TeacherDashboardData, 
  TeacherProfile, 
  AssignedStudent, 
  UpcomingLesson,
  TeacherProfileFormData
} from '@/types/teacher';

export function useTeacherData(userId?: string) {
  const [dashboardData, setDashboardData] = useState<TeacherDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // 講師プロフィールの取得
  const fetchTeacherProfile = useCallback(async (userId: string): Promise<TeacherProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .eq('user_id', userId)
        .eq('account_status', '有効')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // レコードが見つからない場合
          return null;
        }
        throw error;
      }

      return data;
    } catch (err) {
      console.error('講師プロフィール取得エラー:', err);
      throw err;
    }
  }, [supabase]);

  // 担当生徒の取得
  const fetchAssignedStudents = useCallback(async (teacherId: string): Promise<AssignedStudent[]> => {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select(`
          *,
          students!inner (
            id,
            full_name,
            grade,
            status
          )
        `)
        .eq('teacher_id', teacherId)
        .eq('status', '有効')
        .order('assignment_start_date', { ascending: false });

      if (error) throw error;

      return data?.map(assignment => ({
        ...assignment,
        student: assignment.students
      })) || [];
    } catch (err) {
      console.error('担当生徒取得エラー:', err);
      throw err;
    }
  }, [supabase]);

  // 今後の授業予定の取得
  const fetchUpcomingLessons = useCallback(async (teacherId: string): Promise<UpcomingLesson[]> => {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('lesson_slots')
        .select(`
          *,
          students!inner (full_name)
        `)
        .eq('teacher_id', teacherId)
        .gte('slot_date', today)
        .in('status', ['予定通り', '実施済み', '欠席'])
        .order('slot_date')
        .order('start_time')
        .limit(20);

      if (error) throw error;

      return data?.map(lesson => ({
        ...lesson,
        student_name: lesson.students?.full_name || '不明'
      })) || [];
    } catch (err) {
      console.error('授業予定取得エラー:', err);
      throw err;
    }
  }, [supabase]);

  // 週間統計の計算
  const calculateWeeklyStats = useCallback((lessons: UpcomingLesson[]) => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay()); // 今週の日曜日
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // 今週の土曜日

    const thisWeekLessons = lessons.filter(lesson => {
      const lessonDate = new Date(lesson.slot_date);
      return lessonDate >= weekStart && lessonDate <= weekEnd;
    });

    return {
      totalLessons: thisWeekLessons.length,
      completedLessons: thisWeekLessons.filter(l => l.status === '実施済み').length,
      upcomingLessons: thisWeekLessons.filter(l => l.status === '予定通り').length,
      cancelledLessons: thisWeekLessons.filter(l => l.status === '欠席').length
    };
  }, []);

  // 全データの取得
  const fetchDashboardData = useCallback(async () => {
    if (!userId) {
      setError('ユーザーIDが指定されていません');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('講師データを取得中..., userId:', userId);
      
      // 講師プロフィールを取得
      const teacher = await fetchTeacherProfile(userId);
      if (!teacher) {
        console.error('講師プロフィールが見つかりません:', userId);
        setError('講師情報が見つかりません。システム管理者にお問い合わせください。');
        setLoading(false);
        return;
      }

      console.log('講師プロフィール取得成功:', teacher);

      // 並行して関連データを取得
      const [assignedStudents, upcomingLessons] = await Promise.all([
        fetchAssignedStudents(teacher.id),
        fetchUpcomingLessons(teacher.id)
      ]);

      // 週間統計を計算
      const weeklyStats = calculateWeeklyStats(upcomingLessons);

      setDashboardData({
        teacher,
        assignedStudents,
        upcomingLessons,
        weeklyStats
      });
    } catch (err) {
      console.error('ダッシュボードデータ取得エラー:', err);
      setError(err instanceof Error ? err.message : 'データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [userId, fetchTeacherProfile, fetchAssignedStudents, fetchUpcomingLessons, calculateWeeklyStats]);

  // プロフィール更新
  const updateProfile = useCallback(async (formData: TeacherProfileFormData) => {
    if (!dashboardData?.teacher) {
      throw new Error('講師情報が見つかりません');
    }

    try {
      const { error } = await supabase
        .from('teachers')
        .update({
          ...formData,
          updated_at: new Date().toISOString()
        })
        .eq('id', dashboardData.teacher.id);

      if (error) throw error;

      // データを再取得
      await fetchDashboardData();
    } catch (err) {
      console.error('プロフィール更新エラー:', err);
      throw new Error(err instanceof Error ? err.message : 'プロフィールの更新に失敗しました');
    }
  }, [dashboardData?.teacher, supabase, fetchDashboardData]);

  // 初回データ取得
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // リアルタイム更新の設定
  useEffect(() => {
    if (!dashboardData?.teacher) return;

    const teacherId = dashboardData.teacher.id;

    const channel = supabase
      .channel('teacher-dashboard-changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'lesson_slots', filter: `teacher_id=eq.${teacherId}` },
        () => {
          console.log('授業スケジュールが更新されました');
          fetchDashboardData();
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'assignments', filter: `teacher_id=eq.${teacherId}` },
        () => {
          console.log('担当生徒が更新されました');
          fetchDashboardData();
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'teachers', filter: `id=eq.${teacherId}` },
        () => {
          console.log('講師プロフィールが更新されました');
          fetchDashboardData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, dashboardData?.teacher, fetchDashboardData]);

  // 手動リフレッシュ
  const refreshData = useCallback(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return {
    dashboardData,
    loading,
    error,
    updateProfile,
    refreshData
  };
}