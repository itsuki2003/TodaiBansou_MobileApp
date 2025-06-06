'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Header from '@/components/ui/Header';
import Breadcrumb, { breadcrumbPaths, useBreadcrumbStudentName } from '@/components/ui/Breadcrumb';
import StudentForm from '@/components/students/StudentForm';
import { StudentFormData, GetStudentResponse, UpdateStudentResponse } from '@/types/studentForm';
import { PageLoader } from '@/components/ui/common/AppLoader';
import { ErrorDisplay } from '@/components/ui/common/ErrorDisplay';

export default function EditStudentPage() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;

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
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-2xl mx-auto p-8">
          <div className="bg-green-50 border border-green-200 rounded-md p-6 text-center">
            <div className="text-green-600 text-4xl mb-4">✓</div>
            <h2 className="text-lg font-medium text-green-800 mb-2">
              生徒情報の更新が完了しました
            </h2>
            <p className="text-green-700">
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
            <button
              onClick={() => router.push('/students')}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              生徒一覧に戻る
            </button>
          </div>
        </div>
      </div>
    );
  }

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
              { ...breadcrumbPaths.studentDetail(studentName, nameLoading), href: `/students/${studentId}` },
              breadcrumbPaths.studentEdit(studentName, nameLoading)
            ]}
          />
        </div>

        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">生徒情報編集</h1>
          <p className="text-gray-600">
            生徒情報を更新してください。
          </p>
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