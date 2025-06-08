'use client';

import { useState } from 'react';
import { 
  ChevronUpIcon, 
  ChevronDownIcon, 
  EyeIcon, 
  PencilIcon, 
  KeyIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { TeacherWithManagementInfo, TeacherSort } from '@/types/teacherManagement';

interface TeacherTableProps {
  teachers: TeacherWithManagementInfo[];
  selectedTeachers: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  onViewDetail: (teacher: TeacherWithManagementInfo) => void;
  onEditTeacher: (teacher: TeacherWithManagementInfo) => void;
  onPasswordReset: (teacherId: string, newPassword: string) => Promise<void>;
  sort: TeacherSort;
  onSortChange: (sort: TeacherSort) => void;
  className?: string;
}

export default function TeacherTable({
  teachers,
  selectedTeachers,
  onSelectionChange,
  onViewDetail,
  onEditTeacher,
  onPasswordReset,
  sort,
  onSortChange,
  className = ''
}: TeacherTableProps) {
  const [resetPasswordId, setResetPasswordId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  // ソート処理
  const handleSort = (field: TeacherSort['field']) => {
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
      onSelectionChange(teachers.map(t => t.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectTeacher = (teacherId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedTeachers, teacherId]);
    } else {
      onSelectionChange(selectedTeachers.filter(id => id !== teacherId));
    }
  };

  // パスワードリセット処理
  const handlePasswordReset = async (teacherId: string) => {
    if (!newPassword.trim()) {
      alert('新しいパスワードを入力してください');
      return;
    }

    setProcessingId(teacherId);
    try {
      await onPasswordReset(teacherId, newPassword);
      setResetPasswordId(null);
      setNewPassword('');
      alert('パスワードをリセットしました');
    } catch (error) {
      console.error('Password reset error:', error);
    } finally {
      setProcessingId(null);
    }
  };

  // ランダムパスワード生成
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(password);
  };

  // ステータス表示
  const getStatusBadge = (status: string) => {
    switch (status) {
      case '有効':
        return (
          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
            有効
          </span>
        );
      case '無効':
        return (
          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
            無効
          </span>
        );
      case '承認待ち':
        return (
          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
            承認待ち
          </span>
        );
      default:
        return (
          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const SortButton = ({ field, children }: { field: TeacherSort['field']; children: React.ReactNode }) => (
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

  const allSelected = teachers.length > 0 && selectedTeachers.length === teachers.length;
  const someSelected = selectedTeachers.length > 0 && selectedTeachers.length < teachers.length;

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
                    <SortButton field="full_name">講師名</SortButton>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <SortButton field="email">メールアドレス</SortButton>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <SortButton field="account_status">ステータス</SortButton>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <SortButton field="assigned_students_count">担当生徒数</SortButton>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    連絡先
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <SortButton field="registration_application_date">登録日</SortButton>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {teachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedTeachers.includes(teacher.id)}
                        onChange={(e) => handleSelectTeacher(teacher.id, e.target.checked)}
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{teacher.full_name}</div>
                        {teacher.furigana_name && (
                          <div className="text-xs text-gray-500">{teacher.furigana_name}</div>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{teacher.email}</div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(teacher.account_status)}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <UserGroupIcon className="h-4 w-4 mr-1 text-gray-400" />
                        {teacher.assigned_students_count}人
                      </div>
                      {teacher.permissions.can_edit_todo_lists > 0 && (
                        <div className="text-xs text-blue-600">
                          編集権限: {teacher.permissions.can_edit_todo_lists}件
                        </div>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {teacher.phone_number || '-'}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {teacher.registration_application_date ? 
                        new Date(teacher.registration_application_date).toLocaleDateString('ja-JP') :
                        new Date(teacher.created_at).toLocaleDateString('ja-JP')
                      }
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onViewDetail(teacher)}
                          className="text-blue-600 hover:text-blue-900"
                          title="詳細表示"
                        >
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => onEditTeacher(teacher)}
                          className="text-green-600 hover:text-green-900"
                          title="編集"
                        >
                          <PencilIcon className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => setResetPasswordId(teacher.id)}
                          className="text-orange-600 hover:text-orange-900"
                          title="パスワードリセット"
                        >
                          <KeyIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {teachers.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-500">
                  条件に一致する講師が見つかりませんでした
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* パスワードリセットモーダル */}
      {resetPasswordId && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              パスワードリセット
            </h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  新しいパスワード
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    id="newPassword"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="新しいパスワードを入力"
                  />
                  <button
                    onClick={generateRandomPassword}
                    className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                  >
                    自動生成
                  </button>
                </div>
              </div>
              
              <div className="text-xs text-gray-500">
                ※ パスワードは12文字以上を推奨します
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setResetPasswordId(null);
                  setNewPassword('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                onClick={() => handlePasswordReset(resetPasswordId)}
                disabled={!newPassword.trim() || processingId === resetPasswordId}
                className="px-4 py-2 bg-orange-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
              >
                {processingId === resetPasswordId ? 'リセット中...' : 'リセット実行'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}