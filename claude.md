# 東大伴走（Tōdai Bansō）プロジェクト

## プロジェクト概要

中学受験生向けオンライン個別指導サービス「東大伴走」のアプリケーション開発プロジェクトです。

### コア目的

- 中学受験に取り組む小学生が「自走型」で学習できるよう支援する
- 保護者が日々の学習サポートで抱える負担・不安を軽減する

### 対象ユーザー

- **生徒・保護者**: モバイルアプリの主要ユーザー（小学 5〜6 年生とその保護者）
- **講師**: ウェブ管理画面およびモバイルアプリのユーザー（主に現役東大生）
- **運営メンバー**: ウェブ管理画面の主要ユーザー

## 技術スタック

### モバイルアプリ

- **対応 OS**: iOS/Android（最新含む過去 2-3 世代サポート）
- **主要機能**:
  - 今日のやることリスト管理
  - 週間学習プランニング
  - 授業予定カレンダー
  - チャット機能
  - お知らせ・設定

### ウェブ管理画面

- **対応ブラウザ**: Chrome, Safari, Edge, Firefox（最新安定版＋ 1 つ前のメジャーバージョン）
- **主要機能**:
  - 講師・生徒アカウント管理
  - やることリスト作成・編集
  - 授業スケジュール管理
  - お知らせ配信

### バックエンド要件

- **通信**: HTTPS 暗号化必須
- **認証**: ロールベースアクセス制御（生徒/保護者、講師、運営）
- **データ保護**: パスワードハッシュ化、セッション管理

## 主要画面一覧

### モバイルアプリ画面

- **SCR-001**: ホーム画面（今日のやることリスト）
- **SCR-002**: 週間やることリスト画面
- **SCR-004**: 授業予定画面（カレンダー）
- **SCR-005**: チャット画面
- **SCR-006**: おしらせ・設定統合画面
- **SCR-007**: プロフィール画面
- **SCR-008**: 欠席申請画面
- **SCR-009**: 追加授業申請画面

### ウェブ管理画面

- **ADM-S1**: 運営者アカウント管理
- **ADM-001**: 講師アカウント管理
- **ADM-002**: 生徒管理
- **ADM-003**: やることリスト管理（週間学習プランニング）
- **ADM-004**: 講師登録申請フォーム
- **ADM-005**: 講師登録申請一覧
- **ADM-006**: 生徒・講師担当割り当て管理
- **ADM-007**: お知らせ作成・管理
- **ADM-008**: 授業スケジュール登録・管理
- **ADM-009**: 生徒申請一覧
- **ADM-T1**: 講師マイページ

## データモデル概要

### 主要エンティティ

1. **生徒 (Student)**: 生徒基本情報、保護者連絡先
2. **講師 (Teacher)**: 講師情報、詳細プロフィール
3. **運営者 (Administrator)**: 管理者アカウント
4. **担当割り当て (Assignment)**: 生徒-講師の紐付け
5. **やることリスト (To-Do List)**: 週単位のタスク管理
6. **タスク (Task)**: 個別の学習項目
7. **授業コマ (Lesson Slot)**: 授業・面談予定
8. **チャット (Chat)**: メッセージ交換

## 開発における重要な注意点

### UI/UX 設計

- 小学生向け：シンプルで楽しい操作感、重要な漢字にふりがな
- 保護者向け：平易な言葉遣い、マニュアル不要の直感的操作
- タスク完了時：「クリア！」等のメッセージとアニメーション演出

### セキュリティ要件

- 個人情報の最小限の取り扱い
- ロールベースの厳格なアクセス制御
- セッションタイムアウト機能
- 一般的な脆弱性対策（SQL インジェクション、XSS 等）

### パフォーマンス要件

- スムーズな画面遷移
- 多数項目でも快適なスクロール
- 適切な応答時間

### 権限管理の重要ポイント

- **面談担当講師**: やることリスト編集権限＋コメント入力権限
- **授業担当講師**: コメント入力権限のみ
- **運営・塾長**: 全権限

## 開発時の推奨コマンド

```bash
# Flutterアプリの初期セットアップ
cd mobile
flutter create . --org com.todaibanso
flutter pub get

# ウェブ管理画面のセットアップ（React想定）
cd web-admin
npm init -y
npm install react react-dom

# バックエンドのセットアップ（Node.js想定）
cd backend
npm init -y
npm install express
```

# Supabase データベーススキーマ

## テーブル一覧

### 1. students (生徒情報テーブル)

生徒の基本情報を管理するテーブル。

#### カラム詳細:

- `id`: UUID、プライマリキー
- `created_at`: レコード作成日時（タイムスタンプ）
- `updated_at`: レコード更新日時（タイムスタンプ）
- `user_id`: 保護者の認証ユーザー ID（auth.users テーブルへの外部キー）
- `full_name`: 生徒の氏名（必須）
- `furigana_name`: 生徒の氏名（フリガナ、任意）
- `grade`: 学年（例: 小学 5 年生、任意）
- `school_attended`: 通塾先の塾名等（任意）
- `enrollment_date`: 入会日
- `status`: 在籍状況（`在籍中`、`休会中`、`退会済み`）
- `parent_name`: 保護者氏名（必須）
- `parent_phone_number`: 保護者の連絡先電話番号（任意）
- `notes`: 特記事項・備考（任意）

### 2. teachers (講師情報テーブル)

講師の基本情報を管理するテーブル。

#### カラム詳細:

- `id`: UUID、プライマリキー
- `created_at`: レコード作成日時
- `updated_at`: レコード更新日時
- `user_id`: Supabase 認証ユーザー ID（任意）
- `full_name`: 講師の氏名（必須）
- `furigana_name`: 講師のフリガナ（必須）
- `email`: 講師のメールアドレス（ログイン ID、必須、ユニーク）
- `phone_number`: 電話番号（任意）
- `account_status`: アカウント状態（`承認待ち`、`有効`、`無効`）
- `profile_formal_photo_url`: 正式な写真の URL（任意）
- `profile_casual_photo_url`: カジュアルな写真の URL（任意）
- `appeal_points`: アピールポイント（任意）
- `hobbies_special_skills`: 趣味・特技（任意）
- `referrer_info`: 紹介元情報（任意）
- `education_background_*`: 教育背景（塾、中学、高校、大学、学部）（任意）
- `registration_application_date`: 登録申請日（任意）
- `account_approval_date`: アカウント承認日（任意）
- `notes_admin_only`: 運営メモ（任意）

### 3. assignments (担当割り当てテーブル)

生徒と講師の担当割り当てを管理するテーブル。

#### カラム詳細:

- `id`: UUID、プライマリキー
- `created_at`: レコード作成日時
- `updated_at`: レコード更新日時
- `student_id`: 生徒の ID（students テーブルへの外部キー）
- `teacher_id`: 講師の ID（teachers テーブルへの外部キー）
- `role`: 講師の役割（`面談担当（リスト編集可）`、`授業担当（コメントのみ）`）
- `assignment_start_date`: 担当開始日（任意）
- `assignment_end_date`: 担当終了日（任意）
- `status`: 担当状態（`有効`、`終了済み`）
- `notes`: 運営専用メモ（任意）

### 4. todo_lists (やることリストテーブル)

生徒の週ごとの「やることリスト」を管理するテーブル。

#### カラム詳細:

- `id`: UUID、プライマリキー
- `created_at`: レコード作成日時
- `updated_at`: レコード更新日時
- `student_id`: 生徒の ID（students テーブルへの外部キー）
- `target_week_start_date`: リスト対象週の開始日
- `list_creation_date`: リスト作成日（デフォルト: 現在日）
- `status`: リストステータス（`下書き`、`公開済み`）
- `notes`: メモ（任意）

### 5. tasks (タスクテーブル)

「やることリスト」に含まれる個々の学習項目や活動を管理するテーブル。

#### カラム詳細:

- `id`: UUID、プライマリキー
- `created_at`: レコード作成日時
- `updated_at`: レコード更新日時
- `todo_list_id`: 属する「やることリスト」の ID（todo_lists テーブルへの外部キー）
- `target_date`: タスクの対象日
- `content`: タスクの具体的な内容
- `is_completed`: 完了状態（真偽値）
- `display_order`: 同日内での表示順序
- `notes`: メモ（任意）

### 6. teacher_comments (講師コメントテーブル)

「やることリスト」に対する講師のフィードバックコメントを管理するテーブル。

#### カラム詳細:

- `id`: UUID、プライマリキー
- `created_at`: レコード作成日時
- `updated_at`: レコード更新日時
- `todo_list_id`: 関連する「やることリスト」の ID
- `target_date`: コメント対象の日付
- `teacher_id`: コメントした講師の ID（teachers テーブルへの外部キー）
- `comment_content`: コメント本文
- `notes`: メモ（任意）

### 7. administrators (運営者テーブル)

管理画面の運営者アカウント情報を管理するテーブル。

#### カラム詳細:

- `id`: UUID、プライマリキー
- `created_at`: レコード作成日時
- `updated_at`: レコード更新日時
- `user_id`: Supabase 認証ユーザー ID（任意、ユニーク）
- `full_name`: 運営者の氏名
- `email`: メールアドレス（ログイン ID、ユニーク）
- `account_status`: アカウント状態（`有効`、`無効`）

### 8. lesson_slots (授業/面談コマテーブル)

授業や面談のスケジュールを管理するテーブル。

#### カラム詳細:

- `id`: UUID、プライマリキー
- `student_id`: 生徒の ID（students テーブルへの外部キー）
- `teacher_id`: 講師の ID（teachers テーブルへの外部キー、任意）
- `slot_type`: コマの種類（`通常授業`、`固定面談`、`振替授業`、`追加授業`）
- `slot_date`: コマの日付
- `start_time`: 開始時刻
- `end_time`: 終了時刻
- `google_meet_link`: Google Meet リンク（任意）
- `status`: コマのステータス（`予定通り`、`実施済み`、`欠席`、`振替済み（振替元）`）
- `original_slot_id_for_reschedule`: 振替授業の場合の元のコマの ID（任意）
- `notes`: メモ（任意）
- `created_at`: レコード作成日時
- `updated_at`: レコード更新日時

### 9. absence_requests (欠席申請テーブル)

生徒からの欠席申請を管理するテーブル。

#### カラム詳細:

- `id`: UUID、プライマリキー
- `student_id`: 申請した生徒の ID（students テーブルへの外部キー）
- `lesson_slot_id`: 欠席対象の授業/面談コマの ID（lesson_slots テーブルへの外部キー）
- `reason`: 欠席理由
- `request_timestamp`: 申請日時
- `status`: 申請ステータス（`未振替`、`振替済`）
- `admin_notes`: 運営メモ（任意）
- `created_at`: レコード作成日時
- `updated_at`: レコード更新日時

### 10. additional_lesson_requests (追加授業申請テーブル)

生徒からの追加授業申請を管理するテーブル。

#### カラム詳細:

- `id`: UUID、プライマリキー
- `student_id`: 申請した生徒の ID（students テーブルへの外部キー）
- `requested_date`: 希望日付
- `requested_start_time`: 希望開始時刻
- `requested_end_time`: 希望終了時刻
- `teacher_id`: 担当講師の ID（teachers テーブルへの外部キー、任意）
- `notes`: 生徒・保護者の備考（任意）
- `request_timestamp`: 申請日時
- `status`: 申請ステータス（`申請中`、`承認済み・授業登録済み`）
- `admin_notes`: 運営メモ（任意）
- `created_lesson_slot_id`: 作成された授業コマの ID（lesson_slots テーブルへの外部キー、任意）
- `created_at`: レコード作成日時
- `updated_at`: レコード更新日時

### 11. notification_categories (お知らせカテゴリーテーブル)

お知らせのカテゴリー情報を管理するテーブル。

#### カラム詳細:

- `id`: UUID、プライマリキー
- `name`: カテゴリー名（ユニーク）
- `created_at`: レコード作成日時
- `updated_at`: レコード更新日時

### 12. notifications (お知らせテーブル)

運営から配信されるお知らせ情報を管理するテーブル。

#### カラム詳細:

- `id`: UUID、プライマリキー
- `title`: お知らせタイトル
- `content`: お知らせ本文
- `category_id`: カテゴリー ID（notification_categories テーブルへの外部キー、任意）
- `creator_admin_id`: 作成した運営者の ID（administrators テーブルへの外部キー、任意）
- `publish_timestamp`: 公開・配信日時
- `status`: お知らせステータス（`下書き`、`配信済み`）
- `created_at`: レコード作成日時
- `updated_at`: レコード更新日時

### 13. chat_groups (チャットグループテーブル)

生徒ごとのチャットグループ（スレッド）を管理するテーブル。

#### カラム詳細:

- `id`: UUID、プライマリキー
- `student_id`: チャットグループが紐づく生徒の ID（students テーブルへの外部キー、ユニーク）
- `group_name`: チャットグループの表示名（任意）
- `last_message_at`: 最終メッセージの送信日時（任意）
- `created_at`: レコード作成日時
- `updated_at`: レコード更新日時

### 14. chat_messages (チャットメッセージテーブル)

チャットグループ内で送受信されるメッセージを管理するテーブル。

#### カラム詳細:

- `id`: UUID、プライマリキー
- `chat_group_id`: メッセージが属するチャットグループの ID（chat_groups テーブルへの外部キー）
- `sender_user_id`: メッセージを送信したユーザーの認証 ID
- `sender_role`: メッセージ送信者の役割（生徒、保護者、講師、運営、システムなど）
- `content`: メッセージ本文（添付ファイルのみの場合は NULL 許可）
- `attachment_info`: 添付ファイル情報（JSON 形式、任意）
- `sent_at`: メッセージ送信日時
- `created_at`: レコード作成日時
- `updated_at`: レコード更新日時

## リレーションシップ

各テーブル間には適切な外部キー制約が設定されており、データの整合性が保たれています。主な関係性は上記の各テーブル説明で外部キーとして示しています。

## データベース設計の特徴

1. UUID（Universally Unique Identifier）をプライマリキーとして採用
2. 各テーブルに`created_at`と`updated_at`を自動的に管理
3. カスタム enum を使用して、状態や役割を厳密に管理
4. Supabase 認証システムと連携する user_id カラムを複数のテーブルに配置
5. 柔軟性と厳密性のバランスを取ったスキーマ設計

## セキュリティ

Row Level Security (RLS)がすべてのテーブルで有効化されており、データアクセスを細かく制御可能です。
