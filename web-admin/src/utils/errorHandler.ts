// 統一エラーハンドリングユーティリティ

export interface ErrorDetails {
  code: string;
  message: string;
  userMessage: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
  timestamp: string;
  userId?: string;
}

export class AppError extends Error {
  public readonly code: string;
  public readonly userMessage: string;
  public readonly severity: ErrorDetails['severity'];
  public readonly context?: Record<string, any>;

  constructor(
    code: string,
    message: string,
    userMessage: string,
    severity: ErrorDetails['severity'] = 'medium',
    context?: Record<string, any>
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.userMessage = userMessage;
    this.severity = severity;
    this.context = context;
  }
}

/**
 * エラーログ記録
 */
export function logError(error: Error | AppError, userId?: string): void {
  const errorDetails: ErrorDetails = {
    code: error instanceof AppError ? error.code : 'UNKNOWN_ERROR',
    message: error.message,
    userMessage: error instanceof AppError ? error.userMessage : 'システムエラーが発生しました',
    severity: error instanceof AppError ? error.severity : 'medium',
    context: error instanceof AppError ? error.context : undefined,
    timestamp: new Date().toISOString(),
    userId,
  };

  // 本番環境では外部ログサービス（Sentry等）に送信
  if (process.env.NODE_ENV === 'production') {
    // Sentryやその他のログサービスに送信
    console.error('[PRODUCTION ERROR]', errorDetails);
  } else {
    console.error('[DEV ERROR]', errorDetails);
  }

  // 重要度がhigh以上の場合は管理者に通知
  if (errorDetails.severity === 'high' || errorDetails.severity === 'critical') {
    // 管理者通知ロジック（メール、Slack等）
    notifyAdministrators(errorDetails);
  }
}

/**
 * 管理者通知
 */
async function notifyAdministrators(errorDetails: ErrorDetails): Promise<void> {
  try {
    // TODO: メール通知やSlack通知の実装
    console.warn('[ADMIN NOTIFICATION REQUIRED]', errorDetails);
  } catch (notificationError) {
    console.error('Failed to notify administrators:', notificationError);
  }
}

/**
 * ユーザー向けエラーメッセージの生成
 */
export function generateUserErrorMessage(error: Error | AppError): string {
  if (error instanceof AppError) {
    return error.userMessage;
  }

  // 一般的なエラーパターンのマッピング
  if (error.message.includes('network') || error.message.includes('fetch')) {
    return 'ネットワークエラーが発生しました。インターネット接続を確認してください。';
  }

  if (error.message.includes('permission') || error.message.includes('unauthorized')) {
    return 'この操作を実行する権限がありません。';
  }

  if (error.message.includes('validation') || error.message.includes('invalid')) {
    return '入力内容に問題があります。確認して再試行してください。';
  }

  if (error.message.includes('timeout')) {
    return '処理がタイムアウトしました。再試行してください。';
  }

  return 'システムエラーが発生しました。しばらく待ってから再試行してください。';
}

/**
 * Supabaseエラーの詳細分析
 */
export function analyzeSupabaseError(error: any): AppError {
  const code = error.code || 'SUPABASE_ERROR';
  const message = error.message || 'Database error occurred';
  
  switch (code) {
    case 'PGRST116':
      return new AppError(
        'NOT_FOUND',
        'Resource not found',
        '指定されたデータが見つかりません',
        'low'
      );
    
    case '23505':
      return new AppError(
        'DUPLICATE_KEY',
        'Duplicate key constraint violation',
        'このデータは既に存在しています',
        'medium'
      );
    
    case '23503':
      return new AppError(
        'FOREIGN_KEY_VIOLATION',
        'Foreign key constraint violation',
        '関連するデータが見つかりません',
        'medium'
      );
    
    case '42501':
      return new AppError(
        'PERMISSION_DENIED',
        'Permission denied',
        'この操作を実行する権限がありません',
        'high'
      );
    
    default:
      return new AppError(
        'DATABASE_ERROR',
        message,
        'データベースエラーが発生しました',
        'medium',
        { originalCode: code }
      );
  }
}

/**
 * エラー境界用のエラーリポート
 */
export function reportErrorBoundaryError(
  error: Error,
  errorInfo: { componentStack: string },
  userId?: string
): void {
  const appError = new AppError(
    'REACT_ERROR_BOUNDARY',
    error.message,
    'アプリケーションエラーが発生しました。ページを再読み込みしてください。',
    'high',
    {
      componentStack: errorInfo.componentStack,
      stack: error.stack,
    }
  );

  logError(appError, userId);
}

/**
 * 非同期エラーのキャッチと処理
 */
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context?: string
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      const appError = error instanceof AppError 
        ? error 
        : new AppError(
            'ASYNC_OPERATION_ERROR',
            error instanceof Error ? error.message : 'Unknown error',
            generateUserErrorMessage(error instanceof Error ? error : new Error('Unknown error')),
            'medium',
            { context, originalError: error }
          );
      
      logError(appError);
      throw appError;
    }
  };
}