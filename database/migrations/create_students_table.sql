-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum type for student status
CREATE TYPE student_status AS ENUM ('在籍中', '休会中', '退会済み');

-- Create students table
CREATE TABLE students (
    -- 基本情報
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- 認証・権限
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- 生徒情報
    full_name TEXT NOT NULL CHECK (char_length(full_name) > 0),
    furigana_name TEXT CHECK (char_length(furigana_name) > 0),
    grade TEXT,
    school_attended TEXT,
    enrollment_date DATE NOT NULL,
    status student_status NOT NULL DEFAULT '在籍中',
    
    -- 保護者情報
    parent_name TEXT NOT NULL CHECK (char_length(parent_name) > 0),
    parent_phone_number TEXT,
    
    -- その他
    notes TEXT,

    -- インデックス
    CONSTRAINT students_user_id_idx UNIQUE (user_id)
);

-- テーブルに対するコメント
COMMENT ON TABLE students IS '生徒情報を管理するテーブル';

-- カラムに対するコメント
COMMENT ON COLUMN students.id IS '生徒ID - プライマリキー';
COMMENT ON COLUMN students.created_at IS 'レコード作成日時';
COMMENT ON COLUMN students.updated_at IS 'レコード更新日時';
COMMENT ON COLUMN students.user_id IS '保護者の認証ユーザーID - auth.usersテーブルの外部キー';
COMMENT ON COLUMN students.full_name IS '生徒の氏名';
COMMENT ON COLUMN students.furigana_name IS '生徒の氏名（フリガナ）';
COMMENT ON COLUMN students.grade IS '学年（例: 小学5年生）';
COMMENT ON COLUMN students.school_attended IS '通塾先の学校名';
COMMENT ON COLUMN students.enrollment_date IS '入会日';
COMMENT ON COLUMN students.status IS '在籍状況（在籍中/休会中/退会済み）';
COMMENT ON COLUMN students.parent_name IS '保護者氏名';
COMMENT ON COLUMN students.parent_phone_number IS '保護者の連絡先電話番号';
COMMENT ON COLUMN students.notes IS '特記事項・備考';

-- updated_atを自動更新するトリガー
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON students
    FOR EACH ROW
    EXECUTE FUNCTION trigger_set_updated_at();

-- トリガー関数の作成（まだ存在しない場合）
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Row Level Security (RLS) ポリシーの設定
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

-- 保護者は自分の子供のデータのみ参照可能
CREATE POLICY "Users can view own students" ON students
    FOR SELECT
    USING (auth.uid() = user_id);

-- 保護者は自分の子供のデータのみ更新可能
CREATE POLICY "Users can update own students" ON students
    FOR UPDATE
    USING (auth.uid() = user_id);

-- 保護者は自分の子供のデータのみ削除可能
CREATE POLICY "Users can delete own students" ON students
    FOR DELETE
    USING (auth.uid() = user_id);

-- 保護者は新規生徒を登録可能（user_idが自分のIDと一致する場合のみ）
CREATE POLICY "Users can insert own students" ON students
    FOR INSERT
    WITH CHECK (auth.uid() = user_id); 