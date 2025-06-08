'use client';

import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* ロゴ */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-lg">東</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-blue-700">東大伴走</h1>
                <span className="text-xs text-gray-500">中学受験個別指導</span>
              </div>
            </div>

            {/* ナビゲーション */}
            <nav className="flex space-x-6">
              <Link 
                href="/login"
                className="text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                ログイン
              </Link>
              <Link 
                href="/teacher-application"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
              >
                講師登録申請
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* ヒーローセクション */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            中学受験生の
            <span className="text-blue-600">「自走型」学習</span>
            を支援
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            東大生による個別指導で、小学5〜6年生の中学受験をサポート。<br />
            生徒の自立的な学習習慣を育み、保護者の負担を軽減します。
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/login"
              className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-medium transition-colors shadow-md"
            >
              管理画面ログイン
            </Link>
            <Link 
              href="/teacher-application"
              className="bg-white hover:bg-gray-50 text-blue-600 border-2 border-blue-600 px-8 py-3 rounded-lg text-lg font-medium transition-colors"
            >
              講師として参加する
            </Link>
          </div>
        </div>

        {/* 講師募集セクション */}
        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-12 mb-16">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-gray-900 mb-4">
              講師募集中
            </h3>
            <p className="text-lg text-gray-600">
              中学受験生の成長をサポートする東大生講師を募集しています
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👨‍🏫</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">個別指導</h4>
              <p className="text-gray-600 text-sm">
                生徒一人ひとりに寄り添った<br />
                丁寧な指導を提供
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⏰</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">柔軟なスケジュール</h4>
              <p className="text-gray-600 text-sm">
                学業との両立がしやすい<br />
                フレキシブルな勤務時間
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎯</span>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">成長実感</h4>
              <p className="text-gray-600 text-sm">
                生徒の成長を身近で感じられる<br />
                やりがいのある仕事
              </p>
            </div>
          </div>

          <div className="text-center">
            <Link 
              href="/teacher-application"
              className="inline-flex items-center bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg text-lg font-medium transition-colors shadow-md"
            >
              講師登録申請フォームへ
              <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* 応募条件 */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-8 md:p-12">
          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">応募条件</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">基本条件</h4>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  東京大学在学中または卒業生
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  中学受験の経験がある方（推奨）
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  小学生への指導に情熱のある方
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  週1回以上の継続指導が可能な方
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">歓迎条件</h4>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">◎</span>
                  塾講師・家庭教師の経験
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">◎</span>
                  SAPIX・日能研等の大手塾出身
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">◎</span>
                  オンライン指導の経験
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2">◎</span>
                  教育への強い関心
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-600 mb-4">
              詳しい条件や待遇については、申請後にご案内いたします
            </p>
            <Link 
              href="/teacher-application"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors"
            >
              今すぐ申請する
            </Link>
          </div>
        </div>
      </main>

      {/* フッター */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold">東</span>
              </div>
              <span className="text-xl font-bold">東大伴走</span>
            </div>
            <p className="text-gray-400 text-sm">
              中学受験生の「自走型」学習を支援する個別指導サービス
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}