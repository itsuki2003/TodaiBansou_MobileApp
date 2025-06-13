import { useState, useCallback } from 'react';
import { Alert } from 'react-native';

export interface AppError {
  type: 'network' | 'validation' | 'permission' | 'unknown';
  message: string;
  details?: string;
  recoverable?: boolean;
  field?: string;
}

export function useErrorHandler() {
  const [error, setError] = useState<AppError | null>(null);

  const handleError = useCallback((error: any, defaultMessage = 'エラーが発生しました') => {
    // エラーハンドリング: エラーは適切に処理される

    let appError: AppError;

    if (error?.message) {
      // Supabaseエラーの処理
      if (error.code) {
        switch (error.code) {
          case 'PGRST116':
            appError = {
              type: 'network',
              message: 'データが見つかりません',
              recoverable: true,
            };
            break;
          case '401':
            appError = {
              type: 'permission',
              message: '認証が必要です',
              recoverable: false,
            };
            break;
          case '403':
            appError = {
              type: 'permission',
              message: 'アクセス権限がありません',
              recoverable: false,
            };
            break;
          case '23505':
            appError = {
              type: 'validation',
              message: '同じデータが既に存在します',
              recoverable: true,
            };
            break;
          default:
            appError = {
              type: 'network',
              message: error.message,
              details: error.details || error.hint,
              recoverable: true,
            };
        }
      } else {
        appError = {
          type: 'unknown',
          message: error.message,
          recoverable: true,
        };
      }
    } else {
      appError = {
        type: 'unknown',
        message: defaultMessage,
        recoverable: true,
      };
    }

    setError(appError);
    return appError;
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const showErrorAlert = useCallback((error: AppError | string, title = 'エラー') => {
    const message = typeof error === 'string' ? error : error.message;
    Alert.alert(title, message);
  }, []);

  return {
    error,
    handleError,
    clearError,
    showErrorAlert,
  };
}