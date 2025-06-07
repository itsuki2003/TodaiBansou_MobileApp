import { AuthUser } from '@/types/auth';
import { TodoPermissions } from '@/types/todoList';

/**
 * ユーザーの役割に基づいてやることリスト管理の権限を取得
 */
export function getTodoPermissions(user: AuthUser | null): TodoPermissions {
  if (!user) {
    return {
      canEditTasks: false,
      canAddTasks: false,
      canDeleteTasks: false,
      canReorderTasks: false,
      canEditComments: false,
      canPublish: false,
    };
  }

  // 管理者は全権限を持つ
  if (user.role === 'admin') {
    return {
      canEditTasks: true,
      canAddTasks: true,
      canDeleteTasks: true,
      canReorderTasks: true,
      canEditComments: true,
      canPublish: true,
    };
  }

  // 講師の場合は、今のところ基本的な権限のみ
  // 将来的に面談担当・授業担当の区別をする場合は、
  // assignments テーブルを確認するロジックをここに追加
  if (user.role === 'teacher') {
    return {
      canEditTasks: true, // 面談担当講師の場合のみtrueにする予定
      canAddTasks: true,  // 面談担当講師の場合のみtrueにする予定
      canDeleteTasks: true, // 面談担当講師の場合のみtrueにする予定
      canReorderTasks: true, // 面談担当講師の場合のみtrueにする予定
      canEditComments: true, // すべての講師がコメント可能
      canPublish: true, // 面談担当講師の場合のみtrueにする予定
    };
  }

  return {
    canEditTasks: false,
    canAddTasks: false,
    canDeleteTasks: false,
    canReorderTasks: false,
    canEditComments: false,
    canPublish: false,
  };
}

/**
 * 特定の生徒に対する講師の権限を取得
 * assignmentsテーブルを確認して面談担当・授業担当を区別する
 */
export async function getTeacherPermissionsForStudent(
  user: AuthUser | null,
  studentId: string
): Promise<TodoPermissions> {
  if (!user) {
    return getTodoPermissions(null);
  }

  // 管理者は常に全権限
  if (user.role === 'admin') {
    return getTodoPermissions(user);
  }

  if (user.role === 'teacher') {
    try {
      // Supabaseクライアントが必要なので、この関数は使用側で実装する
      // ここではプレースホルダとして基本権限を返す
      
      // TODO: assignments テーブルをチェック
      // const { data: assignment } = await supabase
      //   .from('assignments')
      //   .select('role, status')
      //   .eq('teacher_id', user.id)
      //   .eq('student_id', studentId)
      //   .eq('status', '有効')
      //   .single();

      // if (assignment?.role === '面談担当（リスト編集可）') {
      //   return {
      //     canEditTasks: true,
      //     canAddTasks: true,
      //     canDeleteTasks: true,
      //     canReorderTasks: true,
      //     canEditComments: true,
      //     canPublish: true,
      //   };
      // } else if (assignment?.role === '授業担当（コメントのみ）') {
      //   return {
      //     canEditTasks: false,
      //     canAddTasks: false,
      //     canDeleteTasks: false,
      //     canReorderTasks: false,
      //     canEditComments: true,
      //     canPublish: false,
      //   };
      // }

      // 現在は基本的な講師権限を返す
      return getTodoPermissions(user);
    } catch (error) {
      console.error('Error checking teacher assignment:', error);
      // エラー時は安全側に権限を制限
      return {
        canEditTasks: false,
        canAddTasks: false,
        canDeleteTasks: false,
        canReorderTasks: false,
        canEditComments: true, // コメントのみ許可
        canPublish: false,
      };
    }
  }

  return getTodoPermissions(user);
}