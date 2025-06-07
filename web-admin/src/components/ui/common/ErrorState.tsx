'use client';

import React from 'react';
import { AppError } from '@/lib/errorHandler';

interface ErrorStateProps {
  error: AppError | string;
  onRetry?: () => void;
  onClose?: () => void;
  fullScreen?: boolean;
  className?: string;
}

const getSeverityStyles = (severity: AppError['severity']) => {
  switch (severity) {
    case 'critical':
      return {
        containerBg: 'bg-red-50',
        iconBg: 'bg-red-100',
        iconColor: 'text-red-600',
        titleColor: 'text-red-800',
        messageColor: 'text-red-700',
        buttonBg: 'bg-red-600 hover:bg-red-700'
      };
    case 'high':
      return {
        containerBg: 'bg-orange-50',
        iconBg: 'bg-orange-100',
        iconColor: 'text-orange-600',
        titleColor: 'text-orange-800',
        messageColor: 'text-orange-700',
        buttonBg: 'bg-orange-600 hover:bg-orange-700'
      };
    case 'medium':
      return {
        containerBg: 'bg-yellow-50',
        iconBg: 'bg-yellow-100',
        iconColor: 'text-yellow-600',
        titleColor: 'text-yellow-800',
        messageColor: 'text-yellow-700',
        buttonBg: 'bg-yellow-600 hover:bg-yellow-700'
      };
    default:
      return {
        containerBg: 'bg-gray-50',
        iconBg: 'bg-gray-100',
        iconColor: 'text-gray-600',
        titleColor: 'text-gray-800',
        messageColor: 'text-gray-700',
        buttonBg: 'bg-gray-600 hover:bg-gray-700'
      };
  }
};

export default function ErrorState({
  error,
  onRetry,
  onClose,
  fullScreen = false,
  className = ''
}: ErrorStateProps) {
  const isAppError = typeof error === 'object' && 'code' in error;
  const errorObj = isAppError ? error as AppError : null;
  
  const message = isAppError 
    ? errorObj!.userMessage 
    : typeof error === 'string' 
      ? error 
      : 'エラーが発生しました。';

  const severity = errorObj?.severity || 'medium';
  const styles = getSeverityStyles(severity);

  const baseClasses = "flex flex-col items-center justify-center space-y-6 p-8";
  const containerClasses = fullScreen 
    ? `${baseClasses} min-h-screen ${styles.containerBg}` 
    : `${baseClasses} rounded-lg border ${styles.containerBg}`;

  const ErrorIcon = () => (
    <div className={`rounded-full p-3 ${styles.iconBg}`}>
      <svg 
        className={`h-8 w-8 ${styles.iconColor}`} 
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
        />
      </svg>
    </div>
  );

  return (
    <div className={`${containerClasses} ${className}`}>
      <ErrorIcon />
      
      <div className="text-center space-y-2 max-w-md">
        <h3 className={`text-lg font-medium ${styles.titleColor}`}>
          エラーが発生しました
        </h3>
        <p className={`text-sm ${styles.messageColor}`}>
          {message}
        </p>
        {errorObj?.code && process.env.NODE_ENV === 'development' && (
          <p className="text-xs text-gray-500 font-mono">
            エラーコード: {errorObj.code}
          </p>
        )}
      </div>

      <div className="flex space-x-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className={`
              px-4 py-2 text-sm font-medium text-white rounded-md
              ${styles.buttonBg}
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
              transition-colors duration-200
            `}
          >
            再試行
          </button>
        )}
        {onClose && (
          <button
            onClick={onClose}
            className="
              px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md
              hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
              transition-colors duration-200
            "
          >
            閉じる
          </button>
        )}
      </div>
    </div>
  );
}

// インライン用の小さなエラー表示
export function InlineError({ 
  message, 
  className = '' 
}: { 
  message: string; 
  className?: string; 
}) {
  return (
    <div className={`flex items-center space-x-2 text-red-600 text-sm ${className}`}>
      <svg className="h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path 
          fillRule="evenodd" 
          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" 
          clipRule="evenodd" 
        />
      </svg>
      <span>{message}</span>
    </div>
  );
}

// 成功メッセージ用
export function SuccessMessage({ 
  message, 
  onClose,
  className = '' 
}: { 
  message: string; 
  onClose?: () => void;
  className?: string; 
}) {
  return (
    <div className={`
      flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-md
      ${className}
    `}>
      <div className="flex items-center space-x-2 text-green-700">
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
          <path 
            fillRule="evenodd" 
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
            clipRule="evenodd" 
          />
        </svg>
        <span className="text-sm font-medium">{message}</span>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="text-green-400 hover:text-green-500 transition-colors"
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
            <path 
              fillRule="evenodd" 
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" 
              clipRule="evenodd" 
            />
          </svg>
        </button>
      )}
    </div>
  );
}