'use client';

import React from 'react';

export type PageHeaderColorTheme = 'primary' | 'secondary' | 'accent' | 'error' | 'success';

interface PageHeaderProps {
  title: string;
  description: string;
  icon?: string; // 絵文字またはアイコン
  colorTheme?: PageHeaderColorTheme;
  actions?: React.ReactNode;
  className?: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ 
  title, 
  description, 
  icon = '📋', 
  colorTheme = 'primary',
  actions,
  className = ''
}) => {
  const colorClasses: Record<PageHeaderColorTheme, string> = {
    primary: 'from-primary-600 via-primary-700 to-primary-800',
    secondary: 'from-secondary-600 via-secondary-700 to-secondary-800', 
    accent: 'from-accent-600 via-accent-700 to-accent-800',
    error: 'from-error-600 via-error-700 to-error-800',
    success: 'from-success-600 via-success-700 to-success-800'
  };

  return (
    <div className={`relative overflow-hidden bg-gradient-to-r ${colorClasses[colorTheme]} rounded-2xl p-8 text-white shadow-lg mb-8 ${className}`}>
      {/* 背景装飾 */}
      <div className="absolute top-0 right-0 -mt-4 -mr-4 w-20 h-20 bg-white/10 rounded-full opacity-60 blur-xl"></div>
      <div className="absolute bottom-0 left-0 -mb-6 -ml-6 w-24 h-24 bg-white/5 rounded-full opacity-80 blur-2xl"></div>
      
      <div className="relative md:flex md:items-center md:justify-between">
        <div className="flex items-center space-x-4 flex-1 min-w-0">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <span className="text-white text-xl font-bold" role="img" aria-label={`${title}アイコン`}>
              {icon}
            </span>
          </div>
          <div>
            <h1 className="text-3xl font-bold leading-tight">
              {title}
            </h1>
            <p className="text-white/90 text-lg mt-1">
              {description}
            </p>
          </div>
        </div>
        {actions && (
          <div className="mt-4 flex space-x-3 md:mt-0 md:ml-4">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

export default PageHeader;