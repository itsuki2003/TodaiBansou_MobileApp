'use client';

import { useState, useEffect } from 'react';
import {
  TeacherApplicationFormData,
  FormValidationErrors,
  PhotoUploadProgress,
  FormSection
} from '@/types/teacherApplication';
import BasicInfoSection from './BasicInfoSection';
import ProfilePhotosSection from './ProfilePhotosSection';
import AppealHobbiesSection from './AppealHobbiesSection';
import EducationBackgroundSection from './EducationBackgroundSection';

interface TeacherApplicationFormProps {
  onSubmit: (data: TeacherApplicationFormData) => Promise<void>;
  loading: boolean;
  error: string | null;
}

export default function TeacherApplicationForm({
  onSubmit,
  loading,
  error
}: TeacherApplicationFormProps) {
  const [formData, setFormData] = useState<TeacherApplicationFormData>({
    full_name: '',
    furigana_name: '',
    email: '',
    phone_number: '',
    appeal_points: '',
    hobbies_special_skills: '',
    referrer_info: '',
    education_background_cram_school: '',
    education_background_middle_school: '',
    education_background_high_school: '',
    education_background_university: '',
    education_background_faculty: '',
  });

  const [validationErrors, setValidationErrors] = useState<FormValidationErrors>({});
  const [photoUploadProgress, setPhotoUploadProgress] = useState<PhotoUploadProgress>({});
  const [activeSection, setActiveSection] = useState<FormSection>('basic_info');

  // バリデーション関数
  const validateForm = (): boolean => {
    const errors: FormValidationErrors = {};

    // 必須項目のチェック
    if (!formData.full_name.trim()) {
      errors.full_name = '氏名は必須です';
    }

    if (!formData.furigana_name.trim()) {
      errors.furigana_name = 'フリガナは必須です';
    }

    if (!formData.email.trim()) {
      errors.email = 'メールアドレスは必須です';
    } else {
      // メールアドレス形式チェック
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        errors.email = '正しいメールアドレス形式で入力してください';
      }
    }

    // 電話番号形式チェック（任意項目の場合）
    if (formData.phone_number) {
      const phoneRegex = /^[\d-+().\\s]+$/;
      if (!phoneRegex.test(formData.phone_number)) {
        errors.phone_number = '正しい電話番号形式で入力してください';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // フォームデータの更新
  const updateFormData = (section: string, data: Partial<TeacherApplicationFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
    
    // 該当フィールドのバリデーションエラーをクリア
    const updatedErrors = { ...validationErrors };
    Object.keys(data).forEach(key => {
      delete updatedErrors[key as keyof FormValidationErrors];
    });
    setValidationErrors(updatedErrors);
  };

  // ファイルアップロードの進捗更新
  const updatePhotoUploadProgress = (type: 'formal' | 'casual', progress: Partial<PhotoUploadProgress['formal']>) => {
    setPhotoUploadProgress(prev => ({
      ...prev,
      [type]: { ...prev[type], ...progress }
    }));
  };

  // フォーム送信
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (err) {
      console.error('Form submission error:', err);
    }
  };

  // セクションナビゲーション
  const sections: { id: FormSection; title: string; required?: boolean }[] = [
    { id: 'basic_info', title: '基本情報', required: true },
    { id: 'profile_photos', title: 'プロフィール写真' },
    { id: 'appeal_hobbies', title: 'アピールポイント・趣味' },
    { id: 'education_background', title: '学歴情報' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* セクションナビゲーション */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <nav className="flex space-x-8 overflow-x-auto">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveSection(section.id)}
              className={`
                flex-shrink-0 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                ${activeSection === section.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {section.title}
              {section.required && <span className="text-red-500 ml-1">*</span>}
            </button>
          ))}
        </nav>
      </div>

      {/* セクション別フォーム */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {activeSection === 'basic_info' && (
          <BasicInfoSection
            data={formData}
            errors={validationErrors}
            onChange={(data) => updateFormData('basic_info', data)}
          />
        )}

        {activeSection === 'profile_photos' && (
          <ProfilePhotosSection
            data={formData}
            errors={validationErrors}
            uploadProgress={photoUploadProgress}
            onChange={(data) => updateFormData('profile_photos', data)}
            onUploadProgress={updatePhotoUploadProgress}
          />
        )}

        {activeSection === 'appeal_hobbies' && (
          <AppealHobbiesSection
            data={formData}
            errors={validationErrors}
            onChange={(data) => updateFormData('appeal_hobbies', data)}
          />
        )}

        {activeSection === 'education_background' && (
          <EducationBackgroundSection
            data={formData}
            errors={validationErrors}
            onChange={(data) => updateFormData('education_background', data)}
          />
        )}
      </div>

      {/* セクション間ナビゲーション */}
      <div className="flex justify-between">
        <button
          type="button"
          onClick={() => {
            const currentIndex = sections.findIndex(s => s.id === activeSection);
            if (currentIndex > 0) {
              setActiveSection(sections[currentIndex - 1].id);
            }
          }}
          disabled={sections.findIndex(s => s.id === activeSection) === 0}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          前のセクション
        </button>

        <div className="flex space-x-3">
          {sections.findIndex(s => s.id === activeSection) < sections.length - 1 ? (
            <button
              type="button"
              onClick={() => {
                const currentIndex = sections.findIndex(s => s.id === activeSection);
                if (currentIndex < sections.length - 1) {
                  setActiveSection(sections[currentIndex + 1].id);
                }
              }}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
            >
              次のセクション
            </button>
          ) : (
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '送信中...' : '申請を送信'}
            </button>
          )}
        </div>
      </div>

      {/* 必須項目の注意 */}
      <div className="text-sm text-gray-600 bg-gray-50 rounded-md p-4">
        <p>
          <span className="text-red-500">*</span> 印の項目は必須入力項目です。<br />
          すべて入力してから申請を送信してください。
        </p>
      </div>
    </form>
  );
}