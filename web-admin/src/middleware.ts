import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  if (process.env.NODE_ENV === 'development') {
    console.log('🚨 Middleware実行:', request.nextUrl.pathname);
  }
  
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
        set(name: string, value: string, options: { [key: string]: unknown }) {
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
        remove(name: string, options: { [key: string]: unknown }) {
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
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🚨 ミドルウェア セッション確認結果:', !!session, session ? session.user.id : 'no user');
  }

  // ルートパス（/）へのアクセスの場合
  if (request.nextUrl.pathname === '/') {
    if (session) {
      return NextResponse.redirect(new URL('/students', request.url));
    } else {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // 保護されたページへのアクセスの場合
  if (!session) {
    // セッションがない場合はログインページにリダイレクト
    // ログアウト後のクリーンなリダイレクトのためにキャッシュを無効化
    const redirectResponse = NextResponse.redirect(new URL('/login', request.url));
    redirectResponse.headers.set('Cache-Control', 'no-cache, no-store, max-age=0, must-revalidate');
    redirectResponse.headers.set('Pragma', 'no-cache');
    redirectResponse.headers.set('Expires', '0');
    return redirectResponse;
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('🚨 セッションあり、権限確認へ');
  }

  // セッションがある場合、ユーザーの権限確認
  try {
    const userId = session.user.id;
    if (process.env.NODE_ENV === 'development') {
      console.log('🚨 権限確認開始:', userId);
    }

    // administrators テーブルを確認
    const { data: adminData } = await supabase
      .from('administrators')
      .select('account_status')
      .eq('user_id', userId)
      .eq('account_status', '有効')
      .single();

    if (process.env.NODE_ENV === 'development') {
      console.log('🚨 管理者確認結果:', !!adminData);
    }

    if (adminData) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🚨 管理者として認証OK');
      }
      return response; // 管理者として認証済み
    }

    // teachers テーブルを確認
    const { data: teacherData } = await supabase
      .from('teachers')
      .select('account_status')
      .eq('user_id', userId)
      .eq('account_status', '有効')
      .single();

    if (process.env.NODE_ENV === 'development') {
      console.log('🚨 講師確認結果:', !!teacherData);
    }

    if (teacherData) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🚨 講師として認証OK');
      }
      return response; // 講師として認証済み
    }

    // どちらでもない場合はアクセス拒否
    if (process.env.NODE_ENV === 'development') {
      console.warn('🚨 権限なし、ログインページにリダイレクト');
    }
    // 権限がない場合もキャッシュを無効化してリダイレクト
    const redirectResponse = NextResponse.redirect(new URL('/login', request.url));
    redirectResponse.headers.set('Cache-Control', 'no-cache, no-store, max-age=0, must-revalidate');
    redirectResponse.headers.set('Pragma', 'no-cache');
    redirectResponse.headers.set('Expires', '0');
    return redirectResponse;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 Middleware error:', error);
    }
    // エラー時もキャッシュを無効化してリダイレクト
    const redirectResponse = NextResponse.redirect(new URL('/login', request.url));
    redirectResponse.headers.set('Cache-Control', 'no-cache, no-store, max-age=0, must-revalidate');
    redirectResponse.headers.set('Pragma', 'no-cache');
    redirectResponse.headers.set('Expires', '0');
    return redirectResponse;
  }
}

export const config = {
  matcher: [
    /*
     * 以下のパスを除くすべてのリクエストに対してミドルウェアを実行:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - login (ログインページは完全に除外)
     * - 画像ファイル (svg, png, jpg, jpeg, gif, webp)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|login|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};