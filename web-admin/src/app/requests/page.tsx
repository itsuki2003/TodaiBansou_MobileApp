'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/ui/Header';
import Breadcrumb from '@/components/ui/Breadcrumb';
import {
  UnifiedRequest,
  RequestFilter,
  RequestSort,
  RequestStatistics,
  AbsenceRequest,
  AdditionalLessonRequest
} from '@/types/requests';
import RequestTable from './components/RequestTable';
import RequestFilters from './components/RequestFilters';
import RequestStatisticsCard from './components/RequestStatisticsCard';
import RequestDetailModal from './components/RequestDetailModal';
import BulkRequestActions from './components/BulkRequestActions';

export default function RequestsPage() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<UnifiedRequest[]>([]);
  const [statistics, setStatistics] = useState<RequestStatistics>({
    total: 0,
    pending: 0,
    processed: 0,
    absenceRequests: { total: 0, pending: 0, processed: 0 },
    additionalRequests: { total: 0, pending: 0, processed: 0 },
    thisWeek: { total: 0, absence: 0, additional: 0 },
    thisMonth: { total: 0, absence: 0, additional: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<UnifiedRequest | null>(null);

  const [filter, setFilter] = useState<RequestFilter>({
    search: '',
    type: 'all',
    status: 'all',
    dateRange: '30'
  });

  const [sort, setSort] = useState<RequestSort>({
    field: 'request_date',
    direction: 'desc'
  });

  const supabase = useMemo(() => createClient(), []);

  // 申請データの取得
  const fetchRequests = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 日付範囲の計算
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(filter.dateRange));

      // 欠席申請の取得
      const { data: absenceData, error: absenceError } = await supabase
        .from('absence_requests')
        .select(`
          *,
          students!inner (
            id,
            full_name,
            grade
          ),
          lesson_slots!inner (
            id,
            slot_date,
            start_time,
            end_time,
            slot_type,
            teachers!inner (
              full_name
            )
          )
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (absenceError) throw absenceError;

      // 追加授業申請の取得
      const { data: additionalData, error: additionalError } = await supabase
        .from('additional_lesson_requests')
        .select(`
          *,
          students!inner (
            id,
            full_name,
            grade
          ),
          teachers (
            id,
            full_name
          )
        `)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .order('created_at', { ascending: false });

      if (additionalError) throw additionalError;

      // データを統合形式に変換
      const unifiedRequests: UnifiedRequest[] = [];

      // 欠席申請の変換
      (absenceData as any[] || []).forEach((absence: any) => {
        unifiedRequests.push({
          id: absence.id,
          type: 'absence',
          student_id: absence.student_id,
          student_name: absence.students.full_name,
          student_grade: absence.students.grade,
          request_date: absence.created_at,
          target_date: absence.lesson_slots.slot_date,
          target_time: `${absence.lesson_slots.start_time}-${absence.lesson_slots.end_time}`,
          teacher_name: absence.lesson_slots.teachers.full_name,
          status: absence.status,
          reason: absence.reason,
          admin_notes: absence.admin_notes,
          created_at: absence.created_at,
          originalData: absence as AbsenceRequest
        });
      });

      // 追加授業申請の変換
      (additionalData as any[] || []).forEach((additional: any) => {
        unifiedRequests.push({
          id: additional.id,
          type: 'additional',
          student_id: additional.student_id,
          student_name: additional.students.full_name,
          student_grade: additional.students.grade,
          request_date: additional.created_at,
          target_date: additional.requested_date,
          target_time: `${additional.requested_start_time}-${additional.requested_end_time}`,
          teacher_name: additional.teachers?.full_name,
          status: additional.status,
          notes: additional.notes,
          admin_notes: additional.admin_notes,
          created_at: additional.created_at,
          originalData: additional as AdditionalLessonRequest
        });
      });

      // フィルター適用
      const filteredRequests = unifiedRequests.filter(request => {
        // 検索フィルター
        if (filter.search && !request.student_name.toLowerCase().includes(filter.search.toLowerCase())) {
          return false;
        }

        // タイプフィルター
        if (filter.type !== 'all' && request.type !== filter.type) {
          return false;
        }

        // ステータスフィルター
        if (filter.status === 'pending') {
          const isPending = (request.type === 'absence' && request.status === '未振替') ||
                           (request.type === 'additional' && request.status === '申請中');
          if (!isPending) return false;
        } else if (filter.status === 'processed') {
          const isProcessed = (request.type === 'absence' && request.status === '振替済') ||
                             (request.type === 'additional' && request.status === '承認済み・授業登録済み');
          if (!isProcessed) return false;
        }

        return true;
      });

      // ソート適用
      filteredRequests.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sort.field) {
          case 'request_date':
            aValue = new Date(a.request_date);
            bValue = new Date(b.request_date);
            break;
          case 'target_date':
            aValue = new Date(a.target_date);
            bValue = new Date(b.target_date);
            break;
          case 'student_name':
            aValue = a.student_name;
            bValue = b.student_name;
            break;
          case 'status':
            aValue = a.status;
            bValue = b.status;
            break;
          default:
            aValue = new Date(a.request_date);
            bValue = new Date(b.request_date);
        }

        if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1;
        return 0;
      });

      // 統計の計算
      const stats: RequestStatistics = {
        total: unifiedRequests.length,
        pending: unifiedRequests.filter(r => 
          (r.type === 'absence' && r.status === '未振替') ||
          (r.type === 'additional' && r.status === '申請中')
        ).length,
        processed: unifiedRequests.filter(r => 
          (r.type === 'absence' && r.status === '振替済') ||
          (r.type === 'additional' && r.status === '承認済み・授業登録済み')
        ).length,
        absenceRequests: {
          total: unifiedRequests.filter(r => r.type === 'absence').length,
          pending: unifiedRequests.filter(r => r.type === 'absence' && r.status === '未振替').length,
          processed: unifiedRequests.filter(r => r.type === 'absence' && r.status === '振替済').length
        },
        additionalRequests: {
          total: unifiedRequests.filter(r => r.type === 'additional').length,
          pending: unifiedRequests.filter(r => r.type === 'additional' && r.status === '申請中').length,
          processed: unifiedRequests.filter(r => r.type === 'additional' && r.status === '承認済み・授業登録済み').length
        },
        thisWeek: {
          total: 0, // TODO: 今週分の計算
          absence: 0,
          additional: 0
        },
        thisMonth: {
          total: 0, // TODO: 今月分の計算
          absence: 0,
          additional: 0
        }
      };

      setRequests(filteredRequests);
      setStatistics(stats);

    } catch (err) {
      console.error('Error fetching requests:', err);
      setError(err instanceof Error ? err.message : '申請データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [supabase, filter, sort]);

  // 申請の処理
  const handleRequestAction = useCallback(async (requestId: string, action: string, notes?: string) => {
    try {
      const request = requests.find(r => r.id === requestId);
      if (!request) return;

      if (request.type === 'absence') {
        // 欠席申請の処理
        const { error } = await supabase
          .from('absence_requests')
          .update({
            status: action === 'approve' ? '振替済' : request.status,
            admin_notes: notes,
            updated_at: new Date().toISOString()
          })
          .eq('id', requestId);

        if (error) throw error;

      } else if (request.type === 'additional') {
        // 追加授業申請の処理
        if (action === 'approve') {
          // 追加授業申請を承認し、lesson_slotsに新しい授業を作成
          const additionalData = request.originalData as AdditionalLessonRequest;
          
          // 新しい授業スロットを作成
          const { data: newLessonSlot, error: lessonError } = await supabase
            .from('lesson_slots')
            .insert({
              student_id: request.student_id,
              teacher_id: additionalData.teacher_id,
              slot_type: '追加授業',
              slot_date: additionalData.requested_date,
              start_time: additionalData.requested_start_time,
              end_time: additionalData.requested_end_time,
              status: '予定通り',
              notes: additionalData.notes
            })
            .select()
            .single();

          if (lessonError) throw lessonError;

          // 申請ステータスを更新
          const { error: updateError } = await supabase
            .from('additional_lesson_requests')
            .update({
              status: '承認済み・授業登録済み',
              admin_notes: notes,
              created_lesson_slot_id: newLessonSlot.id,
              updated_at: new Date().toISOString()
            })
            .eq('id', requestId);

          if (updateError) throw updateError;
        }
      }

      // データを再取得
      await fetchRequests();

    } catch (err) {
      console.error('Error processing request:', err);
      setError(err instanceof Error ? err.message : '申請の処理に失敗しました');
    }
  }, [requests, supabase, fetchRequests]);

  // 申請詳細の表示
  const handleViewDetail = (request: UnifiedRequest) => {
    setSelectedRequest(request);
    setShowDetailModal(true);
  };

  // 初期データ取得
  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const breadcrumbItems = [
    { label: 'ホーム', href: '/' },
    { label: '生徒申請一覧', href: '/requests' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">申請データを読み込み中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={breadcrumbItems} />
        
        <div className="mt-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                生徒申請一覧
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                欠席申請と追加授業申請の管理
              </p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <button
                onClick={fetchRequests}
                className="ml-3 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                更新
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">エラーが発生しました</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 統計カード */}
          <RequestStatisticsCard
            statistics={statistics}
            className="mt-6"
          />

          {/* フィルター */}
          <RequestFilters
            filter={filter}
            onFilterChange={setFilter}
            className="mt-6"
          />

          {/* 一括操作 */}
          {selectedRequests.length > 0 && (
            <BulkRequestActions
              selectedRequests={selectedRequests}
              requests={requests}
              onBulkAction={async () => {
                await fetchRequests();
                setSelectedRequests([]);
              }}
              onClearSelection={() => setSelectedRequests([])}
              className="mt-4"
            />
          )}

          {/* 申請一覧テーブル */}
          <RequestTable
            requests={requests}
            selectedRequests={selectedRequests}
            onSelectionChange={setSelectedRequests}
            onViewDetail={handleViewDetail}
            onProcessRequest={handleRequestAction}
            sort={sort}
            onSortChange={setSort}
            className="mt-6"
          />

          <div className="mt-4 text-sm text-gray-500">
            {requests.length} 件の申請
          </div>
        </div>
      </main>

      {/* 申請詳細モーダル */}
      <RequestDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        request={selectedRequest}
        onProcessRequest={async (requestId, action, notes) => {
          await handleRequestAction(requestId, action, notes);
          setShowDetailModal(false);
        }}
      />
    </div>
  );
}