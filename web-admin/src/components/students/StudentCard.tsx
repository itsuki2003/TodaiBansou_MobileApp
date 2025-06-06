'use client';

import DropdownMenu, { DropdownMenuItem } from '@/components/ui/DropdownMenu';
import { StudentWithAssignments } from '@/types/student';

interface StudentCardProps {
  student: StudentWithAssignments;
  menuItems: DropdownMenuItem[];
  teachers: {
    mentors: string;
    instructors: string;
  };
}

export default function StudentCard({ student, menuItems, teachers }: StudentCardProps) {
  // ステータスのスタイリング
  const getStatusStyle = (status: string) => {
    switch (status) {
      case '在籍中':
        return 'bg-green-100 text-green-800 border-green-200';
      case '休会中':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case '退会済み':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow duration-200">
      {/* ヘッダー部分：名前・ステータス・操作 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-medium text-gray-900 truncate">
            {student.full_name}
          </h3>
          {student.furigana_name && (
            <p className="text-sm text-gray-500 mt-0.5">
              {student.furigana_name}
            </p>
          )}
        </div>
        
        <div className="flex items-center space-x-3 flex-shrink-0 ml-4">
          {/* ステータスバッジ */}
          <span className={`inline-flex px-2.5 py-1 text-xs font-semibold rounded-full border ${getStatusStyle(student.status)}`}>
            {student.status}
          </span>
          
          {/* 操作メニュー */}
          <DropdownMenu items={menuItems} />
        </div>
      </div>

      {/* 詳細情報 */}
      <div className="space-y-2">
        {/* 学年・通塾先 */}
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-gray-500 font-medium">学年:</span>
            <span className="ml-2 text-gray-900">{student.grade || '-'}</span>
          </div>
          <div>
            <span className="text-gray-500 font-medium">通塾先:</span>
            <span className="ml-2 text-gray-900">{student.school_attended || '-'}</span>
          </div>
        </div>

        {/* 担当講師情報 */}
        <div className="border-t border-gray-100 pt-3 mt-3">
          <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            担当講師
          </h4>
          <div className="space-y-1.5 text-sm">
            <div className="flex">
              <span className="text-gray-500 font-medium w-12 flex-shrink-0">面談:</span>
              <span className="text-gray-900 break-words">{teachers.mentors}</span>
            </div>
            <div className="flex">
              <span className="text-gray-500 font-medium w-12 flex-shrink-0">授業:</span>
              <span className="text-gray-900 break-words">{teachers.instructors}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// タブレット用の簡略テーブル行コンポーネント
interface StudentRowTabletProps {
  student: StudentWithAssignments;
  menuItems: DropdownMenuItem[];
}

export function StudentRowTablet({ student, menuItems }: StudentRowTabletProps) {
  const getStatusStyle = (status: string) => {
    switch (status) {
      case '在籍中':
        return 'bg-green-100 text-green-800';
      case '休会中':
        return 'bg-yellow-100 text-yellow-800';
      case '退会済み':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <tr className="hover:bg-gray-50">
      {/* 生徒氏名 */}
      <td className="px-4 py-3">
        <div>
          <div className="text-sm font-medium text-gray-900">
            {student.full_name}
          </div>
          {student.furigana_name && (
            <div className="text-xs text-gray-500">
              {student.furigana_name}
            </div>
          )}
        </div>
      </td>

      {/* 学年 */}
      <td className="px-4 py-3 text-sm text-gray-900">
        {student.grade || '-'}
      </td>

      {/* 通塾先 */}
      <td className="px-4 py-3 text-sm text-gray-900">
        <div className="max-w-[120px] truncate" title={student.school_attended || '-'}>
          {student.school_attended || '-'}
        </div>
      </td>

      {/* 在籍状況 */}
      <td className="px-4 py-3">
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusStyle(student.status)}`}>
          {student.status}
        </span>
      </td>

      {/* 操作 */}
      <td className="px-4 py-3 text-sm font-medium">
        <DropdownMenu items={menuItems} />
      </td>
    </tr>
  );
}