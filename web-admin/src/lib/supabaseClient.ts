import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createBrowserClient } from '@supabase/ssr';

// Supabaseの設定情報
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://nhsuhxifnmvnxtcndihm.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oc3VoeGlmbm12bnh0Y25kaWhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxMDE3OTUsImV4cCI6MjA2NDY3Nzc5NX0.B0fUGEtSQIeFtVMWyXdLm47LyhR7br01sMLBg43ENwo';

// 設定値が存在しない場合のエラーハンドリング
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabaseの設定が不正です。');
}

// シングルトンインスタンスを保持
let clientInstance: ReturnType<typeof createSupabaseClient> | null = null;
let browserClientInstance: ReturnType<typeof createBrowserClient> | null = null;

// createClient関数をエクスポート（シングルトンパターン）
export function createClient() {
  if (!clientInstance) {
    clientInstance = createSupabaseClient(supabaseUrl, supabaseAnonKey);
  }
  return clientInstance;
}

// SSR対応のブラウザクライアント作成（シングルトンパターン）
export function createBrowserSupabaseClient() {
  if (!browserClientInstance) {
    browserClientInstance = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  return browserClientInstance;
}

// デフォルトのSupabaseクライアント（SSR対応）
export const supabase = createBrowserSupabaseClient();