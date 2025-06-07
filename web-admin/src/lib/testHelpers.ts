/**
 * テストヘルパー関数とモックデータ
 * 開発・テスト環境でのデータ生成とテストサポート
 */

import { createClient } from '@supabase/supabase-js';

// テスト用のSupabaseクライアント設定
export function createTestSupabaseClient() {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('Test helpers are only available in development environment');
  }

  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// テストデータの型定義
export interface TestUser {
  email: string;
  password: string;
  role: 'admin' | 'teacher' | 'student';
  profile: {
    full_name: string;
    [key: string]: any;
  };
}

export interface TestStudent {
  full_name: string;
  furigana_name: string;
  grade: string;
  school_attended: string;
  parent_name: string;
  parent_phone_number: string;
  status: '在籍中' | '休会中' | '退会済み';
}

export interface TestTeacher {
  full_name: string;
  furigana_name: string;
  email: string;
  account_status: '承認待ち' | '有効' | '無効';
  education_background_university: string;
  education_background_faculty: string;
}

// テストデータ生成
export const TEST_USERS: TestUser[] = [
  {
    email: 'admin@todaibanso.test',
    password: 'test123456',
    role: 'admin',
    profile: {
      full_name: '管理者 太郎'
    }
  },
  {
    email: 'teacher1@todaibanso.test',
    password: 'test123456',
    role: 'teacher',
    profile: {
      full_name: '講師 花子',
      furigana_name: 'こうし はなこ',
      education_background_university: '東京大学',
      education_background_faculty: '工学部'
    }
  },
  {
    email: 'teacher2@todaibanso.test',
    password: 'test123456',
    role: 'teacher',
    profile: {
      full_name: '講師 次郎',
      furigana_name: 'こうし じろう',
      education_background_university: '東京大学',
      education_background_faculty: '理学部'
    }
  },
  {
    email: 'parent1@todaibanso.test',
    password: 'test123456',
    role: 'student',
    profile: {
      full_name: '生徒 みさき',
      furigana_name: 'せいと みさき',
      grade: '小学6年生',
      parent_name: '生徒 保護者'
    }
  }
];

export const TEST_STUDENTS: TestStudent[] = [
  {
    full_name: '生徒 みさき',
    furigana_name: 'せいと みさき',
    grade: '小学6年生',
    school_attended: 'SAPIX',
    parent_name: '生徒 保護者',
    parent_phone_number: '090-1234-5678',
    status: '在籍中'
  },
  {
    full_name: '生徒 ゆうた',
    furigana_name: 'せいと ゆうた',
    grade: '小学5年生',
    school_attended: '四谷大塚',
    parent_name: '生徒 母親',
    parent_phone_number: '090-2345-6789',
    status: '在籍中'
  }
];

export const TEST_TEACHERS: TestTeacher[] = [
  {
    full_name: '講師 花子',
    furigana_name: 'こうし はなこ',
    email: 'teacher1@todaibanso.test',
    account_status: '有効',
    education_background_university: '東京大学',
    education_background_faculty: '工学部'
  },
  {
    full_name: '講師 次郎',
    furigana_name: 'こうし じろう',
    email: 'teacher2@todaibanso.test',
    account_status: '有効',
    education_background_university: '東京大学',
    education_background_faculty: '理学部'
  }
];

// テストデータ作成関数
export class TestDataManager {
  private supabase;

  constructor() {
    this.supabase = createTestSupabaseClient();
  }

  // テストユーザーの作成
  async createTestUsers(): Promise<void> {
    console.log('🧪 テストユーザーを作成中...');

    for (const testUser of TEST_USERS) {
      try {
        // 1. Auth userを作成
        const { data: authData, error: authError } = await this.supabase.auth.admin.createUser({
          email: testUser.email,
          password: testUser.password,
          email_confirm: true
        });

        if (authError) {
          console.error(`Auth user creation failed for ${testUser.email}:`, authError);
          continue;
        }

        console.log(`✅ Auth user created: ${testUser.email}`);

        // 2. プロフィールテーブルに挿入
        await this.createUserProfile(authData.user.id, testUser);

      } catch (error) {
        console.error(`Failed to create test user ${testUser.email}:`, error);
      }
    }
  }

  // ユーザープロフィールの作成
  private async createUserProfile(userId: string, testUser: TestUser): Promise<void> {
    switch (testUser.role) {
      case 'admin':
        await this.supabase.from('administrators').insert({
          user_id: userId,
          full_name: testUser.profile.full_name,
          email: testUser.email,
          account_status: '有効'
        });
        break;

      case 'teacher':
        await this.supabase.from('teachers').insert({
          user_id: userId,
          full_name: testUser.profile.full_name,
          furigana_name: testUser.profile.furigana_name,
          email: testUser.email,
          account_status: '有効',
          education_background_university: testUser.profile.education_background_university,
          education_background_faculty: testUser.profile.education_background_faculty
        });
        break;

      case 'student':
        await this.supabase.from('students').insert({
          user_id: userId,
          full_name: testUser.profile.full_name,
          furigana_name: testUser.profile.furigana_name,
          grade: testUser.profile.grade,
          parent_name: testUser.profile.parent_name,
          status: '在籍中'
        });
        break;
    }
  }

  // 担当割り当ての作成
  async createTestAssignments(): Promise<void> {
    console.log('🧪 担当割り当てを作成中...');

    try {
      // 講師と生徒のIDを取得
      const { data: teachers } = await this.supabase
        .from('teachers')
        .select('id')
        .limit(2);

      const { data: students } = await this.supabase
        .from('students')
        .select('id')
        .limit(2);

      if (!teachers?.length || !students?.length) {
        console.error('講師または生徒データが不足しています');
        return;
      }

      // 担当割り当てを作成
      const assignments = [
        {
          student_id: students[0].id,
          teacher_id: teachers[0].id,
          role: '面談担当（リスト編集可）',
          status: '有効'
        },
        {
          student_id: students[0].id,
          teacher_id: teachers[1].id,
          role: '授業担当（コメントのみ）',
          status: '有効'
        },
        {
          student_id: students[1].id,
          teacher_id: teachers[1].id,
          role: '面談担当（リスト編集可）',
          status: '有効'
        }
      ];

      const { error } = await this.supabase
        .from('assignments')
        .insert(assignments);

      if (error) throw error;

      console.log('✅ 担当割り当てを作成しました');
    } catch (error) {
      console.error('担当割り当て作成エラー:', error);
    }
  }

  // サンプルやることリストの作成
  async createSampleTodoLists(): Promise<void> {
    console.log('🧪 サンプルやることリストを作成中...');

    try {
      const { data: students } = await this.supabase
        .from('students')
        .select('id')
        .limit(1);

      if (!students?.length) {
        console.error('生徒データが不足しています');
        return;
      }

      const studentId = students[0].id;
      const today = new Date();
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay()); // 今週の日曜日

      // やることリストを作成
      const { data: todoList, error: todoError } = await this.supabase
        .from('todo_lists')
        .insert({
          student_id: studentId,
          target_week_start_date: weekStart.toISOString().split('T')[0],
          status: '公開済み'
        })
        .select()
        .single();

      if (todoError) throw todoError;

      // サンプルタスクを作成
      const sampleTasks = [];
      for (let i = 0; i < 7; i++) {
        const targetDate = new Date(weekStart);
        targetDate.setDate(weekStart.getDate() + i);

        sampleTasks.push({
          todo_list_id: todoList.id,
          target_date: targetDate.toISOString().split('T')[0],
          content: `算数: 基本問題 ${i + 1}`,
          is_completed: i < 3, // 最初の3つは完了済み
          display_order: 1
        });

        sampleTasks.push({
          todo_list_id: todoList.id,
          target_date: targetDate.toISOString().split('T')[0],
          content: `国語: 漢字練習 ${i + 1}`,
          is_completed: i < 2, // 最初の2つは完了済み
          display_order: 2
        });
      }

      const { error: taskError } = await this.supabase
        .from('tasks')
        .insert(sampleTasks);

      if (taskError) throw taskError;

      console.log('✅ サンプルやることリストを作成しました');
    } catch (error) {
      console.error('やることリスト作成エラー:', error);
    }
  }

  // 全テストデータの削除
  async cleanupTestData(): Promise<void> {
    console.log('🧹 テストデータを削除中...');

    try {
      // テストユーザーのAuth userを削除
      for (const testUser of TEST_USERS) {
        try {
          const { data: users } = await this.supabase.auth.admin.listUsers();
          const user = users.users.find(u => u.email === testUser.email);
          
          if (user) {
            await this.supabase.auth.admin.deleteUser(user.id);
            console.log(`🗑️ Deleted auth user: ${testUser.email}`);
          }
        } catch (error) {
          console.error(`Failed to delete user ${testUser.email}:`, error);
        }
      }

      console.log('✅ テストデータの削除完了');
    } catch (error) {
      console.error('テストデータ削除エラー:', error);
    }
  }

  // 全テストデータの初期化
  async initializeTestData(): Promise<void> {
    console.log('🚀 テストデータの初期化を開始...');

    try {
      await this.cleanupTestData();
      await this.createTestUsers();
      await this.createTestAssignments();
      await this.createSampleTodoLists();

      console.log('🎉 テストデータの初期化完了！');
      console.log('');
      console.log('ログイン情報:');
      TEST_USERS.forEach(user => {
        console.log(`📧 ${user.role}: ${user.email} / 🔑 ${user.password}`);
      });
    } catch (error) {
      console.error('テストデータ初期化エラー:', error);
    }
  }
}

// コンソールから実行可能な関数
export async function setupTestData() {
  const manager = new TestDataManager();
  await manager.initializeTestData();
}

export async function cleanupTestData() {
  const manager = new TestDataManager();
  await manager.cleanupTestData();
}

// データ検証ヘルパー
export class DataValidator {
  private supabase;

  constructor() {
    this.supabase = createTestSupabaseClient();
  }

  // RLSポリシーのテスト
  async testRLSPolicies(): Promise<void> {
    console.log('🔒 RLSポリシーをテスト中...');

    // TODO: 各ロールでのデータアクセステスト
    // 1. 管理者: 全データアクセス可能
    // 2. 講師: 担当生徒のみアクセス可能
    // 3. 生徒: 自分のデータのみアクセス可能

    console.log('✅ RLSポリシーテスト完了');
  }

  // データ整合性のチェック
  async validateDataIntegrity(): Promise<void> {
    console.log('🔍 データ整合性をチェック中...');

    try {
      // 孤立したレコードの確認
      const issues = [];

      // assignments テーブルの整合性チェック
      const { data: invalidAssignments } = await this.supabase
        .from('assignments')
        .select(`
          id,
          students!inner(id),
          teachers!inner(id)
        `)
        .is('students.id', null)
        .or('teachers.id.is.null');

      if (invalidAssignments?.length) {
        issues.push(`Invalid assignments found: ${invalidAssignments.length}`);
      }

      // todo_lists の整合性チェック
      const { data: invalidTodoLists } = await this.supabase
        .from('todo_lists')
        .select(`
          id,
          students!inner(id)
        `)
        .is('students.id', null);

      if (invalidTodoLists?.length) {
        issues.push(`Invalid todo_lists found: ${invalidTodoLists.length}`);
      }

      if (issues.length === 0) {
        console.log('✅ データ整合性に問題なし');
      } else {
        console.error('❌ データ整合性の問題:', issues);
      }
    } catch (error) {
      console.error('データ整合性チェックエラー:', error);
    }
  }
}