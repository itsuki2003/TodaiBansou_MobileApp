/**
 * 最適化された生徒カードコンポーネント
 * - React.memo による不要な再レンダリング防止
 * - useCallback による関数メモ化
 * - useMemo による計算結果メモ化
 */

import { memo, useMemo, useCallback } from 'react';
import Link from 'next/link';
import type { StudentWithDetails } from '@/hooks/useStudentsOptimized';
import type { Teacher } from '@/types/student';

interface StudentCardOptimizedProps {
  student: StudentWithDetails;
  teachers: Teacher[];
  onEdit?: (studentId: string) => void;
  onDelete?: (studentId: string) => void;
  className?: string;
}

// メモ化されたステータスバッジコンポーネント
const StatusBadge = memo(({ status }: { status: string }) => {
  const statusConfig = useMemo(() => {
    switch (status) {
      case '在籍中':
        return { color: 'bg-green-100 text-green-800', icon: '✓' };
      case '休会中':
        return { color: 'bg-yellow-100 text-yellow-800', icon: '⏸' };
      case '退会済み':
        return { color: 'bg-red-100 text-red-800', icon: '✗' };
      default:
        return { color: 'bg-gray-100 text-gray-800', icon: '?' };
    }
  }, [status]);

  return (
    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
      <span className="mr-1">{statusConfig.icon}</span>
      {status}
    </span>
  );
});

StatusBadge.displayName = 'StatusBadge';

// メモ化された講師リストコンポーネント
const TeacherList = memo(({ 
  teachers, 
  label, 
  emptyText = '未設定' 
}: { 
  teachers: string[]; 
  label: string; 
  emptyText?: string; 
}) => {
  const displayText = useMemo(() => {
    return teachers.length > 0 ? teachers.join(', ') : emptyText;
  }, [teachers, emptyText]);

  const textColor = useMemo(() => {
    return teachers.length > 0 ? 'text-gray-900' : 'text-gray-400';
  }, [teachers.length]);

  return (
    <div className="text-sm">
      <span className="font-medium text-gray-700">{label}:</span>
      <span className={`ml-2 ${textColor}`}>{displayText}</span>
    </div>
  );
});

TeacherList.displayName = 'TeacherList';

// メモ化されたアクションボタンコンポーネント
const ActionButtons = memo(({ 
  studentId, 
  mentorTeachers,
  onEdit, 
  onDelete 
}: { 
  studentId: string; 
  mentorTeachers: string[];
  onEdit?: (studentId: string) => void; 
  onDelete?: (studentId: string) => void; 
}) => {
  const handleEdit = useCallback(() => {
    onEdit?.(studentId);
  }, [onEdit, studentId]);

  const handleDelete = useCallback(() => {
    onDelete?.(studentId);
  }, [onDelete, studentId]);

  const canManageTodos = useMemo(() => {
    return mentorTeachers.length > 0;
  }, [mentorTeachers.length]);

  return (
    <div className="flex space-x-2 mt-4">
      {/* やることリスト管理（面談担当講師が設定されている場合のみ） */}
      {canManageTodos && (
        <Link
          href={`/students/${studentId}/todos`}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          やることリスト
        </Link>
      )}

      {/* 詳細表示 */}
      <Link
        href={`/students/${studentId}`}
        className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
      >
        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        詳細
      </Link>

      {/* 編集ボタン */}
      {onEdit && (
        <button
          onClick={handleEdit}
          className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          編集
        </button>
      )}

      {/* 削除ボタン */}
      {onDelete && (
        <button
          onClick={handleDelete}
          className="inline-flex items-center px-3 py-2 border border-red-300 text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
        >
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          削除
        </button>
      )}
    </div>
  );
});

ActionButtons.displayName = 'ActionButtons';

// メインコンポーネント
const StudentCardOptimized = memo<StudentCardOptimizedProps>(({
  student,
  teachers,
  onEdit,
  onDelete,
  className = '',
}) => {
  // 表示データのメモ化
  const displayData = useMemo(() => ({
    enrollmentDate: new Date(student.enrollment_date).toLocaleDateString('ja-JP'),
    hasGrade: Boolean(student.grade),
    hasSchool: Boolean(student.school_attended),
    assignmentCount: student.totalAssignments,
  }), [student.enrollment_date, student.grade, student.school_attended, student.totalAssignments]);

  // アバターの初期文字をメモ化
  const avatarInitial = useMemo(() => {
    return student.full_name.charAt(0);
  }, [student.full_name]);

  // カードのホバー効果用クラス
  const cardClasses = useMemo(() => {
    return `bg-white overflow-hidden shadow-sm border border-gray-200 rounded-lg hover:shadow-md transition-shadow duration-200 ${className}`;
  }, [className]);

  return (
    <div className={cardClasses}>
      <div className="p-6">
        {/* ヘッダー部分 */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-4">
            {/* アバター */}
            <div className="h-12 w-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white font-medium text-lg">
                {avatarInitial}
              </span>
            </div>

            {/* 基本情報 */}
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-medium text-gray-900 truncate">
                {student.full_name}
              </h3>
              {student.furigana_name && (
                <p className="text-sm text-gray-500 truncate">
                  {student.furigana_name}
                </p>
              )}
              <div className="flex items-center space-x-3 mt-2">
                {displayData.hasGrade && (
                  <span className="text-sm text-gray-600">
                    {student.grade}
                  </span>
                )}
                {displayData.hasSchool && (
                  <span className="text-sm text-gray-600">
                    {student.school_attended}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ステータス */}
          <StatusBadge status={student.status} />
        </div>

        {/* 詳細情報 */}
        <div className="mt-4 space-y-2">
          <div className="text-sm">
            <span className="font-medium text-gray-700">入会日:</span>
            <span className="ml-2 text-gray-900">{displayData.enrollmentDate}</span>
          </div>

          <TeacherList 
            teachers={student.mentorTeachers} 
            label="面談担当講師" 
          />
          
          <TeacherList 
            teachers={student.lessonTeachers} 
            label="授業担当講師" 
          />

          {displayData.assignmentCount > 0 && (
            <div className="text-sm">
              <span className="font-medium text-gray-700">担当講師数:</span>
              <span className="ml-2 text-gray-900">{displayData.assignmentCount}名</span>
            </div>
          )}

          {student.notes && (
            <div className="mt-3 p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-700 line-clamp-2">{student.notes}</p>
            </div>
          )}
        </div>

        {/* アクションボタン */}
        <ActionButtons
          studentId={student.id}
          mentorTeachers={student.mentorTeachers}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
});

StudentCardOptimized.displayName = 'StudentCardOptimized';

export default StudentCardOptimized;