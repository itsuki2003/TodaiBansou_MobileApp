'use client';

import Link from 'next/link';
import { QuickAction } from '@/types/teacher';

interface QuickActionsProps {
  actions: QuickAction[];
}

export default function QuickActions({ actions }: QuickActionsProps) {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'calendar':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0V3a2 2 0 012-2h4a2 2 0 012 2v4M9 11v4a2 2 0 002 2h2a2 2 0 002-2v-4M7 21h10" />
          </svg>
        );
      case 'checklist':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        );
      case 'document':
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
    }
  };

  const getColorClasses = (color: QuickAction['color']) => {
    switch (color) {
      case 'blue':
        return {
          bg: 'bg-blue-500',
          hover: 'hover:bg-blue-600',
          ring: 'focus:ring-blue-500'
        };
      case 'green':
        return {
          bg: 'bg-green-500',
          hover: 'hover:bg-green-600',
          ring: 'focus:ring-green-500'
        };
      case 'purple':
        return {
          bg: 'bg-purple-500',
          hover: 'hover:bg-purple-600',
          ring: 'focus:ring-purple-500'
        };
      case 'orange':
        return {
          bg: 'bg-orange-500',
          hover: 'hover:bg-orange-600',
          ring: 'focus:ring-orange-500'
        };
      case 'red':
        return {
          bg: 'bg-red-500',
          hover: 'hover:bg-red-600',
          ring: 'focus:ring-red-500'
        };
      default:
        return {
          bg: 'bg-gray-500',
          hover: 'hover:bg-gray-600',
          ring: 'focus:ring-gray-500'
        };
    }
  };

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">
          クイックアクション
        </h3>
      </div>
      
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {actions.map((action) => {
            const colorClasses = getColorClasses(action.color);
            
            return (
              <Link
                key={action.id}
                href={action.href}
                className="group relative"
              >
                <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center">
                    {/* アイコン */}
                    <div className={`flex-shrink-0 w-12 h-12 ${colorClasses.bg} ${colorClasses.hover} rounded-lg flex items-center justify-center text-white group-hover:scale-105 transition-transform`}>
                      {getIcon(action.icon)}
                    </div>
                    
                    {/* テキスト */}
                    <div className="ml-4 flex-1">
                      <h4 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors">
                        {action.title}
                      </h4>
                      <p className="mt-1 text-sm text-gray-500">
                        {action.description}
                      </p>
                    </div>
                    
                    {/* 矢印アイコン */}
                    <div className="flex-shrink-0 ml-2">
                      <svg 
                        className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        
        {/* 追加のヘルプテキスト */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                ヒント
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>
                  よく使用する機能へのショートカットです。各カードをクリックすると対応する画面に移動します。
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}