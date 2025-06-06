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
  const { signIn, user, loading: authLoading } = useAuth();
  const router = useRouter();

  // クライアントサイドでマウント後に認証状態を確認
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && user && !authLoading) {
      console.log('🔐 ユーザーが既にログイン済み、リダイレクト中...');
      // 3秒後に自動リダイレクト
      const timer = setTimeout(() => {
        window.location.href = '/students';
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [mounted, user, authLoading]);

  // マウント前やログイン済みの場合の表示
  if (!mounted || (mounted && user && !authLoading)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          {!mounted ? (
            <>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">読み込み中...</p>
            </>
          ) : (
            <>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="mb-4 text-gray-600">既にログインしています。3秒後に自動移動します...</p>
              <button
                onClick={() => window.location.href = '/students'}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                すぐに移動
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    console.log('🔐 ログイン試行開始:', { email });

    try {
      console.log('🔐 signIn関数を呼び出し中...');
      await signIn(email, password);
      console.log('🔐 signIn成功、/studentsにリダイレクト');
      // signIn成功後、直接/studentsに移動
      window.location.href = '/students';
    } catch (err: any) {
      console.error('🔐 Login error:', err);
      
      // Supabaseのエラーメッセージを日本語に変換
      let errorMessage = 'ログインに失敗しました。';
      
      if (err.message?.includes('Invalid login credentials')) {
        errorMessage = 'メールアドレスまたはパスワードが正しくありません。';
      } else if (err.message?.includes('Email not confirmed')) {
        errorMessage = 'メールアドレスが確認されていません。';
      } else if (err.message?.includes('Too many requests')) {
        errorMessage = 'ログイン試行回数が多すぎます。しばらく時間をおいてからお試しください。';
      } else if (err.message?.includes('User not found')) {
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
                disabled={loading || !email || !password}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ログイン中...
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