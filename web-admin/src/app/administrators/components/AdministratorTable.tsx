'use client';

import { useState } from 'react';
import { 
  ChevronUpIcon, 
  ChevronDownIcon, 
  EyeIcon, 
  PencilIcon, 
  TrashIcon,
  KeyIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import { AdministratorWithManagementInfo, AdministratorSort } from '@/types/adminManagement';

interface AdministratorTableProps {
  administrators: AdministratorWithManagementInfo[];
  selectedAdministrators: string[];
  currentUserId?: string;
  onSelectionChange: (selectedIds: string[]) => void;
  onViewDetail: (admin: AdministratorWithManagementInfo) => void;
  onEdit: (admin: AdministratorWithManagementInfo) => void;
  onDelete: (adminId: string) => Promise<void>;
  onPasswordReset: (adminId: string) => Promise<void>;
  sort: AdministratorSort;
  onSortChange: (sort: AdministratorSort) => void;
  className?: string;
}

export default function AdministratorTable({
  administrators,
  selectedAdministrators,
  currentUserId,
  onSelectionChange,
  onViewDetail,
  onEdit,
  onDelete,
  onPasswordReset,
  sort,
  onSortChange,
  className = ''
}: AdministratorTableProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [resettingPasswordId, setResettingPasswordId] = useState<string | null>(null);

  // ソート処理
  const handleSort = (field: AdministratorSort['field']) => {
    if (sort.field === field) {
      onSortChange({
        field,
        direction: sort.direction === 'asc' ? 'desc' : 'asc'
      });
    } else {
      onSortChange({
        field,
        direction: 'asc'
      });
    }
  };

  // 選択処理
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(administrators.map(a => a.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectAdministrator = (adminId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedAdministrators, adminId]);
    } else {
      onSelectionChange(selectedAdministrators.filter(id => id !== adminId));
    }
  };

  // 削除処理
  const handleDelete = async (adminId: string) => {
    // 自分自身は削除不可
    if (adminId === currentUserId) {
      alert('⚠️ 自分自身のアカウントは削除できません。');
      return;
    }

    setDeletingId(adminId);
    try {
      await onDelete(adminId);
    } catch (error) {
      console.error('Delete error:', error);
    } finally {
      setDeletingId(null);
    }
  };

  // パスワードリセット処理
  const handlePasswordReset = async (adminId: string) => {
    if (!confirm('この運営者のパスワードをリセットしますか？\n新しいパスワードがメールで送信されます。')) {
      return;
    }

    setResettingPasswordId(adminId);
    try {
      await onPasswordReset(adminId);
      alert('パスワードをリセットしました。新しいパスワードがメールで送信されました。');
    } catch (error) {
      console.error('Password reset error:', error);
    } finally {
      setResettingPasswordId(null);
    }
  };

  // ステータス表示
  const getStatusBadge = (admin: AdministratorWithManagementInfo) => {
    const isCurrentUser = admin.id === currentUserId;
    
    switch (admin.account_status) {
      case '有効':
        return (
          <span className={`inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 ${isCurrentUser ? 'ring-2 ring-blue-300' : ''}`}>
            <ShieldCheckIcon className="h-3 w-3 mr-1" />
            有効
            {isCurrentUser && <span className="ml-1">(自分)</span>}
          </span>
        );
      case '無効':
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
            <ShieldExclamationIcon className="h-3 w-3 mr-1" />
            無効
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
            {admin.account_status}
          </span>
        );
    }
  };

  // ログイン頻度の表示
  const getLoginFrequencyBadge = (frequency: string) => {
    const badges = {
      'daily': { color: 'bg-green-100 text-green-800', text: '毎日' },
      'weekly': { color: 'bg-blue-100 text-blue-800', text: '週1回' },
      'monthly': { color: 'bg-yellow-100 text-yellow-800', text: '月1回' },
      'rarely': { color: 'bg-orange-100 text-orange-800', text: '稀に' },
      'never': { color: 'bg-red-100 text-red-800', text: '未ログイン' }
    };

    const badge = badges[frequency as keyof typeof badges] || { color: 'bg-gray-100 text-gray-800', text: frequency };

    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${badge.color}`}>
        {badge.text}
      </span>
    );
  };

  // セキュリティスコア表示
  const getSecurityScore = (admin: AdministratorWithManagementInfo) => {
    const issues = [];
    if (!admin.security_info.two_factor_enabled) issues.push('2FA無効');
    if (admin.security_info.failed_login_attempts > 0) issues.push('ログイン失敗あり');
    if (!admin.last_login_at) issues.push('未ログイン');

    if (issues.length === 0) {
      return <span className="text-xs text-green-600">良好</span>;
    } else if (issues.length <= 1) {
      return <span className="text-xs text-yellow-600">注意 ({issues.length})</span>;
    } else {
      return <span className="text-xs text-red-600">危険 ({issues.length})</span>;
    }
  };

  const SortButton = ({ field, children }: { field: AdministratorSort['field']; children: React.ReactNode }) => (
    <button
      onClick={() => handleSort(field)}
      className="group inline-flex items-center space-x-1 text-left font-medium text-gray-900 hover:text-gray-600"
    >
      <span>{children}</span>
      {sort.field === field ? (
        sort.direction === 'asc' ? (
          <ChevronUpIcon className="h-4 w-4" />
        ) : (
          <ChevronDownIcon className="h-4 w-4" />
        )
      ) : (
        <div className="h-4 w-4 opacity-0 group-hover:opacity-50">
          <ChevronUpIcon className="h-4 w-4" />
        </div>
      )}
    </button>
  );

  const allSelected = administrators.length > 0 && selectedAdministrators.length === administrators.length;
  const someSelected = selectedAdministrators.length > 0 && selectedAdministrators.length < administrators.length;

  return (
    <div className={className}>
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = someSelected;
                      }}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <SortButton field="full_name">運営者名</SortButton>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <SortButton field="email">メールアドレス</SortButton>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <SortButton field="account_status">ステータス</SortButton>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <SortButton field="login_frequency">ログイン頻度</SortButton>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <SortButton field="last_login_at">最終ログイン</SortButton>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    セキュリティ
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <SortButton field="created_at">作成日</SortButton>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {administrators.map((admin) => {
                  const isCurrentUser = admin.id === currentUserId;
                  const canDelete = !isCurrentUser;
                  const canDeactivate = !isCurrentUser || admin.account_status !== '有効';
                  
                  return (
                    <tr key={admin.id} className={`hover:bg-gray-50 ${isCurrentUser ? 'bg-blue-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedAdministrators.includes(admin.id)}
                          onChange={(e) => handleSelectAdministrator(admin.id, e.target.checked)}
                          className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                        />
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900 flex items-center">
                              {admin.full_name}
                              {isCurrentUser && (
                                <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                  自分
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              作成方法: {
                                admin.account_creation_method === 'manual' ? '手動' :
                                admin.account_creation_method === 'system' ? 'システム' : '一括'
                              }
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{admin.email}</div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(admin)}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getLoginFrequencyBadge(admin.login_frequency)}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {admin.last_login_at ? (
                            <>
                              {new Date(admin.last_login_at).toLocaleDateString('ja-JP')}
                              <div className="text-xs text-gray-500">
                                {new Date(admin.last_login_at).toLocaleTimeString('ja-JP', { 
                                  hour: '2-digit', 
                                  minute: '2-digit' 
                                })}
                              </div>
                            </>
                          ) : (
                            <span className="text-gray-500 flex items-center">
                              <ClockIcon className="h-4 w-4 mr-1" />
                              未ログイン
                            </span>
                          )}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col space-y-1">
                          {getSecurityScore(admin)}
                          <div className="flex items-center space-x-1">
                            {!admin.security_info.two_factor_enabled && (
                              <span className="inline-flex items-center px-1 py-0.5 rounded text-xs bg-red-100 text-red-700" title="2FA無効">
                                <ShieldExclamationIcon className="h-3 w-3" />
                              </span>
                            )}
                            {admin.security_info.failed_login_attempts > 0 && (
                              <span className="inline-flex items-center px-1 py-0.5 rounded text-xs bg-yellow-100 text-yellow-700" title="ログイン失敗履歴あり">
                                <ExclamationTriangleIcon className="h-3 w-3" />
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <CalendarDaysIcon className="h-4 w-4 mr-1 text-gray-400" />
                          {new Date(admin.created_at).toLocaleDateString('ja-JP')}
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => onViewDetail(admin)}
                            className="text-blue-600 hover:text-blue-900"
                            title="詳細表示"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => onEdit(admin)}
                            className="text-green-600 hover:text-green-900"
                            title="編集"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          
                          <button
                            onClick={() => handlePasswordReset(admin.id)}
                            disabled={resettingPasswordId === admin.id}
                            className="text-orange-600 hover:text-orange-900 disabled:opacity-50"
                            title="パスワードリセット"
                          >
                            {resettingPasswordId === admin.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-600"></div>
                            ) : (
                              <KeyIcon className="h-4 w-4" />
                            )}
                          </button>
                          
                          {canDelete ? (
                            <button
                              onClick={() => handleDelete(admin.id)}
                              disabled={deletingId === admin.id}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50"
                              title="削除"
                            >
                              {deletingId === admin.id ? (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                              ) : (
                                <TrashIcon className="h-4 w-4" />
                              )}
                            </button>
                          ) : (
                            <div className="w-4 h-4 text-gray-300" title="自分自身のアカウントは削除できません">
                              <TrashIcon className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {administrators.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-500">
                  条件に一致する運営者が見つかりませんでした
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* セキュリティ警告表示 */}
      {administrators.some(admin => !admin.security_info.two_factor_enabled || admin.security_info.failed_login_attempts > 0) && (
        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">セキュリティ注意事項</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc list-inside space-y-1">
                  {administrators.filter(admin => !admin.security_info.two_factor_enabled).length > 0 && (
                    <li>2要素認証が無効のアカウントがあります。セキュリティ強化のため有効化を推奨します。</li>
                  )}
                  {administrators.filter(admin => admin.security_info.failed_login_attempts > 0).length > 0 && (
                    <li>ログイン失敗履歴があるアカウントがあります。不審な活動がないか確認してください。</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}