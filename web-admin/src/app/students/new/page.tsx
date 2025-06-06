'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/ui/Header';
import Breadcrumb, { breadcrumbPaths } from '@/components/ui/Breadcrumb';
import StudentForm from '@/components/students/StudentForm';
import { StudentFormData, CreateStudentResponse } from '@/types/studentForm';

export default function NewStudentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // フォーム送信処理
  const handleSubmit = async (formData: StudentFormData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/students/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result: CreateStudentResponse = await response.json();

      if (result.success) {
        setSuccess(true);
        // 2秒後に一覧ページにリダイレクト
        setTimeout(() => {
          router.push('/students');
        }, 2000);
      } else {
        setError(result.error || '生徒の登録に失敗しました');
      }
    } catch (err) {
      console.error('Student creation error:', err);
      setError('生徒の登録中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  // キャンセル処理
  const handleCancel = () => {
    router.push('/students');
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-2xl mx-auto p-8">
          <div className="bg-green-50 border border-green-200 rounded-md p-6 text-center">
            <div className="text-green-600 text-4xl mb-4">✓</div>
            <h2 className="text-lg font-medium text-green-800 mb-2">
              生徒の登録が完了しました
            </h2>
            <p className="text-green-700">
              2秒後に生徒一覧ページに移動します...
            </p>
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
              breadcrumbPaths.studentNew
            ]}
          />
        </div>

        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">新規生徒登録</h1>
          <p className="text-gray-600">
            新しい生徒の情報を入力してください。保護者用のアカウントも自動的に作成されます。
          </p>
        </div>

        {/* フォーム */}
        <StudentForm
          mode="create"
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
          error={error}
        />
      </div>
    </div>
  );
}