'use client';

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

export default function Header() {
  const { user, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  if (!user) {
    return null; // ログインしていない場合はヘッダーを表示しない
  }

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* ロゴ・タイトル */}
          <Link href="/students" className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900">東大伴走 管理画面</h1>
          </Link>

          {/* ナビゲーション */}
          <nav className="hidden md:flex space-x-6">
            <Link 
              href="/students" 
              className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              生徒一覧
            </Link>
            <Link 
              href="/students/new" 
              className="text-blue-600 hover:text-blue-700 px-3 py-2 rounded-md text-sm font-medium transition-colors"
            >
              新規生徒登録
            </Link>
            {user.role === 'admin' && (
              <>
                <Link 
                  href="/teachers" 
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors opacity-50 cursor-not-allowed"
                >
                  講師管理
                </Link>
                <Link 
                  href="/todo-lists" 
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors opacity-50 cursor-not-allowed"
                >
                  やることリスト
                </Link>
              </>
            )}
          </nav>

          {/* ユーザーメニュー */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="flex items-center space-x-2 text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-md px-3 py-2"
            >
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium">{user.profile?.full_name || user.email}</div>
                <div className="text-xs text-gray-500">
                  {user.role === 'admin' ? '運営者' : '講師'}
                </div>
              </div>
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
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
                  onClick={handleSignOut}
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
            {user.role === 'admin' && (
              <>
                <div className="block px-3 py-2 text-gray-400 text-sm font-medium opacity-50">
                  講師管理（準備中）
                </div>
                <div className="block px-3 py-2 text-gray-400 text-sm font-medium opacity-50">
                  やることリスト（準備中）
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </header>
  );
}