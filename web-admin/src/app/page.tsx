import Link from "next/link";
import Header from "@/components/ui/Header";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <Header />

      {/* メインコンテンツ */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">
              管理画面ダッシュボード
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
              {/* 生徒管理カード */}
              <Link href="/students">
                <div className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                  <div className="p-5">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 bg-blue-500 rounded-md flex items-center justify-center">
                          <span className="text-white font-semibold">生</span>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            生徒管理
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            生徒一覧・編集
                          </dd>
                        </dl>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-50 px-5 py-3">
                    <div className="text-sm">
                      <span className="font-medium text-blue-600 hover:text-blue-500">
                        生徒管理ページへ →
                      </span>
                    </div>
                  </div>
                </div>
              </Link>

              {/* 講師管理カード（プレースホルダー） */}
              <div className="bg-white overflow-hidden shadow rounded-lg opacity-50">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 bg-green-500 rounded-md flex items-center justify-center">
                        <span className="text-white font-semibold">講</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          講師管理
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          講師一覧・編集
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm">
                    <span className="font-medium text-gray-400">
                      準備中
                    </span>
                  </div>
                </div>
              </div>

              {/* やることリスト管理カード（プレースホルダー） */}
              <div className="bg-white overflow-hidden shadow rounded-lg opacity-50">
                <div className="p-5">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 bg-purple-500 rounded-md flex items-center justify-center">
                        <span className="text-white font-semibold">課</span>
                      </div>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                      <dl>
                        <dt className="text-sm font-medium text-gray-500 truncate">
                          やることリスト
                        </dt>
                        <dd className="text-lg font-medium text-gray-900">
                          課題管理・編集
                        </dd>
                      </dl>
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 px-5 py-3">
                  <div className="text-sm">
                    <span className="font-medium text-gray-400">
                      準備中
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
