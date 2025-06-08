'use client';

import { useState } from 'react';
import { UserGroupIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { 
  StudentWithAssignmentDetails, 
  TeacherOption, 
  AssignmentChangeData 
} from '@/types/assignment';
import TeacherSelect from './TeacherSelect';

interface BulkActionsProps {
  selectedStudents: string[];
  students: StudentWithAssignmentDetails[];
  teachers: TeacherOption[];
  onBulkChange: (changeData: AssignmentChangeData) => Promise<void>;
  onClearSelection: () => void;
  className?: string;
}

export default function BulkActions({
  selectedStudents,
  students,
  teachers,
  onBulkChange,
  onClearSelection,
  className = ''
}: BulkActionsProps) {
  const [bulkAction, setBulkAction] = useState<'add_interview' | 'add_lesson' | 'remove_interview' | 'remove_lesson' | ''>('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [processing, setProcessing] = useState(false);
  const [reason, setReason] = useState('');

  const selectedStudentData = students.filter(s => selectedStudents.includes(s.id));

  const handleBulkAction = async () => {
    if (!bulkAction || !selectedStudents.length) return;

    if ((bulkAction === 'add_interview' || bulkAction === 'add_lesson') && !selectedTeacherId) {
      alert('講師を選択してください');
      return;
    }

    setProcessing(true);

    try {
      for (const studentId of selectedStudents) {
        const student = students.find(s => s.id === studentId);
        if (!student) continue;

        let changeData: AssignmentChangeData;

        switch (bulkAction) {
          case 'add_interview':
            const teacher = teachers.find(t => t.id === selectedTeacherId);
            if (!teacher) continue;
            
            changeData = {
              studentId,
              studentName: student.full_name,
              changeType: 'add',
              role: '面談担当（リスト編集可）',
              newTeacherId: selectedTeacherId,
              newTeacherName: teacher.full_name,
              notes: reason || '一括操作による追加'
            };
            break;

          case 'add_lesson':
            const lessonTeacher = teachers.find(t => t.id === selectedTeacherId);
            if (!lessonTeacher) continue;
            
            changeData = {
              studentId,
              studentName: student.full_name,
              changeType: 'add',
              role: '授業担当（コメントのみ）',
              newTeacherId: selectedTeacherId,
              newTeacherName: lessonTeacher.full_name,
              notes: reason || '一括操作による追加'
            };
            break;

          case 'remove_interview':
            if (!student.interviewTeacher) continue;
            
            changeData = {
              studentId,
              studentName: student.full_name,
              changeType: 'remove',
              role: '面談担当（リスト編集可）',
              oldTeacherId: student.interviewTeacher.id,
              oldTeacherName: student.interviewTeacher.full_name,
              notes: reason || '一括操作による削除'
            };
            break;

          case 'remove_lesson':
            // 複数の授業担当講師がいる場合は、最初の一人を削除
            if (student.lessonTeachers.length === 0) continue;
            const firstLessonTeacher = student.lessonTeachers[0];
            
            changeData = {
              studentId,
              studentName: student.full_name,
              changeType: 'remove',
              role: '授業担当（コメントのみ）',
              oldTeacherId: firstLessonTeacher.id,
              oldTeacherName: firstLessonTeacher.full_name,
              notes: reason || '一括操作による削除'
            };
            break;

          default:
            continue;
        }

        await onBulkChange(changeData);
      }

      // 完了後の処理
      setBulkAction('');
      setSelectedTeacherId('');
      setReason('');
      onClearSelection();
      
    } catch (error) {
      console.error('Bulk action error:', error);
    } finally {
      setProcessing(false);
    }
  };

  const getActionDescription = () => {
    switch (bulkAction) {
      case 'add_interview':
        return '選択した生徒に面談担当講師を一括で設定します';
      case 'add_lesson':
        return '選択した生徒に授業担当講師を一括で追加します';
      case 'remove_interview':
        return '選択した生徒の面談担当講師を一括で削除します';
      case 'remove_lesson':
        return '選択した生徒の授業担当講師（最初の一人）を一括で削除します';
      default:
        return '';
    }
  };

  const getAffectedStudents = () => {
    switch (bulkAction) {
      case 'add_interview':
        return selectedStudentData.filter(s => !s.interviewTeacher);
      case 'add_lesson':
        return selectedStudentData; // 授業担当は複数人可能
      case 'remove_interview':
        return selectedStudentData.filter(s => s.interviewTeacher);
      case 'remove_lesson':
        return selectedStudentData.filter(s => s.lessonTeachers.length > 0);
      default:
        return [];
    }
  };

  const affectedStudents = getAffectedStudents();

  return (
    <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <UserGroupIcon className="h-5 w-5 text-yellow-600" />
          <span className="font-medium text-yellow-800">
            {selectedStudents.length}人の生徒を選択中
          </span>
        </div>
        <button
          onClick={onClearSelection}
          className="text-sm text-yellow-600 hover:text-yellow-800"
        >
          選択解除
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="bulkAction" className="block text-sm font-medium text-gray-700 mb-1">
            一括操作を選択
          </label>
          <select
            id="bulkAction"
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value as any)}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
          >
            <option value="">操作を選択してください</option>
            <option value="add_interview">面談担当講師を一括追加</option>
            <option value="add_lesson">授業担当講師を一括追加</option>
            <option value="remove_interview">面談担当講師を一括削除</option>
            <option value="remove_lesson">授業担当講師を一括削除</option>
          </select>
        </div>

        {bulkAction && (
          <>
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700">{getActionDescription()}</p>
              {affectedStudents.length !== selectedStudents.length && (
                <p className="text-sm text-blue-600 mt-1">
                  ※ {selectedStudents.length}人中 {affectedStudents.length}人に適用されます
                </p>
              )}
            </div>

            {(bulkAction === 'add_interview' || bulkAction === 'add_lesson') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  講師を選択
                </label>
                <TeacherSelect
                  teachers={teachers}
                  value={selectedTeacherId}
                  onChange={setSelectedTeacherId}
                  placeholder="講師を選択してください"
                />
              </div>
            )}

            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
                変更理由（任意）
              </label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={2}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-yellow-500 focus:border-yellow-500"
                placeholder="例：新学期のクラス変更に伴う担当変更"
              />
            </div>

            {affectedStudents.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">対象生徒一覧</h4>
                <div className="max-h-32 overflow-y-auto bg-white border border-gray-200 rounded-md p-2">
                  <div className="text-sm text-gray-600 space-y-1">
                    {affectedStudents.map(student => (
                      <div key={student.id} className="flex items-center justify-between">
                        <span>{student.full_name}</span>
                        <span className="text-xs text-gray-400">
                          {student.grade || '学年未設定'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {affectedStudents.length === 0 && (
              <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex">
                  <ExclamationTriangleIcon className="h-5 w-5 text-orange-400" />
                  <div className="ml-3">
                    <p className="text-sm text-orange-700">
                      選択された生徒にはこの操作を適用できません。
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setBulkAction('');
                  setSelectedTeacherId('');
                  setReason('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleBulkAction}
                disabled={processing || affectedStudents.length === 0 || 
                  ((bulkAction === 'add_interview' || bulkAction === 'add_lesson') && !selectedTeacherId)}
                className="px-4 py-2 bg-yellow-600 border border-transparent rounded-md text-sm font-medium text-white hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? '処理中...' : `一括実行 (${affectedStudents.length}人)`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}