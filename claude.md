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

### バックエンド - Supabase

- **データベース**: PostgreSQL
- **認証**: Supabase Auth（ロールベースアクセス制御）
- **API**: 自動生成される REST API
- **リアルタイム**: WebSocket 接続によるリアルタイム更新
- **通信**: HTTPS 暗号化必須
- **データ保護**: Row Level Security (RLS)、パスワードハッシュ化、セッション管理

### Supabase 接続情報

```typescript
const supabaseUrl = 'https://nhsuhxifnmvnxtcndihm.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oc3VoeGlmbm12bnh0Y25kaWhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxMDE3OTUsImV4cCI6MjA2NDY3Nzc5NX0.B0fUGEtSQIeFtVMWyXdLm47LyhR7br01sMLBg43ENwo';

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types/database.types';

const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
```

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

# Supabaseクライアントのセットアップ
npm install @supabase/supabase-js
```

# Supabase データベーススキーマ - 完全リファレンス

## システム概要

個別指導塾「東大伴走」の運営管理システム。生徒・講師・授業の管理、やることリスト機能、チャット機能、お知らせ機能を統合したデータベース設計。

## テーブル一覧と主要統計

| テーブル名                   | 用途               | データ件数 |
| ---------------------------- | ------------------ | ---------- |
| `students`                   | 生徒基本情報       | 5 件       |
| `teachers`                   | 講師基本情報       | 2 件       |
| `administrators`             | 運営者情報         | 2 件       |
| `assignments`                | 生徒-講師担当割当  | 5 件       |
| `todo_lists`                 | 生徒の週次学習計画 | 3 件       |
| `tasks`                      | 個別学習タスク     | 5 件       |
| `lesson_slots`               | 授業・面談コマ     | 4 件       |
| `absence_requests`           | 欠席申請           | 1 件       |
| `additional_lesson_requests` | 追加授業申請       | 1 件       |
| `notifications`              | お知らせ           | 2 件       |
| `notification_categories`    | お知らせカテゴリ   | 3 件       |
| `chat_groups`                | チャットグループ   | 3 件       |
| `chat_messages`              | チャットメッセージ | 5 件       |
| `teacher_comments`           | 講師コメント       | 2 件       |

## 詳細テーブル仕様

### 1. students (生徒情報テーブル)

生徒の基本情報を管理するテーブル。

```typescript
interface Students {
  id: string; // UUID主キー
  created_at: string; // 作成日時
  updated_at: string; // 更新日時
  user_id: string; // auth.usersとの外部キー（保護者ログイン）
  full_name: string; // 生徒氏名（必須）
  furigana_name: string | null; // フリガナ
  grade: string | null; // 学年（例: "小学6年生"）
  school_attended: string | null; // 通塾先（例: "SAPIX"）
  enrollment_date: string; // 入会日（YYYY-MM-DD）
  status: 'في籍中' | '休会中' | '退会済み'; // 在籍状況
  parent_name: string; // 保護者氏名（必須）
  parent_phone_number: string | null; // 保護者連絡先
  notes: string | null; // 特記事項
}
```

**サンプルデータ**:

```json
{
  "id": "8e42ce43-1760-4dd1-a192-935b955c8be7",
  "full_name": "佐藤 一郎",
  "furigana_name": "サトウ イチロウ",
  "grade": "小学6年生",
  "school_attended": "SAPIX",
  "enrollment_date": "2023-04-01",
  "status": "في籍中",
  "parent_name": "佐藤 京子",
  "parent_phone_number": "090-1111-1111",
  "notes": "算数が得意。国語の読解に課題あり。"
}
```

### 2. teachers (講師情報テーブル)

講師の基本情報を管理するテーブル。

```typescript
interface Teachers {
  id: string; // UUID主キー
  created_at: string; // 作成日時
  updated_at: string; // 更新日時
  user_id: string | null; // auth.usersとの外部キー（講師ログイン）
  full_name: string; // 講師氏名（必須）
  furigana_name: string; // フリガナ（必須）
  email: string; // メールアドレス（ユニーク、必須）
  phone_number: string | null; // 電話番号
  account_status: '承認待ち' | '有効' | '無効'; // アカウント状態
  profile_formal_photo_url: string | null; // 正装写真URL
  profile_casual_photo_url: string | null; // カジュアル写真URL
  appeal_points: string | null; // アピールポイント
  hobbies_special_skills: string | null; // 趣味・特技
  referrer_info: string | null; // 紹介者情報
  education_background_cram_school: string | null; // 塾歴
  education_background_middle_school: string | null; // 中学校
  education_background_high_school: string | null; // 高校
  education_background_university: string | null; // 大学
  education_background_faculty: string | null; // 学部
  registration_application_date: string | null; // 登録申請日
  account_approval_date: string | null; // アカウント承認日
  notes_admin_only: string | null; // 運営メモ
}
```

### 3. assignments (担当割り当てテーブル)

生徒と講師の担当割り当てを管理するテーブル。

```typescript
interface Assignments {
  id: string; // UUID主キー
  created_at: string; // 作成日時
  updated_at: string; // 更新日時
  student_id: string; // 生徒ID（外部キー）
  teacher_id: string; // 講師ID（外部キー）
  role: '面談担当（リスト編集可）' | '授業担当（コメントのみ）'; // 担当役割
  assignment_start_date: string | null; // 担当開始日
  assignment_end_date: string | null; // 担当終了日
  status: '有効' | '終了済み'; // 割当状況
  notes: string | null; // 運営メモ
}
```

**重要な権限設計**:

- `面談担当（リスト編集可）`: やることリストの編集が可能
- `授業担当（コメントのみ）`: やることリストへのコメントのみ可能

### 4. todo_lists (やることリストテーブル)

生徒の週ごとの「やることリスト」を管理するテーブル。

```typescript
interface TodoLists {
  id: string; // UUID主キー
  created_at: string; // 作成日時
  updated_at: string; // 更新日時
  student_id: string; // 生徒ID（外部キー）
  target_week_start_date: string; // 対象週の開始日（月曜日想定）
  list_creation_date: string | null; // リスト作成日
  status: '下書き' | '公開済み'; // 公開状況
  notes: string | null; // 備考
}
```

### 5. tasks (タスクテーブル)

「やることリスト」に含まれる個々の学習項目や活動を管理するテーブル。

```typescript
interface Tasks {
  id: string; // UUID主キー
  created_at: string; // 作成日時
  updated_at: string; // 更新日時
  todo_list_id: string; // やることリストID（外部キー）
  target_date: string; // 対象日（YYYY-MM-DD）
  content: string; // タスク内容（必須）
  is_completed: boolean; // 完了状態（デフォルト: false）
  display_order: number; // 表示順序（デフォルト: 0）
  notes: string | null; // 備考
}
```

### 6. teacher_comments (講師コメントテーブル)

「やることリスト」に対する講師のフィードバックコメントを管理するテーブル。

```typescript
interface TeacherComments {
  id: string; // UUID主キー
  created_at: string; // 作成日時
  updated_at: string; // 更新日時
  todo_list_id: string; // やることリストID（外部キー）
  target_date: string; // 対象日（YYYY-MM-DD）
  teacher_id: string; // 講師ID（外部キー）
  comment_content: string; // コメント内容（必須）
  notes: string | null; // 備考
}
```

### 7. administrators (運営者テーブル)

管理画面の運営者アカウント情報を管理するテーブル。

```typescript
interface Administrators {
  id: string; // UUID主キー
  created_at: string; // 作成日時
  updated_at: string; // 更新日時
  user_id: string | null; // Supabase認証ユーザーID
  full_name: string; // 運営者氏名
  email: string; // メールアドレス（ログインID、ユニーク）
  account_status: '有効' | '無効'; // アカウント状態
}
```

### 8. lesson_slots (授業/面談コマテーブル)

授業や面談のスケジュールを管理するテーブル。

```typescript
interface LessonSlots {
  id: string; // UUID主キー
  created_at: string; // 作成日時
  updated_at: string; // 更新日時
  student_id: string; // 生徒ID（外部キー）
  teacher_id: string | null; // 講師ID（外部キー）
  slot_type: '通常授業' | '固定面談' | '振替授業' | '追加授業'; // コマ種別
  slot_date: string; // 授業日（YYYY-MM-DD）
  start_time: string; // 開始時刻（HH:MM:SS）
  end_time: string; // 終了時刻（HH:MM:SS）
  google_meet_link: string | null; // Google Meetリンク
  status: '予定通り' | '実施済み' | '欠席' | '振替済み（振替元）'; // ステータス
  original_slot_id_for_reschedule: string | null; // 振替元コマID
  notes: string | null; // 備考
}
```

### 9. absence_requests (欠席申請テーブル)

生徒からの欠席申請を管理するテーブル。

```typescript
interface AbsenceRequests {
  id: string; // UUID主キー
  created_at: string; // 作成日時
  updated_at: string; // 更新日時
  student_id: string; // 生徒ID（外部キー）
  lesson_slot_id: string; // 授業コマID（外部キー）
  reason: string; // 欠席理由（必須）
  request_timestamp: string; // 申請日時
  status: '未振替' | '振替済'; // 処理状況
  admin_notes: string | null; // 運営対応メモ
}
```

### 10. additional_lesson_requests (追加授業申請テーブル)

生徒からの追加授業申請を管理するテーブル。

```typescript
interface AdditionalLessonRequests {
  id: string; // UUID主キー
  created_at: string; // 作成日時
  updated_at: string; // 更新日時
  student_id: string; // 生徒ID（外部キー）
  requested_date: string; // 希望日（YYYY-MM-DD）
  requested_start_time: string; // 希望開始時刻（HH:MM:SS）
  requested_end_time: string; // 希望終了時刻（HH:MM:SS）
  teacher_id: string | null; // 担当講師ID（外部キー）
  notes: string | null; // 要望・備考
  request_timestamp: string; // 申請日時
  status: '申請中' | '承認済み・授業登録済み'; // 処理状況
  admin_notes: string | null; // 運営対応メモ
  created_lesson_slot_id: string | null; // 作成された授業コマID
}
```

### 11. notification_categories (お知らせカテゴリーテーブル)

お知らせのカテゴリー情報を管理するテーブル。

```typescript
interface NotificationCategories {
  id: string; // UUID主キー
  name: string; // カテゴリー名（ユニーク）
  created_at: string; // 作成日時
  updated_at: string; // 更新日時
}
```

### 12. notifications (お知らせテーブル)

運営から配信されるお知らせ情報を管理するテーブル。

```typescript
interface Notifications {
  id: string; // UUID主キー
  created_at: string; // 作成日時
  updated_at: string; // 更新日時
  title: string; // タイトル（必須）
  content: string; // 本文（必須）
  category_id: string | null; // カテゴリID（外部キー）
  creator_admin_id: string | null; // 作成者運営者ID
  publish_timestamp: string; // 公開日時
  status: '下書き' | '配信済み'; // 配信状況
}
```

### 13. chat_groups (チャットグループテーブル)

生徒ごとのチャットグループ（スレッド）を管理するテーブル。

```typescript
interface ChatGroups {
  id: string; // UUID主キー
  created_at: string; // 作成日時
  updated_at: string; // 更新日時
  student_id: string; // 生徒ID（外部キー、ユニーク）
  group_name: string | null; // グループ名（任意）
  last_message_at: string | null; // 最終メッセージ日時
}
```

### 14. chat_messages (チャットメッセージテーブル)

チャットグループ内で送受信されるメッセージを管理するテーブル。

```typescript
interface ChatMessages {
  id: string; // UUID主キー
  created_at: string; // 作成日時
  updated_at: string; // 更新日時
  chat_group_id: string; // チャットグループID（外部キー）
  sender_user_id: string; // 送信者ユーザーID
  sender_role: string; // 送信者役割（生徒、保護者、講師、運営、システム）
  content: string | null; // メッセージ本文
  attachment_info: Json | null; // 添付ファイル情報（JSON）
  sent_at: string; // 送信日時
}
```

## Enum 定義

```typescript
// 生徒在籍状況
type StudentStatus = 'في籍中' | '休会中' | '退会済み';

// 講師アカウント状況
type TeacherAccountStatus = '承認待ち' | '有効' | '無効';

// 担当役割
type AssignmentRole = '面談担当（リスト編集可）' | '授業担当（コメントのみ）';

// 担当状況
type AssignmentStatus = '有効' | '終了済み';

// やることリスト状況
type TodoListStatus = '下書き' | '公開済み';

// 授業コマ種別
type LessonSlotType = '通常授業' | '固定面談' | '振替授業' | '追加授業';

// 授業コマ状況
type LessonSlotStatus = '予定通り' | '実施済み' | '欠席' | '振替済み（振替元）';

// 欠席申請状況
type AbsenceRequestStatus = '未振替' | '振替済';

// 追加授業申請状況
type AdditionalLessonRequestStatus = '申請中' | '承認済み・授業登録済み';

// お知らせ状況
type NotificationStatus = '下書き' | '配信済み';

// 運営者アカウント状況
type AdministratorAccountStatus = '有効' | '無効';
```

## 主要なリレーションシップ

### 1 対多の関係

- `students` → `assignments`（1 生徒 → 複数担当割当）
- `teachers` → `assignments`（1 講師 → 複数担当割当）
- `students` → `todo_lists`（1 生徒 → 複数やることリスト）
- `todo_lists` → `tasks`（1 リスト → 複数タスク）
- `students` → `lesson_slots`（1 生徒 → 複数授業コマ）
- `teachers` → `lesson_slots`（1 講師 → 複数授業コマ）
- `chat_groups` → `chat_messages`（1 グループ → 複数メッセージ）

### 1 対 1 の関係

- `students` ↔ `chat_groups`（1 生徒 →1 チャットグループ）

### 自己参照関係

- `lesson_slots.original_slot_id_for_reschedule` → `lesson_slots.id`（振替関係）

## 基本的なクエリ例

### 生徒の担当講師一覧取得

```typescript
const getStudentTeachers = async (studentId: string) => {
  const { data, error } = await supabase
    .from('assignments')
    .select(
      `
      role,
      status,
      assignment_start_date,
      assignment_end_date,
      teachers (
        full_name,
        email,
        account_status
      )
    `
    )
    .eq('student_id', studentId)
    .eq('status', '有効');

  return { data, error };
};
```

### 特定週のやることリスト取得

```typescript
const getWeeklyTodoList = async (studentId: string, weekStartDate: string) => {
  const { data, error } = await supabase
    .from('todo_lists')
    .select(
      `
      *,
      tasks (
        *
      ),
      teacher_comments (
        *,
        teachers (
          full_name
        )
      )
    `
    )
    .eq('student_id', studentId)
    .eq('target_week_start_date', weekStartDate)
    .eq('status', '公開済み')
    .single();

  return { data, error };
};
```

### 生徒の授業スケジュール取得

```typescript
const getStudentLessons = async (
  studentId: string,
  startDate: string,
  endDate: string
) => {
  const { data, error } = await supabase
    .from('lesson_slots')
    .select(
      `
      *,
      teachers (
        full_name,
        email
      )
    `
    )
    .eq('student_id', studentId)
    .gte('slot_date', startDate)
    .lte('slot_date', endDate)
    .order('slot_date', { ascending: true })
    .order('start_time', { ascending: true });

  return { data, error };
};
```

## セキュリティと RLS

- **Row Level Security (RLS)**: 全テーブルで有効化済み
- **認証**: Supabase Auth によるロールベース認証
- **アクセス制御**: ユーザーの役割に応じたデータアクセス制限
- **データ保護**: パスワードハッシュ化、セッション管理

## データベース設計の特徴

1. **UUID 主キー**: 全テーブルで UUID（Universally Unique Identifier）を採用
2. **自動タイムスタンプ**: `created_at`と`updated_at`を自動管理
3. **日本語 Enum**: 日本の塾向けシステムのため日本語での状態管理
4. **権限設計**: assignments テーブルの role による細かい機能制限
5. **振替授業管理**: lesson_slots の自己参照による振替関係管理
6. **チャット機能**: 生徒ごとに 1 つのチャットグループを自動作成
7. **週単位管理**: やることリストの週単位での学習計画管理

## TypeScript 型定義の利用

```typescript
// types/database.types.ts として保存推奨
export type Database = {
  public: {
    Tables: {
      students: {
        Row: Students;
        Insert: Omit<Students, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Students, 'id' | 'created_at'>>;
      };
      // 他のテーブルも同様...
    };
  };
};
```

# テストアカウント情報とテストデータ詳細

## テスト用アカウント一覧

### 運営者アカウント

```typescript
// 管理画面ログイン用
const adminAccounts = [
  {
    email: 'admin01@example.com',
    password: '[Supabaseで設定済み]',
    name: '管理 太郎',
    role: '運営者',
    permissions: '全権限',
  },
  {
    email: 'admin02@example.com',
    password: '[Supabaseで設定済み]',
    name: '運営 花子',
    role: '運営者',
    permissions: '全権限',
  },
];
```

### 講師アカウント

```typescript
const teacherAccounts = [
  {
    email: 'teacher01@example.com',
    password: '[Supabaseで設定済み]',
    name: '高橋 誠',
    university: '東京大学 理学部',
    account_status: '有効',
    appeal_points: '算数の図形問題が得意です！一緒に楽しく学びましょう。',
    担当生徒: ['佐藤 一郎'],
  },
  {
    email: 'teacher02@example.com',
    password: '[Supabaseで設定済み]',
    name: '田中 裕子',
    university: '東京大学 文学部',
    account_status: '有効',
    appeal_points: '国語の記述指導に自信があります。読解力を伸ばします。',
    担当生徒: ['佐藤 さくら'],
  },
];
```

### 生徒・保護者アカウント

```typescript
const studentAccounts = [
  {
    student_name: '佐藤 一郎',
    furigana: 'サトウ イチロウ',
    grade: '小学6年生',
    school: 'SAPIX',
    parent_name: '佐藤 京子',
    parent_email: '[モバイルアプリ用]',
    enrollment_date: '2023-04-01',
    notes: '算数が得意。国語の読解に課題あり。',
  },
  {
    student_name: '佐藤 さくら',
    furigana: 'サトウ サクラ',
    grade: '小学5年生',
    school: '日能研',
    parent_name: '佐藤 京子',
    parent_email: '[モバイルアプリ用]',
    enrollment_date: '2024-02-01',
    notes: '国語が得意。算数の応用問題に課題あり。',
  },
  {
    student_name: 'テスト 太郎',
    grade: '未設定',
    parent_name: 'テスト 花子',
    enrollment_date: '2025-06-05',
    notes: '新規登録テスト用',
  },
];
```

## サンプル授業スケジュール

### 現在登録されている授業コマ

```typescript
const lessonSchedule = [
  {
    date: '2025-06-02(月)',
    time: '17:00-18:00',
    student: '佐藤 一郎',
    teacher: '高橋 誠',
    type: '通常授業',
    status: '予定通り',
    meet_link: 'https://meet.google.com/taro-lesson-mon',
  },
  {
    date: '2025-06-03(火)',
    time: '16:00-17:00',
    student: '佐藤 さくら',
    teacher: '田中 裕子',
    type: '通常授業',
    status: '欠席',
    meet_link: 'https://meet.google.com/hanako-lesson-tue',
    note: '振替授業が6/5に設定済み',
  },
  {
    date: '2025-06-04(水)',
    time: '19:00-19:30',
    student: '佐藤 一郎',
    teacher: '高橋 誠',
    type: '固定面談',
    status: '実施済み',
    meet_link: 'https://meet.google.com/taro-meeting-wed',
  },
  {
    date: '2025-06-05(木)',
    time: '16:00-17:00',
    student: '佐藤 さくら',
    teacher: '田中 裕子',
    type: '振替授業',
    status: '予定通り',
    meet_link: 'https://meet.google.com/hanako-reschedule-thu',
    original_lesson: '6/3の欠席授業の振替',
  },
];
```

## サンプルやることリスト

### 佐藤一郎の週間やることリスト（例）

```typescript
const todoListSample = {
  student: '佐藤 一郎',
  week: '2025年6月2日〜6月8日',
  status: '公開済み',
  tasks: [
    {
      date: '6/2(月)',
      content: '四科のまとめ 算数 P.45-48',
      completed: true,
    },
    {
      date: '6/2(月)',
      content: '漢字練習帳 10ページ',
      completed: true,
    },
    {
      date: '6/3(火)',
      content: '理科メモリーチェック 第3章',
      completed: false,
    },
    {
      date: '6/4(水)',
      content: '算数 過去問1年分',
      completed: false,
    },
  ],
  teacher_comments: [
    {
      date: '6/2(月)',
      teacher: '高橋 誠',
      comment:
        '算数の図形問題、よく理解できていますね！この調子で頑張りましょう。',
    },
  ],
};
```

## 開発・テスト環境セットアップ

### 環境変数設定

```bash
# .env.local (開発環境用)
NEXT_PUBLIC_SUPABASE_URL=https://nhsuhxifnmvnxtcndihm.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oc3VoeGlmbm12bnh0Y25kaWhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxMDE3OTUsImV4cCI6MjA2NDY3Nzc5NX0.B0fUGEtSQIeFtVMWyXdLm47LyhR7br01sMLBg43ENwo

# Flutter環境用
SUPABASE_URL=https://nhsuhxifnmvnxtcndihm.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oc3VoeGlmbm12bnh0Y25kaWhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxMDE3OTUsImV4cCI6MjA2NDY3Nzc5NX0.B0fUGEtSQIeFtVMWyXdLm47LyhR7br01sMLBg43ENwo
```

### データベース接続テスト

```typescript
// 接続テスト用コード
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://nhsuhxifnmvnxtcndihm.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oc3VoeGlmbm12bnh0Y25kaWhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxMDE3OTUsImV4cCI6MjA2NDY3Nzc5NX0.B0fUGEtSQIeFtVMWyXdLm47LyhR7br01sMLBg43ENwo'
);

// 接続確認
async function testConnection() {
  const { data, error } = await supabase
    .from('students')
    .select('full_name')
    .limit(1);

  if (error) {
    console.error('接続エラー:', error);
  } else {
    console.log('接続成功:', data);
  }
}
```

## 開発時の注意事項とベストプラクティス

### 1. 権限管理テスト項目

- [ ] 面談担当講師はやることリスト編集が可能
- [ ] 授業担当講師はコメントのみ可能
- [ ] 生徒・保護者は自分の情報のみアクセス可能
- [ ] 運営者は全データアクセス可能

### 2. データ整合性チェック

- [ ] 振替授業の元授業参照が正しく設定されている
- [ ] 生徒ごとにチャットグループが 1 つだけ存在
- [ ] やることリストと子タスクの関係が正しい
- [ ] 担当割り当ての有効期間が適切

### 3. セキュリティチェック項目

- [ ] RLS ポリシーがすべてのテーブルで有効
- [ ] 認証なしでアクセスできない
- [ ] ユーザーは自分に関連するデータのみアクセス可能
- [ ] 管理者権限の適切な分離

### 4. パフォーマンステスト

- [ ] 大量データでの表示速度
- [ ] リアルタイム更新の動作確認
- [ ] モバイルでのデータ読み込み速度
