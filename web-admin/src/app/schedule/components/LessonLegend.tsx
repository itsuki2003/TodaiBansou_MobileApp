'use client';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons';
import { LESSON_COLORS, STATUS_COLORS } from '../constants/colors';

interface LessonLegendProps {
  className?: string;
}

export default function LessonLegend({ className = '' }: LessonLegendProps) {
  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
        <FontAwesomeIcon icon={faInfoCircle} className="mr-3 text-primary-600 w-5 h-5" />
        凡例
      </h3>
      
      <div className="space-y-6">
        {/* 授業種別の凡例 */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">授業種別</h4>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.entries(LESSON_COLORS).map(([type, colors]) => (
              <div key={type} className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded ${colors.legendBg} shadow-sm`} />
                <span className="text-sm font-medium text-gray-700">{type}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ステータスの凡例 */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">ステータス</h4>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.entries(STATUS_COLORS).map(([status, colors]) => (
              <div key={status} className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded ${colors.bg} border ${colors.border} shadow-sm`} />
                <span className="text-sm font-medium text-gray-700">{status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 使い方のヒント */}
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="bg-primary-50 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <div className="w-5 h-5 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <div className="w-2 h-2 bg-primary-500 rounded-full" />
            </div>
            <div className="text-sm text-primary-700">
              <p className="font-medium mb-1">操作方法</p>
              <ul className="space-y-1 text-xs">
                <li>• 授業をクリックして詳細を表示・編集</li>
                <li>• 空白部分をクリックして新規授業を追加</li>
                <li>• 月/週/日ボタンで表示を切り替え</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}