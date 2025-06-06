import { format, addDays, startOfWeek, parseISO, isValid } from 'date-fns';
import { ja } from 'date-fns/locale';

/**
 * 指定した日付が含まれる週の月曜日を取得
 */
export function getWeekStartDate(date: Date | string): string {
  const targetDate = typeof date === 'string' ? parseISO(date) : date;
  if (!isValid(targetDate)) {
    throw new Error('Invalid date provided');
  }
  
  // 週の開始を月曜日に設定
  const mondayDate = startOfWeek(targetDate, { weekStartsOn: 1 });
  return format(mondayDate, 'yyyy-MM-dd');
}

/**
 * 週開始日（月曜日）から7日分の日付配列を生成
 */
export function getWeekDates(weekStartDate: string): Array<{
  date: string;
  dayOfWeek: string;
  dayOfWeekShort: string;
  formattedDate: string;
}> {
  const startDate = parseISO(weekStartDate);
  if (!isValid(startDate)) {
    throw new Error('Invalid week start date provided');
  }

  const days = [];
  const dayNames = ['月', '火', '水', '木', '金', '土', '日'];
  const dayNamesShort = ['月', '火', '水', '木', '金', '土', '日'];

  for (let i = 0; i < 7; i++) {
    const currentDate = addDays(startDate, i);
    days.push({
      date: format(currentDate, 'yyyy-MM-dd'),
      dayOfWeek: dayNames[i],
      dayOfWeekShort: dayNamesShort[i],
      formattedDate: format(currentDate, 'M/d', { locale: ja }),
    });
  }

  return days;
}

/**
 * 前の週の月曜日を取得
 */
export function getPreviousWeek(weekStartDate: string): string {
  const startDate = parseISO(weekStartDate);
  if (!isValid(startDate)) {
    throw new Error('Invalid week start date provided');
  }
  
  const previousWeek = addDays(startDate, -7);
  return format(previousWeek, 'yyyy-MM-dd');
}

/**
 * 次の週の月曜日を取得
 */
export function getNextWeek(weekStartDate: string): string {
  const startDate = parseISO(weekStartDate);
  if (!isValid(startDate)) {
    throw new Error('Invalid week start date provided');
  }
  
  const nextWeek = addDays(startDate, 7);
  return format(nextWeek, 'yyyy-MM-dd');
}

/**
 * 現在の週（今週の月曜日）を取得
 */
export function getCurrentWeekStart(): string {
  return getWeekStartDate(new Date());
}

/**
 * 週開始日から週の表示用文字列を生成
 * 例: "2024年6月3日〜6月9日"
 */
export function getWeekDisplayString(weekStartDate: string): string {
  const startDate = parseISO(weekStartDate);
  if (!isValid(startDate)) {
    return '無効な日付';
  }
  
  const endDate = addDays(startDate, 6);
  
  // 同じ月の場合
  if (format(startDate, 'yyyy-MM') === format(endDate, 'yyyy-MM')) {
    return `${format(startDate, 'yyyy年M月d日', { locale: ja })}〜${format(endDate, 'd日', { locale: ja })}`;
  }
  
  // 異なる月にまたがる場合
  if (format(startDate, 'yyyy') === format(endDate, 'yyyy')) {
    return `${format(startDate, 'yyyy年M月d日', { locale: ja })}〜${format(endDate, 'M月d日', { locale: ja })}`;
  }
  
  // 異なる年にまたがる場合
  return `${format(startDate, 'yyyy年M月d日', { locale: ja })}〜${format(endDate, 'yyyy年M月d日', { locale: ja })}`;
}

/**
 * クエリパラメータから週開始日を解析
 * 無効な場合は現在の週を返す
 */
export function parseWeekFromQuery(weekParam: string | null): string {
  if (!weekParam) {
    return getCurrentWeekStart();
  }
  
  try {
    const date = parseISO(weekParam);
    if (!isValid(date)) {
      return getCurrentWeekStart();
    }
    
    // 提供された日付を週の開始日として使用
    return format(date, 'yyyy-MM-dd');
  } catch {
    return getCurrentWeekStart();
  }
}

/**
 * 日付文字列が有効かチェック
 */
export function isValidDateString(dateString: string): boolean {
  try {
    const date = parseISO(dateString);
    return isValid(date);
  } catch {
    return false;
  }
}