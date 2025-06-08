import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { TeacherApplicationListResponse } from '@/types/teacherApplication';

export async function GET(request: NextRequest) {
  try {
    console.log('🔷 講師申請一覧取得開始');

    // クエリパラメータ取得
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const searchQuery = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // ベースクエリ
    let query = supabaseAdmin
      .from('teachers')
      .select(`
        id,
        created_at,
        updated_at,
        full_name,
        furigana_name,
        email,
        phone_number,
        account_status,
        appeal_points,
        hobbies_special_skills,
        referrer_info,
        education_background_cram_school,
        education_background_middle_school,
        education_background_high_school,
        education_background_university,
        education_background_faculty,
        registration_application_date,
        account_approval_date,
        notes_admin_only,
        profile_formal_photo_url,
        profile_casual_photo_url
      `)
      .order('created_at', { ascending: false });

    // ステータスフィルタ
    if (status && status !== 'all') {
      query = query.eq('account_status', status);
    }

    // 検索フィルタ
    if (searchQuery) {
      query = query.or(`
        full_name.ilike.%${searchQuery}%,
        furigana_name.ilike.%${searchQuery}%,
        email.ilike.%${searchQuery}%,
        education_background_university.ilike.%${searchQuery}%
      `);
    }

    // ページネーション
    query = query.range(offset, offset + limit - 1);

    const { data: applications, error } = await query;

    if (error) {
      console.error('🔷 申請一覧取得エラー:', error);
      throw new Error(`申請一覧の取得に失敗しました: ${error.message}`);
    }

    // 総件数取得（フィルタ条件付き）
    let countQuery = supabaseAdmin
      .from('teachers')
      .select('id', { count: 'exact', head: true });

    if (status && status !== 'all') {
      countQuery = countQuery.eq('account_status', status);
    }

    if (searchQuery) {
      countQuery = countQuery.or(`
        full_name.ilike.%${searchQuery}%,
        furigana_name.ilike.%${searchQuery}%,
        email.ilike.%${searchQuery}%,
        education_background_university.ilike.%${searchQuery}%
      `);
    }

    const { count: totalCount, error: countError } = await countQuery;

    if (countError) {
      console.warn('🔷 件数取得エラー:', countError);
    }

    console.log(`🔷 申請一覧取得成功: ${applications.length}件`);

    return NextResponse.json<TeacherApplicationListResponse>({
      success: true,
      data: applications,
      total: totalCount || applications.length,
    });

  } catch (error) {
    console.error('🔷 申請一覧API全般エラー:', error);
    
    const errorMessage = error instanceof Error ? error.message : '予期しないエラーが発生しました';
    
    return NextResponse.json<TeacherApplicationListResponse>(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}