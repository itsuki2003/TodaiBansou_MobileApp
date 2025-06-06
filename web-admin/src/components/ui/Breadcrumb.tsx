'use client';

import Link from 'next/link';
import { Fragment, useState, useEffect } from 'react';

export interface BreadcrumbItem {
  label: string;
  href?: string;
  loading?: boolean;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumb({ items, className = '' }: BreadcrumbProps) {
  return (
    <nav aria-label="パンくずリスト" className={`flex ${className}`}>
      <ol className="inline-flex items-center space-x-1 md:space-x-3">
        {items.map((item, index) => (
          <Fragment key={index}>
            <li className="inline-flex items-center">
              {item.href ? (
                <Link
                  href={item.href}
                  className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors duration-200"
                >
                  {index === 0 && (
                    <svg
                      className="w-3 h-3 mr-2.5"
                      aria-hidden="true"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z" />
                    </svg>
                  )}
                  {item.loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-400 mr-2"></div>
                      <span className="text-gray-400">読み込み中...</span>
                    </div>
                  ) : (
                    item.label
                  )}
                </Link>
              ) : (
                <span className="inline-flex items-center text-sm font-medium text-gray-500">
                  {index === 0 && (
                    <svg
                      className="w-3 h-3 mr-2.5"
                      aria-hidden="true"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="m19.707 9.293-2-2-7-7a1 1 0 0 0-1.414 0l-7 7-2 2a1 1 0 0 0 1.414 1.414L2 10.414V18a2 2 0 0 0 2 2h3a1 1 0 0 0 1-1v-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v4a1 1 0 0 0 1 1h3a2 2 0 0 0 2-2v-7.586l.293.293a1 1 0 0 0 1.414-1.414Z" />
                    </svg>
                  )}
                  {item.loading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-400 mr-2"></div>
                      <span className="text-gray-400">読み込み中...</span>
                    </div>
                  ) : (
                    item.label
                  )}
                </span>
              )}
            </li>
            {index < items.length - 1 && (
              <li>
                <div className="flex items-center">
                  <svg
                    className="w-3 h-3 text-gray-400 mx-1"
                    aria-hidden="true"
                    fill="none"
                    viewBox="0 0 6 10"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="m1 9 4-4-4-4"
                    />
                  </svg>
                </div>
              </li>
            )}
          </Fragment>
        ))}
      </ol>
    </nav>
  );
}

// 動的な生徒名取得用のhook
export function useBreadcrumbStudentName(studentId?: string) {
  const [studentName, setStudentName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!studentId) return;

    const fetchStudentName = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/students/${studentId}`);
        const result = await response.json();
        
        if (result.success && result.student) {
          setStudentName(result.student.full_name);
        } else {
          setStudentName(`生徒 (ID: ${studentId.slice(0, 8)}...)`);
        }
      } catch (error) {
        console.error('Failed to fetch student name:', error);
        setStudentName(`生徒 (ID: ${studentId.slice(0, 8)}...)`);
      } finally {
        setLoading(false);
      }
    };

    fetchStudentName();
  }, [studentId]);

  return { studentName, loading };
}

// 便利なヘルパー関数
export const breadcrumbPaths = {
  home: { label: 'ホーム', href: '/' },
  students: { label: '生徒管理', href: '/students' },
  studentNew: { label: '新規登録' },
  studentDetail: (name?: string, loading?: boolean) => ({ 
    label: loading ? '読み込み中...' : name || '生徒詳細',
    loading 
  }),
  studentEdit: (name?: string, loading?: boolean) => ({ 
    label: loading ? '編集中...' : `${name || '生徒'}の編集`,
    loading 
  }),
};