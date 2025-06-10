'use client';

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/ui/Header";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabaseClient";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faTarget, faUsers, faUserTie, faCalendarDays, faClipboardList,
  faBullhorn, faChartLine, faPlus, faLink, faFileText, faCog,
  faBolt, faArrowRight
} from '@fortawesome/free-solid-svg-icons';

interface DashboardStats {
  totalStudents: number;
  activeStudents: number;
  totalTeachers: number;
  pendingRequests: number;
  todayLessons: number;
}

export default function Home() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    activeStudents: 0,
    totalTeachers: 0,
    pendingRequests: 0,
    todayLessons: 0,
  });
  const [loading, setLoading] = useState(true);

  // 認証状態チェック
  useEffect(() => {
    if (!authLoading && !user) {
      // 未認証の場合はランディングページにリダイレクト
      router.push('/landing');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      fetchDashboardStats();
    }
  }, [user]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      
      // 並行してデータを取得
      const [studentsData, teachersData, requestsData, lessonsData] = await Promise.all([
        supabase.from('students').select('id, status'),
        supabase.from('teachers').select('id, account_status'),
        supabase.from('absence_requests').select('id, status').eq('status', '未振替'),
        supabase.from('lesson_slots').select('id').eq('slot_date', new Date().toISOString().split('T')[0])
      ]);

      const totalStudents = studentsData.data?.length || 0;
      const activeStudents = studentsData.data?.filter(s => s.status === '在籍中').length || 0;
      const totalTeachers = teachersData.data?.filter(t => t.account_status === '有効').length || 0;
      const pendingRequests = requestsData.data?.length || 0;
      const todayLessons = lessonsData.data?.length || 0;

      setStats({
        totalStudents,
        activeStudents,
        totalTeachers,
        pendingRequests,
        todayLessons,
      });
    } catch (error) {
      console.error('Dashboard stats fetch error:', error);
    } finally {
      setLoading(false);
    }
  };


  // 認証中またはリダイレクト処理中
  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
      <Header />

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* ウェルカムセクション */}
        <div className="mb-12">
          <div className="relative overflow-hidden bg-gradient-to-r from-primary-600 via-primary-700 to-primary-800 rounded-3xl p-8 lg:p-12 text-white shadow-2xl">
            {/* 背景装飾 */}
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-accent-400 rounded-full opacity-20 blur-xl"></div>
            <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-accent-300 rounded-full opacity-10 blur-2xl"></div>
            
            <div className="relative">
              <div className="mb-6">
                <h1 className="text-4xl font-bold mb-4 text-white">
                  東大伴走 管理画面
                </h1>
                <p className="text-white/90 text-xl">
                  中学受験生の学習をサポートする統合管理システム
                </p>
              </div>
              
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center space-x-2 bg-white/10 rounded-lg px-3 py-1 backdrop-blur-sm">
                  <span className="w-2 h-2 bg-accent-400 rounded-full animate-pulse"></span>
                  <span className="text-white">リアルタイム管理</span>
                </div>
                <div className="flex items-center space-x-2 bg-white/10 rounded-lg px-3 py-1 backdrop-blur-sm">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <span className="text-white">システム正常稼働中</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <div className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-primary-200 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                <FontAwesomeIcon icon={faUsers} className="text-white text-xl" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary-600 group-hover:text-primary-700 transition-colors">
                  {loading ? (
                    <div className="animate-pulse bg-gray-200 rounded h-8 w-12"></div>
                  ) : stats.activeStudents}
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-600 font-medium">在籍生徒数</div>
            <div className="text-xs text-gray-400 mt-1">前月比 +5%</div>
          </div>
          
          <div className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-secondary-200 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                <FontAwesomeIcon icon={faUserTie} className="text-white text-xl" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-secondary-600 group-hover:text-secondary-700 transition-colors">
                  {loading ? (
                    <div className="animate-pulse bg-gray-200 rounded h-8 w-12"></div>
                  ) : stats.totalTeachers}
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-600 font-medium">講師数</div>
            <div className="text-xs text-gray-400 mt-1">全員活動中</div>
          </div>

          <div className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-success-200 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-success-500 to-success-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                <FontAwesomeIcon icon={faCalendarDays} className="text-white text-xl" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-success-600 group-hover:text-success-700 transition-colors">
                  {loading ? (
                    <div className="animate-pulse bg-gray-200 rounded h-8 w-12"></div>
                  ) : stats.todayLessons}
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-600 font-medium">今日の授業</div>
            <div className="text-xs text-gray-400 mt-1">予定通り進行中</div>
          </div>

          <div className="group bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-warning-200 hover:-translate-y-1">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-warning-500 to-warning-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-300">
                <FontAwesomeIcon icon={faClipboardList} className="text-white text-xl" />
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-warning-600 group-hover:text-warning-700 transition-colors">
                  {loading ? (
                    <div className="animate-pulse bg-gray-200 rounded h-8 w-12"></div>
                  ) : stats.pendingRequests}
                </div>
              </div>
            </div>
            <div className="text-sm text-gray-600 font-medium">未対応申請</div>
            <div className="text-xs text-gray-400 mt-1">要確認</div>
          </div>
        </div>

        {/* メイン機能セクション */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* 生徒管理 */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center">
                <FontAwesomeIcon icon={faUsers} className="text-white text-lg" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">生徒管理</h3>
            </div>
            <div className="space-y-3">
              <Link 
                href="/students"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-primary-50 transition-all duration-200 group"
              >
                <div className="flex items-center space-x-3">
                  <FontAwesomeIcon icon={faClipboardList} className="text-lg text-gray-600 group-hover:text-primary-600" />
                  <span className="font-medium text-gray-700 group-hover:text-primary-600">生徒一覧</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">{stats.activeStudents}名</span>
                  <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4 text-gray-400 group-hover:text-primary-500" />
                </div>
              </Link>
              <Link 
                href="/students/new"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-primary-50 transition-all duration-200 group"
              >
                <div className="flex items-center space-x-3">
                  <FontAwesomeIcon icon={faPlus} className="text-lg text-gray-600 group-hover:text-primary-600" />
                  <span className="font-medium text-gray-700 group-hover:text-primary-600">新規生徒登録</span>
                </div>
                <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4 text-gray-400 group-hover:text-primary-500" />
              </Link>
              <Link 
                href="/todo-lists"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-primary-50 transition-all duration-200 group"
              >
                <div className="flex items-center space-x-3">
                  <FontAwesomeIcon icon={faClipboardList} className="text-lg text-gray-600 group-hover:text-primary-600" />
                  <span className="font-medium text-gray-700 group-hover:text-primary-600">やることリスト</span>
                </div>
                <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4 text-gray-400 group-hover:text-primary-500" />
              </Link>
            </div>
          </div>

          {/* スケジュール・申請管理 */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-success-500 to-success-600 rounded-xl flex items-center justify-center">
                <FontAwesomeIcon icon={faCalendarDays} className="text-white text-lg" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">スケジュール</h3>
            </div>
            <div className="space-y-3">
              <Link 
                href="/schedule"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-success-50 transition-all duration-200 group"
              >
                <div className="flex items-center space-x-3">
                  <FontAwesomeIcon icon={faCalendarDays} className="text-lg text-gray-600 group-hover:text-success-600" />
                  <span className="font-medium text-gray-700 group-hover:text-success-600">授業スケジュール</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">今日{stats.todayLessons}件</span>
                  <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4 text-gray-400 group-hover:text-success-500" />
                </div>
              </Link>
              <Link 
                href="/requests"
                className="flex items-center justify-between p-3 rounded-xl hover:bg-warning-50 transition-all duration-200 group"
              >
                <div className="flex items-center space-x-3">
                  <FontAwesomeIcon icon={faClipboardList} className="text-lg text-gray-600 group-hover:text-warning-600" />
                  <span className="font-medium text-gray-700 group-hover:text-warning-600">申請管理</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">{stats.pendingRequests}件未対応</span>
                  <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4 text-gray-400 group-hover:text-warning-500" />
                </div>
              </Link>
              {user.role === 'teacher' && (
                <Link 
                  href="/teacher-dashboard"
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary-50 transition-all duration-200 group"
                >
                  <div className="flex items-center space-x-3">
                    <FontAwesomeIcon icon={faChartLine} className="text-lg text-gray-600 group-hover:text-secondary-600" />
                    <span className="font-medium text-gray-700 group-hover:text-secondary-600">講師ダッシュボード</span>
                  </div>
                  <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4 text-gray-400 group-hover:text-secondary-500" />
                </Link>
              )}
            </div>
          </div>

          {/* 管理者専用機能 */}
          {user.role === 'admin' && (
            <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-xl flex items-center justify-center">
                  <FontAwesomeIcon icon={faCog} className="text-white text-lg" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">管理者機能</h3>
              </div>
              <div className="space-y-3">
                <Link 
                  href="/teachers"
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary-50 transition-all duration-200 group"
                >
                  <div className="flex items-center space-x-3">
                    <FontAwesomeIcon icon={faUserTie} className="text-lg text-gray-600 group-hover:text-secondary-600" />
                    <span className="font-medium text-gray-700 group-hover:text-secondary-600">講師管理</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500">{stats.totalTeachers}名</span>
                    <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4 text-gray-400 group-hover:text-secondary-500" />
                  </div>
                </Link>
                <Link 
                  href="/teacher-applications"
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary-50 transition-all duration-200 group"
                >
                  <div className="flex items-center space-x-3">
                    <FontAwesomeIcon icon={faFileText} className="text-lg text-gray-600 group-hover:text-secondary-600" />
                    <span className="font-medium text-gray-700 group-hover:text-secondary-600">講師申請</span>
                  </div>
                  <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4 text-gray-400 group-hover:text-secondary-500" />
                </Link>
                <Link 
                  href="/assignments"
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary-50 transition-all duration-200 group"
                >
                  <div className="flex items-center space-x-3">
                    <FontAwesomeIcon icon={faLink} className="text-lg text-gray-600 group-hover:text-secondary-600" />
                    <span className="font-medium text-gray-700 group-hover:text-secondary-600">担当割り当て</span>
                  </div>
                  <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4 text-gray-400 group-hover:text-secondary-500" />
                </Link>
                <Link 
                  href="/notifications"
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-secondary-50 transition-all duration-200 group"
                >
                  <div className="flex items-center space-x-3">
                    <FontAwesomeIcon icon={faBullhorn} className="text-lg text-gray-600 group-hover:text-secondary-600" />
                    <span className="font-medium text-gray-700 group-hover:text-secondary-600">お知らせ</span>
                  </div>
                  <FontAwesomeIcon icon={faArrowRight} className="w-4 h-4 text-gray-400 group-hover:text-secondary-500" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* クイックアクション */}
        <div className="bg-gradient-to-r from-accent-100 to-accent-50 rounded-2xl p-8 border border-accent-200">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-8 h-8 bg-accent-500 rounded-lg flex items-center justify-center">
              <FontAwesomeIcon icon={faBolt} className="text-gray-900 text-lg" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">クイックアクション</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <button className="bg-white hover:bg-accent-50 rounded-xl p-4 text-center transition-all duration-200 border border-accent-200 hover:border-accent-300 hover:shadow-md">
              <Link href="/students/new" className="block">
                <div className="text-2xl mb-2">
                  <FontAwesomeIcon icon={faPlus} className="text-gray-600" />
                </div>
                <div className="text-sm font-medium text-gray-700">新規登録</div>
              </Link>
            </button>
            <button className="bg-white hover:bg-accent-50 rounded-xl p-4 text-center transition-all duration-200 border border-accent-200 hover:border-accent-300 hover:shadow-md">
              <Link href="/schedule" className="block">
                <div className="text-2xl mb-2">
                  <FontAwesomeIcon icon={faCalendarDays} className="text-gray-600" />
                </div>
                <div className="text-sm font-medium text-gray-700">スケジュール</div>
              </Link>
            </button>
            <button className="bg-white hover:bg-accent-50 rounded-xl p-4 text-center transition-all duration-200 border border-accent-200 hover:border-accent-300 hover:shadow-md">
              <Link href="/requests" className="block">
                <div className="text-2xl mb-2">
                  <FontAwesomeIcon icon={faClipboardList} className="text-gray-600" />
                </div>
                <div className="text-sm font-medium text-gray-700">申請確認</div>
              </Link>
            </button>
            <button className="bg-white hover:bg-accent-50 rounded-xl p-4 text-center transition-all duration-200 border border-accent-200 hover:border-accent-300 hover:shadow-md">
              <Link href="/notifications" className="block">
                <div className="text-2xl mb-2">
                  <FontAwesomeIcon icon={faBullhorn} className="text-gray-600" />
                </div>
                <div className="text-sm font-medium text-gray-700">お知らせ</div>
              </Link>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
