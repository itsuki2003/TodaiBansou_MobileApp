import * as FileSystem from 'expo-file-system';
import { Alert, Platform } from 'react-native';
import * as Linking from 'expo-linking';

/**
 * ファイル操作のユーティリティ関数
 */

export interface FileOperationResult {
  success: boolean;
  filePath?: string;
  error?: string;
}

/**
 * CSV形式の文字列を生成
 */
export const generateCSV = (data: any[], headers: string[]): string => {
  if (!data || data.length === 0) {
    return headers.join(',') + '\n';
  }

  // ヘッダー行
  let csv = headers.join(',') + '\n';

  // データ行
  data.forEach(row => {
    const csvRow = headers.map(header => {
      let value = row[header];
      
      // null/undefined の場合は空文字
      if (value === null || value === undefined) {
        value = '';
      }
      
      // 文字列の場合はエスケープ処理
      if (typeof value === 'string') {
        // カンマ、改行、ダブルクォートが含まれる場合はダブルクォートで囲む
        if (value.includes(',') || value.includes('\n') || value.includes('"')) {
          value = '"' + value.replace(/"/g, '""') + '"';
        }
      }
      
      return value;
    }).join(',');
    
    csv += csvRow + '\n';
  });

  return csv;
};

/**
 * JSON形式の文字列を生成（美しくフォーマット）
 */
export const generateJSON = (data: any): string => {
  return JSON.stringify(data, null, 2);
};

/**
 * ファイルをローカルに保存
 */
export const saveFile = async (
  content: string, 
  fileName: string, 
  mimeType: string = 'text/plain'
): Promise<FileOperationResult> => {
  try {
    // ドキュメントディレクトリにファイルを保存
    const fileUri = FileSystem.documentDirectory + fileName;
    
    await FileSystem.writeAsStringAsync(fileUri, content, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    return {
      success: true,
      filePath: fileUri,
    };
  } catch (error) {
    console.error('File save error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'ファイルの保存に失敗しました',
    };
  }
};

/**
 * ファイルを共有（代替実装）
 */
export const shareFile = async (
  filePath: string, 
  title?: string
): Promise<boolean> => {
  try {
    // ファイルの存在確認
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    if (!fileInfo.exists) {
      Alert.alert('エラー', 'ファイルが見つかりません');
      return false;
    }

    // Expo Sharingが利用できないため、代替手段を提供
    Alert.alert(
      title || 'ファイルを保存しました',
      `ファイルが保存されました:\n${filePath}\n\nファイルマネージャーからアクセスできます。`,
      [
        { text: 'OK' },
        {
          text: 'ファイルの場所を開く',
          onPress: () => {
            // ファイルの保存場所を開く（可能な場合）
            if (Platform.OS === 'ios') {
              Linking.openURL('shareddocuments://');
            } else {
              // Android の場合はファイルマネージャーを開く
              Linking.openURL('content://com.android.externalstorage.documents/');
            }
          }
        }
      ]
    );

    return true;
  } catch (error) {
    console.error('File share error:', error);
    Alert.alert('エラー', 'ファイルの共有に失敗しました');
    return false;
  }
};

/**
 * ファイル拡張子からMIMEタイプを取得
 */
const getMimeType = (filePath: string): string => {
  const extension = filePath.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'csv':
      return 'text/csv';
    case 'json':
      return 'application/json';
    case 'txt':
      return 'text/plain';
    default:
      return 'application/octet-stream';
  }
};

/**
 * ファイル拡張子からUTI（Uniform Type Identifier）を取得
 */
const getUTI = (filePath: string): string => {
  const extension = filePath.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'csv':
      return 'public.comma-separated-values-text';
    case 'json':
      return 'public.json';
    case 'txt':
      return 'public.plain-text';
    default:
      return 'public.data';
  }
};

/**
 * ファイルサイズを人が読める形式で取得
 */
export const getFileSize = async (filePath: string): Promise<string> => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(filePath);
    
    if (fileInfo.exists && 'size' in fileInfo) {
      return formatFileSize(fileInfo.size);
    }
    
    return '不明';
  } catch (error) {
    return '不明';
  }
};

/**
 * バイト数を人が読める形式にフォーマット
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * 安全なファイル名を生成（特殊文字を除去）
 */
export const sanitizeFileName = (fileName: string): string => {
  // 危険な文字を置換
  return fileName
    .replace(/[<>:"/\\|?*]/g, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
};

/**
 * タイムスタンプ付きファイル名を生成
 */
export const generateTimestampedFileName = (
  baseName: string, 
  extension: string
): string => {
  const now = new Date();
  const timestamp = now.toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '_')
    .split('.')[0];
  
  return `${sanitizeFileName(baseName)}_${timestamp}.${extension}`;
};

/**
 * ディレクトリの利用可能容量を確認
 */
export const getAvailableSpace = async (): Promise<number> => {
  try {
    const space = await FileSystem.getFreeDiskStorageAsync();
    return space;
  } catch (error) {
    console.error('Storage check error:', error);
    return 0;
  }
};

/**
 * 容量チェック（推定ファイルサイズと比較）
 */
export const checkStorageSpace = async (estimatedSize: number): Promise<boolean> => {
  const availableSpace = await getAvailableSpace();
  const requiredSpace = estimatedSize * 1.5; // 50%のバッファを確保
  
  return availableSpace > requiredSpace;
};