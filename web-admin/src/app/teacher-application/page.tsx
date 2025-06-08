'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/ui/Header';
import TeacherApplicationForm from './components/TeacherApplicationForm';
import { TeacherApplicationFormData } from '@/types/teacherApplication';

export default function TeacherApplicationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // フォーム送信処理
  const handleSubmit = async (formData: TeacherApplicationFormData) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/teacher-application/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        // 3秒後にホームページにリダイレクト
        setTimeout(() => {
          router.push('/');
        }, 3000);
      } else {
        setError(result.error || '講師登録申請の送信に失敗しました');
      }
    } catch (err) {
      console.error('Teacher application submission error:', err);
      setError('講師登録申請の送信中にエラーが発生しました');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-2xl mx-auto p-8">
          <div className="bg-green-50 border border-green-200 rounded-md p-6 text-center">
            <div className="text-green-600 text-4xl mb-4">✓</div>
            <h2 className="text-lg font-medium text-green-800 mb-2">
              講師登録申請を受け付けました
            </h2>
            <p className="text-green-700 mb-4">
              ご申請いただき、ありがとうございます。<br />
              審査結果につきましては、1週間以内にご連絡いたします。
            </p>
            <p className="text-sm text-green-600">
              3秒後にホームページに移動します...
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
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            講師登録申請フォーム
          </h1>
          <p className="text-gray-600">
            東大伴走の講師として参加をご希望の方は、下記フォームにご記入ください。<br />
            審査後、1週間以内にご連絡いたします。
          </p>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  エラーが発生しました
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* フォーム */}
        <TeacherApplicationForm
          onSubmit={handleSubmit}
          loading={loading}
          error={error}
        />
      </div>
    </div>
  );
}