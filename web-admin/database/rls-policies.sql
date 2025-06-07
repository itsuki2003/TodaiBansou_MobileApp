-- 東大伴走アプリケーション Row Level Security (RLS) ポリシー
-- 各ユーザーロールに対する適切なデータアクセス制御を実装

-- =====================================
-- 1. RLS 有効化
-- =====================================

-- 全テーブルでRLSを有効化
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE administrators ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE todo_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE absence_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE additional_lesson_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- =====================================
-- 2. 管理者ポリシー（全データアクセス可能）
-- =====================================

-- 管理者は全データにアクセス可能
CREATE POLICY "管理者は全生徒データ閲覧可能" ON students
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM administrators 
      WHERE user_id = auth.uid() AND account_status = '有効'
    )
  );

CREATE POLICY "管理者は全講師データ閲覧可能" ON teachers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM administrators 
      WHERE user_id = auth.uid() AND account_status = '有効'
    )
  );

CREATE POLICY "管理者は全担当割り当て管理可能" ON assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM administrators 
      WHERE user_id = auth.uid() AND account_status = '有効'
    )
  );

CREATE POLICY "管理者は全やることリスト管理可能" ON todo_lists
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM administrators 
      WHERE user_id = auth.uid() AND account_status = '有効'
    )
  );

CREATE POLICY "管理者は全タスク管理可能" ON tasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM administrators 
      WHERE user_id = auth.uid() AND account_status = '有効'
    )
  );

CREATE POLICY "管理者は全講師コメント管理可能" ON teacher_comments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM administrators 
      WHERE user_id = auth.uid() AND account_status = '有効'
    )
  );

CREATE POLICY "管理者は全授業スケジュール管理可能" ON lesson_slots
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM administrators 
      WHERE user_id = auth.uid() AND account_status = '有効'
    )
  );

CREATE POLICY "管理者は全申請データ管理可能" ON absence_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM administrators 
      WHERE user_id = auth.uid() AND account_status = '有効'
    )
  );

CREATE POLICY "管理者は全追加授業申請管理可能" ON additional_lesson_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM administrators 
      WHERE user_id = auth.uid() AND account_status = '有効'
    )
  );

CREATE POLICY "管理者は全お知らせ管理可能" ON notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM administrators 
      WHERE user_id = auth.uid() AND account_status = '有効'
    )
  );

CREATE POLICY "管理者は全チャット管理可能" ON chat_groups
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM administrators 
      WHERE user_id = auth.uid() AND account_status = '有効'
    )
  );

CREATE POLICY "管理者は全チャットメッセージ管理可能" ON chat_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM administrators 
      WHERE user_id = auth.uid() AND account_status = '有効'
    )
  );

-- =====================================
-- 3. 講師ポリシー（担当生徒のみアクセス可能）
-- =====================================

-- 講師は担当生徒のデータのみ閲覧可能
CREATE POLICY "講師は担当生徒データのみ閲覧可能" ON students
  FOR SELECT USING (
    id IN (
      SELECT a.student_id 
      FROM assignments a
      JOIN teachers t ON t.id = a.teacher_id
      WHERE t.user_id = auth.uid() 
        AND t.account_status = '有効'
        AND a.status = '有効'
    )
  );

-- 講師は自分の情報のみ管理可能
CREATE POLICY "講師は自分の情報のみ更新可能" ON teachers
  FOR ALL USING (user_id = auth.uid() AND account_status = '有効');

-- 講師は自分の担当割り当てのみ閲覧可能
CREATE POLICY "講師は自分の担当割り当てのみ閲覧可能" ON assignments
  FOR SELECT USING (
    teacher_id IN (
      SELECT id FROM teachers 
      WHERE user_id = auth.uid() AND account_status = '有効'
    )
  );

-- 面談担当講師はやることリスト編集可能、授業担当講師は閲覧のみ
CREATE POLICY "面談担当講師はやることリスト編集可能" ON todo_lists
  FOR ALL USING (
    student_id IN (
      SELECT a.student_id 
      FROM assignments a
      JOIN teachers t ON t.id = a.teacher_id
      WHERE t.user_id = auth.uid() 
        AND t.account_status = '有効'
        AND a.status = '有効'
        AND a.role = '面談担当（リスト編集可）'
    )
  );

CREATE POLICY "授業担当講師はやることリスト閲覧可能" ON todo_lists
  FOR SELECT USING (
    student_id IN (
      SELECT a.student_id 
      FROM assignments a
      JOIN teachers t ON t.id = a.teacher_id
      WHERE t.user_id = auth.uid() 
        AND t.account_status = '有効'
        AND a.status = '有効'
        AND a.role = '授業担当（コメントのみ）'
    )
  );

-- 面談担当講師はタスク編集可能、授業担当講師は閲覧のみ
CREATE POLICY "面談担当講師はタスク編集可能" ON tasks
  FOR ALL USING (
    todo_list_id IN (
      SELECT tl.id 
      FROM todo_lists tl
      JOIN assignments a ON a.student_id = tl.student_id
      JOIN teachers t ON t.id = a.teacher_id
      WHERE t.user_id = auth.uid() 
        AND t.account_status = '有効'
        AND a.status = '有効'
        AND a.role = '面談担当（リスト編集可）'
    )
  );

CREATE POLICY "授業担当講師はタスク閲覧可能" ON tasks
  FOR SELECT USING (
    todo_list_id IN (
      SELECT tl.id 
      FROM todo_lists tl
      JOIN assignments a ON a.student_id = tl.student_id
      JOIN teachers t ON t.id = a.teacher_id
      WHERE t.user_id = auth.uid() 
        AND t.account_status = '有効'
        AND a.status = '有効'
        AND a.role = '授業担当（コメントのみ）'
    )
  );

-- 講師は担当生徒のやることリストにコメント可能
CREATE POLICY "講師は担当生徒のやることリストにコメント可能" ON teacher_comments
  FOR ALL USING (
    todo_list_id IN (
      SELECT tl.id 
      FROM todo_lists tl
      JOIN assignments a ON a.student_id = tl.student_id
      JOIN teachers t ON t.id = a.teacher_id
      WHERE t.user_id = auth.uid() 
        AND t.account_status = '有効'
        AND a.status = '有効'
    )
    AND teacher_id IN (
      SELECT id FROM teachers 
      WHERE user_id = auth.uid() AND account_status = '有効'
    )
  );

-- 講師は自分の授業スケジュールのみ管理可能
CREATE POLICY "講師は自分の授業スケジュールのみ管理可能" ON lesson_slots
  FOR ALL USING (
    teacher_id IN (
      SELECT id FROM teachers 
      WHERE user_id = auth.uid() AND account_status = '有効'
    )
  );

-- 講師は担当生徒の申請のみ閲覧可能
CREATE POLICY "講師は担当生徒の欠席申請のみ閲覧可能" ON absence_requests
  FOR SELECT USING (
    student_id IN (
      SELECT a.student_id 
      FROM assignments a
      JOIN teachers t ON t.id = a.teacher_id
      WHERE t.user_id = auth.uid() 
        AND t.account_status = '有効'
        AND a.status = '有効'
    )
  );

CREATE POLICY "講師は担当生徒の追加授業申請のみ閲覧可能" ON additional_lesson_requests
  FOR SELECT USING (
    student_id IN (
      SELECT a.student_id 
      FROM assignments a
      JOIN teachers t ON t.id = a.teacher_id
      WHERE t.user_id = auth.uid() 
        AND t.account_status = '有効'
        AND a.status = '有効'
    )
  );

-- 講師は担当生徒のチャットグループにアクセス可能
CREATE POLICY "講師は担当生徒のチャットグループにアクセス可能" ON chat_groups
  FOR ALL USING (
    student_id IN (
      SELECT a.student_id 
      FROM assignments a
      JOIN teachers t ON t.id = a.teacher_id
      WHERE t.user_id = auth.uid() 
        AND t.account_status = '有効'
        AND a.status = '有効'
    )
  );

CREATE POLICY "講師は担当生徒のチャットメッセージにアクセス可能" ON chat_messages
  FOR ALL USING (
    chat_group_id IN (
      SELECT cg.id 
      FROM chat_groups cg
      JOIN assignments a ON a.student_id = cg.student_id
      JOIN teachers t ON t.id = a.teacher_id
      WHERE t.user_id = auth.uid() 
        AND t.account_status = '有効'
        AND a.status = '有効'
    )
  );

-- =====================================
-- 4. 生徒・保護者ポリシー（自分のデータのみアクセス可能）
-- =====================================

-- 生徒・保護者は自分のデータのみアクセス可能
CREATE POLICY "生徒・保護者は自分のデータのみアクセス可能" ON students
  FOR ALL USING (user_id = auth.uid());

-- 生徒・保護者は自分のやることリストのみ閲覧可能
CREATE POLICY "生徒・保護者は自分のやることリストのみ閲覧可能" ON todo_lists
  FOR SELECT USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

-- 生徒・保護者は自分のタスクの完了状態のみ更新可能
CREATE POLICY "生徒・保護者は自分のタスク完了状態のみ更新可能" ON tasks
  FOR UPDATE USING (
    todo_list_id IN (
      SELECT tl.id 
      FROM todo_lists tl
      JOIN students s ON s.id = tl.student_id
      WHERE s.user_id = auth.uid()
    )
  );

CREATE POLICY "生徒・保護者は自分のタスク閲覧可能" ON tasks
  FOR SELECT USING (
    todo_list_id IN (
      SELECT tl.id 
      FROM todo_lists tl
      JOIN students s ON s.id = tl.student_id
      WHERE s.user_id = auth.uid()
    )
  );

-- 生徒・保護者は自分の講師コメント閲覧可能
CREATE POLICY "生徒・保護者は自分の講師コメント閲覧可能" ON teacher_comments
  FOR SELECT USING (
    todo_list_id IN (
      SELECT tl.id 
      FROM todo_lists tl
      JOIN students s ON s.id = tl.student_id
      WHERE s.user_id = auth.uid()
    )
  );

-- 生徒・保護者は自分の授業スケジュール閲覧可能
CREATE POLICY "生徒・保護者は自分の授業スケジュール閲覧可能" ON lesson_slots
  FOR SELECT USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

-- 生徒・保護者は自分の申請のみ管理可能
CREATE POLICY "生徒・保護者は自分の欠席申請のみ管理可能" ON absence_requests
  FOR ALL USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "生徒・保護者は自分の追加授業申請のみ管理可能" ON additional_lesson_requests
  FOR ALL USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

-- 生徒・保護者は全お知らせ閲覧可能
CREATE POLICY "生徒・保護者は全お知らせ閲覧可能" ON notifications
  FOR SELECT USING (status = '配信済み');

-- 生徒・保護者は自分のチャットグループのみアクセス可能
CREATE POLICY "生徒・保護者は自分のチャットグループのみアクセス可能" ON chat_groups
  FOR ALL USING (
    student_id IN (
      SELECT id FROM students WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "生徒・保護者は自分のチャットメッセージのみアクセス可能" ON chat_messages
  FOR ALL USING (
    chat_group_id IN (
      SELECT cg.id 
      FROM chat_groups cg
      JOIN students s ON s.id = cg.student_id
      WHERE s.user_id = auth.uid()
    )
  );

-- =====================================
-- 5. 管理者テーブルアクセス制御
-- =====================================

-- 管理者は自分の情報のみ管理可能（他の管理者情報は閲覧のみ）
CREATE POLICY "管理者は自分の情報のみ更新可能" ON administrators
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "管理者は全管理者情報閲覧可能" ON administrators
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM administrators 
      WHERE user_id = auth.uid() AND account_status = '有効'
    )
  );

-- =====================================
-- 6. お知らせカテゴリー（管理者のみ管理可能）
-- =====================================

CREATE POLICY "管理者のみお知らせカテゴリー管理可能" ON notification_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM administrators 
      WHERE user_id = auth.uid() AND account_status = '有効'
    )
  );

-- 全ユーザーがお知らせカテゴリー閲覧可能
CREATE POLICY "全ユーザーお知らせカテゴリー閲覧可能" ON notification_categories
  FOR SELECT USING (true);

-- =====================================
-- 7. セキュリティ確認用関数
-- =====================================

-- 現在のユーザーの役割を確認する関数
CREATE OR REPLACE FUNCTION get_current_user_role()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role text;
BEGIN
  -- 管理者チェック
  SELECT 'admin' INTO user_role
  FROM administrators 
  WHERE user_id = auth.uid() AND account_status = '有効'
  LIMIT 1;
  
  IF user_role IS NOT NULL THEN
    RETURN user_role;
  END IF;
  
  -- 講師チェック
  SELECT 'teacher' INTO user_role
  FROM teachers 
  WHERE user_id = auth.uid() AND account_status = '有効'
  LIMIT 1;
  
  IF user_role IS NOT NULL THEN
    RETURN user_role;
  END IF;
  
  -- 生徒チェック
  SELECT 'student' INTO user_role
  FROM students 
  WHERE user_id = auth.uid()
  LIMIT 1;
  
  IF user_role IS NOT NULL THEN
    RETURN user_role;
  END IF;
  
  RETURN 'unauthorized';
END;
$$;