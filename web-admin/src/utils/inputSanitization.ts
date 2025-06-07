// 入力値サニタイズユーティリティ

import DOMPurify from 'dompurify';

/**
 * HTMLタグを除去し、安全な文字列に変換
 */
export function sanitizeText(input: string): string {
  if (!input) return '';
  
  // HTMLタグを除去
  const cleaned = DOMPurify.sanitize(input, { ALLOWED_TAGS: [] });
  
  // 前後の空白を除去
  return cleaned.trim();
}

/**
 * 日本語名前のバリデーション
 */
export function validateJapaneseName(name: string): { isValid: boolean; error?: string } {
  if (!name) {
    return { isValid: false, error: '名前を入力してください' };
  }
  
  const sanitized = sanitizeText(name);
  
  if (sanitized.length < 1 || sanitized.length > 50) {
    return { isValid: false, error: '名前は1文字以上50文字以下で入力してください' };
  }
  
  // 日本語文字、英字、数字、スペース、ハイフンのみ許可
  const validPattern = /^[ぁ-んァ-ヶー一-龠a-zA-Z0-9\s\-　]+$/;
  if (!validPattern.test(sanitized)) {
    return { isValid: false, error: '名前に無効な文字が含まれています' };
  }
  
  return { isValid: true };
}

/**
 * フリガナのバリデーション
 */
export function validateFurigana(furigana: string): { isValid: boolean; error?: string } {
  if (!furigana) {
    return { isValid: true }; // 任意項目
  }
  
  const sanitized = sanitizeText(furigana);
  
  if (sanitized.length > 50) {
    return { isValid: false, error: 'フリガナは50文字以下で入力してください' };
  }
  
  // ひらがな、カタカナ、スペースのみ許可
  const validPattern = /^[ぁ-んァ-ヶー\s　]+$/;
  if (!validPattern.test(sanitized)) {
    return { isValid: false, error: 'フリガナはひらがな・カタカナで入力してください' };
  }
  
  return { isValid: true };
}

/**
 * 電話番号のバリデーション
 */
export function validatePhoneNumber(phone: string): { isValid: boolean; error?: string } {
  if (!phone) {
    return { isValid: true }; // 任意項目
  }
  
  const sanitized = sanitizeText(phone);
  
  // 数字、ハイフン、括弧、スペース、プラス記号のみ許可
  const validPattern = /^[\d\-+().\s]+$/;
  if (!validPattern.test(sanitized)) {
    return { isValid: false, error: '電話番号の形式が正しくありません' };
  }
  
  // 数字のみ抽出して長さチェック
  const digitsOnly = sanitized.replace(/[\D]/g, '');
  if (digitsOnly.length < 10 || digitsOnly.length > 11) {
    return { isValid: false, error: '電話番号は10-11桁で入力してください' };
  }
  
  return { isValid: true };
}

/**
 * メールアドレスのバリデーション
 */
export function validateEmail(email: string): { isValid: boolean; error?: string } {
  if (!email) {
    return { isValid: false, error: 'メールアドレスを入力してください' };
  }
  
  const sanitized = sanitizeText(email);
  
  if (sanitized.length > 254) {
    return { isValid: false, error: 'メールアドレスが長すぎます' };
  }
  
  // RFC 5322準拠の簡易チェック
  const validPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!validPattern.test(sanitized)) {
    return { isValid: false, error: 'メールアドレスの形式が正しくありません' };
  }
  
  return { isValid: true };
}

/**
 * タスク内容のバリデーション
 */
export function validateTaskContent(content: string): { isValid: boolean; error?: string } {
  if (!content) {
    return { isValid: false, error: 'タスク内容を入力してください' };
  }
  
  const sanitized = sanitizeText(content);
  
  if (sanitized.length < 1 || sanitized.length > 200) {
    return { isValid: false, error: 'タスク内容は1文字以上200文字以下で入力してください' };
  }
  
  return { isValid: true };
}

/**
 * コメント内容のバリデーション  
 */
export function validateComment(comment: string): { isValid: boolean; error?: string } {
  if (!comment) {
    return { isValid: false, error: 'コメントを入力してください' };
  }
  
  const sanitized = sanitizeText(comment);
  
  if (sanitized.length < 1 || sanitized.length > 500) {
    return { isValid: false, error: 'コメントは1文字以上500文字以下で入力してください' };
  }
  
  return { isValid: true };
}

/**
 * 申請理由のバリデーション
 */
export function validateRequestReason(reason: string): { isValid: boolean; error?: string } {
  if (!reason) {
    return { isValid: false, error: '理由を入力してください' };
  }
  
  const sanitized = sanitizeText(reason);
  
  if (sanitized.length < 5 || sanitized.length > 300) {
    return { isValid: false, error: '理由は5文字以上300文字以下で入力してください' };
  }
  
  return { isValid: true };
}

/**
 * SQLインジェクション対策のためのエスケープ処理
 */
export function escapeSql(input: string): string {
  if (!input) return '';
  
  return input
    .replace(/'/g, "''")
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"');
}

/**
 * ファイル名のサニタイズ
 */
export function sanitizeFileName(fileName: string): string {
  if (!fileName) return '';
  
  // 危険な文字を除去
  return fileName
    .replace(/[^a-zA-Z0-9._\-]/g, '_')
    .replace(/\.{2,}/g, '.')
    .substring(0, 255);
}