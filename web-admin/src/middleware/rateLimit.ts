// レート制限ミドルウェア
import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  windowMs: number; // 時間窓（ミリ秒）
  max: number; // 最大リクエスト数
  message: string; // エラーメッセージ
}

// メモリベースの簡易レート制限（本番環境ではRedisを推奨）
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function createRateLimit(config: RateLimitConfig) {
  return (request: NextRequest): NextResponse | null => {
    const identifier = request.ip || 'anonymous';
    const now = Date.now();
    
    // 古いエントリを削除
    for (const [key, value] of requestCounts.entries()) {
      if (now > value.resetTime) {
        requestCounts.delete(key);
      }
    }
    
    const requestInfo = requestCounts.get(identifier);
    
    if (!requestInfo || now > requestInfo.resetTime) {
      // 新しい時間窓を開始
      requestCounts.set(identifier, {
        count: 1,
        resetTime: now + config.windowMs
      });
      return null; // 制限にかからない
    }
    
    if (requestInfo.count >= config.max) {
      // レート制限に引っかかった
      return NextResponse.json(
        { error: config.message },
        { 
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((requestInfo.resetTime - now) / 1000))
          }
        }
      );
    }
    
    // カウントを増加
    requestInfo.count++;
    return null; // 制限にかからない
  };
}

// 学生登録用のレート制限
export const studentCreationRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 5, // 15分間に5回まで
  message: '生徒登録の試行回数が上限に達しました。しばらく待ってから再試行してください。'
});

// チャットメッセージ用のレート制限  
export const chatMessageRateLimit = createRateLimit({
  windowMs: 60 * 1000, // 1分
  max: 30, // 1分間に30回まで
  message: 'メッセージの送信頻度が高すぎます。少し待ってから再試行してください。'
});

// 申請系のレート制限
export const requestSubmissionRateLimit = createRateLimit({
  windowMs: 5 * 60 * 1000, // 5分
  max: 3, // 5分間に3回まで
  message: '申請の送信頻度が高すぎます。しばらく待ってから再試行してください。'
});