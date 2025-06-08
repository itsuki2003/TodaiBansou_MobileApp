-- 東大伴走システム パフォーマンス最適化用インデックス
-- ===================================================

-- 生徒管理画面 高速化用インデックス
-- students テーブルの検索用複合インデックス
CREATE INDEX IF NOT EXISTS idx_students_search_text 
ON students USING gin(to_tsvector('japanese', full_name || ' ' || COALESCE(furigana_name, '')));

-- students テーブルのフィルタリング用インデックス
CREATE INDEX IF NOT EXISTS idx_students_status_grade 
ON students(status, grade) WHERE status != '退会済み';

-- students テーブルの入会日順ソート用
CREATE INDEX IF NOT EXISTS idx_students_enrollment_date 
ON students(enrollment_date DESC, full_name);

-- 担当割り当て管理画面 高速化用インデックス
-- assignments テーブルの生徒別担当検索用
CREATE INDEX IF NOT EXISTS idx_assignments_student_active 
ON assignments(student_id, status, role) WHERE status = '有効';

-- assignments テーブルの講師別担当検索用
CREATE INDEX IF NOT EXISTS idx_assignments_teacher_active 
ON assignments(teacher_id, status, role) WHERE status = '有効';

-- 講師-生徒の関連検索用複合インデックス
CREATE INDEX IF NOT EXISTS idx_assignments_teacher_student_role 
ON assignments(teacher_id, student_id, role, status);

-- スケジュール管理画面 高速化用インデックス
-- lesson_slots テーブルの日付範囲検索用
CREATE INDEX IF NOT EXISTS idx_lesson_slots_date_range 
ON lesson_slots(slot_date, teacher_id, status) WHERE status IN ('予定通り', '実施済み');

-- lesson_slots テーブルの生徒別スケジュール用
CREATE INDEX IF NOT EXISTS idx_lesson_slots_student_schedule 
ON lesson_slots(student_id, slot_date DESC, start_time);

-- lesson_slots テーブルの講師別今後の予定用
CREATE INDEX IF NOT EXISTS idx_lesson_slots_teacher_upcoming 
ON lesson_slots(teacher_id, slot_date, start_time) WHERE slot_date >= CURRENT_DATE;

-- やることリスト管理 高速化用インデックス
-- todo_lists テーブルの生徒・週別検索用
CREATE INDEX IF NOT EXISTS idx_todo_lists_student_week 
ON todo_lists(student_id, target_week_start_date, status);

-- tasks テーブルのやることリスト・日付別検索用
CREATE INDEX IF NOT EXISTS idx_tasks_todo_date 
ON tasks(todo_list_id, target_date, display_order);

-- teacher_comments テーブルのやることリスト・日付別検索用
CREATE INDEX IF NOT EXISTS idx_teacher_comments_todo_date 
ON teacher_comments(todo_list_id, target_date, created_at DESC);

-- お知らせ機能 高速化用インデックス
-- notifications テーブルの公開済み通知用
CREATE INDEX IF NOT EXISTS idx_notifications_published 
ON notifications(publish_timestamp DESC) WHERE status = '配信済み';

-- notifications テーブルのカテゴリ別検索用
CREATE INDEX IF NOT EXISTS idx_notifications_category_published 
ON notifications(category_id, publish_timestamp DESC) WHERE status = '配信済み';

-- チャット機能 高速化用インデックス
-- chat_messages テーブルのグループ別時系列検索用
CREATE INDEX IF NOT EXISTS idx_chat_messages_group_time 
ON chat_messages(chat_group_id, sent_at DESC);

-- chat_groups テーブルの生徒別検索用
CREATE INDEX IF NOT EXISTS idx_chat_groups_student 
ON chat_groups(student_id);

-- 講師管理 高速化用インデックス
-- teachers テーブルの有効講師検索用
CREATE INDEX IF NOT EXISTS idx_teachers_active_search 
ON teachers(account_status, full_name) WHERE account_status = '有効';

-- teachers テーブルのメール検索用
CREATE INDEX IF NOT EXISTS idx_teachers_email 
ON teachers(email);

-- 申請管理 高速化用インデックス
-- absence_requests テーブルの生徒・状況別検索用
CREATE INDEX IF NOT EXISTS idx_absence_requests_student_status 
ON absence_requests(student_id, status, created_at DESC);

-- additional_lesson_requests テーブルの生徒・状況別検索用
CREATE INDEX IF NOT EXISTS idx_additional_lesson_requests_student_status 
ON additional_lesson_requests(student_id, status, created_at DESC);

-- パフォーマンス統計更新
-- 自動統計更新を有効化（PostgreSQL のオートバキューム設定）
ANALYZE students;
ANALYZE assignments;
ANALYZE lesson_slots;
ANALYZE todo_lists;
ANALYZE tasks;
ANALYZE teacher_comments;
ANALYZE notifications;
ANALYZE chat_messages;
ANALYZE teachers;

-- インデックス使用状況確認クエリ（運用時の監視用）
/*
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
*/

-- 今後のメンテナンス用
COMMENT ON INDEX idx_students_search_text IS '生徒名・フリガナ全文検索用（生徒管理画面）';
COMMENT ON INDEX idx_assignments_student_active IS '生徒別有効担当検索用（担当割り当て管理）';
COMMENT ON INDEX idx_lesson_slots_date_range IS 'スケジュール日付範囲検索用（スケジュール管理）';
COMMENT ON INDEX idx_todo_lists_student_week IS 'やることリスト週別検索用（学習管理）';