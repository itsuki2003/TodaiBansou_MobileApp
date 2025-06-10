'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import PageHeader from '@/components/ui/PageHeader';
import { TeacherDashboardData, QuickAction } from '@/types/teacher';
import TeacherProfile from './components/TeacherProfile';
import AssignedStudents from './components/AssignedStudents';
import UpcomingLessons from './components/UpcomingLessons';
import QuickActions from './components/QuickActions';
import { useTeacherData } from './hooks/useTeacherData';

export default function TeacherDashboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'students' | 'lessons' | 'profile'>('overview');
  
  const {
    dashboardData,
    loading,
    error,
    updateProfile,
    refreshData
  } = useTeacherData(user?.role === 'teacher' ? user.id : undefined);

  // クイックアクション定義
  const quickActions: QuickAction[] = [
    {
      id: 'view-schedule',
      title: '授業スケジュール',
      description: '今週の授業予定を確認',
      icon: 'calendar',
      href: '/schedule',
      color: 'blue'
    },
    {
      id: 'manage-todos',
      title: 'やることリスト',
      description: '生徒の課題を管理',
      icon: 'checklist',
      href: '/students',
      color: 'green'
    },
    {
      id: 'view-requests',
      title: '申請確認',
      description: '欠席・追加授業申請',
      icon: 'document',
      href: '/requests',
      color: 'orange'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">ダッシュボードを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="rounded-md bg-red-50 p-4 max-w-md">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  エラーが発生しました
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
                <div className="mt-4">
                  <button
                    onClick={refreshData}
                    className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
                  >
                    再試行
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            講師情報が見つかりません
          </h3>
          <p className="text-gray-600">
            システム管理者にお問い合わせください。
          </p>
        </div>
      </div>
    );
  }

  const { teacher, assignedStudents, upcomingLessons, weeklyStats } = dashboardData;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader
          title="講師ダッシュボード"
          description={`${teacher.full_name}さん、お疲れさまです`}
          icon="🎓"
          colorTheme="primary"
          actions={
            <div className="text-sm text-white/90">
              最終ログイン: {new Date().toLocaleDateString('ja-JP')}
            </div>
          }
        />
      </div>

      {/* タブナビゲーション */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mt-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', name: '概要', icon: 'home' },
                { id: 'students', name: '担当生徒', icon: 'users' },
                { id: 'lessons', name: '授業予定', icon: 'calendar' },
                { id: 'profile', name: 'プロフィール', icon: 'user' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center`}
                >
                  <span className="mr-2">
                    {tab.icon === 'home' && '🏠'}
                    {tab.icon === 'users' && '👥'}
                    {tab.icon === 'calendar' && '📅'}
                    {tab.icon === 'user' && '👤'}
                  </span>
                  {tab.name}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* メインコンテンツ */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* 統計カード */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 bg-blue-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm font-bold">📚</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          今週の授業
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {weeklyStats.totalLessons}件
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 bg-green-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm font-bold">✅</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          実施済み
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {weeklyStats.completedLessons}件
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 bg-yellow-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm font-bold">⏰</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          予定
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {weeklyStats.upcomingLessons}件
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 bg-red-500 rounded-md flex items-center justify-center">
                        <span className="text-white text-sm font-bold">❌</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          担当生徒
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          {assignedStudents.length}名
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* クイックアクション */}
            <QuickActions actions={quickActions} />

            {/* 直近の授業予定 */}
            <div className="bg-white shadow rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  直近の授業予定
                </h3>
              </div>
              <UpcomingLessons 
                lessons={upcomingLessons.slice(0, 5)}
                showAll={false}
              />
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <AssignedStudents 
            students={assignedStudents}
            onRefresh={refreshData}
          />
        )}

        {activeTab === 'lessons' && (
          <UpcomingLessons 
            lessons={upcomingLessons}
            showAll={true}
          />
        )}

        {activeTab === 'profile' && (
          <TeacherProfile 
            teacher={teacher}
            onUpdate={updateProfile}
            onRefresh={refreshData}
          />
        )}
      </div>
    </div>
  );
}