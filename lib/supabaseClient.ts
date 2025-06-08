import { createClient } from '@supabase/supabase-js';

// Supabaseの設定情報
const supabaseUrl = 'https://nhsuhxifnmvnxtcndihm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oc3VoeGlmbm12bnh0Y25kaWhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxMDE3OTUsImV4cCI6MjA2NDY3Nzc5NX0.B0fUGEtSQIeFtVMWyXdLm47LyhR7br01sMLBg43ENwo';

// Supabaseクライアントの初期化
export const supabase = createClient(supabaseUrl, supabaseAnonKey); 