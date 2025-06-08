import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { TodoListResponse, WeekData, TodoPermissions } from '@/types/todoList';
import { format, startOfWeek, addDays } from 'date-fns';
import { ja } from 'date-fns/locale';

export async function GET(
  request: NextRequest,
  { params }: { params: { studentId: string; weekStart: string } }
) {
  try {
    const { studentId, weekStart } = params;
    
    console.log('🔷 やることリスト取得開始:', { studentId, weekStart });

    // 週の開始日を検証（月曜日である必要がある）
    const weekStartDate = new Date(weekStart);
    const mondayDate = startOfWeek(weekStartDate, { weekStartsOn: 1 });
    const formattedWeekStart = format(mondayDate, 'yyyy-MM-dd');

    // 生徒情報の取得
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('id, full_name, furigana_name, grade, status')
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      return NextResponse.json<TodoListResponse>(
        { success: false, error: '生徒が見つかりません' },
        { status: 404 }
      );
    }

    // やることリストの取得
    const { data: todoList, error: todoListError } = await supabaseAdmin
      .from('todo_lists')
      .select('*')
      .eq('student_id', studentId)
      .eq('target_week_start_date', formattedWeekStart)
      .maybeSingle();

    if (todoListError) {
      console.error('🔷 やることリスト取得エラー:', todoListError);
      return NextResponse.json<TodoListResponse>(
        { success: false, error: 'やることリストの取得に失敗しました' },
        { status: 500 }
      );
    }

    let tasks: any[] = [];
    let comments: any[] = [];

    // やることリストが存在する場合、タスクとコメントを取得
    if (todoList) {
      // タスクの取得
      const { data: tasksData, error: tasksError } = await supabaseAdmin
        .from('tasks')
        .select('*')
        .eq('todo_list_id', todoList.id)
        .order('target_date', { ascending: true })
        .order('display_order', { ascending: true });

      if (tasksError) {
        console.error('🔷 タスク取得エラー:', tasksError);
      } else {
        tasks = tasksData || [];
      }

      // コメントの取得
      const { data: commentsData, error: commentsError } = await supabaseAdmin
        .from('teacher_comments')
        .select(`
          *,
          teacher:teachers!teacher_comments_teacher_id_fkey (
            id,
            full_name
          )
        `)
        .eq('todo_list_id', todoList.id)
        .order('target_date', { ascending: true })
        .order('created_at', { ascending: true });

      if (commentsError) {
        console.error('🔷 コメント取得エラー:', commentsError);
      } else {
        comments = commentsData || [];
      }
    }

    // 権限の計算（仮実装 - 後で認証情報から判定）
    const permissions: TodoPermissions = {
      canEditTasks: true,
      canAddTasks: true,
      canDeleteTasks: true,
      canReorderTasks: true,
      canAddComments: true,
      canEditComments: true,
      canPublish: true,
      role: 'admin'
    };

    // 週間データの構築
    const days = Array.from({ length: 7 }, (_, index) => {
      const currentDate = addDays(mondayDate, index);
      const dateString = format(currentDate, 'yyyy-MM-dd');
      const dayOfWeek = format(currentDate, 'E', { locale: ja });

      return {
        date: dateString,
        dayOfWeek,
        tasks: tasks.filter(task => task.target_date === dateString),
        comments: comments.filter(comment => comment.target_date === dateString)
      };
    });

    const weekData: WeekData = {
      todoList,
      student,
      days,
      weekStartDate: formattedWeekStart,
      permissions
    };

    console.log(`🔷 やることリスト取得成功: ${tasks.length}個のタスク、${comments.length}個のコメント`);

    return NextResponse.json<TodoListResponse>({
      success: true,
      data: weekData
    });

  } catch (error) {
    console.error('🔷 やることリスト取得API全般エラー:', error);
    
    const errorMessage = error instanceof Error ? error.message : '予期しないエラーが発生しました';
    
    return NextResponse.json<TodoListResponse>(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { studentId: string; weekStart: string } }
) {
  try {
    const { studentId, weekStart } = params;
    const body = await request.json();
    
    console.log('🔷 やることリスト作成開始:', { studentId, weekStart, body });

    // 週の開始日を検証（月曜日である必要がある）
    const weekStartDate = new Date(weekStart);
    const mondayDate = startOfWeek(weekStartDate, { weekStartsOn: 1 });
    const formattedWeekStart = format(mondayDate, 'yyyy-MM-dd');

    // 既存のやることリストをチェック
    const { data: existingList } = await supabaseAdmin
      .from('todo_lists')
      .select('id')
      .eq('student_id', studentId)
      .eq('target_week_start_date', formattedWeekStart)
      .maybeSingle();

    if (existingList) {
      return NextResponse.json<TodoListResponse>(
        { success: false, error: 'この週のやることリストは既に存在します' },
        { status: 409 }
      );
    }

    // 新しいやることリストを作成
    const { data: newTodoList, error: createError } = await supabaseAdmin
      .from('todo_lists')
      .insert({
        student_id: studentId,
        target_week_start_date: formattedWeekStart,
        list_creation_date: new Date().toISOString().split('T')[0],
        status: body.status || '下書き',
        notes: body.notes || null
      })
      .select()
      .single();

    if (createError) {
      console.error('🔷 やることリスト作成エラー:', createError);
      return NextResponse.json<TodoListResponse>(
        { success: false, error: 'やることリストの作成に失敗しました' },
        { status: 500 }
      );
    }

    console.log('🔷 やることリスト作成成功:', newTodoList.id);

    return NextResponse.json<TodoListResponse>({
      success: true,
      data: {
        todoList: newTodoList,
        student: null,
        days: [],
        weekStartDate: formattedWeekStart,
        permissions: {
          canEditTasks: true,
          canAddTasks: true,
          canDeleteTasks: true,
          canReorderTasks: true,
          canAddComments: true,
          canEditComments: true,
          canPublish: true,
          role: 'admin'
        }
      }
    });

  } catch (error) {
    console.error('🔷 やることリスト作成API全般エラー:', error);
    
    const errorMessage = error instanceof Error ? error.message : '予期しないエラーが発生しました';
    
    return NextResponse.json<TodoListResponse>(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}