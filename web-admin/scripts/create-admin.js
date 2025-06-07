#!/usr/bin/env node

/**
 * 管理者アカウント作成スクリプト
 * 
 * 使用方法:
 * node scripts/create-admin.js <email> <password> <full_name>
 * 
 * 例:
 * node scripts/create-admin.js admin@example.com password123 "管理者"
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function createAdminAccount(email, password, fullName) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY // Service Role Key を使用
  );

  try {
    console.log('🔧 管理者アカウント作成開始...');
    console.log('📧 Email:', email);
    console.log('👤 Name:', fullName);

    // 1. Supabase Authにユーザーを作成
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // メール確認をスキップ
    });

    if (authError) {
      console.error('❌ Auth user creation failed:', authError);
      throw authError;
    }

    console.log('✅ Auth user created:', authData.user.id);

    // 2. administratorsテーブルにレコードを挿入
    const { data: adminData, error: adminError } = await supabase
      .from('administrators')
      .insert({
        user_id: authData.user.id,
        full_name: fullName,
        email: email,
        account_status: '有効'
      })
      .select()
      .single();

    if (adminError) {
      console.error('❌ Administrator record creation failed:', adminError);
      
      // Auth userを削除（クリーンアップ）
      await supabase.auth.admin.deleteUser(authData.user.id);
      throw adminError;
    }

    console.log('✅ Administrator record created:', adminData.id);
    console.log('🎉 管理者アカウント作成完了！');
    console.log('');
    console.log('ログイン情報:');
    console.log('📧 Email:', email);
    console.log('🔑 Password:', password);
    console.log('');
    console.log('http://localhost:3000/login でログインできます');

  } catch (error) {
    console.error('💥 Error creating admin account:', error);
    process.exit(1);
  }
}

// コマンドライン引数の確認
const args = process.argv.slice(2);
if (args.length !== 3) {
  console.log('❌ 使用方法: node scripts/create-admin.js <email> <password> <full_name>');
  console.log('例: node scripts/create-admin.js admin@example.com password123 "管理者"');
  process.exit(1);
}

const [email, password, fullName] = args;

// 基本的なバリデーション
if (!email.includes('@')) {
  console.error('❌ 有効なメールアドレスを入力してください');
  process.exit(1);
}

if (password.length < 6) {
  console.error('❌ パスワードは6文字以上で入力してください');
  process.exit(1);
}

// 実行
createAdminAccount(email, password, fullName);