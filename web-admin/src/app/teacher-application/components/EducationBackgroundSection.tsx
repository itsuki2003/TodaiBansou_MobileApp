'use client';

import { TeacherApplicationFormData, FormValidationErrors } from '@/types/teacherApplication';

interface EducationBackgroundSectionProps {
  data: TeacherApplicationFormData;
  errors: FormValidationErrors;
  onChange: (data: Partial<TeacherApplicationFormData>) => void;
}

export default function EducationBackgroundSection({
  data,
  errors,
  onChange
}: EducationBackgroundSectionProps) {
  
  const handleInputChange = (field: keyof TeacherApplicationFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    onChange({ [field]: e.target.value });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          学歴情報
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          あなたの学歴についてお聞かせください。生徒・保護者への信頼性向上に活用します。
        </p>
      </div>

      <div className="space-y-6">
        {/* 塾歴 */}
        <div>
          <label
            htmlFor="education_background_cram_school"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            塾歴（任意）
          </label>
          <input
            type="text"
            id="education_background_cram_school"
            value={data.education_background_cram_school || ''}
            onChange={handleInputChange('education_background_cram_school')}
            className={`
              w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-transparent
              ${errors.education_background_cram_school
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
              }
            `}
            placeholder="例：SAPIX、日能研、四谷大塚、早稲田アカデミーなど"
          />
          {errors.education_background_cram_school && (
            <p className="mt-1 text-sm text-red-600">{errors.education_background_cram_school}</p>
          )}
          <p className="mt-1 text-xs text-gray-500">
            中学受験時に通っていた塾があれば記入してください
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 中学校 */}
          <div>
            <label
              htmlFor="education_background_middle_school"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              中学校（任意）
            </label>
            <input
              type="text"
              id="education_background_middle_school"
              value={data.education_background_middle_school || ''}
              onChange={handleInputChange('education_background_middle_school')}
              className={`
                w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-transparent
                ${errors.education_background_middle_school
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
                }
              `}
              placeholder="例：麻布中学校、桜蔭中学校など"
            />
            {errors.education_background_middle_school && (
              <p className="mt-1 text-sm text-red-600">{errors.education_background_middle_school}</p>
            )}
          </div>

          {/* 高校 */}
          <div>
            <label
              htmlFor="education_background_high_school"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              高校（任意）
            </label>
            <input
              type="text"
              id="education_background_high_school"
              value={data.education_background_high_school || ''}
              onChange={handleInputChange('education_background_high_school')}
              className={`
                w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-transparent
                ${errors.education_background_high_school
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
                }
              `}
              placeholder="例：麻布高等学校、桜蔭高等学校など"
            />
            {errors.education_background_high_school && (
              <p className="mt-1 text-sm text-red-600">{errors.education_background_high_school}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 大学 */}
          <div>
            <label
              htmlFor="education_background_university"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              大学（任意）
            </label>
            <input
              type="text"
              id="education_background_university"
              value={data.education_background_university || ''}
              onChange={handleInputChange('education_background_university')}
              className={`
                w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-transparent
                ${errors.education_background_university
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
                }
              `}
              placeholder="例：東京大学、早稲田大学、慶應義塾大学など"
            />
            {errors.education_background_university && (
              <p className="mt-1 text-sm text-red-600">{errors.education_background_university}</p>
            )}
          </div>

          {/* 学部 */}
          <div>
            <label
              htmlFor="education_background_faculty"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              学部・学科（任意）
            </label>
            <input
              type="text"
              id="education_background_faculty"
              value={data.education_background_faculty || ''}
              onChange={handleInputChange('education_background_faculty')}
              className={`
                w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-transparent
                ${errors.education_background_faculty
                  ? 'border-red-300 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500'
                }
              `}
              placeholder="例：文学部、理学部、工学部、医学部など"
            />
            {errors.education_background_faculty && (
              <p className="mt-1 text-sm text-red-600">{errors.education_background_faculty}</p>
            )}
          </div>
        </div>
      </div>

      {/* 学歴例 */}
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
        <h4 className="text-sm font-medium text-gray-800 mb-3">記入例</h4>
        
        <div className="space-y-3 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="font-medium text-gray-700 mb-1">パターン1（私立中高一貫）:</p>
              <div className="text-gray-600 bg-white p-2 rounded border text-xs space-y-1">
                <p>塾歴: SAPIX</p>
                <p>中学校: 麻布中学校</p>
                <p>高校: 麻布高等学校</p>
                <p>大学: 東京大学</p>
                <p>学部: 文科一類→法学部</p>
              </div>
            </div>
            
            <div>
              <p className="font-medium text-gray-700 mb-1">パターン2（公立）:</p>
              <div className="text-gray-600 bg-white p-2 rounded border text-xs space-y-1">
                <p>塾歴: 地元の個人塾</p>
                <p>中学校: ○○市立○○中学校</p>
                <p>高校: ○○県立○○高等学校</p>
                <p>大学: 東京大学</p>
                <p>学部: 理科二類→農学部</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 注意事項 */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <h4 className="text-sm font-medium text-blue-800 mb-2">学歴情報について</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• すべて任意項目です。記入できる範囲で構いません</li>
          <li>• 中学受験経験がある場合は、生徒・保護者との共感につながることがあります</li>
          <li>• 現在在学中の場合は「○○大学（在学中）」のように記入してください</li>
          <li>• 学歴だけでなく、人柄や指導力を総合的に評価いたします</li>
          <li>• 虚偽の申告は発覚した場合、採用取り消しとなる場合があります</li>
        </ul>
      </div>

      {/* プライバシー */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <h4 className="text-sm font-medium text-yellow-800 mb-2">プライバシーについて</h4>
        <p className="text-sm text-yellow-700">
          学歴情報は生徒・保護者への紹介や信頼性向上のため使用します。
          詳細な情報（卒業年度など）の公開範囲については、採用後に改めてご相談させていただきます。
        </p>
      </div>
    </div>
  );
}