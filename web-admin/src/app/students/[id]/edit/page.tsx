'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/ui/Header';
import Breadcrumb, { breadcrumbPaths, useBreadcrumbStudentName } from '@/components/ui/Breadcrumb';
import StudentForm from '@/components/students/StudentForm';
import { StudentFormData, GetStudentResponse, UpdateStudentResponse } from '@/types/studentForm';
import { PageLoader } from '@/components/ui/common/AppLoader';
import { ErrorDisplay } from '@/components/ui/common/ErrorDisplay';

interface EditStudentPageProps {
  params: Promise<{ id: string }>;
}

export default function EditStudentPage({ params }: EditStudentPageProps) {
  const router = useRouter();
  const { id: studentId } = use(params);

  const [loading, setLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [studentData, setStudentData] = useState<StudentFormData | null>(null);

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
          // API レスポンスから不要な id フィールドを除外
          const { id: _unused, ...formData } = result.student;
          void _unused; // 未使用変数の警告を回避
          setStudentData(formData);
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

  // フォーム送信処理
  const handleSubmit = async (formData: StudentFormData) => {
    setUpdateLoading(true);
    setUpdateError(null);

    try {
      const response = await fetch(`/api/students/${studentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          id: studentId,
        }),
      });

      const result: UpdateStudentResponse = await response.json();

      if (result.success) {
        setSuccess(true);
        // 2秒後に一覧ページにリダイレクト
        setTimeout(() => {
          router.push('/students');
        }, 2000);
      } else {
        setUpdateError(result.error || '生徒情報の更新に失敗しました');
      }
    } catch (err) {
      console.error('Student update error:', err);
      setUpdateError('生徒情報の更新中にエラーが発生しました');
    } finally {
      setUpdateLoading(false);
    }
  };

  // キャンセル処理
  const handleCancel = () => {
    router.push('/students');
  };

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

  // 成功画面
  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
        <Header />
        <div className="max-w-2xl mx-auto p-8">
          <div className="bg-gradient-to-r from-success-50 to-success-100 border border-success-200 rounded-2xl p-8 text-center shadow-lg">
            <div className="w-16 h-16 bg-gradient-to-br from-success-500 to-success-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-white text-3xl font-bold">✓</span>
            </div>
            <h2 className="text-2xl font-bold text-success-800 mb-3">
              生徒情報の更新が完了しました
            </h2>
            <p className="text-success-700 text-lg">
              2秒後に生徒一覧ページに移動します...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // データがない場合
  if (!studentData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
        <Header />
        <div className="max-w-4xl mx-auto p-8">
          <div className="bg-gradient-to-r from-warning-50 to-warning-100 border border-warning-200 rounded-2xl p-8 text-center shadow-lg">
            <div className="w-16 h-16 bg-gradient-to-br from-warning-500 to-warning-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-white text-3xl font-bold">⚠</span>
            </div>
            <h2 className="text-2xl font-bold text-warning-800 mb-3">
              生徒が見つかりません
            </h2>
            <p className="text-warning-700 mb-6 text-lg">
              指定された生徒情報が見つかりませんでした。
            </p>
            <button
              onClick={() => router.push('/students')}
              className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 font-medium shadow-lg"
            >
              生徒一覧に戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
      <Header />
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* パンくずリスト */}
        <div className="mb-6">
          <Breadcrumb 
            items={[
              breadcrumbPaths.home,
              breadcrumbPaths.students,
              { ...breadcrumbPaths.studentDetail(studentName, nameLoading), href: `/students/${studentId}` },
              breadcrumbPaths.studentEdit(studentName, nameLoading)
            ]}
          />
        </div>

        {/* ヘッダー */}
        <div className="mb-8">
          <div className="relative overflow-hidden bg-gradient-to-r from-secondary-600 via-secondary-700 to-secondary-800 rounded-2xl p-8 text-white shadow-lg">
            {/* 背景装飾 */}
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-20 h-20 bg-accent-400 rounded-full opacity-20 blur-xl"></div>
            <div className="absolute bottom-0 left-0 -mb-6 -ml-6 w-24 h-24 bg-accent-300 rounded-full opacity-10 blur-2xl"></div>
            
            <div className="relative">
              <h1 className="text-3xl font-bold mb-2">生徒情報編集</h1>
              <p className="text-white/90 text-lg">
                {studentName || '生徒'}の情報を更新してください
              </p>
            </div>
          </div>
        </div>

        {/* フォーム */}
        <StudentForm
          mode="edit"
          initialData={studentData}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={updateLoading}
          error={updateError}
        />
      </div>
    </div>
  );
}