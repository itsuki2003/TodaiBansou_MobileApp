import React, { useState, useEffect } from 'react';
import { TeacherComment } from '@/types/todoList';

// 新システム用インターフェース
interface NewCommentSectionProps {
  targetDate: string;
  comments: TeacherComment[];
  onSave: (content: string, commentId?: string) => void;
  isProcessing: boolean;
}

// 既存システム用インターフェース  
interface OldCommentSectionProps {
  targetDate: string;
  comments: TeacherComment[];
  currentUserComment: TeacherComment | null;
  onSave: (targetDate: string, content: string) => Promise<void>;
  isProcessing: boolean;
}

type CommentSectionProps = NewCommentSectionProps | OldCommentSectionProps;

export default function CommentSection(props: CommentSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);

  // プロパティの型判定
  const isNewInterface = (props: CommentSectionProps): props is NewCommentSectionProps => {
    return !('currentUserComment' in props);
  };

  // 共通データの抽出
  const targetDate = props.targetDate;
  const comments = props.comments;
  const isProcessing = props.isProcessing;

  // 現在のユーザーのコメントを取得
  const currentUserComment = isNewInterface(props) 
    ? comments.find(c => c.teacher_id === 'current-teacher-id') // TODO: 実際のユーザーIDを使用
    : props.currentUserComment;

  const handleStartEdit = (comment?: TeacherComment) => {
    setIsEditing(true);
    setEditContent(comment?.comment_content || '');
    setEditingCommentId(comment?.id || null);
  };

  const handleSave = async () => {
    if (editContent.trim()) {
      if (isNewInterface(props)) {
        // 新システム
        props.onSave(editContent.trim(), editingCommentId || undefined);
      } else {
        // 既存システム
        await props.onSave(targetDate, editContent.trim());
      }
      setIsEditing(false);
      setEditContent('');
      setEditingCommentId(null);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditContent('');
    setEditingCommentId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  return (
    <div className="border-t border-gray-200 pt-4">
      <div className="mb-2">
        <h4 className="text-xs font-medium text-gray-700 uppercase tracking-wide">
          講師コメント
        </h4>
      </div>

      {/* 既存のコメント一覧 */}
      {comments.length > 0 && (
        <div className="space-y-2 mb-3">
          {comments.map((comment) => (
            <div
              key={comment.id}
              className="bg-gray-50 rounded-md p-3 text-sm"
            >
              <div className="flex items-start justify-between mb-1">
                <span className="font-medium text-gray-700">
                  {comment.teacher?.full_name || '講師'}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(comment.created_at).toLocaleDateString('ja-JP', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
              <p className="text-gray-800 leading-relaxed">
                {comment.comment_content}
              </p>
              
              {/* 編集ボタン（自分のコメントの場合のみ） */}
              {comment.teacher_id === 'current-teacher-id' && (
                <button
                  onClick={() => handleStartEdit(comment)}
                  disabled={isProcessing}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
                >
                  編集
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* コメント入力・編集エリア */}
      {isEditing ? (
        <div className="space-y-2">
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onKeyDown={handleKeyDown}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            rows={3}
            placeholder="コメントを入力... (Ctrl/Cmd+Enter: 保存, Esc: キャンセル)"
            autoFocus
            disabled={isProcessing}
          />
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={!editContent.trim() || isProcessing}
              className="px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 rounded-md transition-colors"
            >
              {isProcessing ? '保存中...' : '保存'}
            </button>
            <button
              onClick={handleCancel}
              disabled={isProcessing}
              className="px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 rounded-md transition-colors"
            >
              キャンセル
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => handleStartEdit()}
          disabled={isProcessing}
          className="w-full py-2 px-3 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 hover:border-gray-300 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {currentUserComment ? 'コメントを編集' : '+ コメントを追加'}
        </button>
      )}

      {/* ヘルプテキスト */}
      {!isEditing && (
        <p className="mt-2 text-xs text-gray-500">
          この日のタスクについて保護者や生徒にフィードバックを残せます
        </p>
      )}
    </div>
  );
}