'use client';

import { useState } from 'react';
import { ChevronUpIcon, ChevronDownIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { 
  StudentWithAssignmentDetails, 
  TeacherOption, 
  AssignmentSort,
  AssignmentChangeData
} from '@/types/assignment';
import TeacherSelect from './TeacherSelect';
import AssignmentConfirmDialog from './AssignmentConfirmDialog';

interface AssignmentTableProps {
  students: StudentWithAssignmentDetails[];
  teachers: TeacherOption[];
  selectedStudents: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  onAssignmentChange: (changeData: AssignmentChangeData) => Promise<void>;
  sort: AssignmentSort;
  onSortChange: (sort: AssignmentSort) => void;
  className?: string;
}

export default function AssignmentTable({
  students,
  teachers,
  selectedStudents,
  onSelectionChange,
  onAssignmentChange,
  sort,
  onSortChange,
  className = ''
}: AssignmentTableProps) {
  const [pendingChange, setPendingChange] = useState<AssignmentChangeData | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // ソート処理
  const handleSort = (field: AssignmentSort['field']) => {
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
      onSelectionChange(students.map(s => s.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectStudent = (studentId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedStudents, studentId]);
    } else {
      onSelectionChange(selectedStudents.filter(id => id !== studentId));
    }
  };

  // 担当割り当て変更処理
  const handleAssignmentUpdate = (changeData: AssignmentChangeData) => {
    setPendingChange(changeData);
    setShowConfirmDialog(true);
  };

  const confirmAssignmentChange = async () => {
    if (pendingChange) {
      await onAssignmentChange(pendingChange);
      setPendingChange(null);
    }
    setShowConfirmDialog(false);
  };

  // 面談担当講師の追加
  const handleAddInterviewTeacher = (studentId: string, teacherId: string) => {
    const student = students.find(s => s.id === studentId);
    const teacher = teachers.find(t => t.id === teacherId);
    
    if (student && teacher) {
      handleAssignmentUpdate({
        studentId,
        studentName: student.full_name,
        changeType: 'add',
        role: '面談担当（リスト編集可）',
        newTeacherId: teacherId,
        newTeacherName: teacher.full_name
      });
    }
  };

  // 面談担当講師の変更
  const handleUpdateInterviewTeacher = (studentId: string, oldTeacherId: string, newTeacherId: string) => {
    const student = students.find(s => s.id === studentId);
    const oldTeacher = teachers.find(t => t.id === oldTeacherId);
    const newTeacher = teachers.find(t => t.id === newTeacherId);
    
    if (student && oldTeacher && newTeacher) {
      handleAssignmentUpdate({
        studentId,
        studentName: student.full_name,
        changeType: 'update',
        role: '面談担当（リスト編集可）',
        oldTeacherId,
        oldTeacherName: oldTeacher.full_name,
        newTeacherId,
        newTeacherName: newTeacher.full_name
      });
    }
  };

  // 面談担当講師の削除
  const handleRemoveInterviewTeacher = (studentId: string, teacherId: string) => {
    const student = students.find(s => s.id === studentId);
    const teacher = teachers.find(t => t.id === teacherId);
    
    if (student && teacher) {
      handleAssignmentUpdate({
        studentId,
        studentName: student.full_name,
        changeType: 'remove',
        role: '面談担当（リスト編集可）',
        oldTeacherId: teacherId,
        oldTeacherName: teacher.full_name
      });
    }
  };

  // 授業担当講師の追加
  const handleAddLessonTeacher = (studentId: string, teacherId: string) => {
    const student = students.find(s => s.id === studentId);
    const teacher = teachers.find(t => t.id === teacherId);
    
    if (student && teacher) {
      handleAssignmentUpdate({
        studentId,
        studentName: student.full_name,
        changeType: 'add',
        role: '授業担当（コメントのみ）',
        newTeacherId: teacherId,
        newTeacherName: teacher.full_name
      });
    }
  };

  // 授業担当講師の削除
  const handleRemoveLessonTeacher = (studentId: string, teacherId: string) => {
    const student = students.find(s => s.id === studentId);
    const teacher = teachers.find(t => t.id === teacherId);
    
    if (student && teacher) {
      handleAssignmentUpdate({
        studentId,
        studentName: student.full_name,
        changeType: 'remove',
        role: '授業担当（コメントのみ）',
        oldTeacherId: teacherId,
        oldTeacherName: teacher.full_name
      });
    }
  };

  const SortButton = ({ field, children }: { field: AssignmentSort['field']; children: React.ReactNode }) => (
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

  const allSelected = students.length > 0 && selectedStudents.length === students.length;
  const someSelected = selectedStudents.length > 0 && selectedStudents.length < students.length;

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
                    <SortButton field="full_name">生徒名</SortButton>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <SortButton field="grade">学年</SortButton>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ステータス
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    面談担当講師
                    <div className="text-xs text-gray-400 font-normal">（リスト編集可）</div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    授業担当講師
                    <div className="text-xs text-gray-400 font-normal">（コメントのみ）</div>
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <SortButton field="enrollment_date">入会日</SortButton>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={(e) => handleSelectStudent(student.id, e.target.checked)}
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{student.full_name}</div>
                        {student.furigana_name && (
                          <div className="text-xs text-gray-500">{student.furigana_name}</div>
                        )}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.grade || '-'}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        student.status === '在籍中' ? 'bg-green-100 text-green-800' :
                        student.status === '休会中' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {student.status}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      {student.interviewTeacher ? (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-900">{student.interviewTeacher.full_name}</span>
                          <button
                            onClick={() => handleRemoveInterviewTeacher(student.id, student.interviewTeacher!.id)}
                            className="text-red-600 hover:text-red-800"
                            title="削除"
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                          <TeacherSelect
                            teachers={teachers}
                            value={student.interviewTeacher.id}
                            onChange={(teacherId) => handleUpdateInterviewTeacher(student.id, student.interviewTeacher!.id, teacherId)}
                            placeholder="変更"
                            size="sm"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-400">未設定</span>
                          <TeacherSelect
                            teachers={teachers}
                            value=""
                            onChange={(teacherId) => handleAddInterviewTeacher(student.id, teacherId)}
                            placeholder="講師を選択"
                            size="sm"
                          />
                        </div>
                      )}
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {student.lessonTeachers.map((teacher) => (
                          <div key={teacher.id} className="flex items-center space-x-2">
                            <span className="text-sm text-gray-900">{teacher.full_name}</span>
                            <button
                              onClick={() => handleRemoveLessonTeacher(student.id, teacher.id)}
                              className="text-red-600 hover:text-red-800"
                              title="削除"
                            >
                              <XMarkIcon className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                        <div className="flex items-center space-x-2">
                          <TeacherSelect
                            teachers={teachers}
                            value=""
                            onChange={(teacherId) => handleAddLessonTeacher(student.id, teacherId)}
                            placeholder="講師を追加"
                            size="sm"
                            excludeIds={student.lessonTeachers.map(t => t.id)}
                          />
                          <PlusIcon className="h-4 w-4 text-gray-400" />
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(student.enrollment_date).toLocaleDateString('ja-JP')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {students.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-500">
                  条件に一致する生徒が見つかりませんでした
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 変更確認ダイアログ */}
      <AssignmentConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => setShowConfirmDialog(false)}
        onConfirm={confirmAssignmentChange}
        changeData={pendingChange}
      />
    </div>
  );
}