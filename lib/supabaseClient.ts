import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';

// Supabaseの設定情報（環境変数から取得）
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://nhsuhxifnmvnxtcndihm.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oc3VoeGlmbm12bnh0Y25kaWhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxMDE3OTUsImV4cCI6MjA2NDY3Nzc5NX0.B0fUGEtSQIeFtVMWyXdLm47LyhR7br01sMLBg43ENwo';

// Supabaseクライアントの初期化
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
}); 