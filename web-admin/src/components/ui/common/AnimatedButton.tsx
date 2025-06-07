'use client';

import React, { useState } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface AnimatedButtonProps {
  children: React.ReactNode;
  onClick?: () => void | Promise<void>;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  icon?: React.ReactNode;
  loadingText?: string;
}

const variantStyles = {
  primary: {
    base: 'bg-blue-600 text-white border-transparent',
    hover: 'hover:bg-blue-700 hover:shadow-lg',
    active: 'active:bg-blue-800 active:transform active:scale-95',
    disabled: 'disabled:bg-blue-300 disabled:cursor-not-allowed',
    focus: 'focus:ring-blue-500'
  },
  secondary: {
    base: 'bg-white text-gray-700 border-gray-300',
    hover: 'hover:bg-gray-50 hover:shadow-md',
    active: 'active:bg-gray-100 active:transform active:scale-95',
    disabled: 'disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400',
    focus: 'focus:ring-blue-500'
  },
  danger: {
    base: 'bg-red-600 text-white border-transparent',
    hover: 'hover:bg-red-700 hover:shadow-lg',
    active: 'active:bg-red-800 active:transform active:scale-95',
    disabled: 'disabled:bg-red-300 disabled:cursor-not-allowed',
    focus: 'focus:ring-red-500'
  },
  success: {
    base: 'bg-green-600 text-white border-transparent',
    hover: 'hover:bg-green-700 hover:shadow-lg',
    active: 'active:bg-green-800 active:transform active:scale-95',
    disabled: 'disabled:bg-green-300 disabled:cursor-not-allowed',
    focus: 'focus:ring-green-500'
  }
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base'
};

export default function AnimatedButton({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  icon,
  loadingText
}: AnimatedButtonProps) {
  const [isClicked, setIsClicked] = useState(false);
  const [internalLoading, setInternalLoading] = useState(false);

  const styles = variantStyles[variant];
  const isDisabled = disabled || loading || internalLoading;
  const isLoading = loading || internalLoading;

  const handleClick = async () => {
    if (isDisabled || !onClick) return;

    setIsClicked(true);
    
    try {
      setInternalLoading(true);
      await onClick();
    } catch (error) {
      console.error('Button click error:', error);
    } finally {
      setInternalLoading(false);
      // クリックアニメーションのために少し遅延
      setTimeout(() => setIsClicked(false), 150);
    }
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      disabled={isDisabled}
      className={`
        inline-flex items-center justify-center space-x-2 border rounded-md font-medium
        transition-all duration-200 ease-out
        focus:outline-none focus:ring-2 focus:ring-offset-2
        ${sizeStyles[size]}
        ${styles.base}
        ${!isDisabled && styles.hover}
        ${!isDisabled && styles.active}
        ${styles.disabled}
        ${styles.focus}
        ${isClicked ? 'transform scale-95' : ''}
        ${className}
      `}
    >
      {isLoading ? (
        <>
          <LoadingSpinner size="sm" color="white" />
          <span>{loadingText || '処理中...'}</span>
        </>
      ) : (
        <>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          <span>{children}</span>
        </>
      )}
    </button>
  );
}

// プリセットボタン
export function SaveButton(props: Omit<AnimatedButtonProps, 'variant' | 'children'>) {
  return (
    <AnimatedButton 
      variant="primary" 
      icon={
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      }
      loadingText="保存中..."
      {...props}
    >
      保存
    </AnimatedButton>
  );
}

export function DeleteButton(props: Omit<AnimatedButtonProps, 'variant' | 'children'>) {
  return (
    <AnimatedButton 
      variant="danger" 
      icon={
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
      }
      loadingText="削除中..."
      {...props}
    >
      削除
    </AnimatedButton>
  );
}

export function CancelButton(props: Omit<AnimatedButtonProps, 'variant' | 'children'>) {
  return (
    <AnimatedButton 
      variant="secondary" 
      icon={
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      }
      {...props}
    >
      キャンセル
    </AnimatedButton>
  );
}