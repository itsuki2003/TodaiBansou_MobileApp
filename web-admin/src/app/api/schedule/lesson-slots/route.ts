import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('studentId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    console.log('🔧 API: lesson-slots取得開始', { studentId, startDate, endDate });

    // 管理者クライアントを使用してRLSを回避
    const { data, error } = await supabaseAdmin
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

    console.log('🔧 API: Supabaseレスポンス', { data, error, dataLength: data?.length });

    if (error) {
      console.error('🔧 API: lesson-slots取得エラー:', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // データを整形
    const formattedData = (data || []).map(slot => ({
      ...slot,
      student_name: slot.students?.full_name || '不明',
      teacher_name: slot.teachers?.full_name,
      absence_request: slot.absence_requests?.[0],
      additional_request: slot.additional_lesson_requests?.[0]
    }));

    console.log('🔧 API: 整形後のデータ', formattedData);

    return NextResponse.json({
      success: true,
      data: formattedData
    });

  } catch (error) {
    console.error('🔧 API: 全般エラー:', error);
    const errorMessage = error instanceof Error ? error.message : '予期しないエラーが発生しました';
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}