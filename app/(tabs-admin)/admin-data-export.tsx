import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { router } from 'expo-router';
import {
  Download,
  FileText,
  Database,
  Share2,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Users,
  GraduationCap,
  Calendar,
  BookOpen,
  MessageCircle,
  Bell,
} from 'lucide-react-native';

import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { AdminGuard } from '@/components/common/RoleGuard';
import AppHeader from '@/components/ui/AppHeader';
import { exportData, quickExportStudentData, EXPORT_TABLES, type ExportOptions, type ExportTable } from '@/utils/dataExport';
import { shareFile } from '@/utils/fileUtils';

interface ExportProgress {
  isExporting: boolean;
  progress: number;
  currentStep: string;
}

export default function AdminDataExportScreen() {
  const { administrator } = useAuth();
  const { showNotification } = useNotification();
  
  const [tables, setTables] = useState<ExportTable[]>(EXPORT_TABLES.map(table => ({ ...table })));
  const [exportFormat, setExportFormat] = useState<'csv' | 'json'>('csv');
  const [includeRelations, setIncludeRelations] = useState(true);
  const [exportProgress, setExportProgress] = useState<ExportProgress>({
    isExporting: false,
    progress: 0,
    currentStep: ''
  });
  const [lastExportResult, setLastExportResult] = useState<{
    success: boolean;
    filePath?: string;
    fileSize?: string;
    recordCount?: number;
    error?: string;
  } | null>(null);

  // テーブル選択の切り替え
  const toggleTableSelection = useCallback((tableName: string) => {
    setTables(prev => 
      prev.map(table => 
        table.name === tableName 
          ? { ...table, selected: !table.selected }
          : table
      )
    );
  }, []);

  // 全選択/全解除
  const toggleAllTables = useCallback((selectAll: boolean) => {
    setTables(prev => 
      prev.map(table => ({ ...table, selected: selectAll }))
    );
  }, []);

  // アイコンを取得
  const getTableIcon = (tableName: string) => {
    const iconProps = { size: 20, color: '#6B7280' };
    
    switch (tableName) {
      case 'students': return <Users {...iconProps} />;
      case 'teachers': return <GraduationCap {...iconProps} />;
      case 'assignments': return <Users {...iconProps} />;
      case 'lesson_slots': return <Calendar {...iconProps} />;
      case 'todo_lists':
      case 'tasks': return <BookOpen {...iconProps} />;
      case 'notifications': return <Bell {...iconProps} />;
      case 'chat_messages': return <MessageCircle {...iconProps} />;
      default: return <Database {...iconProps} />;
    }
  };

  // エクスポート実行
  const handleExport = async () => {
    const selectedTables = tables.filter(table => table.selected);
    
    if (selectedTables.length === 0) {
      Alert.alert('エラー', 'エクスポートするデータを選択してください');
      return;
    }

    try {
      setExportProgress({
        isExporting: true,
        progress: 0,
        currentStep: '準備中...'
      });

      const options: ExportOptions = {
        tables: selectedTables,
        format: exportFormat,
        includeRelations,
        onProgress: (progress, currentStep) => {
          setExportProgress({
            isExporting: true,
            progress,
            currentStep
          });
        }
      };

      const result = await exportData(options);
      
      setLastExportResult(result);
      
      if (result.success) {
        showNotification({
          type: 'success',
          title: 'エクスポート完了',
          message: `${result.recordCount}件のデータをエクスポートしました（${result.fileSize}）`,
          autoHide: true,
          duration: 5000,
        });

        // 自動共有オプション
        Alert.alert(
          'エクスポート完了',
          `${result.recordCount}件のデータをエクスポートしました。\nファイルサイズ: ${result.fileSize}`,
          [
            { text: 'OK', style: 'default' },
            {
              text: '共有',
              onPress: () => {
                if (result.filePath) {
                  shareFile(result.filePath, 'データエクスポート');
                }
              }
            }
          ]
        );
      } else {
        Alert.alert('エラー', result.error || 'エクスポートに失敗しました');
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('エラー', 'エクスポート処理中にエラーが発生しました');
      setLastExportResult({
        success: false,
        error: 'エクスポート処理中にエラーが発生しました'
      });
    } finally {
      setExportProgress({
        isExporting: false,
        progress: 100,
        currentStep: '完了'
      });
    }
  };

  // クイックエクスポート（生徒・講師・授業データ）
  const handleQuickExport = async () => {
    try {
      setExportProgress({
        isExporting: true,
        progress: 0,
        currentStep: 'クイックエクスポートを準備中...'
      });

      const result = await quickExportStudentData((progress, currentStep) => {
        setExportProgress({
          isExporting: true,
          progress,
          currentStep
        });
      });

      setLastExportResult(result);

      if (result.success) {
        showNotification({
          type: 'success',
          title: 'クイックエクスポート完了',
          message: `主要データ（${result.recordCount}件）をエクスポートしました`,
          autoHide: true,
        });

        Alert.alert(
          'クイックエクスポート完了',
          `主要データ（${result.recordCount}件）をエクスポートしました。`,
          [
            { text: 'OK' },
            {
              text: '共有',
              onPress: () => {
                if (result.filePath) {
                  shareFile(result.filePath, 'データエクスポート（クイック）');
                }
              }
            }
          ]
        );
      } else {
        Alert.alert('エラー', result.error || 'クイックエクスポートに失敗しました');
      }
    } catch (error) {
      console.error('Quick export error:', error);
      Alert.alert('エラー', 'クイックエクスポート処理中にエラーが発生しました');
    } finally {
      setExportProgress({
        isExporting: false,
        progress: 100,
        currentStep: '完了'
      });
    }
  };

  // ファイル共有
  const handleShareLastExport = () => {
    if (lastExportResult?.filePath) {
      shareFile(lastExportResult.filePath, 'データエクスポート');
    }
  };

  const selectedCount = tables.filter(table => table.selected).length;

  return (
    <AdminGuard>
      <SafeAreaView style={styles.container}>
        <AppHeader 
          title="データエクスポート" 
          showBackButton 
          onBackPress={() => router.back()}
        />

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* クイックエクスポート */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>クイックエクスポート</Text>
            <Text style={styles.sectionDescription}>
              よく使う主要データ（生徒・講師・授業）を一括エクスポート
            </Text>
            
            <TouchableOpacity
              style={[styles.quickExportButton, exportProgress.isExporting && styles.buttonDisabled]}
              onPress={handleQuickExport}
              disabled={exportProgress.isExporting}
            >
              <Download size={20} color="#FFFFFF" />
              <Text style={styles.quickExportButtonText}>クイックエクスポート</Text>
            </TouchableOpacity>
          </View>

          {/* 詳細エクスポート設定 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>詳細エクスポート設定</Text>
            
            {/* テーブル選択 */}
            <View style={styles.subsection}>
              <View style={styles.subsectionHeader}>
                <Text style={styles.subsectionTitle}>エクスポートデータ選択</Text>
                <View style={styles.tableControls}>
                  <TouchableOpacity 
                    onPress={() => toggleAllTables(true)}
                    style={styles.controlButton}
                  >
                    <Text style={styles.controlButtonText}>全選択</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    onPress={() => toggleAllTables(false)}
                    style={styles.controlButton}
                  >
                    <Text style={styles.controlButtonText}>全解除</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {tables.map((table) => (
                <TouchableOpacity
                  key={table.name}
                  style={styles.tableItem}
                  onPress={() => toggleTableSelection(table.name)}
                >
                  <View style={styles.tableInfo}>
                    {getTableIcon(table.name)}
                    <View style={styles.tableTextContainer}>
                      <Text style={styles.tableName}>{table.displayName}</Text>
                      <Text style={styles.tableDescription}>
                        {table.name}テーブル
                      </Text>
                    </View>
                  </View>
                  <View style={[
                    styles.checkbox,
                    table.selected && styles.checkboxSelected
                  ]}>
                    {table.selected && <CheckCircle2 size={20} color="#FFFFFF" />}
                  </View>
                </TouchableOpacity>
              ))}
            </View>

            {/* フォーマット選択 */}
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>エクスポート形式</Text>
              
              <View style={styles.formatOptions}>
                <TouchableOpacity
                  style={[
                    styles.formatOption,
                    exportFormat === 'csv' && styles.formatOptionSelected
                  ]}
                  onPress={() => setExportFormat('csv')}
                >
                  <FileText size={20} color={exportFormat === 'csv' ? '#FFFFFF' : '#6B7280'} />
                  <Text style={[
                    styles.formatOptionText,
                    exportFormat === 'csv' && styles.formatOptionTextSelected
                  ]}>
                    CSV形式
                  </Text>
                  <Text style={[
                    styles.formatDescription,
                    exportFormat === 'csv' && styles.formatDescriptionSelected
                  ]}>
                    Excel等で開ける
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.formatOption,
                    exportFormat === 'json' && styles.formatOptionSelected
                  ]}
                  onPress={() => setExportFormat('json')}
                >
                  <Database size={20} color={exportFormat === 'json' ? '#FFFFFF' : '#6B7280'} />
                  <Text style={[
                    styles.formatOptionText,
                    exportFormat === 'json' && styles.formatOptionTextSelected
                  ]}>
                    JSON形式
                  </Text>
                  <Text style={[
                    styles.formatDescription,
                    exportFormat === 'json' && styles.formatDescriptionSelected
                  ]}>
                    システム連携用
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* オプション */}
            <View style={styles.subsection}>
              <Text style={styles.subsectionTitle}>エクスポートオプション</Text>
              
              <View style={styles.optionItem}>
                <View style={styles.optionInfo}>
                  <Text style={styles.optionTitle}>関連データを含める</Text>
                  <Text style={styles.optionDescription}>
                    担当割当で生徒・講師情報、授業で参加者情報等を含める
                  </Text>
                </View>
                <Switch
                  value={includeRelations}
                  onValueChange={setIncludeRelations}
                  trackColor={{ false: '#E5E7EB', true: '#FCA5A5' }}
                  thumbColor={includeRelations ? '#DC2626' : '#F3F4F6'}
                />
              </View>
            </View>
          </View>

          {/* エクスポート実行 */}
          <View style={styles.section}>
            <View style={styles.exportSummary}>
              <BarChart3 size={20} color="#DC2626" />
              <Text style={styles.exportSummaryText}>
                {selectedCount}個のデータテーブルを{exportFormat.toUpperCase()}形式でエクスポート
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.exportButton, (exportProgress.isExporting || selectedCount === 0) && styles.buttonDisabled]}
              onPress={handleExport}
              disabled={exportProgress.isExporting || selectedCount === 0}
            >
              {exportProgress.isExporting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Download size={20} color="#FFFFFF" />
              )}
              <Text style={styles.exportButtonText}>
                {exportProgress.isExporting ? 'エクスポート中...' : 'エクスポート開始'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 進行状況 */}
          {exportProgress.isExporting && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>エクスポート進行状況</Text>
              
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill,
                      { width: `${exportProgress.progress}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>
                  {Math.round(exportProgress.progress)}%
                </Text>
              </View>
              
              <Text style={styles.progressStep}>
                {exportProgress.currentStep}
              </Text>
            </View>
          )}

          {/* 最新のエクスポート結果 */}
          {lastExportResult && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>最新のエクスポート結果</Text>
              
              <View style={[
                styles.resultContainer,
                lastExportResult.success ? styles.resultSuccess : styles.resultError
              ]}>
                {lastExportResult.success ? (
                  <CheckCircle2 size={20} color="#10B981" />
                ) : (
                  <AlertCircle size={20} color="#EF4444" />
                )}
                
                <View style={styles.resultInfo}>
                  {lastExportResult.success ? (
                    <>
                      <Text style={styles.resultText}>
                        エクスポートが完了しました
                      </Text>
                      <Text style={styles.resultDetails}>
                        {lastExportResult.recordCount}件のデータ（{lastExportResult.fileSize}）
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.resultText}>
                        エクスポートに失敗しました
                      </Text>
                      <Text style={styles.resultDetails}>
                        {lastExportResult.error}
                      </Text>
                    </>
                  )}
                </View>
                
                {lastExportResult.success && lastExportResult.filePath && (
                  <TouchableOpacity
                    style={styles.shareButton}
                    onPress={handleShareLastExport}
                  >
                    <Share2 size={16} color="#DC2626" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </AdminGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  quickExportButton: {
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
  },
  quickExportButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  subsection: {
    marginBottom: 24,
  },
  subsectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  subsectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  tableControls: {
    flexDirection: 'row',
    gap: 8,
  },
  controlButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 6,
  },
  controlButtonText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  tableItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  tableInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tableTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  tableName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  tableDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  formatOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  formatOption: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  formatOptionSelected: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  formatOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginTop: 8,
  },
  formatOptionTextSelected: {
    color: '#FFFFFF',
  },
  formatDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  formatDescriptionSelected: {
    color: '#FCA5A5',
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  optionInfo: {
    flex: 1,
    marginRight: 16,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  optionDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  exportSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  exportSummaryText: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '500',
    flex: 1,
  },
  exportButton: {
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#DC2626',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#DC2626',
    minWidth: 40,
  },
  progressStep: {
    fontSize: 14,
    color: '#6B7280',
  },
  resultContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    gap: 12,
  },
  resultSuccess: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  resultError: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  resultInfo: {
    flex: 1,
  },
  resultText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  resultDetails: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  shareButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
});