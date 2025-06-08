'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/ui/Header';
import Breadcrumb from '@/components/ui/Breadcrumb';
import {
  TeacherWithManagementInfo,
  TeacherFilter,
  TeacherSort,
  TeacherStatistics,
  NewTeacherFormData,
  BulkTeacherAction
} from '@/types/teacherManagement';
import TeacherTable from './components/TeacherTable';
import TeacherFilters from './components/TeacherFilters';
import TeacherStatisticsCard from './components/TeacherStatisticsCard';
import TeacherDetailModal from './components/TeacherDetailModal';
import TeacherCreateModal from './components/TeacherCreateModal';
import TeacherEditModal from './components/TeacherEditModal';
import BulkTeacherActions from './components/BulkTeacherActions';

export default function TeachersPage() {
  const { user, loading: authLoading } = useAuth();
  const [teachers, setTeachers] = useState<TeacherWithManagementInfo[]>([]);
  const [statistics, setStatistics] = useState<TeacherStatistics>({
    total: 0,
    active: 0,
    inactive: 0,
    pending: 0,
    with_assignments: 0,
    without_assignments: 0,
    recent_registrations: 0,
    recent_logins: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTeachers, setSelectedTeachers] = useState<string[]>([]);
  
  // モーダル状態
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherWithManagementInfo | null>(null);

  const [filter, setFilter] = useState<TeacherFilter>({
    search: '',
    account_status: 'all',
    account_creation_method: 'all',
    has_assignments: 'all',
    last_login_period: 'all',
    registration_period: 'all'
  });

  const [sort, setSort] = useState<TeacherSort>({
    field: 'full_name',
    direction: 'asc'
  });

  const supabase = useMemo(() => createClient(), []);

  // 講師データの取得
  const fetchTeachers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 講師データと関連情報を取得
      const { data: teachersData, error: teachersError } = await supabase
        .from('teachers')
        .select(`
          *,
          assignments!left (
            id,
            student_id,
            role,
            status,
            students!inner (
              id,
              full_name,
              grade
            )
          )
        `)
        .order('full_name');

      if (teachersError) throw teachersError;

      // データを整形
      const formattedTeachers: TeacherWithManagementInfo[] = (teachersData || []).map(teacher => {
        const activeAssignments = teacher.assignments?.filter((a: any) => a.status === '有効') || [];
        
        return {
          ...teacher,
          assigned_students_count: activeAssignments.length,
          this_month_lessons: 0, // TODO: 実際のレッスン数を計算
          last_login_at: undefined, // TODO: 最終ログイン情報を取得
          account_creation_method: 'manual' as const, // TODO: 実際の作成方法を判定
          permissions: {
            can_edit_todo_lists: activeAssignments.filter((a: any) => a.role === '面談担当（リスト編集可）').length,
            can_comment_todo_lists: activeAssignments.length
          }
        };
      });

      // フィルター適用
      const filteredTeachers = formattedTeachers.filter(teacher => {
        // 検索フィルター
        if (filter.search) {
          const searchLower = filter.search.toLowerCase();
          const matchesName = teacher.full_name.toLowerCase().includes(searchLower) ||
                             teacher.furigana_name?.toLowerCase().includes(searchLower) ||
                             false;
          const matchesEmail = teacher.email.toLowerCase().includes(searchLower);
          if (!matchesName && !matchesEmail) return false;
        }

        // アカウント状態フィルター
        if (filter.account_status !== 'all' && teacher.account_status !== filter.account_status) {
          return false;
        }

        // 担当生徒フィルター
        if (filter.has_assignments !== 'all') {
          const hasAssignments = teacher.assigned_students_count > 0;
          if (filter.has_assignments !== hasAssignments) return false;
        }

        return true;
      });

      // ソート適用
      filteredTeachers.sort((a, b) => {
        let aValue: any;
        let bValue: any;

        switch (sort.field) {
          case 'full_name':
            aValue = a.full_name;
            bValue = b.full_name;
            break;
          case 'email':
            aValue = a.email;
            bValue = b.email;
            break;
          case 'account_status':
            aValue = a.account_status;
            bValue = b.account_status;
            break;
          case 'assigned_students_count':
            aValue = a.assigned_students_count;
            bValue = b.assigned_students_count;
            break;
          case 'registration_application_date':
            aValue = new Date(a.registration_application_date || a.created_at);
            bValue = new Date(b.registration_application_date || b.created_at);
            break;
          default:
            aValue = a.full_name;
            bValue = b.full_name;
        }

        if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1;
        return 0;
      });

      // 統計の計算
      const stats: TeacherStatistics = {
        total: formattedTeachers.length,
        active: formattedTeachers.filter(t => t.account_status === '有効').length,
        inactive: formattedTeachers.filter(t => t.account_status === '無効').length,
        pending: formattedTeachers.filter(t => t.account_status === '承認待ち').length,
        with_assignments: formattedTeachers.filter(t => t.assigned_students_count > 0).length,
        without_assignments: formattedTeachers.filter(t => t.assigned_students_count === 0).length,
        recent_registrations: 0, // TODO: 過去30日の新規登録数
        recent_logins: 0 // TODO: 過去7日のログイン数
      };

      setTeachers(filteredTeachers);
      setStatistics(stats);

    } catch (err) {
      console.error('Error fetching teachers:', err);
      setError(err instanceof Error ? err.message : '講師データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [supabase, filter, sort]);

  // 新規講師作成
  const handleCreateTeacher = useCallback(async (formData: NewTeacherFormData) => {
    try {
      setError(null);

      // Supabase Authでユーザーを作成
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.email,
        password: formData.initial_password,
        email_confirm: true
      });

      if (authError) throw authError;

      // teachersテーブルに講師情報を追加
      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .insert({
          user_id: authData.user.id,
          full_name: formData.full_name,
          furigana_name: formData.furigana_name,
          email: formData.email,
          phone_number: formData.phone_number,
          account_status: formData.account_status,
          notes_admin_only: formData.notes_admin_only,
          registration_application_date: new Date().toISOString().split('T')[0],
          account_approval_date: formData.account_status === '有効' ? new Date().toISOString().split('T')[0] : null
        })
        .select()
        .single();

      if (teacherError) throw teacherError;

      // TODO: ウェルカムメール送信
      if (formData.send_welcome_email) {
        console.log('Sending welcome email to:', formData.email);
      }

      // データを再取得
      await fetchTeachers();
      setShowCreateModal(false);

    } catch (err) {
      console.error('Error creating teacher:', err);
      setError(err instanceof Error ? err.message : '講師の作成に失敗しました');
    }
  }, [supabase, fetchTeachers]);

  // 講師情報更新
  const handleUpdateTeacher = useCallback(async (teacherId: string, updateData: any) => {
    try {
      setError(null);

      const { error } = await supabase
        .from('teachers')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', teacherId);

      if (error) throw error;

      await fetchTeachers();
      setShowEditModal(false);

    } catch (err) {
      console.error('Error updating teacher:', err);
      setError(err instanceof Error ? err.message : '講師情報の更新に失敗しました');
    }
  }, [supabase, fetchTeachers]);

  // 一括操作処理
  const handleBulkAction = useCallback(async (action: BulkTeacherAction) => {
    try {
      setError(null);

      switch (action.type) {
        case 'activate':
          {
            const { error } = await supabase
              .from('teachers')
              .update({ 
                account_status: '有効',
                account_approval_date: new Date().toISOString().split('T')[0],
                updated_at: new Date().toISOString()
              })
              .in('id', action.teacherIds);
            
            if (error) throw error;
          }
          break;

        case 'deactivate':
          {
            const { error } = await supabase
              .from('teachers')
              .update({ 
                account_status: '無効',
                updated_at: new Date().toISOString()
              })
              .in('id', action.teacherIds);
            
            if (error) throw error;
          }
          break;

        case 'approve':
          {
            const { error } = await supabase
              .from('teachers')
              .update({ 
                account_status: '有効',
                account_approval_date: new Date().toISOString().split('T')[0],
                updated_at: new Date().toISOString()
              })
              .in('id', action.teacherIds);
            
            if (error) throw error;
          }
          break;

        case 'reset_password':
          {
            for (const teacherId of action.teacherIds) {
              const teacher = teachers.find(t => t.id === teacherId);
              if (teacher?.user_id) {
                // ランダムパスワード生成
                const newPassword = generateRandomPassword();
                
                const { error } = await supabase.auth.admin.updateUserById(
                  teacher.user_id,
                  { password: newPassword }
                );
                
                if (error) throw error;
                
                // TODO: パスワードリセット通知メール送信
                console.log('Password reset for teacher:', teacher.email, 'New password:', newPassword);
              }
            }
          }
          break;

        case 'send_welcome':
          {
            // TODO: ウェルカムメール再送信の実装
            for (const teacherId of action.teacherIds) {
              const teacher = teachers.find(t => t.id === teacherId);
              if (teacher) {
                console.log('Sending welcome email to:', teacher.email);
              }
            }
          }
          break;

        case 'delete':
          {
            // 担当生徒がいる講師は削除不可
            const teachersWithAssignments = teachers.filter(t => 
              action.teacherIds.includes(t.id) && t.assigned_students_count > 0
            );
            
            if (teachersWithAssignments.length > 0) {
              throw new Error('担当生徒がいる講師は削除できません。先に担当割り当てを解除してください。');
            }

            // 講師データを削除
            const { error } = await supabase
              .from('teachers')
              .delete()
              .in('id', action.teacherIds);
            
            if (error) throw error;

            // 対応するAuthユーザーも削除
            for (const teacherId of action.teacherIds) {
              const teacher = teachers.find(t => t.id === teacherId);
              if (teacher?.user_id) {
                await supabase.auth.admin.deleteUser(teacher.user_id);
              }
            }
          }
          break;

        default:
          throw new Error('未対応の操作です');
      }

      // データを再取得
      await fetchTeachers();

    } catch (err) {
      console.error('Bulk action error:', err);
      setError(err instanceof Error ? err.message : '一括操作に失敗しました');
      throw err;
    }
  }, [supabase, teachers, fetchTeachers]);

  // ランダムパスワード生成ヘルパー
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  // パスワードリセット
  const handlePasswordReset = useCallback(async (teacherId: string, newPassword?: string) => {
    try {
      setError(null);

      const teacher = teachers.find(t => t.id === teacherId);
      if (!teacher || !teacher.user_id) throw new Error('講師情報が見つかりません');

      const password = newPassword || generateRandomPassword();

      // Supabase Authでパスワードを更新
      const { error } = await supabase.auth.admin.updateUserById(
        teacher.user_id,
        { password }
      );

      if (error) throw error;

      // TODO: パスワードリセット通知メール送信
      console.log('Password reset for teacher:', teacher.email);

    } catch (err) {
      console.error('Error resetting password:', err);
      setError(err instanceof Error ? err.message : 'パスワードリセットに失敗しました');
    }
  }, [supabase, teachers]);

  // 講師詳細表示
  const handleViewDetail = (teacher: TeacherWithManagementInfo) => {
    setSelectedTeacher(teacher);
    setShowDetailModal(true);
  };

  // 講師編集
  const handleEditTeacher = (teacher: TeacherWithManagementInfo) => {
    setSelectedTeacher(teacher);
    setShowEditModal(true);
  };

  // 初期データ取得
  useEffect(() => {
    if (user?.role === 'admin') {
      fetchTeachers();
    }
  }, [user, fetchTeachers]);

  // 認証チェック - 認証処理中は待機
  console.log('👤 講師管理ページ - 認証状態:', { user, authLoading });
  console.log('👤 ユーザーロール:', user?.role);
  
  if (authLoading) {
    console.log('👤 認証処理中...');
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">認証状態を確認中...</span>
        </div>
      </div>
    );
  }
  
  if (user?.role !== 'admin') {
    console.log('👤 アクセス拒否 - ユーザーロールが admin ではありません:', user?.role);
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900">アクセス権限がありません</h3>
            <p className="text-gray-500">この機能は運営者のみ利用可能です</p>
            <p className="text-gray-400 text-sm mt-2">現在のロール: {user?.role || 'undefined'}</p>
          </div>
        </div>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: 'ホーム', href: '/' },
    { label: '講師管理', href: '/teachers' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">講師データを読み込み中...</span>
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
                講師管理
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                講師アカウントの管理と運営
              </p>
            </div>
            <div className="mt-4 flex md:mt-0 md:ml-4">
              <button
                onClick={() => setShowCreateModal(true)}
                className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                新規講師登録
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
          <TeacherStatisticsCard
            statistics={statistics}
            className="mt-6"
          />

          {/* フィルター */}
          <TeacherFilters
            filter={filter}
            onFilterChange={setFilter}
            className="mt-6"
          />

          {/* 一括操作 */}
          {selectedTeachers.length > 0 && (
            <BulkTeacherActions
              selectedTeachers={selectedTeachers}
              teachers={teachers}
              onBulkAction={handleBulkAction}
              onClearSelection={() => setSelectedTeachers([])}
              className="mt-4"
            />
          )}

          {/* 講師一覧テーブル */}
          <TeacherTable
            teachers={teachers}
            selectedTeachers={selectedTeachers}
            onSelectionChange={setSelectedTeachers}
            onViewDetail={handleViewDetail}
            onEditTeacher={handleEditTeacher}
            onPasswordReset={handlePasswordReset}
            sort={sort}
            onSortChange={setSort}
            className="mt-6"
          />

          <div className="mt-4 text-sm text-gray-500">
            {teachers.length} 人の講師
          </div>
        </div>
      </main>

      {/* モーダル */}
      <TeacherCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateTeacher}
      />

      <TeacherEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        teacher={selectedTeacher}
        onSubmit={handleUpdateTeacher}
      />

      <TeacherDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        teacher={selectedTeacher}
        onEdit={() => {
          setShowDetailModal(false);
          setShowEditModal(true);
        }}
        onPasswordReset={(teacherId) => handlePasswordReset(teacherId)}
      />
    </div>
  );
}