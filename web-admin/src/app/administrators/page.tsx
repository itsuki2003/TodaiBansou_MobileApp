'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/ui/Header';
import Breadcrumb from '@/components/ui/Breadcrumb';
import {
  AdministratorWithManagementInfo,
  AdministratorFilter,
  AdministratorSort,
  AdministratorStatistics,
  NewAdministratorFormData,
  BulkAdministratorAction,
  AdministratorSecuritySettings
} from '@/types/adminManagement';
import AdministratorTable from './components/AdministratorTable';
import AdministratorFilters from './components/AdministratorFilters';
import AdministratorStatisticsCard from './components/AdministratorStatisticsCard';
import AdministratorCreateModal from './components/AdministratorCreateModal';
import AdministratorEditModal from './components/AdministratorEditModal';
import AdministratorDetailModal from './components/AdministratorDetailModal';
import BulkAdministratorActions from './components/BulkAdministratorActions';
import SecuritySettingsModal from './components/SecuritySettingsModal';

export default function AdministratorsPage() {
  const { user } = useAuth();
  const [administrators, setAdministrators] = useState<AdministratorWithManagementInfo[]>([]);
  const [statistics, setStatistics] = useState<AdministratorStatistics>({
    total: 0,
    active: 0,
    inactive: 0,
    super_admins: 0,
    regular_admins: 0,
    recent_logins: 0,
    never_logged_in: 0,
    this_month_created: 0,
    security_alerts: {
      accounts_with_weak_passwords: 0,
      accounts_without_2fa: 0,
      accounts_with_failed_logins: 0
    }
  });
  const [securitySettings, setSecuritySettings] = useState<AdministratorSecuritySettings>({
    password_policy: {
      min_length: 12,
      require_uppercase: true,
      require_lowercase: true,
      require_numbers: true,
      require_symbols: true,
      password_expiry_days: 90
    },
    login_security: {
      max_failed_attempts: 5,
      lockout_duration_minutes: 30,
      require_2fa: false,
      session_timeout_minutes: 480
    },
    audit_settings: {
      log_all_actions: true,
      log_retention_days: 365,
      alert_on_suspicious_activity: true
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAdministrators, setSelectedAdministrators] = useState<string[]>([]);
  
  // モーダル状態
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [selectedAdministrator, setSelectedAdministrator] = useState<AdministratorWithManagementInfo | null>(null);

  const [filter, setFilter] = useState<AdministratorFilter>({
    search: '',
    account_status: 'all',
    account_creation_method: 'all',
    last_login_period: 'all',
    login_frequency: 'all',
    created_date_range: null
  });

  const [sort, setSort] = useState<AdministratorSort>({
    field: 'created_at',
    direction: 'desc'
  });

  const supabase = useMemo(() => createClient(), []);

  // 運営者データの取得
  const fetchAdministrators = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 運営者データを取得
      const { data: adminsData, error: adminsError } = await supabase
        .from('administrators')
        .select('*')
        .order('created_at', { ascending: false });

      if (adminsError) throw adminsError;

      // データを整形（実際の実装では、last_login_atやactivity_statsなどの情報も取得）
      const formattedAdmins: AdministratorWithManagementInfo[] = (adminsData || []).map(admin => ({
        ...admin,
        last_login_at: undefined, // TODO: 実際のログイン履歴から取得
        account_creation_method: 'manual' as const,
        activity_stats: {
          notifications_created_this_month: 0, // TODO: 実際の統計を計算
          students_registered_this_month: 0,
          teachers_created_this_month: 0,
          last_activity_at: undefined
        },
        login_frequency: 'weekly' as const, // TODO: 実際のログイン頻度を計算
        security_info: {
          two_factor_enabled: false, // TODO: 実際の2FA状態を取得
          password_last_changed: undefined,
          failed_login_attempts: 0
        }
      }));

      // フィルター適用
      const filteredAdmins = formattedAdmins.filter(admin => {
        // 検索フィルター
        if (filter.search) {
          const searchLower = filter.search.toLowerCase();
          const matchesName = admin.full_name.toLowerCase().includes(searchLower);
          const matchesEmail = admin.email.toLowerCase().includes(searchLower);
          if (!matchesName && !matchesEmail) return false;
        }

        // アカウント状態フィルター
        if (filter.account_status !== 'all' && admin.account_status !== filter.account_status) {
          return false;
        }

        // 作成方法フィルター
        if (filter.account_creation_method !== 'all' && admin.account_creation_method !== filter.account_creation_method) {
          return false;
        }

        // ログイン頻度フィルター
        if (filter.login_frequency !== 'all' && admin.login_frequency !== filter.login_frequency) {
          return false;
        }

        return true;
      });

      // ソート適用
      filteredAdmins.sort((a, b) => {
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
          case 'created_at':
            aValue = new Date(a.created_at);
            bValue = new Date(b.created_at);
            break;
          case 'last_login_at':
            aValue = a.last_login_at ? new Date(a.last_login_at) : new Date(0);
            bValue = b.last_login_at ? new Date(b.last_login_at) : new Date(0);
            break;
          default:
            aValue = new Date(a.created_at);
            bValue = new Date(b.created_at);
        }

        if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1;
        return 0;
      });

      // 統計の計算
      const now = new Date();
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const stats: AdministratorStatistics = {
        total: formattedAdmins.length,
        active: formattedAdmins.filter(a => a.account_status === '有効').length,
        inactive: formattedAdmins.filter(a => a.account_status === '無効').length,
        super_admins: 1, // TODO: 実際のスーパー管理者数を計算
        regular_admins: formattedAdmins.length - 1,
        recent_logins: formattedAdmins.filter(a => 
          a.last_login_at && new Date(a.last_login_at) >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        ).length,
        never_logged_in: formattedAdmins.filter(a => !a.last_login_at).length,
        this_month_created: formattedAdmins.filter(a => 
          new Date(a.created_at) >= thisMonthStart
        ).length,
        security_alerts: {
          accounts_with_weak_passwords: 0, // TODO: 実際のパスワード強度を確認
          accounts_without_2fa: formattedAdmins.filter(a => !a.security_info.two_factor_enabled).length,
          accounts_with_failed_logins: formattedAdmins.filter(a => a.security_info.failed_login_attempts > 0).length
        }
      };

      setAdministrators(filteredAdmins);
      setStatistics(stats);

    } catch (err) {
      console.error('Error fetching administrators:', err);
      setError(err instanceof Error ? err.message : '運営者データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [supabase, filter, sort]);

  // 新規運営者作成
  const handleCreateAdministrator = useCallback(async (formData: NewAdministratorFormData) => {
    try {
      setError(null);

      // Supabase Authでユーザーを作成
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.email,
        password: formData.initial_password,
        email_confirm: true
      });

      if (authError) throw authError;

      // administratorsテーブルに運営者情報を追加
      const { data: adminData, error: adminError } = await supabase
        .from('administrators')
        .insert({
          user_id: authData.user.id,
          full_name: formData.full_name,
          email: formData.email,
          account_status: formData.account_status
        })
        .select()
        .single();

      if (adminError) throw adminError;

      // TODO: ウェルカムメール送信
      if (formData.send_welcome_email) {
        console.log('Sending welcome email to:', formData.email);
      }

      // 監査ログ記録
      console.log('Administrator created:', {
        created_by: user?.id,
        new_admin_id: adminData.id,
        email: formData.email
      });

      // データを再取得
      await fetchAdministrators();
      setShowCreateModal(false);

    } catch (err) {
      console.error('Error creating administrator:', err);
      setError(err instanceof Error ? err.message : '運営者の作成に失敗しました');
      throw err;
    }
  }, [supabase, user, fetchAdministrators]);

  // 運営者情報更新
  const handleUpdateAdministrator = useCallback(async (adminId: string, updateData: any) => {
    try {
      setError(null);

      // 自分自身を無効化しようとしている場合の確認
      if (user?.id === adminId && updateData.account_status === '無効') {
        if (!confirm('⚠️ 重要な警告\n\n自分自身のアカウントを無効化しようとしています。\n無効化すると、このアカウントでログインできなくなります。\n\n本当に実行しますか？')) {
          return;
        }
      }

      const { error } = await supabase
        .from('administrators')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', adminId);

      if (error) throw error;

      // 監査ログ記録
      console.log('Administrator updated:', {
        updated_by: user?.id,
        target_admin_id: adminId,
        changes: updateData
      });

      await fetchAdministrators();
      setShowEditModal(false);

    } catch (err) {
      console.error('Error updating administrator:', err);
      setError(err instanceof Error ? err.message : '運営者情報の更新に失敗しました');
      throw err;
    }
  }, [supabase, user, fetchAdministrators]);

  // 一括操作処理
  const handleBulkAction = useCallback(async (action: BulkAdministratorAction) => {
    try {
      setError(null);

      // 自分自身を含む操作の場合の確認
      const includesSelf = action.adminIds.includes(user?.profile?.id || '');
      if (includesSelf && (action.type === 'deactivate' || action.type === 'delete')) {
        if (!confirm('⚠️ 警告: 自分自身のアカウントも操作対象に含まれています。\n続行すると、ログインできなくなる可能性があります。\n\n本当に実行しますか？')) {
          return;
        }
      }

      switch (action.type) {
        case 'activate':
          {
            const { error } = await supabase
              .from('administrators')
              .update({ 
                account_status: '有効',
                updated_at: new Date().toISOString()
              })
              .in('id', action.adminIds);
            
            if (error) throw error;
          }
          break;

        case 'deactivate':
          {
            const { error } = await supabase
              .from('administrators')
              .update({ 
                account_status: '無効',
                updated_at: new Date().toISOString()
              })
              .in('id', action.adminIds);
            
            if (error) throw error;
          }
          break;

        case 'reset_password':
          {
            for (const adminId of action.adminIds) {
              const admin = administrators.find(a => a.id === adminId);
              if (admin?.user_id) {
                // ランダムパスワード生成
                const newPassword = generateRandomPassword();
                
                const { error } = await supabase.auth.admin.updateUserById(
                  admin.user_id,
                  { password: newPassword }
                );
                
                if (error) throw error;
                
                // TODO: パスワードリセット通知メール送信
                console.log('Password reset for admin:', admin.email, 'New password:', newPassword);
              }
            }
          }
          break;

        case 'send_notification':
          {
            // TODO: 通知メール送信の実装
            for (const adminId of action.adminIds) {
              const admin = administrators.find(a => a.id === adminId);
              if (admin) {
                console.log('Sending notification to admin:', admin.email, 'Message:', action.notificationMessage);
              }
            }
          }
          break;

        case 'delete':
          {
            // 現在ログイン中のユーザーは削除不可
            const filteredIds = action.adminIds.filter(id => id !== user?.profile?.id);
            if (filteredIds.length !== action.adminIds.length) {
              alert('⚠️ 自分自身のアカウントは削除できません。');
            }

            if (filteredIds.length === 0) {
              return;
            }

            // 運営者データを削除
            const { error } = await supabase
              .from('administrators')
              .delete()
              .in('id', filteredIds);
            
            if (error) throw error;

            // 対応するAuthユーザーも削除
            for (const adminId of filteredIds) {
              const admin = administrators.find(a => a.id === adminId);
              if (admin?.user_id) {
                await supabase.auth.admin.deleteUser(admin.user_id);
              }
            }
          }
          break;

        default:
          throw new Error('未対応の操作です');
      }

      // 監査ログ記録
      console.log('Bulk action executed:', {
        action_type: action.type,
        executed_by: user?.id,
        target_ids: action.adminIds,
        notes: action.notes
      });

      // データを再取得
      await fetchAdministrators();

    } catch (err) {
      console.error('Bulk action error:', err);
      setError(err instanceof Error ? err.message : '一括操作に失敗しました');
      throw err;
    }
  }, [supabase, user, administrators, fetchAdministrators]);

  // ランダムパスワード生成ヘルパー
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 16; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  // パスワードリセット
  const handlePasswordReset = useCallback(async (adminId: string, newPassword?: string) => {
    try {
      setError(null);

      const admin = administrators.find(a => a.id === adminId);
      if (!admin || !admin.user_id) throw new Error('運営者情報が見つかりません');

      const password = newPassword || generateRandomPassword();

      // Supabase Authでパスワードを更新
      const { error } = await supabase.auth.admin.updateUserById(
        admin.user_id,
        { password }
      );

      if (error) throw error;

      // 監査ログ記録
      console.log('Password reset for admin:', {
        reset_by: user?.id,
        target_admin_id: adminId,
        admin_email: admin.email
      });

      // TODO: パスワードリセット通知メール送信
      console.log('Password reset for admin:', admin.email);

    } catch (err) {
      console.error('Error resetting password:', err);
      setError(err instanceof Error ? err.message : 'パスワードリセットに失敗しました');
    }
  }, [supabase, user, administrators]);

  // 運営者詳細表示
  const handleViewDetail = (admin: AdministratorWithManagementInfo) => {
    setSelectedAdministrator(admin);
    setShowDetailModal(true);
  };

  // 運営者編集
  const handleEditAdministrator = (admin: AdministratorWithManagementInfo) => {
    setSelectedAdministrator(admin);
    setShowEditModal(true);
  };

  // 運営者削除
  const handleDeleteAdministrator = useCallback(async (adminId: string) => {
    try {
      // 自分自身は削除不可
      if (adminId === user?.profile?.id) {
        alert('⚠️ 自分自身のアカウントは削除できません。');
        return;
      }

      if (!confirm('⚠️ 重要な警告\n\nこの運営者アカウントを完全に削除します。\nこの操作は取り消すことができません。\n\n本当に削除しますか？')) {
        return;
      }

      setError(null);

      const admin = administrators.find(a => a.id === adminId);
      if (!admin) throw new Error('運営者が見つかりません');

      // 運営者データを削除
      const { error } = await supabase
        .from('administrators')
        .delete()
        .eq('id', adminId);
      
      if (error) throw error;

      // 対応するAuthユーザーも削除
      if (admin.user_id) {
        await supabase.auth.admin.deleteUser(admin.user_id);
      }

      // 監査ログ記録
      console.log('Administrator deleted:', {
        deleted_by: user?.id,
        deleted_admin_id: adminId,
        deleted_admin_email: admin.email
      });

      await fetchAdministrators();

    } catch (err) {
      console.error('Error deleting administrator:', err);
      setError(err instanceof Error ? err.message : '運営者の削除に失敗しました');
    }
  }, [supabase, user, administrators, fetchAdministrators]);

  // 初期データ取得
  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAdministrators();
    }
  }, [user, fetchAdministrators]);

  // 権限チェック（運営者のみアクセス可能）
  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900">アクセス権限がありません</h3>
            <p className="text-gray-500">この機能は運営者のみ利用可能です</p>
          </div>
        </div>
      </div>
    );
  }

  const breadcrumbItems = [
    { label: 'ホーム', href: '/' },
    { label: '運営者管理', href: '/administrators' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">運営者データを読み込み中...</span>
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
                運営者アカウント管理
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                システムの運営者アカウントの管理とセキュリティ設定
              </p>
            </div>
            <div className="mt-4 flex space-x-3 md:mt-0 md:ml-4">
              <button
                onClick={() => setShowSecurityModal(true)}
                className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                セキュリティ設定
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                新規運営者登録
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

          {/* セキュリティ警告 */}
          {statistics.security_alerts.accounts_without_2fa > 0 && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-md p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">セキュリティ警告</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>{statistics.security_alerts.accounts_without_2fa}個のアカウントで2要素認証が有効化されていません。</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 統計カード */}
          <AdministratorStatisticsCard
            statistics={statistics}
            className="mt-6"
          />

          {/* フィルター */}
          <AdministratorFilters
            filter={filter}
            onFilterChange={setFilter}
            className="mt-6"
          />

          {/* 一括操作 */}
          {selectedAdministrators.length > 0 && (
            <BulkAdministratorActions
              selectedAdministrators={selectedAdministrators}
              administrators={administrators}
              currentUserId={user?.profile?.id}
              onBulkAction={handleBulkAction}
              onClearSelection={() => setSelectedAdministrators([])}
              className="mt-4"
            />
          )}

          {/* 運営者一覧テーブル */}
          <AdministratorTable
            administrators={administrators}
            selectedAdministrators={selectedAdministrators}
            currentUserId={user?.profile?.id}
            onSelectionChange={setSelectedAdministrators}
            onViewDetail={handleViewDetail}
            onEdit={handleEditAdministrator}
            onDelete={handleDeleteAdministrator}
            onPasswordReset={(adminId) => handlePasswordReset(adminId)}
            sort={sort}
            onSortChange={setSort}
            className="mt-6"
          />

          <div className="mt-4 text-sm text-gray-500">
            {administrators.length} 人の運営者
          </div>
        </div>
      </main>

      {/* モーダル */}
      <AdministratorCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateAdministrator}
      />

      <AdministratorEditModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        administrator={selectedAdministrator}
        currentUserId={user?.profile?.id}
        onSubmit={handleUpdateAdministrator}
      />

      <AdministratorDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        administrator={selectedAdministrator}
        currentUserId={user?.profile?.id}
        onEdit={() => {
          setShowDetailModal(false);
          setShowEditModal(true);
        }}
        onPasswordReset={(adminId) => handlePasswordReset(adminId)}
      />

      <SecuritySettingsModal
        isOpen={showSecurityModal}
        onClose={() => setShowSecurityModal(false)}
        settings={securitySettings}
        onUpdate={setSecuritySettings}
      />
    </div>
  );
}