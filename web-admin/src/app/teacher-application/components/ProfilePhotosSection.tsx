'use client';

import { useState, useRef } from 'react';
import { TeacherApplicationFormData, FormValidationErrors, PhotoUploadProgress } from '@/types/teacherApplication';

interface ProfilePhotosSectionProps {
  data: TeacherApplicationFormData;
  errors: FormValidationErrors;
  uploadProgress: PhotoUploadProgress;
  onChange: (data: Partial<TeacherApplicationFormData>) => void;
  onUploadProgress: (type: 'formal' | 'casual', progress: Partial<PhotoUploadProgress['formal']>) => void;
}

export default function ProfilePhotosSection({
  data,
  errors,
  uploadProgress,
  onChange,
  onUploadProgress
}: ProfilePhotosSectionProps) {
  
  const formalPhotoRef = useRef<HTMLInputElement>(null);
  const casualPhotoRef = useRef<HTMLInputElement>(null);
  const [formalPreview, setFormalPreview] = useState<string | null>(null);
  const [casualPreview, setCasualPreview] = useState<string | null>(null);

  // ファイルサイズ制限（5MB）
  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];

  // ファイル選択処理
  const handleFileSelect = async (type: 'formal' | 'casual', file: File) => {
    // ファイルサイズチェック
    if (file.size > MAX_FILE_SIZE) {
      alert('ファイルサイズが大きすぎます。5MB以下のファイルを選択してください。');
      return;
    }

    // ファイル形式チェック
    if (!ALLOWED_TYPES.includes(file.type)) {
      alert('サポートされていないファイル形式です。JPEG、JPG、PNGファイルを選択してください。');
      return;
    }

    // プレビュー表示
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (type === 'formal') {
        setFormalPreview(result);
      } else {
        setCasualPreview(result);
      }
    };
    reader.readAsDataURL(file);

    // フォームデータに追加
    onChange({
      [type === 'formal' ? 'profile_formal_photo' : 'profile_casual_photo']: file
    });

    // アップロード進捗の初期化
    onUploadProgress(type, {
      uploading: false,
      progress: 0,
      error: undefined
    });
  };

  // ファイル削除処理
  const handleFileRemove = (type: 'formal' | 'casual') => {
    if (type === 'formal') {
      setFormalPreview(null);
      onChange({ profile_formal_photo: undefined });
      if (formalPhotoRef.current) {
        formalPhotoRef.current.value = '';
      }
    } else {
      setCasualPreview(null);
      onChange({ profile_casual_photo: undefined });
      if (casualPhotoRef.current) {
        casualPhotoRef.current.value = '';
      }
    }

    onUploadProgress(type, {
      uploading: false,
      progress: 0,
      url: undefined,
      error: undefined
    });
  };

  // ファイル入力変更処理
  const handleInputChange = (type: 'formal' | 'casual') => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(type, file);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          プロフィール写真
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          生徒・保護者向けのプロフィールページで使用します。任意ですが、登録いただくことで信頼度が向上します。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 正装写真 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            正装写真（推奨）
          </label>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            {formalPreview ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <img
                    src={formalPreview}
                    alt="正装写真プレビュー"
                    className="w-32 h-32 object-cover rounded-lg border"
                  />
                </div>
                <div className="flex justify-center space-x-2">
                  <button
                    type="button"
                    onClick={() => formalPhotoRef.current?.click()}
                    className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                  >
                    変更
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFileRemove('formal')}
                    className="px-3 py-1 text-sm font-medium text-red-600 bg-red-50 rounded hover:bg-red-100"
                  >
                    削除
                  </button>
                </div>
              </div>
            ) : (
              <div 
                className="text-center cursor-pointer"
                onClick={() => formalPhotoRef.current?.click()}
              >
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="mt-4">
                  <p className="text-sm text-gray-600">
                    クリックして写真をアップロード
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    JPEG, JPG, PNG (最大 5MB)
                  </p>
                </div>
              </div>
            )}
          </div>
          
          <input
            ref={formalPhotoRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            onChange={handleInputChange('formal')}
            className="hidden"
          />
          
          {errors.profile_formal_photo && (
            <p className="mt-1 text-sm text-red-600">{errors.profile_formal_photo}</p>
          )}
          
          <p className="mt-2 text-xs text-gray-500">
            スーツやジャケット着用の写真をお願いします
          </p>
        </div>

        {/* カジュアル写真 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            カジュアル写真（任意）
          </label>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            {casualPreview ? (
              <div className="space-y-4">
                <div className="flex justify-center">
                  <img
                    src={casualPreview}
                    alt="カジュアル写真プレビュー"
                    className="w-32 h-32 object-cover rounded-lg border"
                  />
                </div>
                <div className="flex justify-center space-x-2">
                  <button
                    type="button"
                    onClick={() => casualPhotoRef.current?.click()}
                    className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-50 rounded hover:bg-blue-100"
                  >
                    変更
                  </button>
                  <button
                    type="button"
                    onClick={() => handleFileRemove('casual')}
                    className="px-3 py-1 text-sm font-medium text-red-600 bg-red-50 rounded hover:bg-red-100"
                  >
                    削除
                  </button>
                </div>
              </div>
            ) : (
              <div 
                className="text-center cursor-pointer"
                onClick={() => casualPhotoRef.current?.click()}
              >
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="mt-4">
                  <p className="text-sm text-gray-600">
                    クリックして写真をアップロード
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    JPEG, JPG, PNG (最大 5MB)
                  </p>
                </div>
              </div>
            )}
          </div>
          
          <input
            ref={casualPhotoRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png"
            onChange={handleInputChange('casual')}
            className="hidden"
          />
          
          {errors.profile_casual_photo && (
            <p className="mt-1 text-sm text-red-600">{errors.profile_casual_photo}</p>
          )}
          
          <p className="mt-2 text-xs text-gray-500">
            普段着や趣味の写真などでも構いません
          </p>
        </div>
      </div>

      {/* 注意事項 */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <h4 className="text-sm font-medium text-yellow-800 mb-2">写真について</h4>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• 顔がはっきりと写っている写真をお願いします</li>
          <li>• 不適切な内容の写真は審査で不採用となる場合があります</li>
          <li>• アップロードした写真は生徒・保護者のプロフィール閲覧で使用されます</li>
          <li>• 写真は後からマイページで変更することも可能です</li>
        </ul>
      </div>
    </div>
  );
}