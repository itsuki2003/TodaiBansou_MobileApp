'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const { signIn, user, loading: authLoading, mounted: authMounted } = useAuth();
  const router = useRouter();

  // クライアントサイドでマウント後に認証状態を確認
  useEffect(() => {
    setMounted(true);
  }, []);

  // ユーザーが存在する場合は常にリダイレクト（既存ログイン済み・新規ログイン成功両方対応）
  useEffect(() => {
    if (mounted && authMounted && user && !redirecting && !authLoading) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔐 ユーザー存在確認、リダイレクト開始', { 
          userId: user.id, 
          role: user.role,
          mounted, 
          authMounted, 
          redirecting, 
          authLoading 
        });
      }
      setRedirecting(true);
      
      // リダイレクト実行のログ
      if (process.env.NODE_ENV === 'development') {
        console.log('🔐 router.replace実行前');
      }
      
      try {
        // router.replaceを使ってブラウザ履歴を汚染しないようにする
        router.replace('/students');
        if (process.env.NODE_ENV === 'development') {
          console.log('🔐 router.replace実行成功');
        }
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('🔐 router.replaceエラー:', error);
        }
        // fallback: window.location.replaceを試す
        window.location.replace('/students');
      }
    }
  }, [mounted, authMounted, user, redirecting, authLoading, router]);

  // 初期ローディング中またはリダイレクト処理中の表示
  if (!mounted || !authMounted || authLoading || redirecting || user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">
            {redirecting ? 'リダイレクト中...' : user ? '既にログインしています。リダイレクト中...' : '認証状態を確認中...'}
          </p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 既にローディング中またはログイン済みの場合は重複実行を防ぐ
    if (loading || user || redirecting) {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔐 ログイン処理をスキップ（重複防止）:', { loading, hasUser: !!user, redirecting });
      }
      return;
    }

    setLoading(true);
    setError(null);

    if (process.env.NODE_ENV === 'development') {
      console.log('🔐 ログイン試行開始:', { email });
    }

    try {
      await signIn(email, password);
      if (process.env.NODE_ENV === 'development') {
        console.log('🔐 signIn成功、ユーザー状態変更を待機');
      }
      
      // ログイン成功後は、AuthContextのユーザー状態変更により、
      // useEffect で自動的にリダイレクトが実行される
      
    } catch (err: unknown) {
      if (process.env.NODE_ENV === 'development') {
        console.error('🔐 Login error:', err);
      }
      
      // Supabaseのエラーメッセージを日本語に変換
      let errorMessage = 'ログインに失敗しました。';
      
      const errorMsg = err instanceof Error ? err.message : String(err);
      
      if (errorMsg.includes('Invalid login credentials')) {
        errorMessage = 'メールアドレスまたはパスワードが正しくありません。';
      } else if (errorMsg.includes('Email not confirmed')) {
        errorMessage = 'メールアドレスが確認されていません。';
      } else if (errorMsg.includes('Too many requests')) {
        errorMessage = 'ログイン試行回数が多すぎます。しばらく時間をおいてからお試しください。';
      } else if (errorMsg.includes('User not found')) {
        errorMessage = 'このアカウントは管理画面へのアクセス権限がありません。';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold text-gray-900">
          東大伴走 管理画面
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          管理者・講師アカウントでログインしてください
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg rounded-lg sm:px-10 border border-gray-200">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">
                      ログインエラー
                    </h3>
                    <div className="mt-2 text-sm text-red-700">
                      <p>{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                メールアドレス
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="your-email@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                パスワード
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="パスワードを入力"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading || redirecting || !email || !password || !!user}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading || redirecting ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {redirecting ? 'リダイレクト中...' : 'ログイン中...'}
                  </div>
                ) : (
                  'ログイン'
                )}
              </button>
            </div>

            <div className="mt-6 text-center">
              <a
                href="#"
                className="text-sm text-blue-600 hover:text-blue-500"
                onClick={(e) => {
                  e.preventDefault();
                  alert('パスワードリセット機能は準備中です。管理者にお問い合わせください。');
                }}
              >
                パスワードをお忘れですか？
              </a>
            </div>
          </form>
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-gray-500">
            このページは管理者・講師専用です。<br />
            アクセス権限について不明な点は管理者にお問い合わせください。
          </p>
        </div>
      </div>
    </div>
  );
}