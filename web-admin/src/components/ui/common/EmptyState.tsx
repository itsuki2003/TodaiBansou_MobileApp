'use client';

import React from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
  };
  className?: string;
}

const defaultIcons = {
  default: (
    <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  ),
  students: (
    <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
    </svg>
  ),
  tasks: (
    <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    </svg>
  ),
  lessons: (
    <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  chat: (
    <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  )
};

export default function EmptyState({
  title,
  description,
  icon,
  action,
  className = ''
}: EmptyStateProps) {
  return (
    <div className={`text-center py-12 px-4 ${className}`}>
      <div className="flex justify-center mb-4">
        {icon || defaultIcons.default}
      </div>
      
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
          {description}
        </p>
      )}
      
      {action && (
        <button
          onClick={action.onClick}
          className={`
            inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md
            focus:outline-none focus:ring-2 focus:ring-offset-2
            transition-colors duration-200
            ${action.variant === 'secondary' 
              ? 'border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-blue-500'
              : 'border-transparent text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
            }
          `}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

// 特定用途向けのプリセット
export function EmptyStudentsList({ onAddStudent }: { onAddStudent: () => void }) {
  return (
    <EmptyState
      icon={defaultIcons.students}
      title="生徒が登録されていません"
      description="最初の生徒を登録して、学習管理を始めましょう。"
      action={{
        label: "生徒を登録",
        onClick: onAddStudent
      }}
    />
  );
}

export function EmptyTasksList({ onAddTask }: { onAddTask: () => void }) {
  return (
    <EmptyState
      icon={defaultIcons.tasks}
      title="タスクがありません"
      description="今週のやることリストを作成して、学習計画を立てましょう。"
      action={{
        label: "タスクを追加",
        onClick: onAddTask
      }}
    />
  );
}

export function EmptyLessonsList({ onAddLesson }: { onAddLesson: () => void }) {
  return (
    <EmptyState
      icon={defaultIcons.lessons}
      title="授業予定がありません"
      description="授業スケジュールを登録して、学習リズムを作りましょう。"
      action={{
        label: "授業を登録",
        onClick: onAddLesson
      }}
    />
  );
}

export function EmptyChatHistory() {
  return (
    <EmptyState
      icon={defaultIcons.chat}
      title="メッセージがありません"
      description="講師や運営メンバーとのコミュニケーションがここに表示されます。"
    />
  );
}