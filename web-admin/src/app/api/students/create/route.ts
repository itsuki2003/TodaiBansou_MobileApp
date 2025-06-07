import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, generateInitialPassword } from '@/lib/supabaseAdmin';
import { CreateStudentRequest, CreateStudentResponse } from '@/types/studentForm';

export async function POST(request: NextRequest) {
  try {
    // リクエストボディを取得
    const body: CreateStudentRequest = await request.json();
    
    // 基本的なバリデーション
    if (!body.full_name || !body.parent_name || !body.parent_email || !body.enrollment_date) {
      return NextResponse.json<CreateStudentResponse>(
        { success: false, error: '必須項目が不足しています' },
        { status: 400 }
      );
    }

    // メールアドレス形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.parent_email)) {
      return NextResponse.json<CreateStudentResponse>(
        { success: false, error: '正しいメールアドレス形式で入力してください' },
        { status: 400 }
      );
    }

    // 電話番号形式チェック（任意項目の場合）
    if (body.parent_phone_number) {
      const phoneRegex = /^[\d-+().\s]+$/;
      if (!phoneRegex.test(body.parent_phone_number)) {
        return NextResponse.json<CreateStudentResponse>(
          { success: false, error: '正しい電話番号形式で入力してください' },
          { status: 400 }
        );
      }
    }

    // 重複メールアドレスチェック
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const existingEmail = existingUser.users.find(u => u.email === body.parent_email);
    if (existingEmail) {
      return NextResponse.json<CreateStudentResponse>(
        { success: false, error: 'このメールアドレスは既に登録されています' },
        { status: 409 }
      );
    }

    console.log('🔷 新規生徒登録開始:', { email: body.parent_email, student: body.full_name });

    // 初期パスワード生成
    const initialPassword = generateInitialPassword();
    console.log('🔷 初期パスワード生成完了');

    let createdUserId: string | null = null;
    let createdStudentId: string | null = null;

    try {
      // 1. Supabase Authにユーザーを作成
      console.log('🔷 認証ユーザー作成中...');
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: body.parent_email,
        password: initialPassword,
        email_confirm: true, // メール確認をスキップ
        user_metadata: {
          role: 'parent',
          full_name: body.parent_name,
          created_by: 'admin_system',
        },
      });

      if (authError) {
        console.error('🔷 認証ユーザー作成エラー:', authError);
        throw new Error(`認証ユーザーの作成に失敗しました: ${authError.message}`);
      }

      if (!authData.user) {
        throw new Error('認証ユーザーの作成に失敗しました');
      }

      createdUserId = authData.user.id;
      console.log('🔷 認証ユーザー作成成功:', createdUserId);

      // 2. studentsテーブルにレコードを挿入
      console.log('🔷 生徒情報をデータベースに挿入中...');
      const { data: studentData, error: studentError } = await supabaseAdmin
        .from('students')
        .insert({
          user_id: createdUserId,
          full_name: body.full_name,
          furigana_name: body.furigana_name || null,
          grade: body.grade || null,
          school_attended: body.school_attended || null,
          enrollment_date: body.enrollment_date,
          status: body.status,
          parent_name: body.parent_name,
          parent_phone_number: body.parent_phone_number || null,
          notes: body.notes || null,
        })
        .select('id')
        .single();

      if (studentError) {
        console.error('🔷 生徒データ挿入エラー:', studentError);
        throw new Error(`生徒情報の保存に失敗しました: ${studentError.message}`);
      }

      createdStudentId = studentData.id;
      console.log('🔷 生徒データ挿入成功:', createdStudentId);

      // 3. chat_groupsテーブルに空のグループを作成
      console.log('🔷 チャットグループ作成中...');
      const { error: chatGroupError } = await supabaseAdmin
        .from('chat_groups')
        .insert({
          student_id: createdStudentId,
          group_name: `${body.full_name}さんのチャット`,
        });

      if (chatGroupError) {
        console.error('🔷 チャットグループ作成エラー:', chatGroupError);
        throw new Error(`チャットグループの作成に失敗しました: ${chatGroupError.message}`);
      }

      console.log('🔷 チャットグループ作成成功');

      // 成功レスポンス
      console.log('🔷 生徒登録完了');
      return NextResponse.json<CreateStudentResponse>({
        success: true,
        student_id: createdStudentId,
        user_id: createdUserId,
        message: `生徒「${body.full_name}」の登録が完了しました。初期パスワードは別途お知らせします。`,
        // セキュリティ上、パスワードはレスポンスに含めない
      });

    } catch (processingError) {
      console.error('🔷 処理中エラー:', processingError);

      // エラー時のクリーンアップ（順序を改善）
      console.log('🔷 エラー時のクリーンアップ開始');

      // チャットグループが作成されている場合は削除
      if (createdStudentId) {
        console.log('🔷 作成済みチャットグループを削除中...');
        await supabaseAdmin
          .from('chat_groups')
          .delete()
          .eq('student_id', createdStudentId)
          .catch(err => console.error('🔷 チャットグループ削除エラー:', err));

        console.log('🔷 作成済み生徒データを削除中...');
        await supabaseAdmin
          .from('students')
          .delete()
          .eq('id', createdStudentId)
          .catch(err => console.error('🔷 生徒データ削除エラー:', err));
      }

      if (createdUserId) {
        console.log('🔷 作成済み認証ユーザーを削除中...');
        await supabaseAdmin.auth.admin
          .deleteUser(createdUserId)
          .catch(err => console.error('🔷 認証ユーザー削除エラー:', err));
      }

      console.log('🔷 クリーンアップ完了');

      throw processingError;
    }

  } catch (error) {
    console.error('🔷 API Route全般エラー:', error);
    
    const errorMessage = error instanceof Error ? error.message : '予期しないエラーが発生しました';
    
    return NextResponse.json<CreateStudentResponse>(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}