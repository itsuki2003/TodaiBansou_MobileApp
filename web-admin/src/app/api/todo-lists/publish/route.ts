import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔷 公開状態更新開始:', body);

    // バリデーション
    if (!body.todoListId || !body.status) {
      return NextResponse.json(
        { success: false, error: '必須項目が不足しています' },
        { status: 400 }
      );
    }

    // ステータス値の検証
    if (!['下書き', '公開済み'].includes(body.status)) {
      return NextResponse.json(
        { success: false, error: '無効なステータスです' },
        { status: 400 }
      );
    }

    // やることリストの存在確認
    const { data: existingTodoList, error: fetchError } = await supabaseAdmin
      .from('todo_lists')
      .select('id, status, student_id')
      .eq('id', body.todoListId)
      .single();

    if (fetchError || !existingTodoList) {
      return NextResponse.json(
        { success: false, error: 'やることリストが見つかりません' },
        { status: 404 }
      );
    }

    // ステータス更新
    const updateData: any = {
      status: body.status,
      updated_at: new Date().toISOString()
    };

    // 公開時には配布日も設定
    if (body.status === '公開済み' && !existingTodoList.list_creation_date) {
      updateData.list_creation_date = new Date().toISOString();
    }

    const { data: updatedTodoList, error: updateError } = await supabaseAdmin
      .from('todo_lists')
      .update(updateData)
      .eq('id', body.todoListId)
      .select('*')
      .single();

    if (updateError) {
      console.error('🔷 公開状態更新エラー:', updateError);
      return NextResponse.json(
        { success: false, error: '公開状態の更新に失敗しました' },
        { status: 500 }
      );
    }

    console.log('🔷 公開状態更新成功:', updatedTodoList.id, '→', body.status);

    return NextResponse.json({
      success: true,
      todoList: updatedTodoList
    });

  } catch (error) {
    console.error('🔷 公開状態更新API全般エラー:', error);
    
    const errorMessage = error instanceof Error ? error.message : '予期しないエラーが発生しました';
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}