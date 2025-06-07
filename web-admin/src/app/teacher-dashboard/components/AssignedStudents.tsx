'use client';

import { AssignedStudent } from '@/types/teacher';

interface AssignedStudentsProps {
  students: AssignedStudent[];
  onRefresh: () => void;
}

export default function AssignedStudents({ students, onRefresh }: AssignedStudentsProps) {
  if (students.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            担当生徒
          </h3>
        </div>
        <div className="p-12 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">担当生徒なし</h3>
          <p className="mt-1 text-sm text-gray-500">
            現在、担当している生徒はいません。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">
          担当生徒 ({students.length}名)
        </h3>
        <button
          onClick={onRefresh}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          更新
        </button>
      </div>

      <div className="divide-y divide-gray-200">
        {students.map((assignment) => (
          <div key={assignment.id} className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* 生徒アバター */}
                <div className="h-12 w-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-lg">
                    {assignment.student.full_name.charAt(0)}
                  </span>
                </div>

                {/* 生徒情報 */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900">
                    {assignment.student.full_name}
                  </h4>
                  <div className="flex items-center space-x-4 mt-1">
                    {assignment.student.grade && (
                      <span className="text-sm text-gray-500">
                        {assignment.student.grade}
                      </span>
                    )}
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      assignment.student.status === '在籍中' 
                        ? 'bg-green-100 text-green-800'
                        : assignment.student.status === '休会中'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {assignment.student.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* 担当役割と期間 */}
              <div className="text-right">
                <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                  assignment.role === '面談担当（リスト編集可）'
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-blue-100 text-blue-800'
                }`}>
                  {assignment.role === '面談担当（リスト編集可）' ? '面談担当' : '授業担当'}
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  {assignment.assignment_start_date && (
                    <div>
                      開始: {new Date(assignment.assignment_start_date).toLocaleDateString('ja-JP')}
                    </div>
                  )}
                  {assignment.assignment_end_date && (
                    <div>
                      終了: {new Date(assignment.assignment_end_date).toLocaleDateString('ja-JP')}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* クイックアクション */}
            <div className="mt-4 flex space-x-3">
              {assignment.role === '面談担当（リスト編集可）' && (
                <a
                  href={`/students/${assignment.student_id}/todos`}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                  やることリスト
                </a>
              )}
              
              <a
                href={`/schedule?student=${assignment.student_id}`}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V3a2 2 0 012-2h4a2 2 0 012 2v4M9 11v4a2 2 0 002 2h2a2 2 0 002-2v-4M7 21h10" />
                </svg>
                スケジュール
              </a>

              <a
                href={`/students/${assignment.student_id}`}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                詳細
              </a>
            </div>

            {/* 備考 */}
            {assignment.notes && (
              <div className="mt-3 p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-700">{assignment.notes}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}