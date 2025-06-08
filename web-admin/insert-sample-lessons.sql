-- サンプル授業データの挿入
-- 佐藤一郎のスケジュール

INSERT INTO lesson_slots (
    id,
    student_id,
    teacher_id,
    slot_type,
    slot_date,
    start_time,
    end_time,
    google_meet_link,
    status,
    notes,
    created_at,
    updated_at
) VALUES 
-- 6月の授業スケジュール
(
    gen_random_uuid(),
    (SELECT id FROM students WHERE full_name = '佐藤 一郎' LIMIT 1),
    (SELECT id FROM teachers WHERE full_name = '高橋 誠' LIMIT 1),
    '通常授業',
    '2025-06-02',  -- 月曜日
    '19:00:00',
    '20:30:00',
    'https://meet.google.com/abc-defg-hij',
    '予定通り',
    '算数：分数の応用問題',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    (SELECT id FROM students WHERE full_name = '佐藤 一郎' LIMIT 1),
    (SELECT id FROM teachers WHERE full_name = '田中 裕子' LIMIT 1),
    '通常授業',
    '2025-06-04',  -- 水曜日
    '18:00:00',
    '19:30:00',
    'https://meet.google.com/xyz-uvwx-yz',
    '予定通り',
    '国語：読解問題演習',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    (SELECT id FROM students WHERE full_name = '佐藤 一郎' LIMIT 1),
    (SELECT id FROM teachers WHERE full_name = '高橋 誠' LIMIT 1),
    '固定面談',
    '2025-06-07',  -- 土曜日
    '10:00:00',
    '11:00:00',
    'https://meet.google.com/weekly-meeting-001',
    '予定通り',
    '週次面談：学習進捗確認',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    (SELECT id FROM students WHERE full_name = '佐藤 一郎' LIMIT 1),
    (SELECT id FROM teachers WHERE full_name = '高橋 誠' LIMIT 1),
    '通常授業',
    '2025-06-09',  -- 月曜日
    '19:00:00',
    '20:30:00',
    'https://meet.google.com/abc-defg-hij',
    '予定通り',
    '算数：図形問題',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    (SELECT id FROM students WHERE full_name = '佐藤 一郎' LIMIT 1),
    (SELECT id FROM teachers WHERE full_name = '田中 裕子' LIMIT 1),
    '通常授業',
    '2025-06-11',  -- 水曜日
    '18:00:00',
    '19:30:00',
    'https://meet.google.com/xyz-uvwx-yz',
    '予定通り',
    '国語：作文練習',
    NOW(),
    NOW()
),
-- 佐藤さくらのスケジュール
(
    gen_random_uuid(),
    (SELECT id FROM students WHERE full_name = '佐藤 さくら' LIMIT 1),
    (SELECT id FROM teachers WHERE full_name = '田中 裕子' LIMIT 1),
    '固定面談',
    '2025-06-05',  -- 木曜日
    '17:00:00',
    '18:00:00',
    'https://meet.google.com/sakura-meeting-001',
    '予定通り',
    '週次面談：小学5年生学習計画',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    (SELECT id FROM students WHERE full_name = '佐藤 さくら' LIMIT 1),
    (SELECT id FROM teachers WHERE full_name = '高橋 誠' LIMIT 1),
    '通常授業',
    '2025-06-06',  -- 金曜日
    '17:30:00',
    '19:00:00',
    'https://meet.google.com/sakura-lesson-001',
    '予定通り',
    '算数：小数の計算',
    NOW(),
    NOW()
);

-- お知らせデータの挿入
INSERT INTO notifications (
    id,
    title,
    content,
    category_id,
    creator_admin_id,
    publish_timestamp,
    status,
    created_at,
    updated_at
) VALUES 
(
    gen_random_uuid(),
    '6月の授業スケジュールについて',
    '6月の授業スケジュールを公開いたします。各生徒の保護者の皆様は、授業予定をご確認ください。

【重要事項】
- 授業開始15分前にはGoogle Meetに入室をお願いします
- 教材の準備をお忘れなく
- 体調不良等で欠席の場合は、前日までにご連絡ください

ご不明な点がございましたら、お気軽にお問い合わせください。',
    (SELECT id FROM notification_categories WHERE name = '授業' LIMIT 1),
    (SELECT id FROM administrators WHERE full_name = '管理 太郎' LIMIT 1),
    NOW(),
    '配信済み',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    'システムメンテナンスのお知らせ',
    '【システムメンテナンス実施のお知らせ】

下記日程でシステムメンテナンスを実施いたします。

■日時：2025年6月15日（日）2:00～6:00
■影響：管理画面へのアクセスができません
■内容：システム性能向上のためのメンテナンス

メンテナンス中はご不便をおかけいたしますが、ご理解のほどよろしくお願いいたします。',
    (SELECT id FROM notification_categories WHERE name = 'システム' LIMIT 1),
    (SELECT id FROM administrators WHERE full_name = '管理 太郎' LIMIT 1),
    NOW(),
    '配信済み',
    '2025-06-01 09:00:00',
    '2025-06-01 09:00:00'
);