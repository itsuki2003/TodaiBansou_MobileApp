import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabaseClient';
import { generateJSON, saveFile, shareFile, generateTimestampedFileName, formatFileSize, checkStorageSpace } from './fileUtils';
import type { Database } from '@/types/database.types';

/**
 * システムバックアップ管理機能
 */

export interface BackupOptions {
  includeSystemData?: boolean;
  includeUserContent?: boolean;
  onProgress?: (progress: number, currentStep: string) => void;
}

export interface BackupResult {
  success: boolean;
  filePath?: string;
  fileSize?: string;
  backupId?: string;
  totalRecords?: number;
  error?: string;
}

export interface BackupMetadata {
  id: string;
  version: string;
  createdAt: string;
  createdBy: string;
  totalRecords: number;
  fileSize: string;
  tables: {
    [tableName: string]: {
      recordCount: number;
      lastUpdated?: string;
    };
  };
}

export interface BackupData {
  metadata: BackupMetadata;
  systemInfo: {
    appVersion: string;
    platform: string;
    timestamp: string;
  };
  data: {
    [tableName: string]: any[];
  };
}

/**
 * バックアップ対象テーブル定義
 */
const BACKUP_TABLES = [
  'students',
  'teachers', 
  'administrators',
  'assignments',
  'todo_lists',
  'tasks',
  'lesson_slots',
  'absence_requests',
  'additional_lesson_requests',
  'notifications',
  'notification_categories',
  'chat_groups',
  'chat_messages',
  'teacher_comments'
] as const;

/**
 * システム情報を取得
 */
const getSystemInfo = () => {
  return {
    appVersion: '1.0.0',
    platform: 'React Native',
    timestamp: new Date().toISOString()
  };
};

/**
 * 単一テーブルのデータを取得（バックアップ用）
 */
const fetchTableDataForBackup = async (
  tableName: string,
  onProgress?: (progress: number, step: string) => void
): Promise<{ data: any[]; recordCount: number; lastUpdated?: string }> => {
  try {
    const allData: any[] = [];
    let page = 0;
    const pageSize = 500; // バックアップでは少し小さめのページサイズ
    let lastUpdated: string | undefined;
    
    while (true) {
      const { data, error } = await supabase
        .from(tableName as any)
        .select('*')
        .range(page * pageSize, (page + 1) * pageSize - 1)
        .order('created_at', { ascending: false });
      
      if (error) {
        // テーブルが存在しない場合やアクセス権限がない場合はスキップ
        console.warn(`Skipping table ${tableName}: ${error.message}`);
        return { data: [], recordCount: 0 };
      }
      
      if (!data || data.length === 0) break;
      
      allData.push(...data);
      
      // 最初のレコードの更新日時を記録
      if (page === 0 && data[0]?.updated_at) {
        lastUpdated = data[0].updated_at;
      }
      
      onProgress?.(
        (allData.length / (allData.length + data.length)) * 100,
        `${tableName}: ${allData.length}件取得中...`
      );
      
      if (data.length < pageSize) break;
      page++;
    }
    
    return {
      data: allData,
      recordCount: allData.length,
      lastUpdated
    };
  } catch (error) {
    console.error(`Error backing up table ${tableName}:`, error);
    return { data: [], recordCount: 0 };
  }
};

/**
 * バックアップIDを生成
 */
const generateBackupId = (): string => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substr(2, 5);
  return `backup_${timestamp}_${randomStr}`;
};

/**
 * バックアップメタデータを生成
 */
const createBackupMetadata = (
  backupId: string,
  createdBy: string,
  tableStats: { [tableName: string]: { recordCount: number; lastUpdated?: string } },
  totalRecords: number,
  fileSize: string
): BackupMetadata => {
  return {
    id: backupId,
    version: '1.0.0',
    createdAt: new Date().toISOString(),
    createdBy,
    totalRecords,
    fileSize,
    tables: tableStats
  };
};

/**
 * メインバックアップ関数
 */
export const createBackup = async (
  options: BackupOptions = {},
  adminId?: string
): Promise<BackupResult> => {
  try {
    const backupId = generateBackupId();
    
    options.onProgress?.(0, 'バックアップを開始しています...');
    
    // ストレージ容量をチェック（推定100MBの容量を確保）
    const hasSpace = await checkStorageSpace(100 * 1024 * 1024);
    if (!hasSpace) {
      throw new Error('ストレージ容量が不足しています。空き容量を確保してから再試行してください。');
    }
    
    const backupData: any = {};
    const tableStats: { [tableName: string]: { recordCount: number; lastUpdated?: string } } = {};
    let totalRecords = 0;
    
    // 各テーブルのデータを取得
    for (let i = 0; i < BACKUP_TABLES.length; i++) {
      const tableName = BACKUP_TABLES[i];
      
      options.onProgress?.(
        (i / BACKUP_TABLES.length) * 80, // 80%まではデータ取得
        `${tableName}テーブルをバックアップ中...`
      );
      
      const tableResult = await fetchTableDataForBackup(
        tableName,
        (progress, step) => {
          const overallProgress = ((i / BACKUP_TABLES.length) + (progress / 100 / BACKUP_TABLES.length)) * 80;
          options.onProgress?.(overallProgress, step);
        }
      );
      
      backupData[tableName] = tableResult.data;
      tableStats[tableName] = {
        recordCount: tableResult.recordCount,
        lastUpdated: tableResult.lastUpdated
      };
      totalRecords += tableResult.recordCount;
    }
    
    options.onProgress?.(85, 'バックアップファイルを生成中...');
    
    // バックアップオブジェクトを構築
    const backup: BackupData = {
      metadata: createBackupMetadata(
        backupId,
        adminId || 'unknown',
        tableStats,
        totalRecords,
        '計算中...' // ファイルサイズは後で計算
      ),
      systemInfo: getSystemInfo(),
      data: backupData
    };
    
    // JSON文字列を生成
    const backupContent = generateJSON(backup);
    
    // ファイルサイズを更新
    backup.metadata.fileSize = formatFileSize(backupContent.length);
    const finalBackupContent = generateJSON(backup);
    
    options.onProgress?.(95, 'ファイルを保存中...');
    
    // ファイルを保存
    const fileName = generateTimestampedFileName('東大伴走_システムバックアップ', 'json');
    const saveResult = await saveFile(finalBackupContent, fileName);
    
    if (!saveResult.success) {
      throw new Error(saveResult.error || 'バックアップファイルの保存に失敗しました');
    }
    
    // バックアップ履歴をローカルストレージに保存
    await saveBackupHistory(backup.metadata);
    
    options.onProgress?.(100, 'バックアップ完了');
    
    return {
      success: true,
      filePath: saveResult.filePath,
      fileSize: backup.metadata.fileSize,
      backupId,
      totalRecords
    };
    
  } catch (error) {
    console.error('Backup error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'バックアップに失敗しました'
    };
  }
};

/**
 * バックアップ履歴をローカルストレージに保存
 */
const saveBackupHistory = async (metadata: BackupMetadata): Promise<void> => {
  try {
    const historyKey = '@backup_history';
    const existingHistory = await AsyncStorage.getItem(historyKey);
    
    let history: BackupMetadata[] = [];
    if (existingHistory) {
      history = JSON.parse(existingHistory);
    }
    
    // 新しいバックアップを履歴の先頭に追加
    history.unshift(metadata);
    
    // 履歴は最大10件まで保持
    if (history.length > 10) {
      history = history.slice(0, 10);
    }
    
    await AsyncStorage.setItem(historyKey, JSON.stringify(history));
  } catch (error) {
    console.error('Failed to save backup history:', error);
    // 履歴保存の失敗はバックアップ全体を失敗させない
  }
};

/**
 * バックアップ履歴を取得
 */
export const getBackupHistory = async (): Promise<BackupMetadata[]> => {
  try {
    const historyKey = '@backup_history';
    const history = await AsyncStorage.getItem(historyKey);
    
    if (history) {
      return JSON.parse(history);
    }
    
    return [];
  } catch (error) {
    console.error('Failed to get backup history:', error);
    return [];
  }
};

/**
 * バックアップファイルを共有
 */
export const shareBackup = async (filePath: string): Promise<boolean> => {
  return await shareFile(filePath, 'システムバックアップを共有');
};

/**
 * 最新のバックアップ情報を取得
 */
export const getLatestBackupInfo = async (): Promise<BackupMetadata | null> => {
  const history = await getBackupHistory();
  return history.length > 0 ? history[0] : null;
};

/**
 * バックアップ統計情報を取得
 */
export const getBackupStats = async (): Promise<{
  totalBackups: number;
  latestBackup?: string;
  totalDataSize?: string;
}> => {
  const history = await getBackupHistory();
  
  return {
    totalBackups: history.length,
    latestBackup: history[0]?.createdAt,
    totalDataSize: history[0]?.fileSize
  };
};

/**
 * クイックバックアップ（全データ）
 */
export const quickBackup = async (
  adminId?: string,
  onProgress?: (progress: number, step: string) => void
): Promise<BackupResult> => {
  return await createBackup({
    includeSystemData: true,
    includeUserContent: true,
    onProgress
  }, adminId);
};