/**
 * 統一エラーハンドリングシステム
 * アプリケーション全体で一貫したエラー処理を提供
 */

export interface AppError {
  code: string;
  message: string;
  userMessage: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  context?: Record<string, any>;
}

export enum ErrorCode {
  // 認証関連
  AUTH_INVALID_CREDENTIALS = 'AUTH_INVALID_CREDENTIALS',
  AUTH_SESSION_EXPIRED = 'AUTH_SESSION_EXPIRED',
  AUTH_INSUFFICIENT_PERMISSIONS = 'AUTH_INSUFFICIENT_PERMISSIONS',
  
  // データベース関連
  DB_CONNECTION_ERROR = 'DB_CONNECTION_ERROR',
  DB_VALIDATION_ERROR = 'DB_VALIDATION_ERROR',
  DB_CONSTRAINT_VIOLATION = 'DB_CONSTRAINT_VIOLATION',
  DB_RECORD_NOT_FOUND = 'DB_RECORD_NOT_FOUND',
  DB_DUPLICATE_ENTRY = 'DB_DUPLICATE_ENTRY',
  
  // ビジネスロジック関連
  BUSINESS_INVALID_OPERATION = 'BUSINESS_INVALID_OPERATION',
  BUSINESS_RESOURCE_CONFLICT = 'BUSINESS_RESOURCE_CONFLICT',
  BUSINESS_QUOTA_EXCEEDED = 'BUSINESS_QUOTA_EXCEEDED',
  
  // ネットワーク関連
  NETWORK_TIMEOUT = 'NETWORK_TIMEOUT',
  NETWORK_OFFLINE = 'NETWORK_OFFLINE',
  NETWORK_RATE_LIMITED = 'NETWORK_RATE_LIMITED',
  
  // システム関連
  SYSTEM_MAINTENANCE = 'SYSTEM_MAINTENANCE',
  SYSTEM_INTERNAL_ERROR = 'SYSTEM_INTERNAL_ERROR',
  
  // 入力関連
  INPUT_VALIDATION_ERROR = 'INPUT_VALIDATION_ERROR',
  INPUT_MISSING_REQUIRED = 'INPUT_MISSING_REQUIRED',
  INPUT_INVALID_FORMAT = 'INPUT_INVALID_FORMAT'
}

const ERROR_MESSAGES: Record<ErrorCode, { message: string; userMessage: string; severity: AppError['severity'] }> = {
  [ErrorCode.AUTH_INVALID_CREDENTIALS]: {
    message: 'Invalid login credentials provided',
    userMessage: 'メールアドレスまたはパスワードが正しくありません。',
    severity: 'medium'
  },
  [ErrorCode.AUTH_SESSION_EXPIRED]: {
    message: 'User session has expired',
    userMessage: 'セッションが期限切れです。再度ログインしてください。',
    severity: 'medium'
  },
  [ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS]: {
    message: 'User lacks required permissions',
    userMessage: 'この操作を実行する権限がありません。',
    severity: 'high'
  },
  [ErrorCode.DB_CONNECTION_ERROR]: {
    message: 'Database connection failed',
    userMessage: 'システムに一時的な問題が発生しています。しばらく後にお試しください。',
    severity: 'critical'
  },
  [ErrorCode.DB_VALIDATION_ERROR]: {
    message: 'Database validation failed',
    userMessage: '入力内容に問題があります。内容を確認してください。',
    severity: 'medium'
  },
  [ErrorCode.DB_CONSTRAINT_VIOLATION]: {
    message: 'Database constraint violation',
    userMessage: 'データの整合性に問題があります。管理者にお問い合わせください。',
    severity: 'high'
  },
  [ErrorCode.DB_RECORD_NOT_FOUND]: {
    message: 'Requested record not found',
    userMessage: '指定されたデータが見つかりません。',
    severity: 'medium'
  },
  [ErrorCode.DB_DUPLICATE_ENTRY]: {
    message: 'Duplicate entry violation',
    userMessage: '同じデータが既に存在します。',
    severity: 'medium'
  },
  [ErrorCode.BUSINESS_INVALID_OPERATION]: {
    message: 'Invalid business operation',
    userMessage: 'この操作は現在実行できません。',
    severity: 'medium'
  },
  [ErrorCode.BUSINESS_RESOURCE_CONFLICT]: {
    message: 'Resource conflict detected',
    userMessage: '他のユーザーが同じデータを編集中です。ページを更新してください。',
    severity: 'medium'
  },
  [ErrorCode.BUSINESS_QUOTA_EXCEEDED]: {
    message: 'Resource quota exceeded',
    userMessage: '制限を超えました。管理者にお問い合わせください。',
    severity: 'high'
  },
  [ErrorCode.NETWORK_TIMEOUT]: {
    message: 'Network request timeout',
    userMessage: 'ネットワークがタイムアウトしました。接続を確認してください。',
    severity: 'medium'
  },
  [ErrorCode.NETWORK_OFFLINE]: {
    message: 'Network is offline',
    userMessage: 'インターネット接続を確認してください。',
    severity: 'high'
  },
  [ErrorCode.NETWORK_RATE_LIMITED]: {
    message: 'Request rate limit exceeded',
    userMessage: 'リクエストが多すぎます。しばらく待ってからお試しください。',
    severity: 'medium'
  },
  [ErrorCode.SYSTEM_MAINTENANCE]: {
    message: 'System under maintenance',
    userMessage: 'システムメンテナンス中です。しばらくお待ちください。',
    severity: 'high'
  },
  [ErrorCode.SYSTEM_INTERNAL_ERROR]: {
    message: 'Internal system error',
    userMessage: 'システムエラーが発生しました。管理者にお問い合わせください。',
    severity: 'critical'
  },
  [ErrorCode.INPUT_VALIDATION_ERROR]: {
    message: 'Input validation failed',
    userMessage: '入力内容を確認してください。',
    severity: 'low'
  },
  [ErrorCode.INPUT_MISSING_REQUIRED]: {
    message: 'Required field missing',
    userMessage: '必須項目が入力されていません。',
    severity: 'low'
  },
  [ErrorCode.INPUT_INVALID_FORMAT]: {
    message: 'Invalid input format',
    userMessage: '入力形式が正しくありません。',
    severity: 'low'
  }
};

export class AppErrorHandler {
  static createError(
    code: ErrorCode,
    context?: Record<string, any>,
    customUserMessage?: string
  ): AppError {
    const errorConfig = ERROR_MESSAGES[code];
    
    return {
      code,
      message: errorConfig.message,
      userMessage: customUserMessage || errorConfig.userMessage,
      severity: errorConfig.severity,
      timestamp: new Date().toISOString(),
      context
    };
  }

  static handleSupabaseError(error: any, context?: Record<string, any>): AppError {
    // Supabaseエラーの詳細解析
    if (error?.code) {
      switch (error.code) {
        case 'PGRST116':
          return this.createError(ErrorCode.DB_RECORD_NOT_FOUND, context);
        case '23505':
          return this.createError(ErrorCode.DB_DUPLICATE_ENTRY, context);
        case '23503':
          return this.createError(ErrorCode.DB_CONSTRAINT_VIOLATION, context);
        case 'PGRST301':
          return this.createError(ErrorCode.AUTH_INSUFFICIENT_PERMISSIONS, context);
        default:
          break;
      }
    }

    // エラーメッセージによる判定
    const message = error?.message?.toLowerCase() || '';
    
    if (message.includes('invalid login credentials')) {
      return this.createError(ErrorCode.AUTH_INVALID_CREDENTIALS, context);
    }
    
    if (message.includes('jwt expired') || message.includes('session')) {
      return this.createError(ErrorCode.AUTH_SESSION_EXPIRED, context);
    }
    
    if (message.includes('network') || message.includes('fetch')) {
      return this.createError(ErrorCode.NETWORK_TIMEOUT, context);
    }

    // デフォルト：内部エラー
    return this.createError(ErrorCode.SYSTEM_INTERNAL_ERROR, context);
  }

  static handleNetworkError(error: any, context?: Record<string, any>): AppError {
    if (!navigator.onLine) {
      return this.createError(ErrorCode.NETWORK_OFFLINE, context);
    }

    if (error?.name === 'AbortError' || error?.code === 'ECONNABORTED') {
      return this.createError(ErrorCode.NETWORK_TIMEOUT, context);
    }

    return this.createError(ErrorCode.NETWORK_TIMEOUT, context);
  }

  static logError(error: AppError): void {
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 Application Error:', {
        code: error.code,
        message: error.message,
        userMessage: error.userMessage,
        severity: error.severity,
        timestamp: error.timestamp,
        context: error.context
      });
    }

    // 本番環境では外部エラー追跡サービスに送信
    if (process.env.NODE_ENV === 'production' && error.severity === 'critical') {
      // Sentry.captureException(error);
      console.error('Critical error occurred:', error);
    }
  }

  static getRetryConfig(error: AppError): { shouldRetry: boolean; delay: number; maxRetries: number } {
    const baseConfig = { shouldRetry: false, delay: 1000, maxRetries: 3 };

    switch (error.code) {
      case ErrorCode.NETWORK_TIMEOUT:
      case ErrorCode.DB_CONNECTION_ERROR:
        return { shouldRetry: true, delay: 2000, maxRetries: 3 };
      
      case ErrorCode.NETWORK_RATE_LIMITED:
        return { shouldRetry: true, delay: 5000, maxRetries: 2 };
      
      case ErrorCode.BUSINESS_RESOURCE_CONFLICT:
        return { shouldRetry: true, delay: 1000, maxRetries: 2 };
      
      default:
        return baseConfig;
    }
  }
}

// リトライ機能付きの非同期操作ヘルパー
export async function withRetry<T>(
  operation: () => Promise<T>,
  errorHandler: (error: any) => AppError = AppErrorHandler.handleSupabaseError,
  context?: Record<string, any>
): Promise<T> {
  let lastError: AppError;
  let retryCount = 0;

  while (true) {
    try {
      return await operation();
    } catch (error) {
      lastError = errorHandler(error, { ...context, retryCount });
      AppErrorHandler.logError(lastError);

      const retryConfig = AppErrorHandler.getRetryConfig(lastError);
      
      if (!retryConfig.shouldRetry || retryCount >= retryConfig.maxRetries) {
        throw lastError;
      }

      retryCount++;
      await new Promise(resolve => setTimeout(resolve, retryConfig.delay));
    }
  }
}

// React Hook用のエラーハンドリング
export function useErrorHandler() {
  const handleError = (error: any, context?: Record<string, any>): AppError => {
    let appError: AppError;

    if (error instanceof Error) {
      if (error.name === 'ValidationError') {
        appError = AppErrorHandler.createError(ErrorCode.INPUT_VALIDATION_ERROR, context);
      } else {
        appError = AppErrorHandler.handleSupabaseError(error, context);
      }
    } else {
      appError = AppErrorHandler.handleSupabaseError(error, context);
    }

    AppErrorHandler.logError(appError);
    return appError;
  };

  return { handleError };
}