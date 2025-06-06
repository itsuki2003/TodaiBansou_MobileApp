import React from 'react';

interface ErrorDisplayProps {
  errorMessage: string;
  onRetry?: () => void;
  className?: string;
  variant?: 'default' | 'compact';
}

/**
 * 共通エラー表示コンポーネント
 * エラーメッセージと任意で再試行ボタンを表示
 */
export function ErrorDisplay({ 
  errorMessage, 
  onRetry, 
  className = '',
  variant = 'default'
}: ErrorDisplayProps) {
  if (variant === 'compact') {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-md p-3 ${className}`}>
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="h-4 w-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 18.5c-.77.833-.231 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div className="ml-2 flex-1">
            <p className="text-sm text-red-700">{errorMessage}</p>
          </div>
          {onRetry && (
            <div className="ml-2 flex-shrink-0">
              <button
                onClick={onRetry}
                className="text-sm text-red-600 hover:text-red-800 font-medium underline"
              >
                再試行
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gray-50 p-8 ${className}`}>
      <div className="max-w-7xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg 
                className="h-6 w-6 text-red-400" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 18.5c-.77.833-.231 2.5 1.732 2.5z" 
                />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-lg font-semibold text-red-800 mb-2">
                エラーが発生しました
              </h3>
              <p className="text-red-700 mb-4">
                {errorMessage}
              </p>
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  再試行
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * インライン用のコンパクトなエラー表示
 */
export function InlineError({ 
  errorMessage, 
  onRetry, 
  className = '' 
}: Pick<ErrorDisplayProps, 'errorMessage' | 'onRetry' | 'className'>) {
  return (
    <ErrorDisplay 
      errorMessage={errorMessage}
      onRetry={onRetry}
      className={className}
      variant="compact"
    />
  );
}