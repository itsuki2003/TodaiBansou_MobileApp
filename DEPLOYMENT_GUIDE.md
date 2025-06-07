# 🚀 東大伴走アプリケーション デプロイメントガイド

## 📋 目次

1. [環境要件](#環境要件)
2. [初期セットアップ](#初期セットアップ)
3. [データベース設定](#データベース設定)
4. [アプリケーション設定](#アプリケーション設定)
5. [本番環境デプロイ](#本番環境デプロイ)
6. [監視・運用](#監視運用)
7. [トラブルシューティング](#トラブルシューティング)

---

## 🛠 環境要件

### 必要なソフトウェア

- **Node.js**: v20.0.0 以上
- **npm**: v10.0.0 以上
- **Git**: 最新版

### 推奨開発環境

- **OS**: macOS, Linux, Windows (WSL2)
- **エディタ**: VS Code + 推奨拡張機能
- **ブラウザ**: Chrome, Safari, Firefox（最新版）

---

## 🔧 初期セットアップ

### 1. リポジトリのクローン

```bash
git clone <repository-url>
cd TodaiBansou_MobileApp
```

### 2. 依存関係のインストール

```bash
# Web管理画面
cd web-admin
npm install

# モバイルアプリ
cd ../
npm install
```

### 3. 環境変数の設定

#### Web管理画面 (.env.local)

```bash
# web-admin/.env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

#### モバイルアプリ (.env)

```bash
# .env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 🗄 データベース設定

### 1. Supabaseプロジェクトの作成

1. [Supabase](https://supabase.com) にアクセス
2. 新しいプロジェクトを作成
3. データベースパスワードを設定
4. プロジェクトURLとAPIキーを取得

### 2. データベーススキーマの適用

```bash
# Supabase CLIのインストール
npm install -g supabase

# プロジェクトの初期化
supabase init

# データベーススキーマの適用
supabase db push

# RLSポリシーの適用
psql -h your_db_host -U postgres -d postgres -f web-admin/database/rls-policies.sql
```

### 3. テストデータの作成（開発環境のみ）

```bash
cd web-admin
npm run dev

# ブラウザで開発者ツールを開き、以下を実行:
import { setupTestData } from '/src/lib/testHelpers';
await setupTestData();
```

---

## ⚙️ アプリケーション設定

### 1. Web管理画面の起動

```bash
cd web-admin
npm run dev
# http://localhost:3000 でアクセス
```

### 2. モバイルアプリの起動

```bash
# 開発環境で起動
npm run dev

# 特定のプラットフォームで起動
npm run ios     # iOS シミュレータ
npm run android # Android エミュレータ
npm run web     # ブラウザ
```

### 3. 初期管理者アカウントの作成

```bash
cd web-admin
node scripts/create-admin.js admin@example.com password123 "管理者名"
```

---

## 🌐 本番環境デプロイ

### 1. Web管理画面（Vercel推奨）

```bash
# Vercel CLIのインストール
npm install -g vercel

# デプロイ
cd web-admin
vercel

# 環境変数をVercelで設定:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY
# - SUPABASE_SERVICE_ROLE_KEY
```

### 2. モバイルアプリ（Expo EAS Build）

```bash
# EAS CLIのインストール
npm install -g @expo/eas-cli

# EASにログイン
eas login

# ビルド設定
eas build:configure

# 本番ビルド
eas build --platform all

# App Store / Google Play Store に提出
eas submit
```

### 3. 本番環境のセキュリティ設定

#### Supabaseセキュリティ設定

```sql
-- 本番環境でのRLS強化
ALTER DATABASE postgres SET row_security = on;

-- IP制限（必要に応じて）
CREATE POLICY "ip_restriction" ON students
  FOR ALL USING (
    inet_client_addr() <<= '許可するIPレンジ'::inet
  );
```

#### Vercel セキュリティヘッダー

```javascript
// next.config.ts
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    ]
  },
}
```

---

## 📊 監視・運用

### 1. ログ監視

#### Supabase Analytics
- SQLクエリのパフォーマンス監視
- API使用量とレート制限の確認
- エラーログの監視

#### Vercel Analytics
- ページロード時間の監視
- エラー率の追跡
- ユーザー体験指標

### 2. アラート設定

```bash
# Supabaseでアラート設定
# 1. データベース接続数
# 2. API レスポンス時間
# 3. エラー率

# Vercelでアラート設定
# 1. デプロイ失敗
# 2. パフォーマンス劣化
# 3. セキュリティインシデント
```

### 3. バックアップ戦略

```bash
# 日次データベースバックアップ
pg_dump -h your_db_host -U postgres -d postgres > backup_$(date +%Y%m%d).sql

# 設定ファイルのバックアップ
git commit -am "Config backup $(date +%Y%m%d)"
git push origin main
```

---

## 🔧 トラブルシューティング

### よくある問題と解決法

#### 1. 認証エラー

**問題**: ログインできない、セッションが切れる

**解決法**:
```bash
# Supabaseの接続設定を確認
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# RLSポリシーを確認
psql -h your_db_host -U postgres -c "SELECT * FROM pg_policies;"
```

#### 2. パフォーマンス問題

**問題**: ページロードが遅い、タイムアウト

**解決法**:
```bash
# データベースインデックスの確認
psql -h your_db_host -U postgres -c "
SELECT schemaname, tablename, indexname, indexdef 
FROM pg_indexes 
WHERE schemaname = 'public';
"

# 不要なクエリの特定
# Supabase Analytics で遅いクエリを確認
```

#### 3. RLS ポリシー問題

**問題**: データにアクセスできない、権限エラー

**解決法**:
```sql
-- ポリシーの確認
SELECT * FROM pg_policies WHERE tablename = 'students';

-- ユーザーロールの確認
SELECT get_current_user_role();

-- テストクエリの実行
SELECT * FROM students WHERE id = 'test_id';
```

#### 4. デプロイメント問題

**問題**: ビルドエラー、デプロイ失敗

**解決法**:
```bash
# ローカルでビルドテスト
npm run build

# 依存関係の問題を確認
npm audit
npm audit fix

# キャッシュクリア
rm -rf node_modules package-lock.json
npm install
```

---

## 📝 運用チェックリスト

### 日次チェック

- [ ] アプリケーションの正常動作確認
- [ ] エラーログの確認
- [ ] パフォーマンス指標の確認
- [ ] バックアップの実行確認

### 週次チェック

- [ ] セキュリティアップデートの確認
- [ ] 依存関係の更新
- [ ] ユーザーフィードバックの確認
- [ ] リソース使用量の確認

### 月次チェック

- [ ] 包括的なセキュリティレビュー
- [ ] パフォーマンス最適化の実施
- [ ] バックアップの復旧テスト
- [ ] 災害復旧計画の確認

---

## 🆘 緊急時対応

### システム障害時

1. **Statusページで障害状況を確認**
   - Supabase Status: https://status.supabase.com/
   - Vercel Status: https://www.vercel-status.com/

2. **ロールバック手順**
   ```bash
   # Vercelでの前バージョンへのロールバック
   vercel rollback [deployment-url]
   
   # データベースの復旧
   psql -h your_db_host -U postgres -d postgres < backup_latest.sql
   ```

3. **ユーザー通知**
   - システムメンテナンス通知
   - 復旧見込み時間の共有
   - 代替手段の提供

---

## 📞 サポート連絡先

- **開発チーム**: dev@todaibanso.com
- **システム管理**: admin@todaibanso.com
- **緊急連絡**: emergency@todaibanso.com

---

## 📚 追加リソース

- [Supabase ドキュメント](https://supabase.com/docs)
- [Next.js ドキュメント](https://nextjs.org/docs)
- [Expo ドキュメント](https://docs.expo.dev/)
- [Vercel ドキュメント](https://vercel.com/docs)