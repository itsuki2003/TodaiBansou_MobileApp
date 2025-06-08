'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Header from '@/components/ui/Header';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import LoadingState from '@/components/ui/common/LoadingState';
import ErrorState from '@/components/ui/common/ErrorState';
import EmptyState from '@/components/ui/common/EmptyState';
import { TeacherApplicationListItem, TeacherApplicationFilters } from '@/types/teacherApplication';

export default function TeacherApplicationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [applications, setApplications] = useState<TeacherApplicationListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | '承認待ち' | '有効' | '無効'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<TeacherApplicationListItem | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // 認証チェック
  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // 申請一覧取得
  useEffect(() => {
    if (user && user.role === 'admin') {
      fetchApplications();
    }
  }, [user]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/teacher-applications/list');
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '申請一覧の取得に失敗しました');
      }

      setApplications(result.data || []);
    } catch (error) {
      console.error('申請一覧取得エラー:', error);
      setError(error instanceof Error ? error.message : '予期しないエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // 承認/拒否処理
  const handleStatusUpdate = async (applicationId: string, newStatus: '有効' | '無効', reason?: string) => {
    try {
      setProcessingId(applicationId);
      
      const response = await fetch('/api/teacher-applications/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId,
          status: newStatus,
          reason
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'ステータス更新に失敗しました');
      }

      // 一覧を再取得
      await fetchApplications();
      setSelectedApplication(null);
      
    } catch (error) {
      console.error('ステータス更新エラー:', error);
      setError(error instanceof Error ? error.message : '予期しないエラーが発生しました');
    } finally {
      setProcessingId(null);
    }
  };

  // フィルタリング
  const filteredApplications = applications.filter(app => {
    // ステータスフィルタ
    if (statusFilter !== 'all' && app.account_status !== statusFilter) {
      return false;
    }

    // 検索クエリフィルタ
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        app.full_name.toLowerCase().includes(query) ||
        app.furigana_name.toLowerCase().includes(query) ||
        app.email.toLowerCase().includes(query) ||
        (app.education_background_university && app.education_background_university.toLowerCase().includes(query))
      );
    }

    return true;
  });

  // 認証中
  if (authLoading || !user) {
    return <LoadingState />;
  }

  // 権限なし
  if (user.role !== 'admin') {
    return <ErrorState message="この機能にアクセスする権限がありません" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />
      
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* ページヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            講師登録申請一覧
          </h1>
          <p className="text-gray-600">
            講師からの登録申請を確認・承認・拒否できます
          </p>
        </div>

        {/* フィルタ・検索 */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              {/* ステータスフィルタ */}
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ステータス
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">すべて</option>
                  <option value="承認待ち">承認待ち</option>
                  <option value="有効">承認済み</option>
                  <option value="無効">拒否済み</option>
                </select>
              </div>

              {/* 検索 */}
              <div className="flex-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  検索
                </label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="氏名、メールアドレス、大学名で検索..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* 統計 */}
              <div className="flex-1 text-sm text-gray-600 flex items-end">
                <div>
                  <p>全{applications.length}件</p>
                  <p>承認待ち{applications.filter(a => a.account_status === '承認待ち').length}件</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* エラー表示 */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="text-red-600 text-sm">{error}</div>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* 申請一覧 */}
        {loading ? (
          <LoadingState />
        ) : filteredApplications.length === 0 ? (
          searchQuery || statusFilter !== 'all' ? (
            <EmptyState
              title="該当する申請がありません"
              description="検索条件を変更してお試しください"
            />
          ) : (
            <EmptyState
              title="講師登録申請がありません"
              description="申請があると、こちらに表示されます"
            />
          )
        ) : (
          <div className="space-y-4">
            {filteredApplications.map((application) => (
              <Card key={application.id} variant="interactive">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {application.full_name}
                        </h3>
                        <span className="text-sm text-gray-500">
                          ({application.furigana_name})
                        </span>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${
                            application.account_status === '承認待ち'
                              ? 'bg-yellow-100 text-yellow-800'
                              : application.account_status === '有効'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {application.account_status}
                        </span>
                      </div>

                      <div className="text-sm text-gray-600 space-y-1">
                        <p>📧 {application.email}</p>
                        {application.phone_number && (
                          <p>📱 {application.phone_number}</p>
                        )}
                        {application.education_background_university && (
                          <p>🎓 {application.education_background_university}</p>
                        )}
                        <p>📅 申請日: {application.registration_application_date}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedApplication(application)}
                      >
                        詳細確認
                      </Button>
                      
                      {application.account_status === '承認待ち' && (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleStatusUpdate(application.id, '有効')}
                            disabled={processingId === application.id}
                          >
                            {processingId === application.id ? '処理中...' : '承認'}
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleStatusUpdate(application.id, '無効')}
                            disabled={processingId === application.id}
                          >
                            拒否
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* 詳細モーダル */}
        {selectedApplication && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">
                    申請詳細 - {selectedApplication.full_name}
                  </h2>
                  <button
                    onClick={() => setSelectedApplication(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ×
                  </button>
                </div>

                <div className="space-y-4 text-sm">
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">基本情報</h3>
                    <div className="bg-gray-50 p-3 rounded space-y-1">
                      <p><span className="font-medium">氏名:</span> {selectedApplication.full_name}</p>
                      <p><span className="font-medium">フリガナ:</span> {selectedApplication.furigana_name}</p>
                      <p><span className="font-medium">メール:</span> {selectedApplication.email}</p>
                      {selectedApplication.phone_number && (
                        <p><span className="font-medium">電話:</span> {selectedApplication.phone_number}</p>
                      )}
                    </div>
                  </div>

                  {selectedApplication.appeal_points && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">アピールポイント</h3>
                      <div className="bg-gray-50 p-3 rounded">
                        <p>{selectedApplication.appeal_points}</p>
                      </div>
                    </div>
                  )}

                  {selectedApplication.hobbies_special_skills && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">趣味・特技</h3>
                      <div className="bg-gray-50 p-3 rounded">
                        <p>{selectedApplication.hobbies_special_skills}</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">学歴情報</h3>
                    <div className="bg-gray-50 p-3 rounded space-y-1">
                      {selectedApplication.education_background_cram_school && (
                        <p><span className="font-medium">塾歴:</span> {selectedApplication.education_background_cram_school}</p>
                      )}
                      {selectedApplication.education_background_middle_school && (
                        <p><span className="font-medium">中学校:</span> {selectedApplication.education_background_middle_school}</p>
                      )}
                      {selectedApplication.education_background_high_school && (
                        <p><span className="font-medium">高校:</span> {selectedApplication.education_background_high_school}</p>
                      )}
                      {selectedApplication.education_background_university && (
                        <p><span className="font-medium">大学:</span> {selectedApplication.education_background_university}</p>
                      )}
                      {selectedApplication.education_background_faculty && (
                        <p><span className="font-medium">学部:</span> {selectedApplication.education_background_faculty}</p>
                      )}
                    </div>
                  </div>

                  {selectedApplication.referrer_info && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">紹介者情報</h3>
                      <div className="bg-gray-50 p-3 rounded">
                        <p>{selectedApplication.referrer_info}</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">申請情報</h3>
                    <div className="bg-gray-50 p-3 rounded space-y-1">
                      <p><span className="font-medium">申請日:</span> {selectedApplication.registration_application_date}</p>
                      <p><span className="font-medium">ステータス:</span> 
                        <span
                          className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                            selectedApplication.account_status === '承認待ち'
                              ? 'bg-yellow-100 text-yellow-800'
                              : selectedApplication.account_status === '有効'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {selectedApplication.account_status}
                        </span>
                      </p>
                      {selectedApplication.account_approval_date && (
                        <p><span className="font-medium">承認日:</span> {selectedApplication.account_approval_date}</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* アクション */}
                {selectedApplication.account_status === '承認待ち' && (
                  <div className="flex gap-3 mt-6 pt-4 border-t border-gray-200">
                    <Button
                      variant="primary"
                      onClick={() => handleStatusUpdate(selectedApplication.id, '有効')}
                      disabled={processingId === selectedApplication.id}
                      className="flex-1"
                    >
                      {processingId === selectedApplication.id ? '処理中...' : '承認する'}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleStatusUpdate(selectedApplication.id, '無効')}
                      disabled={processingId === selectedApplication.id}
                      className="flex-1"
                    >
                      拒否する
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}