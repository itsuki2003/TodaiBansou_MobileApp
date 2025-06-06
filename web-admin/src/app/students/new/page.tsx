'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '@/components/ui/Header';
import { StudentFormData, CreateStudentResponse } from '@/types/studentForm';

export default function NewStudentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState<StudentFormData>({
    full_name: '',
    furigana_name: '',
    grade: '',
    school_attended: '',
    enrollment_date: new Date().toISOString().split('T')[0], // 今日の日付をデフォルト
    status: '在籍中',
    notes: '',
    parent_name: '',
    parent_email: '',
    parent_phone_number: '',
  });

  const [formErrors, setFormErrors] = useState<Partial<Record<keyof StudentFormData, string>>>({});

  // バリデーション関数
  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof StudentFormData, string>> = {};

    // 必須項目チェック
    if (!formData.full_name.trim()) {
      errors.full_name = '生徒氏名は必須です';
    }
    if (!formData.parent_name.trim()) {
      errors.parent_name = '保護者氏名は必須です';
    }
    if (!formData.parent_email.trim()) {
      errors.parent_email = '保護者メールアドレスは必須です';
    }
    if (!formData.enrollment_date) {
      errors.enrollment_date = '入会日は必須です';
    }

    // メールアドレス形式チェック
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.parent_email && !emailRegex.test(formData.parent_email)) {
      errors.parent_email = '正しいメールアドレス形式で入力してください';
    }

    // 電話番号形式チェック（任意入力だが、入力がある場合はチェック）
    if (formData.parent_phone_number) {
      const phoneRegex = /^[\d\-\+\(\)\s]+$/;
      if (!phoneRegex.test(formData.parent_phone_number)) {
        errors.parent_phone_number = '正しい電話番号形式で入力してください';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // フォーム送信処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

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

  // 入力値更新
  const handleInputChange = (field: keyof StudentFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // エラーがある場合はクリア
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  // キャンセル処理
  const handleCancel = () => {
    if (window.confirm('入力内容が失われますが、よろしいですか？')) {
      router.push('/students');
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
      <div className="max-w-4xl mx-auto p-8">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">新規生徒登録</h1>
          <p className="text-gray-600">
            新しい生徒の情報を入力してください。保護者用のアカウントも自動的に作成されます。
          </p>
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">登録エラー</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* 生徒情報セクション */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">生徒情報</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 生徒氏名 */}
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
                  生徒氏名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => handleInputChange('full_name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    formErrors.full_name ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                  }`}
                  placeholder="例: 山田太郎"
                />
                {formErrors.full_name && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.full_name}</p>
                )}
              </div>

              {/* フリガナ */}
              <div>
                <label htmlFor="furigana_name" className="block text-sm font-medium text-gray-700 mb-2">
                  フリガナ
                </label>
                <input
                  type="text"
                  id="furigana_name"
                  value={formData.furigana_name}
                  onChange={(e) => handleInputChange('furigana_name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="例: ヤマダタロウ"
                />
              </div>

              {/* 学年 */}
              <div>
                <label htmlFor="grade" className="block text-sm font-medium text-gray-700 mb-2">
                  学年
                </label>
                <select
                  id="grade"
                  value={formData.grade}
                  onChange={(e) => handleInputChange('grade', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">選択してください</option>
                  <option value="小学1年生">小学1年生</option>
                  <option value="小学2年生">小学2年生</option>
                  <option value="小学3年生">小学3年生</option>
                  <option value="小学4年生">小学4年生</option>
                  <option value="小学5年生">小学5年生</option>
                  <option value="小学6年生">小学6年生</option>
                  <option value="中学1年生">中学1年生</option>
                  <option value="中学2年生">中学2年生</option>
                  <option value="中学3年生">中学3年生</option>
                </select>
              </div>

              {/* 通塾先 */}
              <div>
                <label htmlFor="school_attended" className="block text-sm font-medium text-gray-700 mb-2">
                  通塾先
                </label>
                <input
                  type="text"
                  id="school_attended"
                  value={formData.school_attended}
                  onChange={(e) => handleInputChange('school_attended', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="例: 〇〇塾"
                />
              </div>

              {/* 入会日 */}
              <div>
                <label htmlFor="enrollment_date" className="block text-sm font-medium text-gray-700 mb-2">
                  入会日 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="enrollment_date"
                  value={formData.enrollment_date}
                  onChange={(e) => handleInputChange('enrollment_date', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    formErrors.enrollment_date ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                  }`}
                />
                {formErrors.enrollment_date && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.enrollment_date}</p>
                )}
              </div>

              {/* 在籍状況 */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                  在籍状況
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value as StudentFormData['status'])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="在籍中">在籍中</option>
                  <option value="休会中">休会中</option>
                  <option value="退会済み">退会済み</option>
                </select>
              </div>
            </div>

            {/* 特記事項 */}
            <div className="mt-6">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                特記事項・メモ
              </label>
              <textarea
                id="notes"
                rows={4}
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                placeholder="アレルギーや特記事項があれば記入してください（任意）"
              />
            </div>
          </div>

          {/* 保護者情報セクション */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">保護者情報</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 保護者氏名 */}
              <div>
                <label htmlFor="parent_name" className="block text-sm font-medium text-gray-700 mb-2">
                  保護者氏名 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="parent_name"
                  value={formData.parent_name}
                  onChange={(e) => handleInputChange('parent_name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    formErrors.parent_name ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                  }`}
                  placeholder="例: 山田花子"
                />
                {formErrors.parent_name && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.parent_name}</p>
                )}
              </div>

              {/* 保護者電話番号 */}
              <div>
                <label htmlFor="parent_phone_number" className="block text-sm font-medium text-gray-700 mb-2">
                  保護者電話番号
                </label>
                <input
                  type="tel"
                  id="parent_phone_number"
                  value={formData.parent_phone_number}
                  onChange={(e) => handleInputChange('parent_phone_number', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                    formErrors.parent_phone_number ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                  }`}
                  placeholder="例: 090-1234-5678"
                />
                {formErrors.parent_phone_number && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.parent_phone_number}</p>
                )}
              </div>
            </div>

            {/* 保護者メールアドレス */}
            <div className="mt-6">
              <label htmlFor="parent_email" className="block text-sm font-medium text-gray-700 mb-2">
                保護者メールアドレス <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="parent_email"
                value={formData.parent_email}
                onChange={(e) => handleInputChange('parent_email', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 ${
                  formErrors.parent_email ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-blue-500'
                }`}
                placeholder="例: yamada@example.com"
              />
              {formErrors.parent_email && (
                <p className="mt-1 text-sm text-red-600">{formErrors.parent_email}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                このメールアドレスがモバイルアプリのログインIDになります
              </p>
            </div>
          </div>

          {/* ボタン */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              キャンセル
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  登録中...
                </div>
              ) : (
                '保存'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}