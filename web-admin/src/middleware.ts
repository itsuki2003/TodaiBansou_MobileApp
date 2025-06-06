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
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: { [key: string]: unknown }) {
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
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (process.env.NODE_ENV === 'development') {
    console.log('🚨 ミドルウェア セッション確認結果:', !!session, session ? session.user.id : 'no user');
    if (sessionError) {
      console.error('🚨 セッション取得エラー:', sessionError);
    }
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
    if (process.env.NODE_ENV === 'development') {
      console.log('🚨 セッションなし、ログインページにリダイレクト');
    }
    const redirectResponse = NextResponse.redirect(new URL('/login', request.url));
    redirectResponse.headers.set('Cache-Control', 'no-cache, no-store, max-age=0, must-revalidate');
    redirectResponse.headers.set('Pragma', 'no-cache');
    redirectResponse.headers.set('Expires', '0');
    return redirectResponse;
  }

  // セッションがある場合は基本的に通す（詳細な権限確認はクライアントサイドで実行）
  if (process.env.NODE_ENV === 'development') {
    console.log('🚨 セッションあり、アクセス許可');
  }
  
  return response;
}

export const config = {
  matcher: [
    /*
     * 一時的にミドルウェアを無効化
     * クッキー読み取り問題を解決するため
     */
    // 何もマッチしないパターンで無効化
    '/middleware-disabled',
  ],
};