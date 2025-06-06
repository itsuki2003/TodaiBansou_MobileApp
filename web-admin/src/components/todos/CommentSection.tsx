import React, { useState, useEffect } from 'react';
import { TeacherComment } from '@/types/todoList';

interface CommentSectionProps {
  targetDate: string;
  comments: TeacherComment[];
  currentUserComment: TeacherComment | null;
  onSave: (targetDate: string, content: string) => Promise<void>;
  isProcessing: boolean;
}

export default function CommentSection({
  targetDate,
  comments,
  currentUserComment,
  onSave,
  isProcessing,
}: CommentSectionProps) {
  const [content, setContent] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // 既存コメントを読み込み
  useEffect(() => {
    setContent(currentUserComment?.comment_content || '');
    setHasUnsavedChanges(false);
  }, [currentUserComment]);

  const handleContentChange = (newContent: string) => {
    setContent(newContent);
    setHasUnsavedChanges(newContent !== (currentUserComment?.comment_content || ''));
  };

  const handleSave = async () => {
    if (isProcessing) return;
    
    await onSave(targetDate, content);
    setHasUnsavedChanges(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    }
  };

  // 他の講師のコメントを表示
  const otherComments = comments.filter(c => c.id !== currentUserComment?.id);

  return (
    <div className="border-t border-gray-200 pt-4">
      <div className="space-y-3">
        {/* 自分のコメント入力エリア */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-2">
            講師コメント
          </label>
          <div className="space-y-2">
            <textarea
              value={content}
              onChange={(e) => handleContentChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="この日のコメントを入力... (Ctrl+Enter: 保存)"
              className="w-full p-2 text-sm border border-gray-200 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              disabled={isProcessing}
            />
            
            {hasUnsavedChanges && (
              <div className="flex items-center justify-between">
                <p className="text-xs text-amber-600">
                  未保存の変更があります
                </p>
                <button
                  onClick={handleSave}
                  disabled={isProcessing}
                  className="px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 rounded-md transition-colors inline-flex items-center"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-1"></div>
                      保存中...
                    </>
                  ) : (
                    '保存'
                  )}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* 他の講師のコメント表示 */}
        {otherComments.length > 0 && (
          <div className="pt-2 border-t border-gray-100">
            <p className="text-xs font-medium text-gray-700 mb-2">
              他の講師のコメント
            </p>
            <div className="space-y-2">
              {otherComments.map((comment) => (
                <div
                  key={comment.id}
                  className="bg-gray-50 rounded-md p-3"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium text-gray-700">
                      {comment.teacher?.full_name || '講師'}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(comment.updated_at).toLocaleDateString('ja-JP', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">
                    {comment.comment_content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}