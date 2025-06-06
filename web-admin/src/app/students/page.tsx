'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { StudentWithAssignments } from '@/types/student';

export default function StudentsPage() {
  const [students, setStudents] = useState<StudentWithAssignments[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentWithAssignments[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [gradeFilter, setGradeFilter] = useState<string>('all');

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm, statusFilter, gradeFilter]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select(`
          *,
          assignments!inner(
            id,
            role,
            status,
            assignment_start_date,
            assignment_end_date,
            teacher:teachers(
              id,
              full_name,
              account_status
            )
          )
        `)
        .eq('assignments.status', '有効');

      if (studentsError) {
        throw new Error(studentsError.message);
      }

      setStudents(studentsData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '生徒データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = students;

    // 名前・フリガナで検索
    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.furigana_name && student.furigana_name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // 在籍状況で絞り込み
    if (statusFilter !== 'all') {
      filtered = filtered.filter(student => student.status === statusFilter);
    }

    // 学年で絞り込み
    if (gradeFilter !== 'all') {
      filtered = filtered.filter(student => student.grade === gradeFilter);
    }

    setFilteredStudents(filtered);
  };

  const getUniqueGrades = () => {
    const grades = students
      .map(student => student.grade)
      .filter(grade => grade)
      .filter((value, index, self) => self.indexOf(value) === index);
    return grades;
  };

  const getTeachersByRole = (assignments: any[]) => {
    const mentorTeachers = assignments
      .filter(assignment => assignment.role === '面談担当（リスト編集可）')
      .map(assignment => assignment.teacher.full_name);
    
    const lessonTeachers = assignments
      .filter(assignment => assignment.role === '授業担当（コメントのみ）')
      .map(assignment => assignment.teacher.full_name);

    return {
      mentors: mentorTeachers.join(', ') || '-',
      instructors: lessonTeachers.join(', ') || '-'
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">読み込み中...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">エラーが発生しました</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">生徒管理</h1>
          <div className="flex justify-between items-center">
            <p className="text-gray-600">
              全{students.length}名の生徒が登録されています
            </p>
            <button className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md font-medium transition-colors">
              新規生徒登録
            </button>
          </div>
        </div>

        {/* 検索・フィルター */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                生徒名・フリガナで検索
              </label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="生徒名またはフリガナを入力"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                在籍状況
              </label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">すべて</option>
                <option value="在籍中">在籍中</option>
                <option value="休会中">休会中</option>
                <option value="退会済み">退会済み</option>
              </select>
            </div>
            <div>
              <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-2">
                学年
              </label>
              <select
                id="grade"
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">すべて</option>
                {getUniqueGrades().map(grade => (
                  <option key={grade} value={grade}>{grade}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 検索結果の件数表示 */}
        {filteredStudents.length !== students.length && (
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              {filteredStudents.length}件の生徒が見つかりました
            </p>
          </div>
        )}

        {/* テーブル */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    生徒氏名
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    学年
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    通塾先
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    在籍状況
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    担当講師（面談）
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    担当講師（授業）
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student) => {
                  const teachers = getTeachersByRole(student.assignments);
                  return (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {student.full_name}
                          </div>
                          {student.furigana_name && (
                            <div className="text-sm text-gray-500">
                              {student.furigana_name}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.grade || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.school_attended || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          student.status === '在籍中' 
                            ? 'bg-green-100 text-green-800'
                            : student.status === '休会中'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {student.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {teachers.mentors}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {teachers.instructors}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900 transition-colors">
                          編集
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* データがない場合 */}
        {filteredStudents.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">
              {searchTerm || statusFilter !== 'all' || gradeFilter !== 'all'
                ? '検索条件に一致する生徒が見つかりませんでした。'
                : '登録されている生徒がありません。'
              }
            </div>
          </div>
        )}
      </div>
    </div>
  );
}