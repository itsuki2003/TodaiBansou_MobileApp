/**
 * 入力値検証のユーティリティ関数
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * メールアドレスの検証
 */
export const validateEmail = (email: string): ValidationResult => {
  if (!email) {
    return { isValid: false, error: 'メールアドレスを入力してください' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, error: 'メールアドレスの形式が正しくありません' };
  }

  if (email.length > 254) {
    return { isValid: false, error: 'メールアドレスが長すぎます' };
  }

  return { isValid: true };
};

/**
 * パスワードの検証
 */
export const validatePassword = (password: string): ValidationResult => {
  if (!password) {
    return { isValid: false, error: 'パスワードを入力してください' };
  }

  if (password.length < 8) {
    return { isValid: false, error: 'パスワードは8文字以上で入力してください' };
  }

  if (password.length > 128) {
    return { isValid: false, error: 'パスワードは128文字以下で入力してください' };
  }

  // 少なくとも1つの文字と1つの数字を含む
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  
  if (!hasLetter || !hasNumber) {
    return { isValid: false, error: 'パスワードは英字と数字を含む必要があります' };
  }

  return { isValid: true };
};

/**
 * 名前の検証
 */
export const validateFullName = (name: string): ValidationResult => {
  if (!name) {
    return { isValid: false, error: '氏名を入力してください' };
  }

  if (name.length < 2) {
    return { isValid: false, error: '氏名は2文字以上で入力してください' };
  }

  if (name.length > 50) {
    return { isValid: false, error: '氏名は50文字以下で入力してください' };
  }

  // 特殊文字のチェック（基本的な日本語、英字、数字、スペース、ハイフンのみ許可）
  const validNameRegex = /^[a-zA-Z0-9ひらがなカタカナ漢字\s\-・]+$/;
  if (!validNameRegex.test(name)) {
    return { isValid: false, error: '氏名に使用できない文字が含まれています' };
  }

  return { isValid: true };
};

/**
 * フリガナの検証
 */
export const validateFurigana = (furigana: string): ValidationResult => {
  if (!furigana) {
    return { isValid: false, error: 'フリガナを入力してください' };
  }

  if (furigana.length > 100) {
    return { isValid: false, error: 'フリガナは100文字以下で入力してください' };
  }

  // カタカナのみ許可
  const katakanaRegex = /^[ァ-ヶー\s]+$/;
  if (!katakanaRegex.test(furigana)) {
    return { isValid: false, error: 'フリガナはカタカナで入力してください' };
  }

  return { isValid: true };
};

/**
 * 電話番号の検証
 */
export const validatePhoneNumber = (phone: string): ValidationResult => {
  if (!phone) {
    return { isValid: false, error: '電話番号を入力してください' };
  }

  // ハイフンを除去
  const cleanPhone = phone.replace(/-/g, '');

  if (cleanPhone.length < 10 || cleanPhone.length > 11) {
    return { isValid: false, error: '電話番号は10-11桁で入力してください' };
  }

  const phoneRegex = /^[0-9]+$/;
  if (!phoneRegex.test(cleanPhone)) {
    return { isValid: false, error: '電話番号は数字のみで入力してください' };
  }

  return { isValid: true };
};

/**
 * 学年の検証
 */
export const validateGrade = (grade: string): ValidationResult => {
  if (!grade) {
    return { isValid: false, error: '学年を選択してください' };
  }

  const validGrades = [
    '小学1年生', '小学2年生', '小学3年生', '小学4年生', 
    '小学5年生', '小学6年生', '中学1年生', '中学2年生', '中学3年生'
  ];

  if (!validGrades.includes(grade)) {
    return { isValid: false, error: '正しい学年を選択してください' };
  }

  return { isValid: true };
};

/**
 * 通塾先の検証
 */
export const validateSchoolAttended = (school: string): ValidationResult => {
  if (!school) {
    return { isValid: true }; // 任意項目
  }

  if (school.length > 100) {
    return { isValid: false, error: '通塾先は100文字以下で入力してください' };
  }

  return { isValid: true };
};

/**
 * メモ・備考の検証
 */
export const validateNotes = (notes: string): ValidationResult => {
  if (!notes) {
    return { isValid: true }; // 任意項目
  }

  if (notes.length > 1000) {
    return { isValid: false, error: 'メモは1000文字以下で入力してください' };
  }

  return { isValid: true };
};

/**
 * 複数の検証を一度に実行
 */
export const validateMultiple = (
  validations: (() => ValidationResult)[]
): ValidationResult => {
  for (const validation of validations) {
    const result = validation();
    if (!result.isValid) {
      return result;
    }
  }
  return { isValid: true };
};

/**
 * XSS対策のためのHTML特殊文字エスケープ
 */
export const escapeHtml = (text: string): string => {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

/**
 * SQLインジェクション対策のための基本的なサニタイズ
 */
export const sanitizeInput = (input: string): string => {
  if (!input) return '';
  
  // 基本的な危険文字の除去
  return input
    .replace(/[<>\"'%;()&+]/g, '') // 危険な特殊文字を除去
    .trim()
    .substring(0, 1000); // 最大長制限
};