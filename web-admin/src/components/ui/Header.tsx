'use client';

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useRef, useEffect } from "react";
import { LogoutConfirmDialog } from "@/components/ui/common/LogoutConfirmDialog";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHome, faUsers, faUserTie, faCalendarDays, faClipboardList, 
  faBullhorn, faChartLine, faPlus, faLink, faFileText,
  faChevronDown, faSignOutAlt, faBars
} from '@fortawesome/free-solid-svg-icons';

export default function Header() {
  const router = useRouter();
  const { user, loading, signOut, signOutLoading, signOutError, clearSignOutError } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // ドロップダウンの外側クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // ドロップダウンの開閉
  const handleDropdownToggle = (dropdown: string) => {
    setOpenDropdown(openDropdown === dropdown ? null : dropdown);
  };

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

  const navigationItems = [
    {
      label: 'ホーム',
      href: '/',
      icon: faHome,
      simple: true
    },
    {
      label: '生徒管理',
      icon: faUsers,
      dropdown: 'students',
      items: [
        { label: '生徒一覧', href: '/students', icon: faClipboardList },
        { label: '新規生徒登録', href: '/students/new', icon: faPlus },
        { label: 'やることリスト', href: '/todo-lists', icon: faClipboardList }
      ]
    },
    ...(user.role === 'admin' ? [{
      label: '講師管理',
      icon: faUserTie,
      dropdown: 'teachers',
      items: [
        { label: '講師一覧', href: '/teachers', icon: faClipboardList },
        { label: '講師申請管理', href: '/teacher-applications', icon: faFileText },
        { label: '担当割り当て', href: '/assignments', icon: faLink }
      ]
    }] : []),
    {
      label: 'スケジュール',
      href: '/schedule',
      icon: faCalendarDays,
      simple: true
    },
    {
      label: '申請管理',
      href: '/requests',
      icon: faClipboardList,
      simple: true
    },
    ...(user.role === 'admin' ? [{
      label: 'お知らせ',
      href: '/notifications',
      icon: faBullhorn,
      simple: true
    }] : []),
    ...(user.role === 'teacher' ? [{
      label: 'ダッシュボード',
      href: '/teacher-dashboard',
      icon: faChartLine,
      simple: true
    }] : [])
  ];

  return (
    <header className="bg-white shadow-lg border-b border-primary-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* ロゴ・タイトル */}
          <Link href="/" className="flex items-center space-x-3 group">
            <Image
              src="/logo.png"
              alt="東大伴走ロゴ"
              height={40}
              width={160}
              className="object-contain h-10 w-auto"
              priority
            />
            <span className="text-sm text-gray-400 font-medium border-l border-gray-200 pl-3">
              管理画面
            </span>
          </Link>

          {/* デスクトップナビゲーション */}
          <nav className="hidden lg:flex items-center space-x-2" ref={dropdownRef}>
            {navigationItems.map((item, index) => (
              <div key={index} className="relative">
                {item.simple ? (
                  <Link
                    href={item.href!}
                    className="px-3 py-2 rounded-lg text-gray-600 hover:text-primary-600 hover:bg-primary-50 transition-all duration-200 font-medium text-sm"
                  >
                    {item.label}
                  </Link>
                ) : (
                  <>
                    <button
                      onClick={() => handleDropdownToggle(item.dropdown!)}
                      className="flex items-center space-x-2 px-3 py-2 rounded-lg text-gray-600 hover:text-primary-600 hover:bg-primary-50 transition-all duration-200 font-medium text-sm"
                    >
                      <span>{item.label}</span>
                      <FontAwesomeIcon 
                        icon={faChevronDown} 
                        className={`w-3 h-3 transition-transform duration-200 ${
                          openDropdown === item.dropdown ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                    
                    {openDropdown === item.dropdown && (
                      <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-slide-in-up">
                        {item.items?.map((subItem, subIndex) => (
                          <Link
                            key={subIndex}
                            href={subItem.href}
                            onClick={() => setOpenDropdown(null)}
                            className="block px-4 py-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 transition-all duration-200 text-sm"
                          >
                            {subItem.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </nav>

          {/* ユーザーメニュー */}
          <div className="flex items-center space-x-4">
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg px-2 py-2 transition-all duration-200 hover:bg-primary-50"
              >
                <div className="text-right">
                  <div className="text-sm font-medium">{user.profile?.full_name || user.email}</div>
                  <div className="text-xs text-gray-500">
                    {user.role === 'admin' ? '運営者' : '講師'}
                  </div>
                </div>
                <FontAwesomeIcon 
                  icon={faChevronDown} 
                  className={`w-3 h-3 transition-transform duration-200 ${isMenuOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {/* ユーザードロップダウンメニュー */}
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-slide-in-up">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <div className="font-semibold text-gray-900">{user.profile?.full_name || user.email}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                    <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary-100 text-primary-700 mt-1">
                      {user.role === 'admin' ? '運営者' : '講師'}
                    </div>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={handleSignOutClick}
                      className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-error-50 hover:text-error-700 transition-colors"
                    >
                      <FontAwesomeIcon icon={faSignOutAlt} className="w-4 h-4 mr-3" />
                      ログアウト
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* モバイルメニューボタン */}
            <div className="lg:hidden">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-2 text-gray-600 hover:text-primary-600 hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg transition-all duration-200"
              >
                <FontAwesomeIcon icon={faBars} className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* モバイルナビゲーション */}
        {isMenuOpen && (
          <div className="lg:hidden border-t border-primary-100 py-4 bg-gray-50 rounded-b-xl">
            <div className="space-y-2 px-4">
              {navigationItems.map((item, index) => (
                <div key={index}>
                  {item.simple ? (
                    <Link
                      href={item.href!}
                      onClick={() => setIsMenuOpen(false)}
                      className="block px-4 py-3 text-gray-600 hover:text-primary-600 hover:bg-white rounded-lg transition-all duration-200 font-medium"
                    >
                      {item.label}
                    </Link>
                  ) : (
                    <div className="space-y-1">
                      <div className="px-4 py-2 text-gray-800 font-semibold text-sm">
                        {item.label}
                      </div>
                      <div className="ml-6 space-y-1">
                        {item.items?.map((subItem, subIndex) => (
                          <Link
                            key={subIndex}
                            href={subItem.href}
                            onClick={() => setIsMenuOpen(false)}
                            className="block px-6 py-2 text-gray-600 hover:text-primary-600 hover:bg-white rounded-lg transition-all duration-200 text-sm"
                          >
                            {subItem.label}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
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