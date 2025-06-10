'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Header from '@/components/ui/Header';
import Breadcrumb from '@/components/ui/Breadcrumb';
import PageHeader from '@/components/ui/PageHeader';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import LoadingState from '@/components/ui/common/LoadingState';
import ErrorState from '@/components/ui/common/ErrorState';
import EmptyState from '@/components/ui/common/EmptyState';
import { TeacherApplicationListItem, TeacherApplicationFilters } from '@/types/teacherApplication';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faEnvelope, faPhone, faGraduationCap, faCalendarDays, 
  faUserGraduate, faCheck, faTimes, faEye, faUserTie,
  faSearch, faFilter, faInfoCircle
} from '@fortawesome/free-solid-svg-icons';

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
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
      <Header />
      
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* パンくずリスト */}
        <Breadcrumb 
          items={[
            { label: '管理者機能', href: '/' },
            { label: '講師登録申請一覧' }
          ]}
        />
        
        {/* ページヘッダー */}
        <PageHeader
          title="講師登録申請一覧"
          description="講師からの登録申請を確認・承認・拒否できます"
          icon="👔"
          colorTheme="primary"
        />

        {/* フィルタ・検索 */}
        <Card className="mb-6 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* ステータスフィルタ */}
              <div className="flex-1">
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                  <FontAwesomeIcon icon={faFilter} className="w-4 h-4" />
                  <span>ステータス</span>
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                >
                  <option value="all">すべて</option>
                  <option value="承認待ち">承認待ち</option>
                  <option value="有効">承認済み</option>
                  <option value="無効">拒否済み</option>
                </select>
              </div>

              {/* 検索 */}
              <div className="flex-2">
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                  <FontAwesomeIcon icon={faSearch} className="w-4 h-4" />
                  <span>検索</span>
                </label>
                <div className="relative">
                  <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="氏名、メールアドレス、大学名で検索..."
                    className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                  />
                </div>
              </div>

              {/* 統計 */}
              <div className="flex-1">
                <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                  <FontAwesomeIcon icon={faInfoCircle} className="w-4 h-4" />
                  <span>統計</span>
                </label>
                <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl p-4">
                  <div className="flex flex-col space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">全件数:</span>
                      <span className="font-semibold text-primary-600">{applications.length}件</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">承認待ち:</span>
                      <span className="font-semibold text-warning-600">{applications.filter(a => a.account_status === '承認待ち').length}件</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* エラー表示 */}
        {error && (
          <div className="mb-6 bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-xl p-4 shadow-sm">
            <div className="flex items-center">
              <FontAwesomeIcon icon={faTimes} className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
              <div className="text-red-700 text-sm flex-1">{error}</div>
              <button
                onClick={() => setError(null)}
                className="ml-3 text-red-500 hover:text-red-700 transition-colors duration-200"
              >
                <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
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
          <div className="space-y-6">
            {filteredApplications.map((application) => (
              <Card key={application.id} className="border-0 shadow-xl bg-white/90 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <CardContent className="p-8">
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-1">
                            {application.full_name}
                          </h3>
                          <span className="text-sm text-gray-500">
                            {application.furigana_name}
                          </span>
                        </div>
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                            application.account_status === '承認待ち'
                              ? 'bg-gradient-to-r from-warning-100 to-warning-200 text-warning-800 border border-warning-300'
                              : application.account_status === '有効'
                              ? 'bg-gradient-to-r from-success-100 to-success-200 text-success-800 border border-success-300'
                              : 'bg-gradient-to-r from-error-100 to-error-200 text-error-800 border border-error-300'
                          }`}
                        >
                          {application.account_status === '承認待ち' && <FontAwesomeIcon icon={faInfoCircle} className="w-4 h-4 mr-2" />}
                          {application.account_status === '有効' && <FontAwesomeIcon icon={faCheck} className="w-4 h-4 mr-2" />}
                          {application.account_status === '無効' && <FontAwesomeIcon icon={faTimes} className="w-4 h-4 mr-2" />}
                          {application.account_status}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3 text-sm text-gray-600">
                            <FontAwesomeIcon icon={faEnvelope} className="w-4 h-4 text-primary-500" />
                            <span className="font-medium">{application.email}</span>
                          </div>
                          {application.phone_number && (
                            <div className="flex items-center space-x-3 text-sm text-gray-600">
                              <FontAwesomeIcon icon={faPhone} className="w-4 h-4 text-primary-500" />
                              <span>{application.phone_number}</span>
                            </div>
                          )}
                        </div>
                        <div className="space-y-3">
                          {application.education_background_university && (
                            <div className="flex items-center space-x-3 text-sm text-gray-600">
                              <FontAwesomeIcon icon={faGraduationCap} className="w-4 h-4 text-primary-500" />
                              <span>{application.education_background_university}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-3 text-sm text-gray-600">
                            <FontAwesomeIcon icon={faCalendarDays} className="w-4 h-4 text-primary-500" />
                            <span>申請日: {application.registration_application_date}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedApplication(application)}
                        className="flex items-center space-x-2"
                      >
                        <FontAwesomeIcon icon={faEye} className="w-4 h-4" />
                        <span>詳細確認</span>
                      </Button>
                      
                      {application.account_status === '承認待ち' && (
                        <>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleStatusUpdate(application.id, '有効')}
                            disabled={processingId === application.id}
                            className="flex items-center space-x-2"
                          >
                            <FontAwesomeIcon icon={faCheck} className="w-4 h-4" />
                            <span>{processingId === application.id ? '処理中...' : '承認'}</span>
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleStatusUpdate(application.id, '無効')}
                            disabled={processingId === application.id}
                            className="flex items-center space-x-2"
                          >
                            <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
                            <span>拒否</span>
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