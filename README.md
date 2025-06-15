# 東大伴走（Tōdai Bansō）モバイルアプリ

中学受験生向けオンライン個別指導サービス「東大伴走」のモバイルアプリケーションです。

## 📱 概要

このアプリは中学受験に取り組む小学生が「自走型」で学習できるよう支援し、保護者の学習サポート負担を軽減することを目的としています。

### 対象ユーザー
- **生徒・保護者**: 小学5〜6年生とその保護者（モバイルアプリの主要ユーザー）
- **講師**: 主に現役東大生（ウェブ管理画面およびモバイルアプリ使用）
- **運営メンバー**: システム管理者（ウェブ管理画面の主要ユーザー）

## 🚀 技術スタック

### フロントエンド
- **React Native**: モバイルアプリ開発フレームワーク
- **Expo SDK 53.0.11**: 開発・ビルドプラットフォーム
- **Expo Router v5.1.0**: ファイルベースナビゲーション
- **TypeScript**: 型安全性の向上
- **Lucide React Native**: アイコンライブラリ

### バックエンド
- **Supabase**: 
  - PostgreSQLデータベース
  - 認証システム（ロールベースアクセス制御）
  - リアルタイム機能（WebSocket）
  - 自動生成REST API

### 状態管理・ユーティリティ
- **React Context**: グローバル状態管理
- **AsyncStorage**: ローカルデータ永続化
- **date-fns**: 日付処理ライブラリ
- **React Native Reanimated**: アニメーション

## 🗂️ プロジェクト構成

```
📁 東大伴走_MobileApp/
├── 📁 app/                          # Expo Routerのメイン画面
│   ├── 📁 (auth)/                   # 認証画面群
│   ├── 📁 (tabs)/                   # 生徒・保護者用タブ画面
│   ├── 📁 (tabs-teacher)/           # 講師用タブ画面
│   ├── 📁 (tabs-admin)/             # 運営者用タブ画面
│   └── 📄 _layout.tsx               # ルートレイアウト
├── 📁 components/                   # 再利用可能コンポーネント
│   ├── 📁 common/                   # 共通コンポーネント
│   ├── 📁 ui/                       # UIコンポーネント
│   ├── 📁 optimized/                # パフォーマンス最適化コンポーネント
│   └── 📁 debug/                    # 開発用デバッグツール
├── 📁 contexts/                     # React Context
│   ├── 📄 AuthContext.tsx           # 認証・ユーザー管理
│   └── 📄 NotificationContext.tsx   # 通知管理
├── 📁 hooks/                        # カスタムフック
├── 📁 utils/                        # ユーティリティ関数
├── 📁 types/                        # TypeScript型定義
├── 📁 lib/                          # ライブラリ設定
└── 📁 web-admin/                    # ウェブ管理画面（Next.js）
```

## 🔧 セットアップ

### 前提条件
- Node.js 18+
- npm または yarn
- Expo CLI
- iOS Simulator（iOS開発の場合）
- Android Studio（Android開発の場合）

### インストール

1. **プロジェクトのクローン**
```bash
git clone <repository-url>
cd TodaiBansou_MobileApp
```

2. **依存関係のインストール**
```bash
npm install
```

3. **環境変数の設定**
```bash
# Supabase接続情報は既にCLAUDE.mdに記載済み
# 必要に応じて追加の環境変数を.env.localに設定
```

4. **開発サーバーの起動**
```bash
npm run dev
```

### ビルド

```bash
# iOS
npm run ios

# Android  
npm run android

# Web（管理画面）
npm run build:web
```

## 📲 主要機能

### 生徒・保護者向け機能
- ✅ **今日のやることリスト**: 日単位の学習タスク管理
- 📅 **週間学習プランニング**: 週単位の計画表示
- 🗓️ **授業予定カレンダー**: 講師との授業スケジュール
- 💬 **チャット機能**: 講師・運営との連絡
- 📢 **お知らせ・設定**: 重要な連絡事項の確認

### 講師向け機能
- 👥 **担当生徒管理**: 割り当てられた生徒の確認
- ✏️ **やることリスト編集**: 面談担当講師による学習計画作成
- 💭 **コメント機能**: 授業担当講師による学習フィードバック
- 📊 **授業スケジュール**: 担当授業の確認・管理
- ⚙️ **講師設定**: 通知設定等

### 運営者向け機能
- 📊 **リアルタイムダッシュボード**: システム統計の監視
- 👤 **ユーザー管理**: 生徒・講師・担当割り当ての管理
- 📅 **スケジュール管理**: 全体の授業・面談管理
- 📢 **お知らせ配信**: システム全体への通知送信
- ⚙️ **システム設定**: バックアップ・メンテナンス等

## 🔐 認証・権限システム

### ユーザーロール
- **parent**: 保護者（生徒選択機能付き）
- **teacher**: 講師（担当生徒の管理）
- **admin**: 運営者（システム全体の管理）

### 権限レベル
- **面談担当講師**: やることリスト編集 + コメント入力
- **授業担当講師**: コメント入力のみ
- **運営・塾長**: 全権限

## 📊 データベース設計

### 主要エンティティ
- **students**: 生徒基本情報
- **teachers**: 講師情報
- **administrators**: 運営者情報
- **assignments**: 担当割り当て
- **todo_lists**: 週間学習プラン
- **tasks**: 個別学習タスク
- **lesson_slots**: 授業・面談コマ
- **chat_groups / chat_messages**: チャット機能
- **notifications**: お知らせ

詳細なスキーマは`CLAUDE.md`を参照してください。

## ⚡ パフォーマンス最適化

### 実装済み最適化
- **認証キャッシュ**: ユーザー情報の5-10分キャッシュ
- **並行クエリ**: `Promise.allSettled`による高速化
- **メモ化**: `useCallback`/`useMemo`による再レンダリング最適化
- **遅延読み込み**: 画像・コンポーネントの最適化
- **デバウンス/スロットル**: 検索・入力の最適化

### 監視ツール
- **PerformanceMonitor**: タイミング測定
- **APICache**: レスポンスキャッシュ
- **PerformanceDebugPanel**: 開発時の監視画面

## 🛠️ 開発者向け情報

### TypeScript型定義
```typescript
// 主要な型はtypes/database.types.tsで管理
import type { Database } from '@/types/database.types';

type Student = Database['public']['Tables']['students']['Row'];
type Teacher = Database['public']['Tables']['teachers']['Row'];
```

### カスタムフック
```typescript
// 最適化されたデータ取得
import { useOptimizedQuery } from '@/hooks/useOptimizedQuery';

// パフォーマンスヘルパー
import { useDebounce, APICache } from '@/utils/performanceHelpers';

// エラーハンドリング
import { handleAppError } from '@/utils/errorHandling';
```

### デバッグ
```typescript
// 開発環境でのパフォーマンス監視
import { PerformanceDebugPanel } from '@/components/debug/PerformanceDebugPanel';
```

## 🐛 トラブルシューティング

### よくある問題

1. **TypeScriptエラー**
```bash
npx tsc --noEmit  # 型チェック実行
```

2. **Expo関連の問題**
```bash
expo doctor      # 環境チェック
expo r -c        # キャッシュクリア
```

3. **Supabase接続問題**
- CLAUDE.mdの接続情報を確認
- ネットワーク環境をチェック

## 📝 開発履歴

### Phase 1: 基盤整備
- ✅ RoleGuard認証システム実装
- ✅ タブナビゲーション（生徒・講師・運営）
- ✅ AuthContext拡張

### Phase 2: 講師機能
- ✅ 講師個別生徒詳細画面
- ✅ やることリスト編集機能

### Phase 3: 管理者機能
- ✅ ダッシュボード強化（リアルタイム統計）
- ✅ 生徒管理（検索・フィルター）
- ✅ 講師管理機能
- ✅ スケジュール管理
- ✅ お知らせ管理

### Phase 4: 高度な機能
- ✅ リアルタイムチャット機能
- ✅ プッシュ通知基盤
- ✅ 授業予定カレンダー
- ✅ 設定画面統合
- ✅ パフォーマンス最適化

### Phase 5: 最終調整
- ✅ TypeScript型定義整合性確認
- ✅ 設定・環境変数最終確認
- ✅ エラーハンドリング統一
- ✅ コード整理・ドキュメント作成

## 📞 サポート

問題やご質問がございましたら、開発チームまでお問い合わせください。

---

**東大伴走 v1.0.0**  
中学受験生の自走型学習をサポートする、次世代個別指導プラットフォーム
