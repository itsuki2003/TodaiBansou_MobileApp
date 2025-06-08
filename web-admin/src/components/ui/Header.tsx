'use client';

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { LogoutConfirmDialog } from "@/components/ui/common/LogoutConfirmDialog";

export default function Header() {
  const router = useRouter();
  const { user, loading, signOut, signOutLoading, signOutError, clearSignOutError } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);

  // ログアウトボタンクリック時（確認ダイアログを表示）
  const handleSignOutClick = () => {
    setIsMenuOpen(false);
    setIsLogoutDialogOpen(true);
  };

  // 実際のログアウト処理（確認ダイアログから呼び出される）
  const handleSignOut = async () => {
    try {
      // エラーがある場合はクリア
      if (signOutError) {
        clearSignOutError();
      }

      console.log('🔓 Header: ログアウト処理開始');
      await signOut();
      
      console.log('🔓 Header: ログアウト成功、リダイレクト開始');
      
      // ログアウト成功時はログインページにリダイレクト
      router.push('/login');
      
      // ダイアログを閉じる
      setIsLogoutDialogOpen(false);
      
    } catch (error) {
      console.error('🔓 Header: ログアウトエラー:', error);
      // エラーは AuthContext で管理されるため、ここでは何もしない
      // ダイアログは開いたままにして、ユーザーが再試行できるようにする
    }
  };

  // ログアウトダイアログを閉じる
  const handleCloseLogoutDialog = () => {
    if (!signOutLoading) {
      setIsLogoutDialogOpen(false);
      // エラーがある場合はクリア
      if (signOutError) {
        clearSignOutError();
      }
    }
  };

  if (!user) {
    return null; // ログインしていない場合はヘッダーを表示しない
  }

  return (
    <header className="bg-white shadow-md border-b border-primary-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* ロゴ・タイトル */}
          <Link href="/students" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-lg flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-200">
              <span className="text-white font-bold text-lg">東</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary-700 group-hover:text-primary-600 transition-colors">
                東大伴走
              </h1>
              <span className="text-xs text-gray-500 font-medium">管理画面</span>
            </div>
          </Link>

          {/* ナビゲーション */}
          <nav className="hidden md:flex space-x-6">
            <Link 
              href="/students" 
              className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              生徒一覧
            </Link>
            <Link 
              href="/students/new" 
              className="text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              新規生徒登録
            </Link>
            <Link 
              href="/assignments" 
              className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              担当割り当て
            </Link>
            <Link 
              href="/schedule" 
              className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              スケジュール
            </Link>
            {user.role === 'teacher' && (
              <Link 
                href="/teacher-dashboard" 
                className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                ダッシュボード
              </Link>
            )}
            <Link 
              href="/requests" 
              className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              申請管理
            </Link>
            {user.role === 'admin' && (
              <>
                <Link 
                  href="/teachers" 
                  className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  講師管理
                </Link>
                <Link 
                  href="/teacher-applications" 
                  className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  講師申請
                </Link>
                <Link 
                  href="/notifications" 
                  className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  お知らせ
                </Link>
              </>
            )}
          </nav>

          {/* ユーザーメニュー */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-md px-3 py-2 transition-colors"
            >
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium">{user.profile?.full_name || user.email}</div>
                <div className="text-xs text-gray-500">
                  {user.role === 'admin' ? '運営者' : '講師'}
                </div>
              </div>
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-sm">
                <span className="text-white text-sm font-semibold">
                  {user.profile?.full_name ? user.profile.full_name.charAt(0) : user.email.charAt(0).toUpperCase()}
                </span>
              </div>
              <svg
                className={`w-4 h-4 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* ドロップダウンメニュー */}
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                  <div className="font-medium">{user.profile?.full_name || user.email}</div>
                  <div className="text-xs text-gray-500">{user.email}</div>
                </div>
                <button
                  onClick={handleSignOutClick}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                >
                  ログアウト
                </button>
              </div>
            )}
          </div>

          {/* モバイルメニューボタン */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md p-2"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* モバイルナビゲーション */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-gray-200 py-2">
            <Link 
              href="/students" 
              className="block px-3 py-2 text-gray-600 hover:text-gray-900 text-sm font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              生徒一覧
            </Link>
            <Link 
              href="/students/new" 
              className="block px-3 py-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              新規生徒登録
            </Link>
            <Link 
              href="/assignments" 
              className="block px-3 py-2 text-gray-600 hover:text-gray-900 text-sm font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              担当割り当て
            </Link>
            <Link 
              href="/schedule" 
              className="block px-3 py-2 text-gray-600 hover:text-gray-900 text-sm font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              スケジュール
            </Link>
            {user.role === 'teacher' && (
              <Link 
                href="/teacher-dashboard" 
                className="block px-3 py-2 text-gray-600 hover:text-gray-900 text-sm font-medium"
                onClick={() => setIsMenuOpen(false)}
              >
                ダッシュボード
              </Link>
            )}
            <Link 
              href="/requests" 
              className="block px-3 py-2 text-gray-600 hover:text-gray-900 text-sm font-medium"
              onClick={() => setIsMenuOpen(false)}
            >
              申請管理
            </Link>
            {user.role === 'admin' && (
              <>
                <Link 
                  href="/teachers" 
                  className="block px-3 py-2 text-gray-600 hover:text-gray-900 text-sm font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  講師管理
                </Link>
                <Link 
                  href="/teacher-applications" 
                  className="block px-3 py-2 text-gray-600 hover:text-gray-900 text-sm font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  講師申請
                </Link>
                <Link 
                  href="/notifications" 
                  className="block px-3 py-2 text-gray-600 hover:text-gray-900 text-sm font-medium"
                  onClick={() => setIsMenuOpen(false)}
                >
                  お知らせ
                </Link>
              </>
            )}
          </div>
        )}
      </div>
      
      {/* ログアウト確認ダイアログ */}
      <LogoutConfirmDialog
        isOpen={isLogoutDialogOpen}
        onClose={handleCloseLogoutDialog}
        onConfirm={handleSignOut}
        loading={signOutLoading}
        error={signOutError}
        userName={user.profile?.full_name}
      />
    </header>
  );
}