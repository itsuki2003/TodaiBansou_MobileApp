'use client';

import { Student } from '@/types/schedule';

interface StudentSelectorProps {
  students: Student[];
  selectedStudent: Student | null;
  onSelectStudent: (student: Student | null) => void;
}

export default function StudentSelector({
  students,
  selectedStudent,
  onSelectStudent
}: StudentSelectorProps) {
  return (
    <div className="w-full max-w-md">
      <label htmlFor="student-select" className="block text-sm font-medium text-gray-700 mb-2">
        生徒を選択
      </label>
      <select
        id="student-select"
        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        value={selectedStudent?.id || ''}
        onChange={(e) => {
          const studentId = e.target.value;
          if (studentId) {
            const student = students.find(s => s.id === studentId);
            onSelectStudent(student || null);
          } else {
            onSelectStudent(null);
          }
        }}
      >
        <option value="">生徒を選択してください</option>
        {students
          .filter(student => student.status === '在籍中')
          .map((student) => (
            <option key={student.id} value={student.id}>
              {student.full_name} {student.grade && `(${student.grade})`}
            </option>
          ))}
      </select>
      
      {selectedStudent && (
        <div className="mt-2 text-sm text-gray-600">
          選択中: {selectedStudent.full_name}
          {selectedStudent.grade && ` (${selectedStudent.grade})`}
        </div>
      )}
    </div>
  );
}