'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Header from '@/components/ui/Header';
import Breadcrumb, { breadcrumbPaths, useBreadcrumbStudentName } from '@/components/ui/Breadcrumb';
import { GetStudentResponse } from '@/types/studentForm';
import { PageLoader } from '@/components/ui/common/AppLoader';
import { ErrorDisplay } from '@/components/ui/common/ErrorDisplay';

interface StudentDetail {
  id: string;
  full_name: string;
  furigana_name: string;
  grade: string;
  school_attended: string;
  enrollment_date: string;
  status: string;
  notes: string;
  parent_name: string;
  parent_email: string;
  parent_phone_number: string;
  created_at?: string;
  updated_at?: string;
}

export default function StudentDetailPage() {
  const params = useParams();
  const studentId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [student, setStudent] = useState<StudentDetail | null>(null);

  // パンくずリスト用の生徒名取得
  const { studentName, loading: nameLoading } = useBreadcrumbStudentName(studentId);

  // 生徒情報を取得
  useEffect(() => {
    const fetchStudent = async () => {
      if (!studentId) return;

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/students/${studentId}`);
        const result: GetStudentResponse = await response.json();

        if (result.success && result.student) {
          setStudent(result.student);
        } else {
          setError(result.error || '生徒情報の取得に失敗しました');
        }
      } catch (err) {
        console.error('Student fetch error:', err);
        setError('生徒情報の取得中にエラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [studentId]);

  // ローディング画面
  if (loading) {
    return <PageLoader message="生徒情報を読み込み中..." />;
  }

  // エラー画面
  if (error) {
    return (
      <ErrorDisplay 
        errorMessage={error}
        onRetry={() => window.location.reload()}
      />
    );
  }

  // データがない場合
  if (!student) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-4xl mx-auto p-8">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-6 text-center">
            <div className="text-yellow-600 text-4xl mb-4">⚠</div>
            <h2 className="text-lg font-medium text-yellow-800 mb-2">
              生徒が見つかりません
            </h2>
            <p className="text-yellow-700 mb-4">
              指定された生徒情報が見つかりませんでした。
            </p>
            <Link
              href="/students"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 inline-block"
            >
              生徒一覧に戻る
            </Link>
          </div>
        </div>
      </div>
    );
  }

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

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('ja-JP');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* パンくずリスト */}
        <div className="mb-6">
          <Breadcrumb 
            items={[
              breadcrumbPaths.home,
              breadcrumbPaths.students,
              breadcrumbPaths.studentDetail(studentName, nameLoading)
            ]}
          />
        </div>

        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">生徒詳細情報</h1>
            <div className="flex space-x-3">
              <Link
                href="/students"
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                一覧に戻る
              </Link>
              <Link
                href={`/students/${studentId}/edit`}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
              >
                編集
              </Link>
            </div>
          </div>
          <p className="text-gray-600">
            生徒の詳細情報を表示しています。
          </p>
        </div>

        {/* 生徒情報セクション */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">生徒情報</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* 生徒氏名 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                生徒氏名
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                {student.full_name || '-'}
              </div>
            </div>

            {/* フリガナ */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                フリガナ
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                {student.furigana_name || '-'}
              </div>
            </div>

            {/* 学年 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                学年
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                {student.grade || '-'}
              </div>
            </div>

            {/* 通塾先 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                通塾先
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                {student.school_attended || '-'}
              </div>
            </div>

            {/* 入会日 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                入会日
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                {formatDate(student.enrollment_date) || '-'}
              </div>
            </div>

            {/* 在籍状況 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                在籍状況
              </label>
              <div className="px-3 py-2">
                <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full border ${getStatusStyle(student.status)}`}>
                  {student.status}
                </span>
              </div>
            </div>
          </div>

          {/* 特記事項 */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              特記事項・メモ
            </label>
            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900 min-h-[100px] whitespace-pre-wrap">
              {student.notes || '特記事項はありません'}
            </div>
          </div>
        </div>

        {/* 保護者情報セクション */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-6">保護者情報</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* 保護者氏名 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                保護者氏名
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                {student.parent_name || '-'}
              </div>
            </div>

            {/* 保護者電話番号 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                保護者電話番号
              </label>
              <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                {student.parent_phone_number || '-'}
              </div>
            </div>
          </div>

          {/* 保護者メールアドレス */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              保護者メールアドレス
            </label>
            <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
              {student.parent_email || '-'}
            </div>
            <p className="mt-1 text-sm text-gray-500">
              モバイルアプリのログインIDとして使用
            </p>
          </div>
        </div>

        {/* システム情報セクション */}
        {(student.created_at || student.updated_at) && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">システム情報</h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {student.created_at && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    登録日時
                  </label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                    {formatDate(student.created_at)}
                  </div>
                </div>
              )}

              {student.updated_at && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    最終更新日時
                  </label>
                  <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-900">
                    {formatDate(student.updated_at)}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}