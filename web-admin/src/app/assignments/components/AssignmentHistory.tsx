'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  ClockIcon, 
  UserIcon, 
  ArrowRightIcon,
  PlusIcon,
  MinusIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { createClient } from '@/lib/supabaseClient';
import { AssignmentHistory } from '@/types/assignment';

interface AssignmentHistoryProps {
  className?: string;
}

export default function AssignmentHistory({ className = '' }: AssignmentHistoryProps) {
  const [history, setHistory] = useState<AssignmentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState({
    studentName: '',
    changeType: 'all',
    role: 'all',
    dateRange: '30' // 30日間
  });

  const supabase = createClient();

  const fetchHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 日付範囲の計算
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(filter.dateRange));

      // TODO: assignment_historyテーブルが存在する場合の実装
      // 現在はモックデータを使用
      const mockHistory: AssignmentHistory[] = [
        {
          id: '1',
          student_id: 'student1',
          student_name: '田中太郎',
          change_type: 'add',
          role: '面談担当（リスト編集可）',
          new_teacher_id: 'teacher1',
          new_teacher_name: '山田先生',
          changed_by: 'admin1',
          changed_by_name: '管理者',
          reason: '新学期の担当割り当て',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
        },
        {
          id: '2',
          student_id: 'student2',
          student_name: '佐藤花子',
          change_type: 'update',
          role: '授業担当（コメントのみ）',
          old_teacher_id: 'teacher2',
          old_teacher_name: '鈴木先生',
          new_teacher_id: 'teacher3',
          new_teacher_name: '高橋先生',
          changed_by: 'admin1',
          changed_by_name: '管理者',
          reason: '講師の退職に伴う変更',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString()
        },
        {
          id: '3',
          student_id: 'student3',
          student_name: '鈴木一郎',
          change_type: 'remove',
          role: '面談担当（リスト編集可）',
          old_teacher_id: 'teacher4',
          old_teacher_name: '伊藤先生',
          changed_by: 'admin1',
          changed_by_name: '管理者',
          reason: '生徒の休会',
          created_at: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString()
        }
      ];

      // フィルター適用
      const filteredHistory = mockHistory.filter(item => {
        if (filter.studentName && !item.student_name.toLowerCase().includes(filter.studentName.toLowerCase())) {
          return false;
        }
        if (filter.changeType !== 'all' && item.change_type !== filter.changeType) {
          return false;
        }
        if (filter.role !== 'all' && item.role !== filter.role) {
          return false;
        }
        return true;
      });

      setHistory(filteredHistory);

    } catch (err) {
      console.error('Error fetching assignment history:', err);
      setError(err instanceof Error ? err.message : '履歴の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const getChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'add':
        return <PlusIcon className="h-5 w-5 text-green-600" />;
      case 'remove':
        return <MinusIcon className="h-5 w-5 text-red-600" />;
      case 'update':
        return <ArrowPathIcon className="h-5 w-5 text-blue-600" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const getChangeText = (item: AssignmentHistory) => {
    const roleText = item.role === '面談担当（リスト編集可）' ? '面談担当' : '授業担当';
    
    switch (item.change_type) {
      case 'add':
        return (
          <span>
            <span className="font-medium">{item.student_name}</span> さんの
            <span className="text-blue-600 font-medium">{roleText}</span>に
            <span className="font-medium">{item.new_teacher_name}</span> を追加
          </span>
        );
      case 'remove':
        return (
          <span>
            <span className="font-medium">{item.student_name}</span> さんの
            <span className="text-blue-600 font-medium">{roleText}</span>から
            <span className="font-medium">{item.old_teacher_name}</span> を削除
          </span>
        );
      case 'update':
        return (
          <span>
            <span className="font-medium">{item.student_name}</span> さんの
            <span className="text-blue-600 font-medium">{roleText}</span>を
            <span className="font-medium">{item.old_teacher_name}</span> から
            <span className="font-medium">{item.new_teacher_name}</span> に変更
          </span>
        );
      default:
        return '不明な変更';
    }
  };

  const getChangeBadgeColor = (changeType: string) => {
    switch (changeType) {
      case 'add':
        return 'bg-green-100 text-green-800';
      case 'remove':
        return 'bg-red-100 text-red-800';
      case 'update':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getChangeTypeText = (changeType: string) => {
    switch (changeType) {
      case 'add':
        return '追加';
      case 'remove':
        return '削除';
      case 'update':
        return '変更';
      default:
        return '不明';
    }
  };

  if (loading) {
    return (
      <div className={`bg-white shadow rounded-lg p-6 ${className}`}>
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">履歴を読み込み中...</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white shadow rounded-lg ${className}`}>
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">担当割り当て変更履歴</h3>
        
        {/* フィルター */}
        <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="studentName" className="block text-sm font-medium text-gray-700 mb-1">
              生徒名で検索
            </label>
            <input
              type="text"
              id="studentName"
              value={filter.studentName}
              onChange={(e) => setFilter({ ...filter, studentName: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="生徒名"
            />
          </div>
          
          <div>
            <label htmlFor="changeType" className="block text-sm font-medium text-gray-700 mb-1">
              変更種別
            </label>
            <select
              id="changeType"
              value={filter.changeType}
              onChange={(e) => setFilter({ ...filter, changeType: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">すべて</option>
              <option value="add">追加</option>
              <option value="remove">削除</option>
              <option value="update">変更</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              担当種別
            </label>
            <select
              id="role"
              value={filter.role}
              onChange={(e) => setFilter({ ...filter, role: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">すべて</option>
              <option value="面談担当（リスト編集可）">面談担当</option>
              <option value="授業担当（コメントのみ）">授業担当</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="dateRange" className="block text-sm font-medium text-gray-700 mb-1">
              期間
            </label>
            <select
              id="dateRange"
              value={filter.dateRange}
              onChange={(e) => setFilter({ ...filter, dateRange: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="7">過去7日間</option>
              <option value="30">過去30日間</option>
              <option value="90">過去90日間</option>
              <option value="365">過去1年間</option>
            </select>
          </div>
        </div>
      </div>

      <div className="px-6 py-4">
        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {history.length === 0 ? (
          <div className="text-center py-8">
            <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">履歴がありません</h3>
            <p className="mt-1 text-sm text-gray-500">
              指定した条件に一致する変更履歴が見つかりませんでした
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {history.map((item) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {getChangeIcon(item.change_type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getChangeBadgeColor(item.change_type)}`}>
                        {getChangeTypeText(item.change_type)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(item.created_at).toLocaleDateString('ja-JP', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    
                    <div className="text-sm text-gray-900 mb-2">
                      {getChangeText(item)}
                    </div>
                    
                    {item.reason && (
                      <div className="text-sm text-gray-600 mb-2">
                        理由: {item.reason}
                      </div>
                    )}
                    
                    <div className="flex items-center text-xs text-gray-500">
                      <UserIcon className="h-3 w-3 mr-1" />
                      変更者: {item.changed_by_name}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}