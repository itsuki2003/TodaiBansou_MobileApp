import React, { useEffect } from 'react';
import { InlineSpinner } from './AppLoader';

interface LogoutConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  loading?: boolean;
  error?: string | null;
  userName?: string;
}

export function LogoutConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
  error = null,
  userName
}: LogoutConfirmDialogProps) {
  
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !loading) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, loading]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      await onConfirm();
      // ログアウト成功時はonConfirm内でリダイレクトが実行される
    } catch (error) {
      // エラーはAuthContextで処理される
      console.error('ログアウト確認ダイアログ内エラー:', error);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* オーバーレイ */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={handleClose}
      />
      
      {/* ダイアログ */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="mb-4">
          {/* アイコン */}
          <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-orange-100 rounded-full">
            <svg 
              className="w-6 h-6 text-orange-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" 
              />
            </svg>
          </div>
          
          {/* タイトル */}
          <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
            ログアウトの確認
          </h3>
          
          {/* メッセージ */}
          <div className="text-sm text-gray-600 text-center space-y-2">
            {userName ? (
              <p>
                <span className="font-medium">{userName}</span>さん、
                本当にログアウトしますか？
              </p>
            ) : (
              <p>本当にログアウトしますか？</p>
            )}
            <p className="text-xs">
              ログアウト後、再度ログインが必要になります。
            </p>
          </div>
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <div className="flex items-center">
              <svg 
                className="w-4 h-4 text-red-400 mr-2 flex-shrink-0" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 18.5c-.77.833-.231 2.5 1.732 2.5z" 
                />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}
        
        {/* ボタン */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed rounded-md min-w-[100px] flex items-center justify-center"
          >
            {loading ? (
              <InlineSpinner size="sm" />
            ) : (
              'ログアウト'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}