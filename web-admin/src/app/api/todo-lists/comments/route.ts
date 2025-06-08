import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { CommentOperationResponse } from '@/types/todoList';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔷 コメント作成開始:', body);

    // バリデーション
    if (!body.todo_list_id || !body.target_date || !body.teacher_id || !body.comment_content) {
      return NextResponse.json<CommentOperationResponse>(
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
      return NextResponse.json<CommentOperationResponse>(
        { success: false, error: 'やることリストが見つかりません' },
        { status: 404 }
      );
    }

    // 講師の存在確認
    const { data: teacher, error: teacherError } = await supabaseAdmin
      .from('teachers')
      .select('id, full_name')
      .eq('id', body.teacher_id)
      .single();

    if (teacherError || !teacher) {
      return NextResponse.json<CommentOperationResponse>(
        { success: false, error: '講師が見つかりません' },
        { status: 404 }
      );
    }

    // コメントを作成
    const { data: newComment, error: createError } = await supabaseAdmin
      .from('teacher_comments')
      .insert({
        todo_list_id: body.todo_list_id,
        target_date: body.target_date,
        teacher_id: body.teacher_id,
        comment_content: body.comment_content,
        notes: body.notes || null
      })
      .select(`
        *,
        teacher:teachers!teacher_comments_teacher_id_fkey (
          id,
          full_name
        )
      `)
      .single();

    if (createError) {
      console.error('🔷 コメント作成エラー:', createError);
      return NextResponse.json<CommentOperationResponse>(
        { success: false, error: 'コメントの作成に失敗しました' },
        { status: 500 }
      );
    }

    console.log('🔷 コメント作成成功:', newComment.id);

    return NextResponse.json<CommentOperationResponse>({
      success: true,
      comment: newComment
    });

  } catch (error) {
    console.error('🔷 コメント作成API全般エラー:', error);
    
    const errorMessage = error instanceof Error ? error.message : '予期しないエラーが発生しました';
    
    return NextResponse.json<CommentOperationResponse>(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('🔷 コメント更新開始:', body);

    // バリデーション
    if (!body.id || !body.comment_content) {
      return NextResponse.json<CommentOperationResponse>(
        { success: false, error: 'コメントIDと内容が必要です' },
        { status: 400 }
      );
    }

    // コメントを更新
    const { data: updatedComment, error: updateError } = await supabaseAdmin
      .from('teacher_comments')
      .update({
        comment_content: body.comment_content,
        updated_at: new Date().toISOString()
      })
      .eq('id', body.id)
      .select(`
        *,
        teacher:teachers!teacher_comments_teacher_id_fkey (
          id,
          full_name
        )
      `)
      .single();

    if (updateError) {
      console.error('🔷 コメント更新エラー:', updateError);
      return NextResponse.json<CommentOperationResponse>(
        { success: false, error: 'コメントの更新に失敗しました' },
        { status: 500 }
      );
    }

    console.log('🔷 コメント更新成功:', updatedComment.id);

    return NextResponse.json<CommentOperationResponse>({
      success: true,
      comment: updatedComment
    });

  } catch (error) {
    console.error('🔷 コメント更新API全般エラー:', error);
    
    const errorMessage = error instanceof Error ? error.message : '予期しないエラーが発生しました';
    
    return NextResponse.json<CommentOperationResponse>(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('id');

    console.log('🔷 コメント削除開始:', commentId);

    if (!commentId) {
      return NextResponse.json<CommentOperationResponse>(
        { success: false, error: 'コメントIDが必要です' },
        { status: 400 }
      );
    }

    // コメントを削除
    const { error: deleteError } = await supabaseAdmin
      .from('teacher_comments')
      .delete()
      .eq('id', commentId);

    if (deleteError) {
      console.error('🔷 コメント削除エラー:', deleteError);
      return NextResponse.json<CommentOperationResponse>(
        { success: false, error: 'コメントの削除に失敗しました' },
        { status: 500 }
      );
    }

    console.log('🔷 コメント削除成功:', commentId);

    return NextResponse.json<CommentOperationResponse>({
      success: true
    });

  } catch (error) {
    console.error('🔷 コメント削除API全般エラー:', error);
    
    const errorMessage = error instanceof Error ? error.message : '予期しないエラーが発生しました';
    
    return NextResponse.json<CommentOperationResponse>(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}