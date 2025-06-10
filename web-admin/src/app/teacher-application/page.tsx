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
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
        <Header />
        <div className="max-w-2xl mx-auto p-8">
          <div className="bg-gradient-to-r from-success-50 to-success-100 border border-success-200 rounded-2xl p-8 text-center shadow-lg">
            <div className="w-16 h-16 bg-gradient-to-br from-success-500 to-success-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-white text-3xl font-bold">✓</span>
            </div>
            <h2 className="text-2xl font-bold text-success-800 mb-4">
              講師登録申請を受け付けました
            </h2>
            <p className="text-success-700 mb-6 text-lg leading-relaxed">
              ご申請いただき、ありがとうございます。<br />
              審査結果につきましては、1週間以内にご連絡いたします。
            </p>
            <p className="text-sm text-success-600 font-medium">
              3秒後にホームページに移動します...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-accent-50">
      <Header />
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="relative overflow-hidden bg-gradient-to-r from-accent-600 via-accent-700 to-accent-800 rounded-2xl p-8 text-gray-900 shadow-lg">
            {/* 背景装飾 */}
            <div className="absolute top-0 right-0 -mt-4 -mr-4 w-20 h-20 bg-primary-400 rounded-full opacity-20 blur-xl"></div>
            <div className="absolute bottom-0 left-0 -mb-6 -ml-6 w-24 h-24 bg-primary-300 rounded-full opacity-10 blur-2xl"></div>
            
            <div className="relative">
              <h1 className="text-3xl font-bold mb-3">
                講師登録申請フォーム
              </h1>
              <p className="text-gray-800 text-lg leading-relaxed">
                東大伴走の講師として参加をご希望の方は、下記フォームにご記入ください。<br />
                審査後、1週間以内にご連絡いたします。
              </p>
            </div>
          </div>
        </div>

        {/* エラー表示 */}
        {error && (
          <div className="mb-6 bg-gradient-to-r from-error-50 to-error-100 border border-error-200 rounded-xl p-6 shadow-lg">
            <div className="flex items-start space-x-4">
              <div className="w-8 h-8 bg-gradient-to-br from-error-500 to-error-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-bold">!</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-error-800 mb-2">
                  エラーが発生しました
                </h3>
                <p className="text-error-700">{error}</p>
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