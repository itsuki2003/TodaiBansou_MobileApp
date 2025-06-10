'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import Header from '@/components/ui/Header';
import Breadcrumb from '@/components/ui/Breadcrumb';
import PageHeader from '@/components/ui/PageHeader';
import { 
  StudentWithAssignmentDetails, 
  TeacherOption, 
  AssignmentFilter, 
  AssignmentSort,
  AssignmentChangeData
} from '@/types/assignment';
import AssignmentTable from './components/AssignmentTable';
import AssignmentFilters from './components/AssignmentFilters';
import AssignmentHistory from './components/AssignmentHistory';
import BulkActions from './components/BulkActions';

export default function AssignmentsPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState<StudentWithAssignmentDetails[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  
  const [filter, setFilter] = useState<AssignmentFilter>({
    search: '',
    status: 'all',
    grade: 'all',
    hasInterviewTeacher: 'all',
    hasLessonTeacher: 'all',
    teacherId: 'all'
  });

  const [sort, setSort] = useState<AssignmentSort>({
    field: 'full_name',
    direction: 'asc'
  });

  const supabase = useMemo(() => createClient(), []);

  // 生徒と担当割り当てデータの取得
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // 生徒データと担当割り当て情報を取得
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select(`
          *,
          assignments!inner (
            id,
            teacher_id,
            role,
            status,
            assignment_start_date,
            teachers!inner (
              id,
              full_name,
              account_status
            )
          )
        `)
        .eq('assignments.status', '有効')
        .order('full_name');

      if (studentsError) throw studentsError;

      // 講師データを取得
      const { data: teachersData, error: teachersError } = await supabase
        .from('teachers')
        .select(`
          id,
          full_name,
          account_status,
          assignments!left (
            id,
            student_id,
            status
          )
        `)
        .eq('account_status', '有効')
        .order('full_name');

      if (teachersError) throw teachersError;

      // データを整形
      const formattedStudents: StudentWithAssignmentDetails[] = (studentsData || []).map(student => {
        const assignments = student.assignments || [];
        
        const interviewAssignment = assignments.find(
          (a: any) => a.role === '面談担当（リスト編集可）'
        );
        
        const lessonAssignments = assignments.filter(
          (a: any) => a.role === '授業担当（コメントのみ）'
        );

        return {
          ...student,
          interviewTeacher: interviewAssignment ? {
            id: interviewAssignment.teachers.id,
            assignmentId: interviewAssignment.id,
            full_name: interviewAssignment.teachers.full_name,
            account_status: interviewAssignment.teachers.account_status,
            assignment_start_date: interviewAssignment.assignment_start_date
          } : undefined,
          lessonTeachers: lessonAssignments.map((a: any) => ({
            id: a.teachers.id,
            assignmentId: a.id,
            full_name: a.teachers.full_name,
            account_status: a.teachers.account_status,
            assignment_start_date: a.assignment_start_date
          })),
          totalAssignments: assignments.length
        };
      });

      const formattedTeachers: TeacherOption[] = (teachersData || []).map(teacher => ({
        id: teacher.id,
        full_name: teacher.full_name,
        account_status: teacher.account_status,
        currentAssignments: teacher.assignments?.filter((a: any) => a.status === '有効').length || 0,
        isAvailable: teacher.account_status === '有効'
      }));

      setStudents(formattedStudents);
      setTeachers(formattedTeachers);

    } catch (err) {
      console.error('Error fetching assignment data:', err);
      setError(err instanceof Error ? err.message : '担当割り当てデータの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // 担当割り当ての変更
  const handleAssignmentChange = useCallback(async (changeData: AssignmentChangeData) => {
    try {
      setError(null);

      if (changeData.changeType === 'add') {
        // 新規割り当て
        const { error } = await supabase
          .from('assignments')
          .insert({
            student_id: changeData.studentId,
            teacher_id: changeData.newTeacherId,
            role: changeData.role,
            status: '有効',
            assignment_start_date: new Date().toISOString().split('T')[0],
            notes: changeData.notes
          });

        if (error) throw error;

      } else if (changeData.changeType === 'remove') {
        // 担当割り当て削除（論理削除）
        const assignment = students
          .find(s => s.id === changeData.studentId)
          ?.assignments?.find(a => 
            a.teacher_id === changeData.oldTeacherId && 
            a.role === changeData.role
          );

        if (assignment) {
          const { error } = await supabase
            .from('assignments')
            .update({
              status: '終了済み',
              assignment_end_date: new Date().toISOString().split('T')[0],
              updated_at: new Date().toISOString()
            })
            .eq('id', assignment.id);

          if (error) throw error;
        }

      } else if (changeData.changeType === 'update') {
        // 担当変更（既存を終了して新規作成）
        const assignment = students
          .find(s => s.id === changeData.studentId)
          ?.assignments?.find(a => 
            a.teacher_id === changeData.oldTeacherId && 
            a.role === changeData.role
          );

        if (assignment) {
          // 既存の割り当てを終了
          const { error: endError } = await supabase
            .from('assignments')
            .update({
              status: '終了済み',
              assignment_end_date: new Date().toISOString().split('T')[0],
              updated_at: new Date().toISOString()
            })
            .eq('id', assignment.id);

          if (endError) throw endError;

          // 新規割り当てを作成
          const { error: addError } = await supabase
            .from('assignments')
            .insert({
              student_id: changeData.studentId,
              teacher_id: changeData.newTeacherId,
              role: changeData.role,
              status: '有効',
              assignment_start_date: new Date().toISOString().split('T')[0],
              notes: changeData.notes
            });

          if (addError) throw addError;
        }
      }

      // データを再取得
      await fetchData();

      // TODO: 権限の同期処理を実装
      // await syncPermissions(changeData.studentId);

    } catch (err) {
      console.error('Error updating assignment:', err);
      setError(err instanceof Error ? err.message : '担当割り当ての変更に失敗しました');
    }
  }, [students, supabase, fetchData]);

  // フィルター適用
  const filteredStudents = students.filter(student => {
    // 検索フィルター
    if (filter.search && !student.full_name.toLowerCase().includes(filter.search.toLowerCase()) &&
        !student.furigana_name?.toLowerCase().includes(filter.search.toLowerCase())) {
      return false;
    }

    // ステータスフィルター
    if (filter.status !== 'all' && student.status !== filter.status) {
      return false;
    }

    // 学年フィルター
    if (filter.grade !== 'all' && student.grade !== filter.grade) {
      return false;
    }

    // 面談担当講師フィルター
    if (filter.hasInterviewTeacher !== 'all') {
      const hasInterview = !!student.interviewTeacher;
      if (filter.hasInterviewTeacher !== hasInterview) {
        return false;
      }
    }

    // 授業担当講師フィルター
    if (filter.hasLessonTeacher !== 'all') {
      const hasLesson = student.lessonTeachers.length > 0;
      if (filter.hasLessonTeacher !== hasLesson) {
        return false;
      }
    }

    // 特定講師フィルター
    if (filter.teacherId !== 'all') {
      const hasThisTeacher = 
        student.interviewTeacher?.id === filter.teacherId ||
        student.lessonTeachers.some(t => t.id === filter.teacherId);
      if (!hasThisTeacher) {
        return false;
      }
    }

    return true;
  });

  // ソート適用
  const sortedStudents = [...filteredStudents].sort((a, b) => {
    let aValue: any;
    let bValue: any;

    switch (sort.field) {
      case 'full_name':
        aValue = a.full_name;
        bValue = b.full_name;
        break;
      case 'grade':
        aValue = a.grade || '';
        bValue = b.grade || '';
        break;
      case 'enrollment_date':
        aValue = new Date(a.enrollment_date);
        bValue = new Date(b.enrollment_date);
        break;
      case 'total_assignments':
        aValue = a.totalAssignments;
        bValue = b.totalAssignments;
        break;
      default:
        aValue = a.full_name;
        bValue = b.full_name;
    }

    if (aValue < bValue) return sort.direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return sort.direction === 'asc' ? 1 : -1;
    return 0;
  });

  // 初期データ取得
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const breadcrumbItems = [
    { label: 'ホーム', href: '/' },
    { label: '担当割り当て管理', href: '/assignments' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">読み込み中...</span>
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
          <PageHeader
            title="担当割り当て管理"
            description="生徒と講師の担当関係を管理します"
            icon="👥"
            colorTheme="secondary"
            actions={
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="px-6 py-3 border-2 border-white/30 rounded-xl text-white bg-white/10 hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-secondary-700 transition-all duration-200 backdrop-blur-sm font-medium"
              >
                {showHistory ? '一覧表示' : '変更履歴'}
              </button>
            }
          />

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

          {!showHistory ? (
            <>
              <AssignmentFilters
                filter={filter}
                onFilterChange={setFilter}
                teachers={teachers}
                className="mt-6"
              />

              {selectedStudents.length > 0 && (
                <BulkActions
                  selectedStudents={selectedStudents}
                  students={students}
                  teachers={teachers}
                  onBulkChange={handleAssignmentChange}
                  onClearSelection={() => setSelectedStudents([])}
                  className="mt-4"
                />
              )}

              <AssignmentTable
                students={sortedStudents}
                teachers={teachers}
                selectedStudents={selectedStudents}
                onSelectionChange={setSelectedStudents}
                onAssignmentChange={handleAssignmentChange}
                sort={sort}
                onSortChange={setSort}
                className="mt-6"
              />

              <div className="mt-4 text-sm text-gray-500">
                {filteredStudents.length} 件中 {sortedStudents.length} 件を表示
              </div>
            </>
          ) : (
            <AssignmentHistory className="mt-6" />
          )}
        </div>
      </main>
    </div>
  );
}