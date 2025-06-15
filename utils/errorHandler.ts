import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

/**
 * エラーレベル定義
 */
export enum ErrorLevel {
  INFO = 'info',
  WARNING = 'warning', 
  ERROR = 'error',
  CRITICAL = 'critical'
}

/**
 * エラー情報の型定義
 */
export interface ErrorInfo {
  id: string;
  timestamp: string;
  level: ErrorLevel;
  message: string;
  stack?: string;
  context?: Record<string, any>;
  userId?: string;
  userRole?: string;
  screen?: string;
  action?: string;
}

/**
 * 統一エラーハンドリングクラス
 */
class ErrorHandler {
  private static instance: ErrorHandler;
  private errorQueue: ErrorInfo[] = [];
  private maxErrorsInMemory = 50;
  private errorStorageKey = 'app_error_logs';

  private constructor() {
    this.setupGlobalErrorHandlers();
  }

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * グローバルエラーハンドラーの設定
   */
  private setupGlobalErrorHandlers(): void {
    // JavaScript エラーのキャッチ
    const originalConsoleError = console.error;
    console.error = (...args: any[]) => {
      this.logError(ErrorLevel.ERROR, args.join(' '), {
        type: 'console_error',
        args: args
      });
      originalConsoleError.apply(console, args);
    };

    // Promise rejection のキャッチ
    const originalHandler = global.Promise;
    if (originalHandler) {
      const handleUnhandledRejection = (event: any) => {
        this.logError(ErrorLevel.ERROR, 'Unhandled Promise Rejection', {
          type: 'promise_rejection',
          reason: event.reason,
          promise: event.promise
        });
      };

      // React Native での Promise rejection 対応
      if (typeof global !== 'undefined' && global.HermesInternal) {
        // Hermes エンジン用
      }
    }
  }

  /**
   * エラーをログに記録
   */
  public logError(
    level: ErrorLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error
  ): void {
    const errorInfo: ErrorInfo = {
      id: this.generateErrorId(),
      timestamp: new Date().toISOString(),
      level,
      message,
      stack: error?.stack,
      context,
      ...this.getCurrentContext()
    };

    // メモリに追加
    this.errorQueue.push(errorInfo);
    if (this.errorQueue.length > this.maxErrorsInMemory) {
      this.errorQueue.shift();
    }

    // AsyncStorage に永続化
    this.persistErrors();

    // 重要なエラーの場合は即座に通知
    if (level === ErrorLevel.CRITICAL) {
      this.showCriticalErrorAlert(errorInfo);
    }

    // 開発環境では詳細ログを出力
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[ErrorHandler] ${level.toUpperCase()}: ${message}`, {
        context,
        stack: error?.stack
      });
    }
  }

  /**
   * エラーIDの生成
   */
  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 現在のコンテキスト情報を取得
   */
  private getCurrentContext(): Partial<ErrorInfo> {
    // 実際の実装では AuthContext や NavigationContext から情報を取得
    return {
      userId: 'current_user_id', // AuthContext から取得
      userRole: 'current_user_role', // AuthContext から取得
      screen: 'current_screen_name' // Navigation から取得
    };
  }

  /**
   * エラーをAsyncStorageに永続化
   */
  private async persistErrors(): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.errorStorageKey,
        JSON.stringify(this.errorQueue)
      );
    } catch (error) {
      // AsyncStorage のエラーは無視（無限ループを防ぐため）
      console.warn('Failed to persist errors to AsyncStorage');
    }
  }

  /**
   * 保存されたエラーログを取得
   */
  public async getPersistedErrors(): Promise<ErrorInfo[]> {
    try {
      const stored = await AsyncStorage.getItem(this.errorStorageKey);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Failed to load persisted errors');
      return [];
    }
  }

  /**
   * エラーログをクリア
   */
  public async clearErrors(): Promise<void> {
    this.errorQueue = [];
    try {
      await AsyncStorage.removeItem(this.errorStorageKey);
    } catch (error) {
      console.warn('Failed to clear persisted errors');
    }
  }

  /**
   * 重要なエラーの即座通知
   */
  private showCriticalErrorAlert(errorInfo: ErrorInfo): void {
    Alert.alert(
      'システムエラー',
      'アプリケーションで重要なエラーが発生しました。アプリを再起動してください。',
      [
        { text: 'OK' },
        {
          text: 'エラー詳細',
          onPress: () => {
            Alert.alert('エラー詳細', `${errorInfo.message}\n\nID: ${errorInfo.id}`);
          }
        }
      ]
    );
  }

  /**
   * ネットワークエラーのハンドリング
   */
  public handleNetworkError(error: any, context?: Record<string, any>): void {
    let message = 'ネットワークエラーが発生しました';
    
    if (error?.message?.includes('fetch')) {
      message = 'サーバーとの通信に失敗しました';
    } else if (error?.message?.includes('timeout')) {
      message = '通信がタイムアウトしました';
    } else if (error?.status === 401) {
      message = '認証が無効です。再ログインしてください';
    } else if (error?.status === 403) {
      message = 'アクセス権限がありません';
    } else if (error?.status >= 500) {
      message = 'サーバーエラーが発生しました';
    }

    this.logError(ErrorLevel.ERROR, message, {
      type: 'network_error',
      status: error?.status,
      url: error?.url,
      ...context
    }, error);
  }

  /**
   * データベースエラーのハンドリング
   */
  public handleDatabaseError(error: any, context?: Record<string, any>): void {
    let message = 'データベースエラーが発生しました';
    
    if (error?.message?.includes('Row Level Security')) {
      message = 'データアクセス権限エラーです';
    } else if (error?.message?.includes('connection')) {
      message = 'データベース接続エラーです';
    }

    this.logError(ErrorLevel.ERROR, message, {
      type: 'database_error',
      code: error?.code,
      details: error?.details,
      ...context
    }, error);
  }

  /**
   * 現在のメモリ内エラーを取得
   */
  public getErrors(): ErrorInfo[] {
    return [...this.errorQueue];
  }

  /**
   * エラー統計を取得
   */
  public getErrorStats(): {
    total: number;
    byLevel: Record<ErrorLevel, number>;
    recent: ErrorInfo[];
  } {
    const stats = {
      total: this.errorQueue.length,
      byLevel: {
        [ErrorLevel.INFO]: 0,
        [ErrorLevel.WARNING]: 0,
        [ErrorLevel.ERROR]: 0,
        [ErrorLevel.CRITICAL]: 0
      },
      recent: this.errorQueue.slice(-5) // 直近5件
    };

    this.errorQueue.forEach(error => {
      stats.byLevel[error.level]++;
    });

    return stats;
  }
}

// シングルトンインスタンスをエクスポート
export const errorHandler = ErrorHandler.getInstance();

// 便利な関数をエクスポート
export const logError = (
  level: ErrorLevel,
  message: string,
  context?: Record<string, any>,
  error?: Error
) => errorHandler.logError(level, message, context, error);

export const logInfo = (message: string, context?: Record<string, any>) => 
  logError(ErrorLevel.INFO, message, context);

export const logWarning = (message: string, context?: Record<string, any>) => 
  logError(ErrorLevel.WARNING, message, context);

export const logCritical = (message: string, context?: Record<string, any>, error?: Error) => 
  logError(ErrorLevel.CRITICAL, message, context, error);

export const handleNetworkError = (error: any, context?: Record<string, any>) => 
  errorHandler.handleNetworkError(error, context);

export const handleDatabaseError = (error: any, context?: Record<string, any>) => 
  errorHandler.handleDatabaseError(error, context);