import { z } from 'zod';

// 生徒作成リクエストのバリデーションスキーマ
export const createStudentSchema = z.object({
  full_name: z.string()
    .min(1, '生徒名は必須です')
    .max(50, '生徒名は50文字以内で入力してください')
    .regex(/^[ぁ-んァ-ヶー一-龠\s]+$/, '生徒名は日本語で入力してください'),
  
  furigana_name: z.string()
    .max(50, 'フリガナは50文字以内で入力してください')
    .regex(/^[ァ-ヶー\s]*$/, 'フリガナはカタカナで入力してください')
    .optional(),
  
  grade: z.string()
    .max(20, '学年は20文字以内で入力してください')
    .optional(),
  
  school_attended: z.string()
    .max(100, '通塾先は100文字以内で入力してください')
    .optional(),
  
  enrollment_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '入会日は正しい日付形式で入力してください'),
  
  status: z.enum(['在籍中', '休会中', '退会済み']),
  
  parent_name: z.string()
    .min(1, '保護者名は必須です')
    .max(50, '保護者名は50文字以内で入力してください'),
  
  parent_email: z.string()
    .min(1, 'メールアドレスは必須です')
    .email('正しいメールアドレス形式で入力してください')
    .max(100, 'メールアドレスは100文字以内で入力してください'),
  
  parent_phone_number: z.string()
    .regex(/^[0-9\-\s]*$/, '電話番号は数字、ハイフン、スペースのみ使用できます')
    .max(20, '電話番号は20文字以内で入力してください')
    .optional(),
  
  notes: z.string()
    .max(1000, '備考は1000文字以内で入力してください')
    .optional(),
});

// タスク作成のバリデーションスキーマ
export const createTaskSchema = z.object({
  content: z.string()
    .min(1, 'タスク内容は必須です')
    .max(500, 'タスク内容は500文字以内で入力してください')
    .refine(
      (val) => !/<script|javascript:|on\w+=/i.test(val),
      '不正なスクリプトが含まれています'
    ),
  
  target_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '対象日は正しい日付形式で入力してください'),
  
  display_order: z.number()
    .int('表示順序は整数で入力してください')
    .min(0, '表示順序は0以上で入力してください')
    .max(1000, '表示順序は1000以下で入力してください'),
});

// コメント作成のバリデーションスキーマ
export const createCommentSchema = z.object({
  comment_content: z.string()
    .min(1, 'コメントは必須です')
    .max(2000, 'コメントは2000文字以内で入力してください')
    .refine(
      (val) => !/<script|javascript:|on\w+=/i.test(val),
      '不正なスクリプトが含まれています'
    ),
  
  target_date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, '対象日は正しい日付形式で入力してください'),
});

// SQLインジェクション対策用のサニタイゼーション
export function sanitizeString(input: string): string {
  return input
    .replace(/[<>'"]/g, '') // HTMLタグや引用符を除去
    .replace(/[\x00-\x1f\x7f-\x9f]/g, '') // 制御文字を除去
    .trim();
}

// XSS対策用のHTMLエスケープ
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// 電話番号の正規化
export function normalizePhoneNumber(phone: string): string {
  return phone.replace(/[^\d]/g, '');
}

// 日付の検証
export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}