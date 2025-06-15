import { Alert } from 'react-native';

// エラータイプの定義
export type AppErrorType = 
  | 'network'
  | 'validation' 
  | 'permission'
  | 'auth'
  | 'database'
  | 'file'
  | 'unknown';

// エラー詳細情報の型
export interface AppError {
  type: AppErrorType;
  message: string;
  originalError?: any;
  action?: string;
  userId?: string;
  timestamp?: Date;
}

// エラーメッセージのマッピング
const ERROR_MESSAGES: Record<AppErrorType, string> = {
  network: 'ネットワークエラーが発生しました。インターネット接続を確認してください。',
  validation: '入力内容に問題があります。もう一度確認してください。',
  permission: 'この操作を実行する権限がありません。',
  auth: '認証エラーが発生しました。再度ログインしてください。',
  database: 'データの読み込みに失敗しました。しばらく経ってから再度お試しください。',
  file: 'ファイルの処理に失敗しました。',
  unknown: '予期しないエラーが発生しました。サポートにお問い合わせください。',
};

// Supabaseエラーからアプリエラーへの変換
export function mapSupabaseError(error: any): AppError {
  if (!error) {
    return {
      type: 'unknown',
      message: ERROR_MESSAGES.unknown,
      timestamp: new Date(),
    };
  }

  // ネットワークエラー
  if (error.name === 'NetworkError' || error.message?.includes('fetch')) {
    return {
      type: 'network',
      message: ERROR_MESSAGES.network,
      originalError: error,
      timestamp: new Date(),
    };
  }

  // 認証エラー
  if (error.status === 401 || error.message?.includes('unauthorized')) {
    return {
      type: 'auth',
      message: ERROR_MESSAGES.auth,
      originalError: error,
      timestamp: new Date(),
    };
  }

  // 権限エラー
  if (error.status === 403 || error.code === 'PGRST301') {
    return {
      type: 'permission',
      message: ERROR_MESSAGES.permission,
      originalError: error,
      timestamp: new Date(),
    };
  }

  // データベースエラー
  if (error.code?.startsWith('PGRST') || error.status >= 500) {
    return {
      type: 'database',
      message: ERROR_MESSAGES.database,
      originalError: error,
      timestamp: new Date(),
    };
  }

  // バリデーションエラー
  if (error.status === 400 || error.code === '23505') {
    return {
      type: 'validation',
      message: error.message || ERROR_MESSAGES.validation,
      originalError: error,
      timestamp: new Date(),
    };
  }

  return {
    type: 'unknown',
    message: error.message || ERROR_MESSAGES.unknown,
    originalError: error,
    timestamp: new Date(),
  };
}

// エラーログ記録
export function logError(error: AppError): void {
  if (__DEV__) {
    console.group('🔴 App Error');
    console.log('Type:', error.type);
    console.log('Message:', error.message);
    console.log('Timestamp:', error.timestamp);
    if (error.originalError) {
      console.log('Original Error:', error.originalError);
    }
    if (error.action) {
      console.log('Action:', error.action);
    }
    if (error.userId) {
      console.log('User ID:', error.userId);
    }
    console.groupEnd();
  }
}

// ユーザーフレンドリーなエラー表示
export function showErrorAlert(error: AppError, title: string = 'エラー'): void {
  Alert.alert(
    title,
    error.message,
    [
      {
        text: 'OK',
        style: 'default',
      },
    ],
    { cancelable: true }
  );
}

// エラーハンドリングのメインハンドラー
export function handleAppError(
  error: any,
  action?: string,
  userId?: string,
  showAlert: boolean = true
): AppError {
  const appError = mapSupabaseError(error);
  
  // 追加情報を設定
  if (action) appError.action = action;
  if (userId) appError.userId = userId;

  // ログに記録
  logError(appError);

  // ユーザーにアラート表示
  if (showAlert) {
    showErrorAlert(appError);
  }

  return appError;
}

// 非同期関数用のエラーハンドリングヘルパー
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  action?: string,
  userId?: string,
  showAlert: boolean = true
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    handleAppError(error, action, userId, showAlert);
    return null;
  }
}

// カスタムエラークラス
export class AppCustomError extends Error {
  public readonly type: AppErrorType;
  public readonly action?: string;
  public readonly userId?: string;

  constructor(
    type: AppErrorType,
    message?: string,
    action?: string,
    userId?: string
  ) {
    super(message || ERROR_MESSAGES[type]);
    this.name = 'AppCustomError';
    this.type = type;
    this.action = action;
    this.userId = userId;
  }

  toAppError(): AppError {
    return {
      type: this.type,
      message: this.message,
      action: this.action,
      userId: this.userId,
      timestamp: new Date(),
    };
  }
}

// バリデーションエラーヘルパー
export function createValidationError(message: string, action?: string): AppCustomError {
  return new AppCustomError('validation', message, action);
}

// 権限エラーヘルパー
export function createPermissionError(action?: string): AppCustomError {
  return new AppCustomError('permission', undefined, action);
}

// ネットワークエラーヘルパー
export function createNetworkError(action?: string): AppCustomError {
  return new AppCustomError('network', undefined, action);
}

// エラー回復のリトライ機能
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000,
  action?: string
): Promise<T | null> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      const appError = mapSupabaseError(error);
      
      // ネットワークエラーやサーバーエラーの場合はリトライ
      if (
        (appError.type === 'network' || appError.type === 'database') &&
        attempt < maxRetries
      ) {
        console.log(`Retry attempt ${attempt}/${maxRetries} for action: ${action}`);
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
        continue;
      }
      
      // リトライしないエラーまたは最終試行の場合
      handleAppError(error, action);
      return null;
    }
  }
  
  return null;
}