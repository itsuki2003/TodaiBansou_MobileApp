import React from 'react';

interface FullScreenLoaderProps {
  message?: string;
}

interface InlineSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  className?: string;
}

/**
 * フルスクリーンローダー - 画面全体を覆うオーバーレイ付きローディング
 */
export function FullScreenLoader({ message = '読み込み中...' }: FullScreenLoaderProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 flex flex-col items-center space-y-4 shadow-lg">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="text-gray-700 font-medium">{message}</span>
      </div>
    </div>
  );
}

/**
 * インラインスピナー - コンテンツ内で使用する小さなローディング
 */
export function InlineSpinner({ 
  size = 'md', 
  message, 
  className = '' 
}: InlineSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6', 
    lg: 'h-8 w-8'
  };

  const borderClasses = {
    sm: 'border',
    md: 'border-2',
    lg: 'border-2'
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className={`animate-spin rounded-full ${sizeClasses[size]} ${borderClasses[size]} border-b-blue-600 border-gray-200`}></div>
      {message && (
        <span className="text-gray-600 text-sm">{message}</span>
      )}
    </div>
  );
}

/**
 * ページローダー - ページ全体のローディング（フルスクリーンほど重くない）
 */
export function PageLoader({ message = '読み込み中...' }: { message?: string }) {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-gray-600 font-medium">{message}</span>
          </div>
        </div>
      </div>
    </div>
  );
}