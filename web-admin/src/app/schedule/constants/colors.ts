/**
 * スケジュール画面用のカラーパレット定義
 * デザインシステムと統一されたカラーテーマ
 */

export const LESSON_COLORS = {
  通常授業: {
    bg: 'bg-primary-100',
    border: 'border-primary-500',
    text: 'text-primary-900',
    legendBg: 'bg-primary-500',
    legendText: 'text-white',
    calendarClass: 'lesson-regular'
  },
  固定面談: {
    bg: 'bg-secondary-100', 
    border: 'border-secondary-500',
    text: 'text-secondary-900',
    legendBg: 'bg-secondary-500',
    legendText: 'text-white',
    calendarClass: 'lesson-interview'
  },
  振替授業: {
    bg: 'bg-accent-100',
    border: 'border-accent-500', 
    text: 'text-accent-900',
    legendBg: 'bg-accent-500',
    legendText: 'text-white',
    calendarClass: 'lesson-makeup'
  },
  追加授業: {
    bg: 'bg-success-100',
    border: 'border-success-500',
    text: 'text-success-900', 
    legendBg: 'bg-success-500',
    legendText: 'text-white',
    calendarClass: 'lesson-additional'
  }
} as const;

export const STATUS_COLORS = {
  予定通り: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    border: 'border-gray-300',
    icon: 'faClock'
  },
  実施済み: {
    bg: 'bg-success-100',
    text: 'text-success-700',
    border: 'border-success-300',
    icon: 'faCheck'
  },
  欠席: {
    bg: 'bg-error-100',
    text: 'text-error-700',
    border: 'border-error-300',
    icon: 'faUserSlash',
    calendarClass: 'lesson-absent'
  },
  '振替済み（振替元）': {
    bg: 'bg-warning-100',
    text: 'text-warning-700',
    border: 'border-warning-300',
    icon: 'faExchangeAlt',
    calendarClass: 'lesson-rescheduled'
  }
} as const;

export type LessonType = keyof typeof LESSON_COLORS;
export type LessonStatus = keyof typeof STATUS_COLORS;

/**
 * 授業種別に応じたカラー情報を取得
 */
export function getLessonTypeColor(slotType: LessonType) {
  return LESSON_COLORS[slotType] || LESSON_COLORS.通常授業;
}

/**
 * ステータスに応じたカラー情報を取得
 */
export function getStatusColor(status: LessonStatus) {
  return STATUS_COLORS[status] || STATUS_COLORS.予定通り;
}

/**
 * 授業種別に応じたアイコンを取得
 */
export function getLessonTypeIcon(slotType: LessonType): string {
  const iconMap = {
    通常授業: 'faBook',
    固定面談: 'faComments',
    振替授業: 'faExchangeAlt',
    追加授業: 'faPlus'
  };
  return iconMap[slotType] || 'faBook';
}

/**
 * ステータスに応じたアイコンを取得
 */
export function getStatusIcon(status: LessonStatus): string {
  return STATUS_COLORS[status]?.icon || 'faClock';
}

/**
 * カレンダーイベントのCSSクラスを生成
 */
export function getEventClassName(slotType: LessonType, status: LessonStatus): string {
  const baseClass = 'lesson-event';
  
  // ステータスが特別な場合はそちらを優先
  if (status === '欠席') return `${baseClass} ${STATUS_COLORS[status].calendarClass}`;
  if (status === '振替済み（振替元）') return `${baseClass} ${STATUS_COLORS[status].calendarClass}`;
  
  // 通常は授業種別のクラス
  return `${baseClass} ${LESSON_COLORS[slotType].calendarClass}`;
}