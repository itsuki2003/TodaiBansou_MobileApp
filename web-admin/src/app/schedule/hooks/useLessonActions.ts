'use client';

import { useCallback } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { LessonSlotFormData, AbsenceFormData, RescheduleFormData } from '@/types/schedule';

export function useLessonActions() {
  const supabase = createClient();

  // 新規授業作成
  const createLessonSlot = useCallback(async (data: LessonSlotFormData) => {
    try {
      const { error } = await supabase
        .from('lesson_slots')
        .insert([{
          student_id: data.student_id,
          teacher_id: data.teacher_id || null,
          slot_type: data.slot_type,
          slot_date: data.slot_date,
          start_time: data.start_time,
          end_time: data.end_time,
          google_meet_link: data.google_meet_link || null,
          status: '予定通り',
          notes: data.notes || null
        }]);

      if (error) throw error;

      // 成功時のログ
      console.log('授業が正常に作成されました');
    } catch (err) {
      console.error('授業作成エラー:', err);
      throw new Error(err instanceof Error ? err.message : '授業の作成に失敗しました');
    }
  }, [supabase]);

  // 授業更新
  const updateLessonSlot = useCallback(async (id: string, data: Partial<LessonSlotFormData>) => {
    try {
      const { error } = await supabase
        .from('lesson_slots')
        .update({
          teacher_id: data.teacher_id || null,
          slot_type: data.slot_type,
          slot_date: data.slot_date,
          start_time: data.start_time,
          end_time: data.end_time,
          google_meet_link: data.google_meet_link || null,
          notes: data.notes || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      console.log('授業が正常に更新されました');
    } catch (err) {
      console.error('授業更新エラー:', err);
      throw new Error(err instanceof Error ? err.message : '授業の更新に失敗しました');
    }
  }, [supabase]);

  // 授業削除
  const deleteLessonSlot = useCallback(async (id: string) => {
    try {
      // 関連する申請も削除
      await supabase
        .from('absence_requests')
        .delete()
        .eq('lesson_slot_id', id);

      await supabase
        .from('additional_lesson_requests')
        .delete()
        .eq('created_lesson_slot_id', id);

      // 授業削除
      const { error } = await supabase
        .from('lesson_slots')
        .delete()
        .eq('id', id);

      if (error) throw error;

      console.log('授業が正常に削除されました');
    } catch (err) {
      console.error('授業削除エラー:', err);
      throw new Error(err instanceof Error ? err.message : '授業の削除に失敗しました');
    }
  }, [supabase]);

  // 欠席マーク
  const markAsAbsent = useCallback(async (slotId: string, reason: string) => {
    try {
      // トランザクション的に処理
      const { error: updateError } = await supabase
        .from('lesson_slots')
        .update({
          status: '欠席',
          updated_at: new Date().toISOString()
        })
        .eq('id', slotId);

      if (updateError) throw updateError;

      // 欠席申請レコードを作成
      const { error: insertError } = await supabase
        .from('absence_requests')
        .insert([{
          lesson_slot_id: slotId,
          reason: reason,
          request_timestamp: new Date().toISOString(),
          status: '未振替'
        }]);

      if (insertError) throw insertError;

      console.log('欠席マークが正常に設定されました');
    } catch (err) {
      console.error('欠席マークエラー:', err);
      throw new Error(err instanceof Error ? err.message : '欠席マークに失敗しました');
    }
  }, [supabase]);

  // 振替授業作成
  const createReschedule = useCallback(async (originalSlotId: string, rescheduleData: any) => {
    try {
      // 元の授業情報を取得
      const { data: originalSlot, error: fetchError } = await supabase
        .from('lesson_slots')
        .select('*')
        .eq('id', originalSlotId)
        .single();

      if (fetchError || !originalSlot) {
        throw new Error('元の授業情報が見つかりません');
      }

      // 元の授業を「振替済み（振替元）」に更新
      const { error: updateError } = await supabase
        .from('lesson_slots')
        .update({
          status: '振替済み（振替元）',
          updated_at: new Date().toISOString()
        })
        .eq('id', originalSlotId);

      if (updateError) throw updateError;

      // 新しい振替授業を作成
      const { data: newSlot, error: insertError } = await supabase
        .from('lesson_slots')
        .insert([{
          student_id: originalSlot.student_id,
          teacher_id: rescheduleData.teacher_id || originalSlot.teacher_id,
          slot_type: '振替授業',
          slot_date: rescheduleData.new_date,
          start_time: rescheduleData.new_start_time,
          end_time: rescheduleData.new_end_time,
          google_meet_link: originalSlot.google_meet_link,
          status: '予定通り',
          original_slot_id_for_reschedule: originalSlotId,
          notes: rescheduleData.notes || `${originalSlot.slot_date} ${originalSlot.start_time}からの振替授業`
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      // 欠席申請を「振替済」に更新
      await supabase
        .from('absence_requests')
        .update({
          status: '振替済',
          admin_notes: `振替授業作成: ${rescheduleData.new_date} ${rescheduleData.new_start_time}`
        })
        .eq('lesson_slot_id', originalSlotId);

      console.log('振替授業が正常に作成されました');
    } catch (err) {
      console.error('振替授業作成エラー:', err);
      throw new Error(err instanceof Error ? err.message : '振替授業の作成に失敗しました');
    }
  }, [supabase]);

  // 追加授業申請の承認（申請一覧から使用）
  const approveAdditionalLessonRequest = useCallback(async (
    requestId: string, 
    teacherId?: string,
    adminNotes?: string
  ) => {
    try {
      // 申請情報を取得
      const { data: request, error: fetchError } = await supabase
        .from('additional_lesson_requests')
        .select('*')
        .eq('id', requestId)
        .single();

      if (fetchError || !request) {
        throw new Error('申請情報が見つかりません');
      }

      // 新しい授業を作成
      const { data: newSlot, error: insertError } = await supabase
        .from('lesson_slots')
        .insert([{
          student_id: request.student_id,
          teacher_id: teacherId || request.teacher_id,
          slot_type: '追加授業',
          slot_date: request.requested_date,
          start_time: request.requested_start_time,
          end_time: request.requested_end_time,
          status: '予定通り',
          notes: request.notes || '追加授業申請による作成'
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      // 申請を承認済みに更新
      const { error: updateError } = await supabase
        .from('additional_lesson_requests')
        .update({
          status: '承認済み・授業登録済み',
          admin_notes: adminNotes || '承認済み',
          created_lesson_slot_id: newSlot.id
        })
        .eq('id', requestId);

      if (updateError) throw updateError;

      console.log('追加授業申請が正常に承認されました');
    } catch (err) {
      console.error('追加授業申請承認エラー:', err);
      throw new Error(err instanceof Error ? err.message : '追加授業申請の承認に失敗しました');
    }
  }, [supabase]);

  // 時間の重複チェック
  const checkTimeConflict = useCallback(async (
    teacherId: string,
    date: string,
    startTime: string,
    endTime: string,
    excludeSlotId?: string
  ) => {
    try {
      let query = supabase
        .from('lesson_slots')
        .select('id, start_time, end_time')
        .eq('teacher_id', teacherId)
        .eq('slot_date', date)
        .eq('status', '予定通り');

      if (excludeSlotId) {
        query = query.neq('id', excludeSlotId);
      }

      const { data, error } = await query;

      if (error) throw error;

      // 時間の重複をチェック
      for (const slot of data || []) {
        const existingStart = slot.start_time;
        const existingEnd = slot.end_time;

        // 重複判定
        if (
          (startTime >= existingStart && startTime < existingEnd) ||
          (endTime > existingStart && endTime <= existingEnd) ||
          (startTime <= existingStart && endTime >= existingEnd)
        ) {
          return {
            hasConflict: true,
            conflictSlot: slot
          };
        }
      }

      return { hasConflict: false };
    } catch (err) {
      console.error('時間重複チェックエラー:', err);
      throw new Error('時間重複チェックに失敗しました');
    }
  }, [supabase]);

  return {
    createLessonSlot,
    updateLessonSlot,
    deleteLessonSlot,
    markAsAbsent,
    createReschedule,
    approveAdditionalLessonRequest,
    checkTimeConflict
  };
}