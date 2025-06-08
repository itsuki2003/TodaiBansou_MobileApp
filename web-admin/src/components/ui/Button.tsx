'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'destructive' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  asChild?: boolean;
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading = false, disabled, asChild = false, children, ...props }, ref) => {
    const baseClasses = 'btn-base';
    
    const variantClasses = {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      accent: 'btn-accent',
      destructive: 'bg-red-500 text-white hover:bg-red-600 focus:ring-red-500',
      ghost: 'bg-transparent text-primary-600 hover:bg-primary-50 border-none shadow-none'
    };

    const sizeClasses = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-sm',
      lg: 'px-8 py-4 text-base'
    };

    const classNames = cn(
      baseClasses,
      variantClasses[variant],
      sizeClasses[size],
      (loading || disabled) && 'opacity-50 cursor-not-allowed transform-none',
      className
    );

    if (asChild) {
      return React.cloneElement(children as React.ReactElement, {
        className: cn(classNames, (children as React.ReactElement).props?.className),
        ref,
        ...props
      });
    }

    return (
      <button
        className={classNames}
        disabled={disabled || loading}
        ref={ref}
        {...props}
      >
        {loading && (
          <svg 
            className="w-4 h-4 mr-2 animate-spin" 
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
export type { ButtonProps };