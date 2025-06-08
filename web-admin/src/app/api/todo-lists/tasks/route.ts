import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { TaskOperationResponse } from '@/types/todoList';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔷 タスク作成開始:', body);

    // バリデーション
    if (!body.todo_list_id || !body.target_date || !body.content) {
      return NextResponse.json<TaskOperationResponse>(
        { success: false, error: '必須項目が不足しています' },
        { status: 400 }
      );
    }

    // やることリストの存在確認
    const { data: todoList, error: todoListError } = await supabaseAdmin
      .from('todo_lists')
      .select('id, status')
      .eq('id', body.todo_list_id)
      .single();

    if (todoListError || !todoList) {
      return NextResponse.json<TaskOperationResponse>(
        { success: false, error: 'やることリストが見つかりません' },
        { status: 404 }
      );
    }

    // 同じ日のタスク数を取得して表示順序を決定
    const { data: existingTasks, error: countError } = await supabaseAdmin
      .from('tasks')
      .select('display_order')
      .eq('todo_list_id', body.todo_list_id)
      .eq('target_date', body.target_date)
      .order('display_order', { ascending: false })
      .limit(1);

    if (countError) {
      console.error('🔷 既存タスク数取得エラー:', countError);
    }

    const nextOrder = existingTasks && existingTasks.length > 0
      ? existingTasks[0].display_order + 1
      : 0;

    // タスクを作成
    const { data: newTask, error: createError } = await supabaseAdmin
      .from('tasks')
      .insert({
        todo_list_id: body.todo_list_id,
        target_date: body.target_date,
        content: body.content,
        is_completed: false,
        display_order: body.display_order ?? nextOrder,
        notes: body.notes || null
      })
      .select()
      .single();

    if (createError) {
      console.error('🔷 タスク作成エラー:', createError);
      return NextResponse.json<TaskOperationResponse>(
        { success: false, error: 'タスクの作成に失敗しました' },
        { status: 500 }
      );
    }

    console.log('🔷 タスク作成成功:', newTask.id);

    return NextResponse.json<TaskOperationResponse>({
      success: true,
      task: newTask
    });

  } catch (error) {
    console.error('🔷 タスク作成API全般エラー:', error);
    
    const errorMessage = error instanceof Error ? error.message : '予期しないエラーが発生しました';
    
    return NextResponse.json<TaskOperationResponse>(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔷 タスク更新開始:', body);

    // バリデーション
    if (!body.id) {
      return NextResponse.json<TaskOperationResponse>(
        { success: false, error: 'タスクIDが必要です' },
        { status: 400 }
      );
    }

    // 更新データの準備
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (body.content !== undefined) updateData.content = body.content;
    if (body.is_completed !== undefined) updateData.is_completed = body.is_completed;
    if (body.display_order !== undefined) updateData.display_order = body.display_order;
    if (body.notes !== undefined) updateData.notes = body.notes;

    // タスクを更新
    const { data: updatedTask, error: updateError } = await supabaseAdmin
      .from('tasks')
      .update(updateData)
      .eq('id', body.id)
      .select()
      .single();

    if (updateError) {
      console.error('🔷 タスク更新エラー:', updateError);
      return NextResponse.json<TaskOperationResponse>(
        { success: false, error: 'タスクの更新に失敗しました' },
        { status: 500 }
      );
    }

    console.log('🔷 タスク更新成功:', updatedTask.id);

    return NextResponse.json<TaskOperationResponse>({
      success: true,
      task: updatedTask
    });

  } catch (error) {
    console.error('🔷 タスク更新API全般エラー:', error);
    
    const errorMessage = error instanceof Error ? error.message : '予期しないエラーが発生しました';
    
    return NextResponse.json<TaskOperationResponse>(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('id');

    console.log('🔷 タスク削除開始:', taskId);

    if (!taskId) {
      return NextResponse.json<TaskOperationResponse>(
        { success: false, error: 'タスクIDが必要です' },
        { status: 400 }
      );
    }

    // タスクを削除
    const { error: deleteError } = await supabaseAdmin
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (deleteError) {
      console.error('🔷 タスク削除エラー:', deleteError);
      return NextResponse.json<TaskOperationResponse>(
        { success: false, error: 'タスクの削除に失敗しました' },
        { status: 500 }
      );
    }

    console.log('🔷 タスク削除成功:', taskId);

    return NextResponse.json<TaskOperationResponse>({
      success: true
    });

  } catch (error) {
    console.error('🔷 タスク削除API全般エラー:', error);
    
    const errorMessage = error instanceof Error ? error.message : '予期しないエラーが発生しました';
    
    return NextResponse.json<TaskOperationResponse>(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}