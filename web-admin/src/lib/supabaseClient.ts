import { createClient } from '@supabase/supabase-js';

// Supabaseの設定情報を環境変数から取得
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// 設定値が存在しない場合のエラーハンドリング
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabaseの環境変数が設定されていません。');
}

// Supabaseクライアントの初期化
export const supabase = createClient(supabaseUrl, supabaseAnonKey);