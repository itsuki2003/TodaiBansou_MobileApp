'use client';

import { TeacherApplicationFormData, FormValidationErrors } from '@/types/teacherApplication';

interface BasicInfoSectionProps {
  data: TeacherApplicationFormData;
  errors: FormValidationErrors;
  onChange: (data: Partial<TeacherApplicationFormData>) => void;
}

export default function BasicInfoSection({
  data,
  errors,
  onChange
}: BasicInfoSectionProps) {
  
  const handleInputChange = (field: keyof TeacherApplicationFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    onChange({ [field]: e.target.value });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          基本情報 <span className="text-red-500">*</span>
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          講師登録に必要な基本情報をご入力ください。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 氏名 */}
        <div>
          <label
            htmlFor="full_name"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            氏名 <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="full_name"
            value={data.full_name}
            onChange={handleInputChange('full_name')}
            className={`
              w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-transparent
              ${errors.full_name
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
              }
            `}
            placeholder="山田 太郎"
            required
          />
          {errors.full_name && (
            <p className="mt-1 text-sm text-red-600">{errors.full_name}</p>
          )}
        </div>

        {/* フリガナ */}
        <div>
          <label
            htmlFor="furigana_name"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            フリガナ <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="furigana_name"
            value={data.furigana_name}
            onChange={handleInputChange('furigana_name')}
            className={`
              w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-transparent
              ${errors.furigana_name
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
              }
            `}
            placeholder="ヤマダ タロウ"
            required
          />
          {errors.furigana_name && (
            <p className="mt-1 text-sm text-red-600">{errors.furigana_name}</p>
          )}
        </div>

        {/* メールアドレス */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            メールアドレス <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            value={data.email}
            onChange={handleInputChange('email')}
            className={`
              w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-transparent
              ${errors.email
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
              }
            `}
            placeholder="yamada@example.com"
            required
          />
          {errors.email && (
            <p className="mt-1 text-sm text-red-600">{errors.email}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            審査結果の連絡や今後のやりとりに使用します
          </p>
        </div>

        {/* 電話番号 */}
        <div>
          <label
            htmlFor="phone_number"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            電話番号（任意）
          </label>
          <input
            type="tel"
            id="phone_number"
            value={data.phone_number || ''}
            onChange={handleInputChange('phone_number')}
            className={`
              w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-transparent
              ${errors.phone_number
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
              }
            `}
            placeholder="090-1234-5678"
          />
          {errors.phone_number && (
            <p className="mt-1 text-sm text-red-600">{errors.phone_number}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            緊急時の連絡先として使用する場合があります
          </p>
        </div>
      </div>

      {/* 注意事項 */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <h4 className="text-sm font-medium text-blue-800 mb-2">ご注意</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• メールアドレスは今後のログインIDとして使用されます</li>
          <li>• 既に登録済みのメールアドレスは使用できません</li>
          <li>• 審査後、アカウント有効化のご連絡をいたします</li>
        </ul>
      </div>
    </div>
  );
}