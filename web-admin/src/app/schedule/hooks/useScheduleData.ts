'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { LessonSlotWithDetails, Student, Teacher } from '@/types/schedule';

export function useScheduleData(studentId?: string, currentDate?: Date) {
  const [lessonSlots, setLessonSlots] = useState<LessonSlotWithDetails[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = useMemo(() => createClient(), []);

  // 生徒一覧の取得
  const fetchStudents = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('id, full_name, grade, status')
        .order('full_name');

      if (error) throw error;
      setStudents(data || []);
    } catch (err) {
      console.error('生徒データの取得に失敗:', err);
      setError('生徒データの取得に失敗しました');
    }
  }, [supabase]);

  // 講師一覧の取得
  const fetchTeachers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('teachers')
        .select('id, full_name, email, account_status')
        .eq('account_status', '有効')
        .order('full_name');

      if (error) throw error;
      setTeachers(data || []);
    } catch (err) {
      console.error('講師データの取得に失敗:', err);
      setError('講師データの取得に失敗しました');
    }
  }, [supabase]);

  // 授業スケジュールの取得
  const fetchLessonSlots = useCallback(async () => {
    if (!studentId || !currentDate) {
      setLessonSlots([]);
      return;
    }

    try {
      // 月の開始日と終了日を計算
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const startDate = new Date(year, month, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('lesson_slots')
        .select(`
          *,
          students!inner(full_name),
          teachers(full_name),
          absence_requests(id, status, reason),
          additional_lesson_requests(id, status)
        `)
        .eq('student_id', studentId)
        .gte('slot_date', startDate)
        .lte('slot_date', endDate)
        .order('slot_date')
        .order('start_time');

      if (error) throw error;

      // データを整形
      const formattedData: LessonSlotWithDetails[] = (data || []).map(slot => ({
        ...slot,
        student_name: slot.students?.full_name || '不明',
        teacher_name: slot.teachers?.full_name,
        absence_request: slot.absence_requests?.[0],
        additional_request: slot.additional_lesson_requests?.[0]
      }));

      setLessonSlots(formattedData);
    } catch (err) {
      console.error('授業スケジュールの取得に失敗:', err);
      setError('授業スケジュールの取得に失敗しました');
    }
  }, [supabase, studentId, currentDate]);

  // 全データの取得
  const fetchAllData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 基本データ（生徒・講師）を先に取得
      await Promise.all([
        fetchStudents(),
        fetchTeachers()
      ]);
      
      // 授業スケジュールは条件が揃ってから取得
      if (studentId && currentDate) {
        await fetchLessonSlots();
      }
    } catch (err) {
      console.error('データの取得に失敗:', err);
      setError('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [fetchStudents, fetchTeachers, fetchLessonSlots, studentId, currentDate]);

  // 初回読み込み
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // 生徒や月が変更されたときの授業スケジュール再取得
  useEffect(() => {
    if (students.length > 0 && teachers.length > 0) {
      fetchLessonSlots();
    }
  }, [studentId, currentDate]);

  // リアルタイム更新の設定
  useEffect(() => {
    const channel = supabase
      .channel('schedule-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'lesson_slots' },
        () => {
          fetchLessonSlots();
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'absence_requests' },
        () => {
          fetchLessonSlots();
        }
      )
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'additional_lesson_requests' },
        () => {
          fetchLessonSlots();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, fetchLessonSlots]);

  // 手動再取得
  const refetch = useCallback(() => {
    fetchAllData();
  }, [fetchAllData]);

  return {
    lessonSlots,
    students,
    teachers,
    loading,
    error,
    refetch
  };
}