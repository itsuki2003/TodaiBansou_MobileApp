import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { TeacherApplicationStatusUpdateResponse } from '@/types/teacherApplication';

export async function POST(request: NextRequest) {
  try {
    console.log('🔷 講師申請ステータス更新開始');

    // リクエストボディを取得
    const body = await request.json();
    const { applicationId, status, reason, notes } = body;

    // バリデーション
    if (!applicationId || !status) {
      return NextResponse.json<TeacherApplicationStatusUpdateResponse>(
        { success: false, error: '申請IDとステータスは必須です' },
        { status: 400 }
      );
    }

    if (!['有効', '無効'].includes(status)) {
      return NextResponse.json<TeacherApplicationStatusUpdateResponse>(
        { success: false, error: '無効なステータスです' },
        { status: 400 }
      );
    }

    console.log(`🔷 申請ID: ${applicationId}, 新ステータス: ${status}`);

    // 申請存在確認
    const { data: existingApplication, error: fetchError } = await supabaseAdmin
      .from('teachers')
      .select('id, full_name, email, account_status, user_id')
      .eq('id', applicationId)
      .single();

    if (fetchError) {
      console.error('🔷 申請取得エラー:', fetchError);
      return NextResponse.json<TeacherApplicationStatusUpdateResponse>(
        { success: false, error: '申請が見つかりません' },
        { status: 404 }
      );
    }

    if (!existingApplication) {
      return NextResponse.json<TeacherApplicationStatusUpdateResponse>(
        { success: false, error: '申請が見つかりません' },
        { status: 404 }
      );
    }

    // 既に同じステータスの場合
    if (existingApplication.account_status === status) {
      return NextResponse.json<TeacherApplicationStatusUpdateResponse>({
        success: true,
        message: `既に${status}状態です`,
      });
    }

    try {
      // トランザクション開始相当の処理
      console.log('🔷 ステータス更新処理開始');

      // 講師テーブルのステータス更新
      const updateData: any = {
        account_status: status,
        updated_at: new Date().toISOString(),
      };

      // 承認の場合は承認日を設定
      if (status === '有効') {
        updateData.account_approval_date = new Date().toISOString().split('T')[0];
      }

      // 運営メモがある場合は追記
      if (notes || reason) {
        const currentNotes = existingApplication.notes_admin_only || '';
        const newNote = `[${new Date().toISOString().split('T')[0]}] ${status === '有効' ? '承認' : '拒否'}: ${reason || notes || ''}`;
        updateData.notes_admin_only = currentNotes ? `${currentNotes}\n${newNote}` : newNote;
      }

      const { error: updateError } = await supabaseAdmin
        .from('teachers')
        .update(updateData)
        .eq('id', applicationId);

      if (updateError) {
        console.error('🔷 ステータス更新エラー:', updateError);
        throw new Error(`ステータス更新に失敗しました: ${updateError.message}`);
      }

      console.log('🔷 ステータス更新成功');

      // 承認の場合：認証ユーザー作成
      if (status === '有効') {
        console.log('🔷 認証ユーザー作成開始');
        
        try {
          // 認証ユーザー作成（仮パスワード付き）
          const tempPassword = Math.random().toString(36).slice(-12) + 'A1!'; // 安全な仮パスワード
          
          const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email: existingApplication.email,
            password: tempPassword,
            email_confirm: true, // メール確認をスキップ
            user_metadata: {
              full_name: existingApplication.full_name,
              role: 'teacher',
            }
          });

          if (authError) {
            console.error('🔷 認証ユーザー作成エラー:', authError);
            throw new Error(`認証ユーザーの作成に失敗しました: ${authError.message}`);
          }

          // 講師テーブルのuser_idを更新
          const { error: userIdUpdateError } = await supabaseAdmin
            .from('teachers')
            .update({ user_id: authUser.user.id })
            .eq('id', applicationId);

          if (userIdUpdateError) {
            console.error('🔷 user_id更新エラー:', userIdUpdateError);
            
            // 認証ユーザーを削除してロールバック
            await supabaseAdmin.auth.admin.deleteUser(authUser.user.id);
            throw new Error(`ユーザーIDの更新に失敗しました: ${userIdUpdateError.message}`);
          }

          console.log('🔷 認証ユーザー作成成功:', authUser.user.id);

          // TODO: メール通知送信
          // - 承認通知メール（仮パスワード含む）
          // - 運営への承認完了通知

        } catch (authCreateError) {
          console.error('🔷 認証ユーザー作成処理エラー:', authCreateError);
          
          // ステータスを元に戻す
          await supabaseAdmin
            .from('teachers')
            .update({ 
              account_status: existingApplication.account_status,
              account_approval_date: null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', applicationId);

          throw authCreateError;
        }
      }

      // 拒否の場合の処理
      if (status === '無効') {
        console.log('🔷 申請拒否処理完了');
        
        // TODO: メール通知送信
        // - 拒否通知メール（理由含む）
        // - 運営への拒否完了通知
      }

      // 成功レスポンス
      const successMessage = status === '有効' 
        ? `${existingApplication.full_name}さんの申請を承認し、アカウントを作成しました`
        : `${existingApplication.full_name}さんの申請を拒否しました`;

      console.log('🔷 講師申請ステータス更新完了');

      return NextResponse.json<TeacherApplicationStatusUpdateResponse>({
        success: true,
        message: successMessage,
      });

    } catch (processingError) {
      console.error('🔷 処理中エラー:', processingError);
      throw processingError;
    }

  } catch (error) {
    console.error('🔷 ステータス更新API全般エラー:', error);
    
    const errorMessage = error instanceof Error ? error.message : '予期しないエラーが発生しました';
    
    return NextResponse.json<TeacherApplicationStatusUpdateResponse>(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}