import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Supabaseの設定情報を環境変数から取得
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl as string;
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey as string;

// 設定値が存在しない場合のエラーハンドリング
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabaseの環境変数が設定されていません。');
}

// Supabaseクライアントの初期化
export const supabase = createClient(supabaseUrl, supabaseAnonKey); 