'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
}

export default function PageTransition({ children, className = '' }: PageTransitionProps) {
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);
  const [displayChildren, setDisplayChildren] = useState(children);

  useEffect(() => {
    if (isLoading) {
      setDisplayChildren(children);
      setIsLoading(false);
    }
  }, [children, isLoading]);

  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [pathname]);

  return (
    <div className={`relative ${className}`}>
      <div
        className={`
          transition-all duration-300 ease-out
          ${isLoading 
            ? 'opacity-0 transform translate-y-4' 
            : 'opacity-100 transform translate-y-0'
          }
        `}
      >
        {displayChildren}
      </div>
    </div>
  );
}

// モーダル用のトランジション
export function ModalTransition({ 
  children, 
  isOpen, 
  onClose 
}: { 
  children: React.ReactNode; 
  isOpen: boolean; 
  onClose: () => void; 
}) {
  const [shouldRender, setShouldRender] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
    } else {
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!shouldRender) return null;

  return (
    <>
      {/* バックドロップ */}
      <div
        className={`
          fixed inset-0 bg-black z-40 transition-opacity duration-300 ease-out
          ${isOpen ? 'opacity-50' : 'opacity-0'}
        `}
        onClick={onClose}
      />
      
      {/* モーダルコンテンツ */}
      <div
        className={`
          fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4
          transition-all duration-300 ease-out
          ${isOpen 
            ? 'opacity-100' 
            : 'opacity-0'
          }
        `}
      >
        <div
          className={`
            bg-white rounded-lg shadow-xl max-w-lg w-full max-h-full overflow-y-auto
            transition-all duration-300 ease-out
            ${isOpen 
              ? 'opacity-100 transform scale-100' 
              : 'opacity-0 transform scale-95'
            }
          `}
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      </div>
    </>
  );
}

// カード用のホバーアニメーション
export function AnimatedCard({ 
  children, 
  onClick,
  className = '',
  hoverEffect = true 
}: { 
  children: React.ReactNode; 
  onClick?: () => void;
  className?: string;
  hoverEffect?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-lg shadow-sm border border-gray-200
        transition-all duration-200 ease-out
        ${hoverEffect && onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-1' : ''}
        ${hoverEffect && !onClick ? 'hover:shadow-md' : ''}
        ${onClick ? 'active:transform active:scale-98' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

// リスト項目用のスライドイン
export function SlideInItem({ 
  children, 
  delay = 0,
  className = '' 
}: { 
  children: React.ReactNode; 
  delay?: number;
  className?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`
        transition-all duration-500 ease-out
        ${isVisible 
          ? 'opacity-100 transform translate-x-0' 
          : 'opacity-0 transform -translate-x-4'
        }
        ${className}
      `}
    >
      {children}
    </div>
  );
}

// フェードイン
export function FadeIn({ 
  children, 
  delay = 0,
  className = '' 
}: { 
  children: React.ReactNode; 
  delay?: number;
  className?: string;
}) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={`
        transition-opacity duration-500 ease-out
        ${isVisible ? 'opacity-100' : 'opacity-0'}
        ${className}
      `}
    >
      {children}
    </div>
  );
}