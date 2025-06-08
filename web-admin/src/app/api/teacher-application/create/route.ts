import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { TeacherApplicationResponse } from '@/types/teacherApplication';

export async function POST(request: NextRequest) {
  try {
    // リクエストボディを取得
    const body = await request.json();
    
    // 基本的なバリデーション
    if (!body.full_name || !body.furigana_name || !body.email) {
      return NextResponse.json<TeacherApplicationResponse>(
        { success: false, error: '必須項目（氏名、フリガナ、メールアドレス）が不足しています' },
        { status: 400 }
      );
    }

    // メールアドレス形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json<TeacherApplicationResponse>(
        { success: false, error: '正しいメールアドレス形式で入力してください' },
        { status: 400 }
      );
    }

    // 電話番号形式チェック（任意項目の場合）
    if (body.phone_number) {
      const phoneRegex = /^[\d-+().\\s]+$/;
      if (!phoneRegex.test(body.phone_number)) {
        return NextResponse.json<TeacherApplicationResponse>(
          { success: false, error: '正しい電話番号形式で入力してください' },
          { status: 400 }
        );
      }
    }

    console.log('🔷 講師登録申請開始:', { email: body.email, name: body.full_name });

    // 重複メールアドレスチェック（既存の講師テーブル）
    const { data: existingTeacher } = await supabaseAdmin
      .from('teachers')
      .select('id, email, account_status')
      .eq('email', body.email)
      .single();

    if (existingTeacher) {
      let errorMessage = 'このメールアドレスは既に登録されています';
      if (existingTeacher.account_status === '承認待ち') {
        errorMessage = 'このメールアドレスで既に申請が提出されています。審査結果をお待ちください';
      } else if (existingTeacher.account_status === '有効') {
        errorMessage = 'このメールアドレスは既に有効な講師アカウントとして登録されています';
      }
      
      return NextResponse.json<TeacherApplicationResponse>(
        { success: false, error: errorMessage },
        { status: 409 }
      );
    }

    // 重複メールアドレスチェック（認証ユーザー）
    const { data: existingAuthUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingAuthUser = existingAuthUsers.users.find(u => u.email === body.email);
    if (existingAuthUser) {
      return NextResponse.json<TeacherApplicationResponse>(
        { success: false, error: 'このメールアドレスは既にシステムに登録されています' },
        { status: 409 }
      );
    }

    try {
      // teachersテーブルに申請データを挿入（承認待ち状態で）
      console.log('🔷 講師申請データを挿入中...');
      const { data: teacherData, error: teacherError } = await supabaseAdmin
        .from('teachers')
        .insert({
          full_name: body.full_name,
          furigana_name: body.furigana_name,
          email: body.email,
          phone_number: body.phone_number || null,
          account_status: '承認待ち',
          appeal_points: body.appeal_points || null,
          hobbies_special_skills: body.hobbies_special_skills || null,
          referrer_info: body.referrer_info || null,
          education_background_cram_school: body.education_background_cram_school || null,
          education_background_middle_school: body.education_background_middle_school || null,
          education_background_high_school: body.education_background_high_school || null,
          education_background_university: body.education_background_university || null,
          education_background_faculty: body.education_background_faculty || null,
          registration_application_date: new Date().toISOString().split('T')[0],
        })
        .select('id')
        .single();

      if (teacherError) {
        console.error('🔷 講師データ挿入エラー:', teacherError);
        throw new Error(`講師申請の保存に失敗しました: ${teacherError.message}`);
      }

      const teacherId = teacherData.id;
      console.log('🔷 講師申請データ挿入成功:', teacherId);

      // TODO: ファイルアップロード処理
      // profile_formal_photo と profile_casual_photo がある場合は
      // Supabase Storage にアップロードして URL を更新

      // TODO: メール通知
      // 申請者への自動返信メール
      // 運営への新規申請通知メール

      // 成功レスポンス
      console.log('🔷 講師登録申請完了');
      return NextResponse.json<TeacherApplicationResponse>({
        success: true,
        teacher_id: teacherId,
        message: `講師登録申請を受け付けました。審査結果については1週間以内にご連絡いたします。`,
      });

    } catch (processingError) {
      console.error('🔷 処理中エラー:', processingError);

      // エラー時のクリーンアップ
      console.log('🔷 エラー時のクリーンアップ開始');
      
      // 作成された講師データがあれば削除
      if (teacherData?.id) {
        console.log('🔷 作成済み講師データを削除中...');
        await supabaseAdmin
          .from('teachers')
          .delete()
          .eq('id', teacherData.id)
          .catch(err => console.error('🔷 講師データ削除エラー:', err));
      }

      console.log('🔷 クリーンアップ完了');
      throw processingError;
    }

  } catch (error) {
    console.error('🔷 講師申請API全般エラー:', error);
    
    const errorMessage = error instanceof Error ? error.message : '予期しないエラーが発生しました';
    
    return NextResponse.json<TeacherApplicationResponse>(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}