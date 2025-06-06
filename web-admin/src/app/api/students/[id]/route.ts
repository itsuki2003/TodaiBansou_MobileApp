import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { GetStudentResponse, UpdateStudentRequest, UpdateStudentResponse } from '@/types/studentForm';

// 生徒情報を取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: studentId } = await params;

    if (!studentId) {
      return NextResponse.json<GetStudentResponse>(
        { success: false, error: '生徒IDが指定されていません' },
        { status: 400 }
      );
    }

    console.log('🔷 生徒情報取得開始:', studentId);

    // studentsテーブルから生徒情報を取得
    const { data: studentData, error: studentError } = await supabaseAdmin
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();

    if (studentError) {
      console.error('🔷 生徒情報取得エラー:', studentError);
      
      if (studentError.code === 'PGRST116') {
        return NextResponse.json<GetStudentResponse>(
          { success: false, error: '指定された生徒が見つかりません' },
          { status: 404 }
        );
      }
      
      return NextResponse.json<GetStudentResponse>(
        { success: false, error: '生徒情報の取得に失敗しました' },
        { status: 500 }
      );
    }

    // 認証ユーザー情報（メールアドレス）を取得
    let parentEmail = '';
    if (studentData.user_id) {
      const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(studentData.user_id);
      if (!userError && userData.user) {
        parentEmail = userData.user.email || '';
      }
    }

    // レスポンス用のデータを構築
    const responseData = {
      id: studentData.id,
      full_name: studentData.full_name || '',
      furigana_name: studentData.furigana_name || '',
      grade: studentData.grade || '',
      school_attended: studentData.school_attended || '',
      enrollment_date: studentData.enrollment_date || new Date().toISOString().split('T')[0],
      status: studentData.status || '在籍中',
      notes: studentData.notes || '',
      parent_name: studentData.parent_name || '',
      parent_email: parentEmail,
      parent_phone_number: studentData.parent_phone_number || '',
    };

    console.log('🔷 生徒情報取得成功');
    return NextResponse.json<GetStudentResponse>({
      success: true,
      student: responseData,
    });

  } catch (error) {
    console.error('🔷 GET API Route全般エラー:', error);
    
    const errorMessage = error instanceof Error ? error.message : '予期しないエラーが発生しました';
    
    return NextResponse.json<GetStudentResponse>(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// 生徒情報を更新
// 生徒情報を削除（論理削除）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: studentId } = await params;

    if (!studentId) {
      return NextResponse.json(
        { success: false, error: '生徒IDが指定されていません' },
        { status: 400 }
      );
    }

    console.log('🔷 生徒論理削除開始:', studentId);

    // 生徒が存在するかチェック
    const { data: existingStudent, error: checkError } = await supabaseAdmin
      .from('students')
      .select('id, full_name, status')
      .eq('id', studentId)
      .single();

    if (checkError || !existingStudent) {
      console.error('🔷 生徒存在チェックエラー:', checkError);
      return NextResponse.json(
        { success: false, error: '指定された生徒が見つかりません' },
        { status: 404 }
      );
    }

    // 既に退会済みの場合はエラー
    if (existingStudent.status === '退会済み') {
      return NextResponse.json(
        { success: false, error: 'この生徒は既に退会済みです' },
        { status: 400 }
      );
    }

    // ステータスを「退会済み」に更新（論理削除）
    const { error: deleteError } = await supabaseAdmin
      .from('students')
      .update({
        status: '退会済み',
        updated_at: new Date().toISOString(),
      })
      .eq('id', studentId);

    if (deleteError) {
      console.error('🔷 生徒論理削除エラー:', deleteError);
      return NextResponse.json(
        { success: false, error: '生徒の退会処理に失敗しました' },
        { status: 500 }
      );
    }

    console.log('🔷 生徒論理削除完了');
    return NextResponse.json({
      success: true,
      message: `生徒「${existingStudent.full_name}」を退会済みに設定しました`,
    });

  } catch (error) {
    console.error('🔷 DELETE API Route全般エラー:', error);
    
    const errorMessage = error instanceof Error ? error.message : '予期しないエラーが発生しました';
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: studentId } = await params;
    const body: UpdateStudentRequest = await request.json();

    if (!studentId) {
      return NextResponse.json<UpdateStudentResponse>(
        { success: false, error: '生徒IDが指定されていません' },
        { status: 400 }
      );
    }

    // 基本的なバリデーション
    if (!body.full_name || !body.parent_name || !body.enrollment_date) {
      return NextResponse.json<UpdateStudentResponse>(
        { success: false, error: '必須項目が不足しています' },
        { status: 400 }
      );
    }

    console.log('🔷 生徒情報更新開始:', studentId);

    // 生徒が存在するかチェック
    const { data: existingStudent, error: checkError } = await supabaseAdmin
      .from('students')
      .select('id, user_id')
      .eq('id', studentId)
      .single();

    if (checkError || !existingStudent) {
      console.error('🔷 生徒存在チェックエラー:', checkError);
      return NextResponse.json<UpdateStudentResponse>(
        { success: false, error: '指定された生徒が見つかりません' },
        { status: 404 }
      );
    }

    // studentsテーブルを更新
    const { error: updateError } = await supabaseAdmin
      .from('students')
      .update({
        full_name: body.full_name,
        furigana_name: body.furigana_name || null,
        grade: body.grade || null,
        school_attended: body.school_attended || null,
        enrollment_date: body.enrollment_date,
        status: body.status,
        parent_name: body.parent_name,
        parent_phone_number: body.parent_phone_number || null,
        notes: body.notes || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', studentId);

    if (updateError) {
      console.error('🔷 生徒情報更新エラー:', updateError);
      return NextResponse.json<UpdateStudentResponse>(
        { success: false, error: '生徒情報の更新に失敗しました' },
        { status: 500 }
      );
    }

    // 認証ユーザーのメタデータも更新（保護者氏名）
    if (existingStudent.user_id) {
      await supabaseAdmin.auth.admin.updateUserById(
        existingStudent.user_id,
        {
          user_metadata: {
            role: 'parent',
            full_name: body.parent_name,
            updated_by: 'admin_system',
            updated_at: new Date().toISOString(),
          },
        }
      ).catch(err => {
        console.warn('🔷 認証ユーザーメタデータ更新警告:', err);
        // メタデータ更新の失敗は致命的でないため警告のみ
      });
    }

    console.log('🔷 生徒情報更新完了');
    return NextResponse.json<UpdateStudentResponse>({
      success: true,
      message: `生徒「${body.full_name}」の情報を更新しました`,
    });

  } catch (error) {
    console.error('🔷 PUT API Route全般エラー:', error);
    
    const errorMessage = error instanceof Error ? error.message : '予期しないエラーが発生しました';
    
    return NextResponse.json<UpdateStudentResponse>(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}