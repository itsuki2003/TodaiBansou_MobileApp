import React, { useState, useRef, useEffect } from 'react';

interface TaskInputProps {
  onSubmit: (content: string) => Promise<void>;
  onCancel: () => void;
  isProcessing: boolean;
}

export default function TaskInput({ onSubmit, onCancel, isProcessing }: TaskInputProps) {
  const [content, setContent] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // オートフォーカス
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  }, []);

  const handleSubmit = async () => {
    if (!content.trim() || isProcessing) return;

    await onSubmit(content.trim());
    setContent('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <div className="bg-white border border-gray-300 rounded-lg p-3 space-y-3">
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="新しいタスクを入力... (Enter: 追加, Shift+Enter: 改行, Esc: キャンセル)"
        className="w-full p-2 text-sm border border-gray-200 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        rows={2}
        disabled={isProcessing}
      />
      
      <div className="flex gap-2">
        <button
          onClick={handleSubmit}
          disabled={!content.trim() || isProcessing}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 rounded-md transition-colors inline-flex items-center"
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
              追加中...
            </>
          ) : (
            '追加'
          )}
        </button>
        
        <button
          onClick={onCancel}
          disabled={isProcessing}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 rounded-md transition-colors"
        >
          キャンセル
        </button>
      </div>
    </div>
  );
}