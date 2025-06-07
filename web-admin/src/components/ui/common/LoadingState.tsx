'use client';

import React from 'react';
import LoadingSpinner from './LoadingSpinner';

interface LoadingStateProps {
  message?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullScreen?: boolean;
  className?: string;
}

export default function LoadingState({ 
  message = '読み込み中...', 
  size = 'lg',
  fullScreen = false,
  className = ''
}: LoadingStateProps) {
  const baseClasses = "flex flex-col items-center justify-center space-y-4";
  const containerClasses = fullScreen 
    ? `${baseClasses} min-h-screen bg-gray-50` 
    : `${baseClasses} py-12`;

  return (
    <div className={`${containerClasses} ${className}`}>
      <LoadingSpinner size={size} />
      <p className="text-sm text-gray-600 animate-pulse">{message}</p>
    </div>
  );
}

// スケルトンローディング用コンポーネント
export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded"></div>
          <div className="h-3 bg-gray-200 rounded w-5/6"></div>
        </div>
        <div className="flex space-x-4">
          <div className="h-8 bg-gray-200 rounded w-20"></div>
          <div className="h-8 bg-gray-200 rounded w-20"></div>
        </div>
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="animate-pulse">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* ヘッダー */}
        <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
          <div className="grid grid-cols-4 gap-4">
            {Array.from({ length: cols }).map((_, i) => (
              <div key={i} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
        {/* 行 */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="px-6 py-4 border-b border-gray-100">
            <div className="grid grid-cols-4 gap-4">
              {Array.from({ length: cols }).map((_, colIndex) => (
                <div key={colIndex} className="h-3 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}