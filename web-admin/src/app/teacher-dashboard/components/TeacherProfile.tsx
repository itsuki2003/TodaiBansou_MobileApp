'use client';

import { useState } from 'react';
import { TeacherProfile as TeacherProfileType, TeacherProfileFormData } from '@/types/teacher';
import PhotoUpload from './PhotoUpload';

interface TeacherProfileProps {
  teacher: TeacherProfileType;
  onUpdate: (data: TeacherProfileFormData) => Promise<void>;
  onRefresh: () => void;
}

export default function TeacherProfile({ teacher, onUpdate, onRefresh }: TeacherProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<TeacherProfileFormData>({
    phone_number: teacher.phone_number || '',
    profile_formal_photo_url: teacher.profile_formal_photo_url || '',
    profile_casual_photo_url: teacher.profile_casual_photo_url || '',
    appeal_points: teacher.appeal_points || '',
    hobbies_special_skills: teacher.hobbies_special_skills || '',
    education_background_cram_school: teacher.education_background_cram_school || '',
    education_background_junior_high: teacher.education_background_junior_high || '',
    education_background_high_school: teacher.education_background_high_school || '',
    education_background_university: teacher.education_background_university || '',
    education_background_faculty: teacher.education_background_faculty || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await onUpdate(formData);
      setIsEditing(false);
      onRefresh();
    } catch (error) {
      console.error('プロフィール更新エラー:', error);
      alert('プロフィールの更新に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      phone_number: teacher.phone_number || '',
      profile_formal_photo_url: teacher.profile_formal_photo_url || '',
      profile_casual_photo_url: teacher.profile_casual_photo_url || '',
      appeal_points: teacher.appeal_points || '',
      hobbies_special_skills: teacher.hobbies_special_skills || '',
      education_background_cram_school: teacher.education_background_cram_school || '',
      education_background_junior_high: teacher.education_background_junior_high || '',
      education_background_high_school: teacher.education_background_high_school || '',
      education_background_university: teacher.education_background_university || '',
      education_background_faculty: teacher.education_background_faculty || '',
    });
    setIsEditing(false);
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">
          プロフィール
        </h3>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700"
          >
            編集
          </button>
        )}
      </div>

      <div className="p-6">
        {!isEditing ? (
          /* 表示モード */
          <div className="space-y-6">
            {/* 基本情報 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">氏名</label>
                <p className="mt-1 text-lg font-medium text-gray-900">{teacher.full_name}</p>
                <p className="text-sm text-gray-500">{teacher.furigana_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">メールアドレス</label>
                <p className="mt-1 text-gray-900">{teacher.email}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">電話番号</label>
                <p className="mt-1 text-gray-900">{teacher.phone_number || '未設定'}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">アカウント状態</label>
                <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium ${
                  teacher.account_status === '有効' ? 'bg-green-100 text-green-800' :
                  teacher.account_status === '承認待ち' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {teacher.account_status}
                </span>
              </div>
            </div>

            {/* 写真 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">正式な写真</label>
                {teacher.profile_formal_photo_url ? (
                  <img
                    src={teacher.profile_formal_photo_url}
                    alt="正式な写真"
                    className="w-32 h-32 object-cover rounded-lg border"
                  />
                ) : (
                  <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-gray-400">未設定</span>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">カジュアルな写真</label>
                {teacher.profile_casual_photo_url ? (
                  <img
                    src={teacher.profile_casual_photo_url}
                    alt="カジュアルな写真"
                    className="w-32 h-32 object-cover rounded-lg border"
                  />
                ) : (
                  <div className="w-32 h-32 bg-gray-200 rounded-lg flex items-center justify-center">
                    <span className="text-gray-400">未設定</span>
                  </div>
                )}
              </div>
            </div>

            {/* アピールポイント・趣味特技 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">アピールポイント</label>
                <p className="mt-1 text-gray-900 whitespace-pre-wrap">
                  {teacher.appeal_points || '未設定'}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">趣味・特技</label>
                <p className="mt-1 text-gray-900 whitespace-pre-wrap">
                  {teacher.hobbies_special_skills || '未設定'}
                </p>
              </div>
            </div>

            {/* 学歴 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">学歴</label>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">塾:</span>
                  <span className="text-gray-900">{teacher.education_background_cram_school || '未設定'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">中学校:</span>
                  <span className="text-gray-900">{teacher.education_background_junior_high || '未設定'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">高等学校:</span>
                  <span className="text-gray-900">{teacher.education_background_high_school || '未設定'}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-600">大学:</span>
                  <span className="text-gray-900">{teacher.education_background_university || '未設定'}</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-600">学部:</span>
                  <span className="text-gray-900">{teacher.education_background_faculty || '未設定'}</span>
                </div>
              </div>
            </div>

            {/* その他の情報 */}
            {teacher.referrer_info && (
              <div>
                <label className="block text-sm font-medium text-gray-700">紹介元情報</label>
                <p className="mt-1 text-gray-900">{teacher.referrer_info}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-500">
              {teacher.registration_application_date && (
                <div>
                  <span className="font-medium">登録申請日:</span>
                  <span className="ml-2">{new Date(teacher.registration_application_date).toLocaleDateString('ja-JP')}</span>
                </div>
              )}
              {teacher.account_approval_date && (
                <div>
                  <span className="font-medium">アカウント承認日:</span>
                  <span className="ml-2">{new Date(teacher.account_approval_date).toLocaleDateString('ja-JP')}</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          /* 編集モード */
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 基本情報 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">電話番号</label>
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="080-1234-5678"
                />
              </div>
            </div>

            {/* 写真アップロード */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <PhotoUpload
                label="正式な写真"
                currentUrl={formData.profile_formal_photo_url}
                onUpload={(url) => setFormData({...formData, profile_formal_photo_url: url})}
              />
              <PhotoUpload
                label="カジュアルな写真"
                currentUrl={formData.profile_casual_photo_url}
                onUpload={(url) => setFormData({...formData, profile_casual_photo_url: url})}
              />
            </div>

            {/* アピールポイント・趣味特技 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">アピールポイント</label>
                <textarea
                  value={formData.appeal_points}
                  onChange={(e) => setFormData({...formData, appeal_points: e.target.value})}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="あなたの強みや特徴を書いてください"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">趣味・特技</label>
                <textarea
                  value={formData.hobbies_special_skills}
                  onChange={(e) => setFormData({...formData, hobbies_special_skills: e.target.value})}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  placeholder="趣味や特技を書いてください"
                />
              </div>
            </div>

            {/* 学歴 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">学歴</label>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-500">塾</label>
                  <input
                    type="text"
                    value={formData.education_background_cram_school}
                    onChange={(e) => setFormData({...formData, education_background_cram_school: e.target.value})}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="通っていた塾名"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">中学校</label>
                  <input
                    type="text"
                    value={formData.education_background_junior_high}
                    onChange={(e) => setFormData({...formData, education_background_junior_high: e.target.value})}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="出身中学校"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">高等学校</label>
                  <input
                    type="text"
                    value={formData.education_background_high_school}
                    onChange={(e) => setFormData({...formData, education_background_high_school: e.target.value})}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="出身高等学校"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500">大学</label>
                    <input
                      type="text"
                      value={formData.education_background_university}
                      onChange={(e) => setFormData({...formData, education_background_university: e.target.value})}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="大学名"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500">学部</label>
                    <input
                      type="text"
                      value={formData.education_background_faculty}
                      onChange={(e) => setFormData({...formData, education_background_faculty: e.target.value})}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="学部名"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ボタン */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {isSubmitting && (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {isSubmitting ? '保存中...' : '保存'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}