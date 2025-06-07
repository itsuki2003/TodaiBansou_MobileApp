import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

// Supabaseの設定情報を環境変数から取得
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// 設定値が存在しない場合のエラーハンドリング
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabaseの環境変数が設定されていません。');
}

// createClient関数をエクスポート（各コンポーネントで新しいクライアントを作成するため）
export function createClient() {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey);
}

// SSR対応のブラウザクライアント作成
export function createBrowserSupabaseClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey);
}

// デフォルトのSupabaseクライアント（SSR対応）
export const supabase = createBrowserSupabaseClient();