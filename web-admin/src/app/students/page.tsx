'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';
import { StudentWithAssignments, Assignment } from '@/types/student';
import Header from '@/components/ui/Header';
import DropdownMenu, { AlertDialog, DropdownMenuItem } from '@/components/ui/DropdownMenu';
import Breadcrumb, { breadcrumbPaths } from '@/components/ui/Breadcrumb';
import StudentCard, { StudentRowTablet } from '@/components/students/StudentCard';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import PageHeader from '@/components/ui/PageHeader';
import { useDebounce } from '@/hooks/useDebounce';
import { PageLoader } from '@/components/ui/common/AppLoader';
import { ErrorDisplay } from '@/components/ui/common/ErrorDisplay';
import { useAuth } from '@/contexts/AuthContext';

export default function StudentsPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState<StudentWithAssignments[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<StudentWithAssignments[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  
  // デバウンス処理を適用（300ms後に検索実行）
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
  // 削除関連の状態
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentWithAssignments | null>(null);

  useEffect(() => {
    if (user) {
      fetchStudents();
    }
  }, [user]);

  useEffect(() => {
    filterStudents();
  }, [students, debouncedSearchTerm, statusFilter, gradeFilter]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
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

      // 講師の場合は担当生徒のみを取得
      if (user?.role === 'teacher' && user.profile?.id) {
        query = query.eq('assignments.teacher_id', user.profile.id);
      }

      const { data: studentsData, error: studentsError } = await query;

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

    // 名前・フリガナで検索（デバウンスされた値を使用）
    if (debouncedSearchTerm) {
      filtered = filtered.filter(student =>
        student.full_name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
        (student.furigana_name && student.furigana_name.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
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

  const getTeachersByRole = (assignments: Assignment[]) => {
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

  // 削除確認ダイアログを開く
  const handleDeleteClick = (student: StudentWithAssignments) => {
    setSelectedStudent(student);
    setDeleteDialogOpen(true);
  };

  // 削除実行
  const handleDeleteConfirm = async () => {
    if (!selectedStudent) return;

    setDeleteLoading(true);
    try {
      const response = await fetch(`/api/students/${selectedStudent.id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        // 成功時は一覧を再取得
        await fetchStudents();
        setDeleteDialogOpen(false);
        setSelectedStudent(null);
      } else {
        setError(result.error || '削除に失敗しました');
      }
    } catch (err) {
      console.error('Delete error:', err);
      setError('削除中にエラーが発生しました');
    } finally {
      setDeleteLoading(false);
    }
  };

  // ドロップダウンメニューのアイテムを生成
  const getMenuItems = (student: StudentWithAssignments): DropdownMenuItem[] => [
    {
      label: '詳細表示',
      onClick: () => window.location.href = `/students/${student.id}`,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
    },
    {
      label: 'やることリスト',
      onClick: () => window.location.href = `/students/${student.id}/todos`,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      label: '編集',
      onClick: () => window.location.href = `/students/${student.id}/edit`,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
    },
    {
      label: '削除',
      onClick: () => handleDeleteClick(student),
      variant: 'destructive',
      disabled: student.status === '退会済み',
      separator: true,
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      ),
    },
  ];

  if (loading) {
    return <PageLoader message="生徒データを読み込み中..." />;
  }

  if (error) {
    return (
      <ErrorDisplay 
        errorMessage={error}
        onRetry={fetchStudents}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Header />
      <div className="max-w-7xl mx-auto p-8">
        {/* パンくずリスト */}
        <div className="mb-6">
          <Breadcrumb 
            items={[
              breadcrumbPaths.home,
              breadcrumbPaths.students
            ]}
          />
        </div>

        {/* ページヘッダー */}
        <PageHeader
          title="生徒管理"
          description={`全${students.length}名の生徒が登録されています`}
          icon="👥"
          colorTheme="primary"
          actions={
            <Button asChild>
              <Link href="/students/new">
                新規生徒登録
              </Link>
            </Button>
          }
        />

        {/* 検索・フィルター */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
          </CardContent>
        </Card>

        {/* 検索結果の件数表示 */}
        {filteredStudents.length !== students.length && (
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              {filteredStudents.length}件の生徒が見つかりました
            </p>
          </div>
        )}

        {/* デスクトップ用テーブル */}
        <Card className="hidden lg:block overflow-hidden" padding="none">
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
                        <DropdownMenu items={getMenuItems(student)} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        {/* タブレット用簡略テーブル */}
        <Card className="hidden md:block lg:hidden overflow-hidden" padding="none">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    生徒氏名
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    学年
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    通塾先
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    在籍状況
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <StudentRowTablet 
                    key={student.id}
                    student={student} 
                    menuItems={getMenuItems(student)}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* モバイル用カードレイアウト */}
        <div className="md:hidden space-y-4">
          {filteredStudents.map((student) => {
            const teachers = getTeachersByRole(student.assignments);
            return (
              <StudentCard
                key={student.id}
                student={student}
                menuItems={getMenuItems(student)}
                teachers={teachers}
              />
            );
          })}
        </div>

        {/* データがない場合 */}
        {filteredStudents.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-500">
              {debouncedSearchTerm || statusFilter !== 'all' || gradeFilter !== 'all'
                ? '検索条件に一致する生徒が見つかりませんでした。'
                : '登録されている生徒がありません。'
              }
            </div>
          </div>
        )}

        {/* 削除確認ダイアログ */}
        <AlertDialog
          isOpen={deleteDialogOpen}
          onClose={() => {
            if (!deleteLoading) {
              setDeleteDialogOpen(false);
              setSelectedStudent(null);
            }
          }}
          onConfirm={handleDeleteConfirm}
          title="生徒の退会処理"
          description={
            selectedStudent
              ? `本当に「${selectedStudent.full_name}」さんを退会済みにしますか？この操作により生徒のステータスが「退会済み」に変更されます。データが完全に削除されるわけではありませんが、この操作は元に戻せません。`
              : ''
          }
          confirmText={deleteLoading ? "処理中..." : "退会にする"}
          cancelText="キャンセル"
          variant="destructive"
        />
      </div>
    </div>
  );
}