const { createClient } = require('@supabase/supabase-js');

// Supabase設定
const supabaseUrl = 'https://nhsuhxifnmvnxtcndihm.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5oc3VoeGlmbm12bnh0Y25kaWhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkxMDE3OTUsImV4cCI6MjA2NDY3Nzc5NX0.B0fUGEtSQIeFtVMWyXdLm47LyhR7br01sMLBg43ENwo';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function insertSampleData() {
  try {
    console.log('🚀 サンプルデータの挿入を開始...');

    // 生徒情報を取得
    const { data: students, error: studentsError } = await supabase
      .from('students')
      .select('id, full_name');
    
    if (studentsError) throw studentsError;
    console.log('📚 生徒情報を取得:', students.length, '名');

    // 講師情報を取得
    const { data: teachers, error: teachersError } = await supabase
      .from('teachers')
      .select('id, full_name');
    
    if (teachersError) throw teachersError;
    console.log('👨‍🏫 講師情報を取得:', teachers.length, '名');

    // 佐藤一郎の情報を取得
    const satouIchiro = students.find(s => s.full_name === '佐藤 一郎');
    const satouSakura = students.find(s => s.full_name === '佐藤 さくら');
    const takahashi = teachers.find(t => t.full_name === '高橋 誠');
    const tanaka = teachers.find(t => t.full_name === '田中 裕子');

    if (!satouIchiro || !satouSakura || !takahashi || !tanaka) {
      throw new Error('必要な生徒または講師データが見つかりません');
    }

    // 授業データを挿入
    const lessonSlots = [
      {
        student_id: satouIchiro.id,
        teacher_id: takahashi.id,
        slot_type: '通常授業',
        slot_date: '2025-06-02',
        start_time: '19:00:00',
        end_time: '20:30:00',
        google_meet_link: 'https://meet.google.com/abc-defg-hij',
        status: '予定通り',
        notes: '算数：分数の応用問題'
      },
      {
        student_id: satouIchiro.id,
        teacher_id: tanaka.id,
        slot_type: '通常授業',
        slot_date: '2025-06-04',
        start_time: '18:00:00',
        end_time: '19:30:00',
        google_meet_link: 'https://meet.google.com/xyz-uvwx-yz',
        status: '予定通り',
        notes: '国語：読解問題演習'
      },
      {
        student_id: satouIchiro.id,
        teacher_id: takahashi.id,
        slot_type: '固定面談',
        slot_date: '2025-06-07',
        start_time: '10:00:00',
        end_time: '11:00:00',
        google_meet_link: 'https://meet.google.com/weekly-meeting-001',
        status: '予定通り',
        notes: '週次面談：学習進捗確認'
      },
      {
        student_id: satouSakura.id,
        teacher_id: tanaka.id,
        slot_type: '固定面談',
        slot_date: '2025-06-05',
        start_time: '17:00:00',
        end_time: '18:00:00',
        google_meet_link: 'https://meet.google.com/sakura-meeting-001',
        status: '予定通り',
        notes: '週次面談：小学5年生学習計画'
      }
    ];

    const { data: insertedLessons, error: lessonError } = await supabase
      .from('lesson_slots')
      .insert(lessonSlots)
      .select();

    if (lessonError) throw lessonError;
    console.log('📅 授業データを挿入:', insertedLessons.length, '件');

    // お知らせデータを挿入
    const { data: categories, error: categoryError } = await supabase
      .from('notification_categories')
      .select('id, name');
    
    if (categoryError) throw categoryError;

    const { data: admins, error: adminError } = await supabase
      .from('administrators')
      .select('id, full_name');
    
    if (adminError) throw adminError;

    const systemCategory = categories.find(c => c.name === 'システム');
    const classCategory = categories.find(c => c.name === '授業');
    const admin = admins[0]; // 最初の管理者を使用

    if (systemCategory && classCategory && admin) {
      const notifications = [
        {
          title: '6月の授業スケジュールについて',
          content: '6月の授業スケジュールを公開いたします。各生徒の保護者の皆様は、授業予定をご確認ください。\n\n【重要事項】\n- 授業開始15分前にはGoogle Meetに入室をお願いします\n- 教材の準備をお忘れなく\n- 体調不良等で欠席の場合は、前日までにご連絡ください',
          category_id: classCategory.id,
          creator_admin_id: admin.id,
          publish_timestamp: new Date().toISOString(),
          status: '配信済み'
        },
        {
          title: 'システムメンテナンスのお知らせ',
          content: '【システムメンテナンス実施のお知らせ】\n\n下記日程でシステムメンテナンスを実施いたします。\n\n■日時：2025年6月15日（日）2:00～6:00\n■影響：管理画面へのアクセスができません\n■内容：システム性能向上のためのメンテナンス',
          category_id: systemCategory.id,
          creator_admin_id: admin.id,
          publish_timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1日前
          status: '配信済み'
        }
      ];

      const { data: insertedNotifications, error: notificationError } = await supabase
        .from('notifications')
        .insert(notifications)
        .select();

      if (notificationError) throw notificationError;
      console.log('📢 お知らせデータを挿入:', insertedNotifications.length, '件');
    }

    console.log('✅ サンプルデータの挿入が完了しました！');

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
  }
}

// スクリプト実行
insertSampleData();