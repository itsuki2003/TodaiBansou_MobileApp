'use client';

import { TeacherApplicationFormData, FormValidationErrors } from '@/types/teacherApplication';

interface AppealHobbiesSectionProps {
  data: TeacherApplicationFormData;
  errors: FormValidationErrors;
  onChange: (data: Partial<TeacherApplicationFormData>) => void;
}

export default function AppealHobbiesSection({
  data,
  errors,
  onChange
}: AppealHobbiesSectionProps) {
  
  const handleTextareaChange = (field: keyof TeacherApplicationFormData) => (
    e: React.ChangeEvent<HTMLTextAreaElement>
  ) => {
    onChange({ [field]: e.target.value });
  };

  const handleInputChange = (field: keyof TeacherApplicationFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    onChange({ [field]: e.target.value });
  };

  // 文字数カウント関数
  const getCharacterCount = (text: string = '', max: number) => {
    return `${text.length}/${max}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          アピールポイント・趣味
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          あなたの人柄や魅力を生徒・保護者に伝えるための情報をご入力ください。
        </p>
      </div>

      <div className="space-y-6">
        {/* アピールポイント */}
        <div>
          <label
            htmlFor="appeal_points"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            アピールポイント（任意）
          </label>
          <textarea
            id="appeal_points"
            value={data.appeal_points || ''}
            onChange={handleTextareaChange('appeal_points')}
            rows={4}
            maxLength={500}
            className={`
              w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-transparent resize-none
              ${errors.appeal_points
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
              }
            `}
            placeholder="例：中学受験の経験があり、生徒の気持ちに寄り添った指導ができます。特に算数の指導が得意で、基礎から応用まで分かりやすく教えることができます。"
          />
          <div className="flex justify-between items-center mt-1">
            {errors.appeal_points && (
              <p className="text-sm text-red-600">{errors.appeal_points}</p>
            )}
            <p className="text-xs text-gray-500 ml-auto">
              {getCharacterCount(data.appeal_points, 500)}文字
            </p>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            指導スタイル、得意科目、生徒への想いなどを自由にお書きください
          </p>
        </div>

        {/* 趣味・特技 */}
        <div>
          <label
            htmlFor="hobbies_special_skills"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            趣味・特技（任意）
          </label>
          <textarea
            id="hobbies_special_skills"
            value={data.hobbies_special_skills || ''}
            onChange={handleTextareaChange('hobbies_special_skills')}
            rows={3}
            maxLength={300}
            className={`
              w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-transparent resize-none
              ${errors.hobbies_special_skills
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
              }
            `}
            placeholder="例：読書、映画鑑賞、テニス、料理、プログラミング、ピアノなど"
          />
          <div className="flex justify-between items-center mt-1">
            {errors.hobbies_special_skills && (
              <p className="text-sm text-red-600">{errors.hobbies_special_skills}</p>
            )}
            <p className="text-xs text-gray-500 ml-auto">
              {getCharacterCount(data.hobbies_special_skills, 300)}文字
            </p>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            生徒とのコミュニケーションのきっかけになることがあります
          </p>
        </div>

        {/* 紹介者情報 */}
        <div>
          <label
            htmlFor="referrer_info"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            紹介者情報（任意）
          </label>
          <input
            type="text"
            id="referrer_info"
            value={data.referrer_info || ''}
            onChange={handleInputChange('referrer_info')}
            maxLength={100}
            className={`
              w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:border-transparent
              ${errors.referrer_info
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
              }
            `}
            placeholder="例：東大伴走講師 田中太郎先生、友人の紹介、ウェブサイトを見て"
          />
          <div className="flex justify-between items-center mt-1">
            {errors.referrer_info && (
              <p className="text-sm text-red-600">{errors.referrer_info}</p>
            )}
            <p className="text-xs text-gray-500 ml-auto">
              {getCharacterCount(data.referrer_info, 100)}文字
            </p>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            どのようなきっかけで東大伴走を知ったかお聞かせください
          </p>
        </div>
      </div>

      {/* サンプル例 */}
      <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
        <h4 className="text-sm font-medium text-gray-800 mb-3">記入例</h4>
        
        <div className="space-y-4 text-sm">
          <div>
            <p className="font-medium text-gray-700 mb-1">アピールポイント例:</p>
            <p className="text-gray-600 bg-white p-2 rounded border text-xs">
              「私自身も中学受験を経験し、SAPIX→麻布中学→東京大学文科一類と進学しました。受験生時代の苦労や喜びを実体験として理解しているため、生徒の気持ちに寄り添った指導ができます。特に国語と社会が得意で、記述問題の解き方や暗記のコツを分かりやすく伝えることができます。生徒一人ひとりの個性を大切にし、自信を持って学習に取り組めるようサポートします。」
            </p>
          </div>
          
          <div>
            <p className="font-medium text-gray-700 mb-1">趣味・特技例:</p>
            <p className="text-gray-600 bg-white p-2 rounded border text-xs">
              「読書（歴史小説が好き）、映画鑑賞、テニス、料理。特に歴史については詳しく、社会の授業では興味深いエピソードを交えて教えることができます。」
            </p>
          </div>
        </div>
      </div>

      {/* ヒント */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <h4 className="text-sm font-medium text-blue-800 mb-2">記入のヒント</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• 生徒・保護者が親しみやすさを感じられる内容を心がけてください</li>
          <li>• 具体的なエピソードがあると、より魅力的に伝わります</li>
          <li>• 教育に活かせる経験や知識があれば積極的にアピールしてください</li>
          <li>• 無理に書く必要はありません。自然体でのあなたを表現してください</li>
        </ul>
      </div>
    </div>
  );
}