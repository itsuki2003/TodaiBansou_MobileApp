import { supabase } from '@/lib/supabaseClient';
import { generateCSV, generateJSON, saveFile, shareFile, generateTimestampedFileName, formatFileSize } from './fileUtils';
import type { Database } from '@/types/database.types';

/**
 * データエクスポート機能
 */

export interface ExportOptions {
  tables: ExportTable[];
  format: 'csv' | 'json';
  includeRelations?: boolean;
  onProgress?: (progress: number, currentTable: string) => void;
}

export interface ExportTable {
  name: string;
  displayName: string;
  selected: boolean;
  tableName: keyof Database['public']['Tables'];
  columns?: string[];
}

export interface ExportResult {
  success: boolean;
  filePath?: string;
  fileSize?: string;
  recordCount?: number;
  error?: string;
}

/**
 * 利用可能なエクスポートテーブル定義
 */
export const EXPORT_TABLES: ExportTable[] = [
  {
    name: 'students',
    displayName: '生徒データ',
    selected: true,
    tableName: 'students',
    columns: ['full_name', 'furigana_name', 'grade', 'school_attended', 'enrollment_date', 'status', 'parent_name', 'parent_phone_number', 'notes']
  },
  {
    name: 'teachers',
    displayName: '講師データ',
    selected: true,
    tableName: 'teachers',
    columns: ['full_name', 'furigana_name', 'email', 'phone_number', 'account_status', 'education_background_university', 'education_background_faculty']
  },
  {
    name: 'assignments',
    displayName: '担当割当データ',
    selected: false,
    tableName: 'assignments',
    columns: ['role', 'assignment_start_date', 'assignment_end_date', 'status']
  },
  {
    name: 'lesson_slots',
    displayName: '授業データ',
    selected: true,
    tableName: 'lesson_slots',
    columns: ['slot_type', 'slot_date', 'start_time', 'end_time', 'status', 'google_meet_link']
  },
  {
    name: 'todo_lists',
    displayName: '学習計画データ',
    selected: false,
    tableName: 'todo_lists',
    columns: ['target_week_start_date', 'list_creation_date', 'status']
  },
  {
    name: 'tasks',
    displayName: 'タスクデータ',
    selected: false,
    tableName: 'tasks',
    columns: ['target_date', 'content', 'is_completed', 'display_order']
  },
  {
    name: 'notifications',
    displayName: 'お知らせデータ',
    selected: false,
    tableName: 'notifications',
    columns: ['title', 'content', 'publish_timestamp', 'status']
  },
  {
    name: 'chat_messages',
    displayName: 'チャットデータ',
    selected: false,
    tableName: 'chat_messages',
    columns: ['sender_role', 'content', 'sent_at']
  }
];

/**
 * 単一テーブルのデータを取得
 */
const fetchTableData = async (
  tableName: keyof Database['public']['Tables'],
  columns?: string[]
): Promise<any[]> => {
  try {
    let query = supabase.from(tableName);
    
    if (columns && columns.length > 0) {
      // 指定されたカラムのみ選択
      query = query.select(columns.join(','));
    } else {
      // 全カラム選択
      query = query.select('*');
    }
    
    // ページネーションで大量データに対応
    const allData: any[] = [];
    let page = 0;
    const pageSize = 1000;
    
    while (true) {
      const { data, error } = await query
        .range(page * pageSize, (page + 1) * pageSize - 1)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      if (!data || data.length === 0) break;
      
      allData.push(...data);
      
      // 取得したデータが pageSize より少ない場合は最終ページ
      if (data.length < pageSize) break;
      
      page++;
    }
    
    return allData;
  } catch (error) {
    console.error(`Error fetching ${tableName}:`, error);
    throw new Error(`${tableName}テーブルの取得に失敗しました: ${error}`);
  }
};

/**
 * 関連データを含むテーブルデータを取得
 */
const fetchTableDataWithRelations = async (tableName: string): Promise<any[]> => {
  try {
    switch (tableName) {
      case 'assignments':
        const { data: assignments, error: assignmentsError } = await supabase
          .from('assignments')
          .select(`
            *,
            students (full_name, grade),
            teachers (full_name, email)
          `);
        
        if (assignmentsError) throw assignmentsError;
        return assignments || [];
        
      case 'lesson_slots':
        const { data: lessons, error: lessonsError } = await supabase
          .from('lesson_slots')
          .select(`
            *,
            students (full_name, grade),
            teachers (full_name, email)
          `);
        
        if (lessonsError) throw lessonsError;
        return lessons || [];
        
      case 'tasks':
        const { data: tasks, error: tasksError } = await supabase
          .from('tasks')
          .select(`
            *,
            todo_lists (
              target_week_start_date,
              students (full_name)
            )
          `);
        
        if (tasksError) throw tasksError;
        return tasks || [];
        
      case 'chat_messages':
        const { data: messages, error: messagesError } = await supabase
          .from('chat_messages')
          .select(`
            *,
            chat_groups (
              students (full_name)
            )
          `);
        
        if (messagesError) throw messagesError;
        return messages || [];
        
      default:
        // 関連データなしの通常取得
        return await fetchTableData(tableName as keyof Database['public']['Tables']);
    }
  } catch (error) {
    console.error(`Error fetching ${tableName} with relations:`, error);
    throw error;
  }
};

/**
 * CSVヘッダーを生成
 */
const generateCSVHeaders = (tableName: string, columns?: string[]): string[] => {
  if (columns) return columns;
  
  // デフォルトヘッダー定義
  const defaultHeaders: { [key: string]: string[] } = {
    students: ['生徒氏名', 'フリガナ', '学年', '通塾先', '入会日', '在籍状況', '保護者氏名', '保護者連絡先', '備考'],
    teachers: ['講師氏名', 'フリガナ', 'メールアドレス', '電話番号', 'アカウント状況', '大学', '学部'],
    assignments: ['担当役割', '開始日', '終了日', '状況', '生徒名', '講師名'],
    lesson_slots: ['授業種別', '授業日', '開始時刻', '終了時刻', '状況', '生徒名', '講師名'],
    todo_lists: ['対象週', '作成日', '状況', '生徒名'],
    tasks: ['対象日', 'タスク内容', '完了状況', '表示順序'],
    notifications: ['タイトル', '内容', '公開日時', '配信状況'],
    chat_messages: ['送信者役割', 'メッセージ内容', '送信日時', '生徒名']
  };
  
  return defaultHeaders[tableName] || ['データ'];
};

/**
 * CSVデータを整形
 */
const formatDataForCSV = (data: any[], tableName: string): any[] => {
  return data.map(item => {
    switch (tableName) {
      case 'students':
        return {
          '生徒氏名': item.full_name,
          'フリガナ': item.furigana_name,
          '学年': item.grade,
          '通塾先': item.school_attended,
          '入会日': item.enrollment_date,
          '在籍状況': item.status,
          '保護者氏名': item.parent_name,
          '保護者連絡先': item.parent_phone_number,
          '備考': item.notes
        };
        
      case 'teachers':
        return {
          '講師氏名': item.full_name,
          'フリガナ': item.furigana_name,
          'メールアドレス': item.email,
          '電話番号': item.phone_number,
          'アカウント状況': item.account_status,
          '大学': item.education_background_university,
          '学部': item.education_background_faculty
        };
        
      case 'assignments':
        return {
          '担当役割': item.role,
          '開始日': item.assignment_start_date,
          '終了日': item.assignment_end_date,
          '状況': item.status,
          '生徒名': item.students?.full_name || '',
          '講師名': item.teachers?.full_name || ''
        };
        
      case 'lesson_slots':
        return {
          '授業種別': item.slot_type,
          '授業日': item.slot_date,
          '開始時刻': item.start_time,
          '終了時刻': item.end_time,
          '状況': item.status,
          '生徒名': item.students?.full_name || '',
          '講師名': item.teachers?.full_name || ''
        };
        
      default:
        return item;
    }
  });
};

/**
 * メインエクスポート関数
 */
export const exportData = async (options: ExportOptions): Promise<ExportResult> => {
  try {
    const selectedTables = options.tables.filter(table => table.selected);
    
    if (selectedTables.length === 0) {
      throw new Error('エクスポートするテーブルを選択してください');
    }
    
    const exportData: { [key: string]: any[] } = {};
    let totalRecords = 0;
    
    // 進捗通知
    options.onProgress?.(0, '準備中...');
    
    // 各テーブルのデータを取得
    for (let i = 0; i < selectedTables.length; i++) {
      const table = selectedTables[i];
      
      options.onProgress?.(
        (i / selectedTables.length) * 100,
        `${table.displayName}を処理中...`
      );
      
      try {
        let data: any[];
        
        if (options.includeRelations) {
          data = await fetchTableDataWithRelations(table.name);
        } else {
          data = await fetchTableData(table.tableName, table.columns);
        }
        
        exportData[table.displayName] = data;
        totalRecords += data.length;
        
      } catch (error) {
        console.warn(`Warning: Failed to export ${table.displayName}:`, error);
        exportData[table.displayName] = [];
      }
    }
    
    // ファイル生成
    options.onProgress?.(90, 'ファイルを生成中...');
    
    let content: string;
    let fileName: string;
    
    if (options.format === 'csv') {
      // CSV形式の場合、各テーブルを個別ファイルまたは統合ファイルとして出力
      if (selectedTables.length === 1) {
        const table = selectedTables[0];
        const csvData = formatDataForCSV(exportData[table.displayName], table.name);
        const headers = generateCSVHeaders(table.name, table.columns);
        content = generateCSV(csvData, headers);
        fileName = generateTimestampedFileName(`東大伴走_${table.displayName}`, 'csv');
      } else {
        // 複数テーブルの場合はJSON形式で出力
        content = generateJSON({
          exportDate: new Date().toISOString(),
          totalRecords,
          tables: exportData
        });
        fileName = generateTimestampedFileName('東大伴走_データエクスポート', 'json');
      }
    } else {
      // JSON形式
      content = generateJSON({
        exportDate: new Date().toISOString(),
        totalRecords,
        tables: exportData
      });
      fileName = generateTimestampedFileName('東大伴走_データエクスポート', 'json');
    }
    
    // ファイル保存
    options.onProgress?.(95, 'ファイルを保存中...');
    
    const saveResult = await saveFile(content, fileName);
    
    if (!saveResult.success) {
      throw new Error(saveResult.error || 'ファイルの保存に失敗しました');
    }
    
    options.onProgress?.(100, '完了');
    
    return {
      success: true,
      filePath: saveResult.filePath,
      fileSize: formatFileSize(content.length),
      recordCount: totalRecords
    };
    
  } catch (error) {
    console.error('Export error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'エクスポートに失敗しました'
    };
  }
};

/**
 * クイックエクスポート（よく使う設定）
 */
export const quickExportStudentData = async (
  onProgress?: (progress: number, currentTable: string) => void
): Promise<ExportResult> => {
  const options: ExportOptions = {
    tables: [
      { ...EXPORT_TABLES[0], selected: true }, // 生徒データ
      { ...EXPORT_TABLES[1], selected: true }, // 講師データ
      { ...EXPORT_TABLES[3], selected: true }, // 授業データ
    ],
    format: 'csv',
    includeRelations: true,
    onProgress
  };
  
  return await exportData(options);
};