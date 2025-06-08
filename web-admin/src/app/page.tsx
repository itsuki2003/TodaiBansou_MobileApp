'use client';

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/ui/Header";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabaseClient";

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

  const quickActions = [
    {
      title: "生徒管理",
      description: "生徒の情報管理・編集",
      href: "/students",
      icon: "👥",
      color: "primary",
      stats: `${stats.activeStudents}名在籍`
    },
    {
      title: "講師管理", 
      description: "講師アカウント・担当管理",
      href: "/teachers",
      icon: "👨‍🏫",
      color: "secondary",
      stats: `${stats.totalTeachers}名登録`
    },
    {
      title: "講師申請",
      description: "講師登録申請の確認・承認",
      href: "/teacher-applications",
      icon: "📝",
      color: "info",
      stats: "審査・承認"
    },
    {
      title: "スケジュール",
      description: "授業・面談の予定管理", 
      href: "/schedule",
      icon: "📅",
      color: "accent",
      stats: `今日${stats.todayLessons}件`
    },
    {
      title: "申請管理",
      description: "欠席・追加授業申請の確認",
      href: "/requests", 
      icon: "📋",
      color: "warning",
      stats: `${stats.pendingRequests}件未対応`
    },
    {
      title: "お知らせ",
      description: "生徒・保護者への通知管理",
      href: "/notifications",
      icon: "📢", 
      color: "info",
      stats: "配信管理"
    },
    {
      title: "やることリスト",
      description: "学習計画の作成・管理",
      href: "/students",
      icon: "✅",
      color: "success", 
      stats: "週間管理"
    }
  ];

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* ウェルカムセクション */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-8 text-white shadow-lg">
            <h1 className="text-3xl font-bold mb-2">
              東大伴走 管理画面
            </h1>
            <p className="text-primary-100 text-lg">
              中学受験生の学習をサポートする管理システム
            </p>
          </div>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <Card variant="elevated" className="text-center">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-primary-600 mb-2">
                {loading ? "..." : stats.activeStudents}
              </div>
              <div className="text-sm text-gray-600">在籍生徒数</div>
            </CardContent>
          </Card>
          
          <Card variant="elevated" className="text-center">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-secondary-600 mb-2">
                {loading ? "..." : stats.totalTeachers}
              </div>
              <div className="text-sm text-gray-600">講師数</div>
            </CardContent>
          </Card>

          <Card variant="elevated" className="text-center">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-success-600 mb-2">
                {loading ? "..." : stats.todayLessons}
              </div>
              <div className="text-sm text-gray-600">今日の授業</div>
            </CardContent>
          </Card>

          <Card variant="elevated" className="text-center">
            <CardContent className="p-6">
              <div className="text-3xl font-bold text-warning-600 mb-2">
                {loading ? "..." : stats.pendingRequests}
              </div>
              <div className="text-sm text-gray-600">未対応申請</div>
            </CardContent>
          </Card>
        </div>

        {/* クイックアクション */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">クイックアクション</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickActions.map((action, index) => (
              <Link key={index} href={action.href}>
                <Card 
                  variant="interactive" 
                  className="h-full group hover:border-primary-300 transition-all duration-300"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start space-x-4">
                      <div className="text-3xl">{action.icon}</div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">
                          {action.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {action.description}
                        </p>
                        <div className="text-xs text-primary-600 font-medium mt-2">
                          {action.stats}
                        </div>
                      </div>
                      <div className="text-primary-400 group-hover:text-primary-600 transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* クイックリンク */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">よく使う機能</h3>
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" size="sm" asChild>
                <Link href="/students/new">新規生徒登録</Link>
              </Button>
              <Button variant="secondary" size="sm" asChild>
                <Link href="/assignments">担当割り当て</Link>
              </Button>
              <Button variant="secondary" size="sm" asChild>
                <Link href="/teacher-dashboard">講師ダッシュボード</Link>
              </Button>
              <Button variant="accent" size="sm" asChild>
                <Link href="/schedule">スケジュール追加</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
