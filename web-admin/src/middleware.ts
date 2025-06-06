import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  console.log('🚨 Middleware実行:', request.nextUrl.pathname);
  
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({
            name,
            value: '',
            ...options,
          });
        },
      },
    }
  );

  // セッション確認
  const { data: { session } } = await supabase.auth.getSession();
  console.log('🚨 セッション確認結果:', !!session);

  // ログインページへのアクセスの場合
  if (request.nextUrl.pathname === '/login') {
    console.log('🚨 ログインページアクセス、セッション:', !!session);
    // 既にログインしている場合はリダイレクト
    if (session) {
      console.log('🚨 ログイン済み、/studentsにリダイレクト');
      return NextResponse.redirect(new URL('/students', request.url));
    }
    console.log('🚨 未ログイン、ログインページ表示');
    return response;
  }

  // 保護されたページへのアクセスの場合
  if (!session) {
    console.log('🚨 セッションなし、/loginにリダイレクト');
    // セッションがない場合はログインページにリダイレクト
    return NextResponse.redirect(new URL('/login', request.url));
  }

  console.log('🚨 セッションあり、権限確認へ');

  // セッションがある場合、ユーザーの権限確認
  try {
    const userId = session.user.id;
    console.log('🚨 権限確認開始:', userId);

    // administrators テーブルを確認
    const { data: adminData } = await supabase
      .from('administrators')
      .select('account_status')
      .eq('user_id', userId)
      .eq('account_status', '有効')
      .single();

    console.log('🚨 管理者確認結果:', !!adminData);

    if (adminData) {
      console.log('🚨 管理者として認証OK');
      return response; // 管理者として認証済み
    }

    // teachers テーブルを確認
    const { data: teacherData } = await supabase
      .from('teachers')
      .select('account_status')
      .eq('user_id', userId)
      .eq('account_status', '有効')
      .single();

    console.log('🚨 講師確認結果:', !!teacherData);

    if (teacherData) {
      console.log('🚨 講師として認証OK');
      return response; // 講師として認証済み
    }

    // どちらでもない場合はアクセス拒否
    console.warn('🚨 権限なし、ログインページにリダイレクト');
    return NextResponse.redirect(new URL('/login', request.url));
  } catch (error) {
    console.error('🚨 Middleware error:', error);
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: [
    // 一時的にミドルウェアを無効化（クライアントサイド認証テスト用）
    // '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};