import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import {
  Database,
  Shield,
  Calendar,
  Share2,
  Download,
  AlertCircle,
  CheckCircle2,
  Clock,
  HardDrive,
  FileArchive,
  RefreshCw,
  History,
} from 'lucide-react-native';

import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { AdminGuard } from '@/components/common/RoleGuard';
import AppHeader from '@/components/ui/AppHeader';
import { 
  createBackup, 
  quickBackup, 
  getBackupHistory, 
  getBackupStats, 
  shareBackup,
  type BackupMetadata 
} from '@/utils/backupManager';
import { formatFileSize } from '@/utils/fileUtils';

interface BackupProgress {
  isRunning: boolean;
  progress: number;
  currentStep: string;
}

interface BackupStats {
  totalBackups: number;
  latestBackup?: string;
  totalDataSize?: string;
}

export default function AdminBackupScreen() {
  const { administrator } = useAuth();
  const { showNotification } = useNotification();
  
  const [backupProgress, setBackupProgress] = useState<BackupProgress>({
    isRunning: false,
    progress: 0,
    currentStep: ''
  });
  const [backupHistory, setBackupHistory] = useState<BackupMetadata[]>([]);
  const [backupStats, setBackupStats] = useState<BackupStats>({
    totalBackups: 0
  });
  const [lastBackupResult, setLastBackupResult] = useState<{
    success: boolean;
    filePath?: string;
    fileSize?: string;
    totalRecords?: number;
    error?: string;
  } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // 初期データ読み込み
  useEffect(() => {
    loadBackupData();
  }, []);

  const loadBackupData = async () => {
    try {
      setLoading(true);
      
      const [history, stats] = await Promise.all([
        getBackupHistory(),
        getBackupStats()
      ]);
      
      setBackupHistory(history);
      setBackupStats(stats);
    } catch (error) {
      console.error('Failed to load backup data:', error);
      showNotification({
        type: 'error',
        title: 'エラー',
        message: 'バックアップ情報の読み込みに失敗しました',
        autoHide: true,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    loadBackupData();
  }, []);

  // クイックバックアップ実行
  const handleQuickBackup = async () => {
    Alert.alert(
      'システムバックアップ',
      'システム全体のデータをバックアップします。\n処理には数分かかる場合があります。',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: 'バックアップ開始',
          onPress: async () => {
            try {
              setBackupProgress({
                isRunning: true,
                progress: 0,
                currentStep: 'バックアップを開始しています...'
              });

              const result = await quickBackup(
                administrator?.id,
                (progress, step) => {
                  setBackupProgress({
                    isRunning: true,
                    progress,
                    currentStep: step
                  });
                }
              );

              setLastBackupResult(result);

              if (result.success) {
                showNotification({
                  type: 'success',
                  title: 'バックアップ完了',
                  message: `${result.totalRecords}件のデータをバックアップしました（${result.fileSize}）`,
                  autoHide: true,
                  duration: 5000,
                });

                // バックアップ完了後に履歴を更新
                await loadBackupData();

                Alert.alert(
                  'バックアップ完了',
                  `システムデータ（${result.totalRecords}件）のバックアップが完了しました。\nファイルサイズ: ${result.fileSize}`,
                  [
                    { text: 'OK' },
                    {
                      text: '共有',
                      onPress: () => {
                        if (result.filePath) {
                          shareBackup(result.filePath);
                        }
                      }
                    }
                  ]
                );
              } else {
                Alert.alert('エラー', result.error || 'バックアップに失敗しました');
              }
            } catch (error) {
              console.error('Backup error:', error);
              Alert.alert('エラー', 'バックアップ処理中にエラーが発生しました');
              setLastBackupResult({
                success: false,
                error: 'バックアップ処理中にエラーが発生しました'
              });
            } finally {
              setBackupProgress({
                isRunning: false,
                progress: 100,
                currentStep: '完了'
              });
            }
          }
        }
      ]
    );
  };

  // カスタムバックアップ（将来実装）
  const handleCustomBackup = () => {
    Alert.alert(
      '機能準備中',
      'カスタムバックアップ機能は今後実装予定です。',
      [{ text: 'OK' }]
    );
  };

  // 最新バックアップの共有
  const handleShareLastBackup = () => {
    if (lastBackupResult?.filePath) {
      shareBackup(lastBackupResult.filePath);
    }
  };

  // 日時フォーマット
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ja-JP', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // バックアップアイテムのレンダリング
  const renderBackupHistoryItem = (backup: BackupMetadata, index: number) => (
    <View key={backup.id} style={styles.historyItem}>
      <View style={styles.historyItemHeader}>
        <View style={styles.historyIconContainer}>
          <FileArchive size={20} color="#6B7280" />
        </View>
        <View style={styles.historyInfo}>
          <Text style={styles.historyDate}>
            {formatDate(backup.createdAt)}
          </Text>
          <Text style={styles.historyDetails}>
            {backup.totalRecords}件のデータ • {backup.fileSize}
          </Text>
        </View>
        <View style={styles.historyBadge}>
          <Text style={styles.historyBadgeText}>
            {index === 0 ? '最新' : `${index + 1}`}
          </Text>
        </View>
      </View>
      
      <View style={styles.historyStats}>
        <Text style={styles.historyStatsText}>
          📊 {Object.keys(backup.tables).length}テーブル含む
        </Text>
        <Text style={styles.historyStatsText}>
          👤 作成者: {backup.createdBy === administrator?.id ? '自分' : '他の管理者'}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <AdminGuard>
        <SafeAreaView style={styles.container}>
          <AppHeader 
            title="システムバックアップ" 
            showBackButton 
            onBackPress={() => router.back()}
          />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#DC2626" />
            <Text style={styles.loadingText}>バックアップ情報を読み込み中...</Text>
          </View>
        </SafeAreaView>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <SafeAreaView style={styles.container}>
        <AppHeader 
          title="システムバックアップ" 
          showBackButton 
          onBackPress={() => router.back()}
        />

        <ScrollView 
          style={styles.content} 
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#DC2626']}
              tintColor="#DC2626"
            />
          }
        >
          {/* システム状況 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>システム状況</Text>
            
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Database size={24} color="#3B82F6" />
                <Text style={styles.statValue}>{backupStats.totalBackups}</Text>
                <Text style={styles.statLabel}>バックアップ数</Text>
              </View>
              
              <View style={styles.statItem}>
                <Calendar size={24} color="#10B981" />
                <Text style={styles.statValue}>
                  {backupStats.latestBackup 
                    ? formatDate(backupStats.latestBackup).split(' ')[0]
                    : '未実行'
                  }
                </Text>
                <Text style={styles.statLabel}>最終バックアップ</Text>
              </View>
              
              <View style={styles.statItem}>
                <HardDrive size={24} color="#F59E0B" />
                <Text style={styles.statValue}>
                  {backupStats.totalDataSize || '不明'}
                </Text>
                <Text style={styles.statLabel}>データサイズ</Text>
              </View>
            </View>
          </View>

          {/* バックアップ実行 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>バックアップ実行</Text>
            <Text style={styles.sectionDescription}>
              システム全体のデータを安全にバックアップします
            </Text>
            
            <TouchableOpacity
              style={[styles.backupButton, backupProgress.isRunning && styles.buttonDisabled]}
              onPress={handleQuickBackup}
              disabled={backupProgress.isRunning}
            >
              {backupProgress.isRunning ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Shield size={20} color="#FFFFFF" />
              )}
              <Text style={styles.backupButtonText}>
                {backupProgress.isRunning ? 'バックアップ実行中...' : 'システムバックアップ開始'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.customBackupButton, backupProgress.isRunning && styles.buttonDisabled]}
              onPress={handleCustomBackup}
              disabled={backupProgress.isRunning}
            >
              <Download size={16} color="#DC2626" />
              <Text style={styles.customBackupButtonText}>カスタムバックアップ</Text>
            </TouchableOpacity>
          </View>

          {/* 進行状況 */}
          {backupProgress.isRunning && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>バックアップ進行状況</Text>
              
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill,
                      { width: `${backupProgress.progress}%` }
                    ]} 
                  />
                </View>
                <Text style={styles.progressText}>
                  {Math.round(backupProgress.progress)}%
                </Text>
              </View>
              
              <Text style={styles.progressStep}>
                {backupProgress.currentStep}
              </Text>
              
              <View style={styles.progressInfo}>
                <RefreshCw size={16} color="#DC2626" />
                <Text style={styles.progressInfoText}>
                  バックアップ処理中です。画面を閉じないでください。
                </Text>
              </View>
            </View>
          )}

          {/* 最新のバックアップ結果 */}
          {lastBackupResult && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>最新のバックアップ結果</Text>
              
              <View style={[
                styles.resultContainer,
                lastBackupResult.success ? styles.resultSuccess : styles.resultError
              ]}>
                {lastBackupResult.success ? (
                  <CheckCircle2 size={20} color="#10B981" />
                ) : (
                  <AlertCircle size={20} color="#EF4444" />
                )}
                
                <View style={styles.resultInfo}>
                  {lastBackupResult.success ? (
                    <>
                      <Text style={styles.resultText}>
                        バックアップが完了しました
                      </Text>
                      <Text style={styles.resultDetails}>
                        {lastBackupResult.totalRecords}件のデータ（{lastBackupResult.fileSize}）
                      </Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.resultText}>
                        バックアップに失敗しました
                      </Text>
                      <Text style={styles.resultDetails}>
                        {lastBackupResult.error}
                      </Text>
                    </>
                  )}
                </View>
                
                {lastBackupResult.success && lastBackupResult.filePath && (
                  <TouchableOpacity
                    style={styles.shareButton}
                    onPress={handleShareLastBackup}
                  >
                    <Share2 size={16} color="#DC2626" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* バックアップ履歴 */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>バックアップ履歴</Text>
              <View style={styles.historyBadgeContainer}>
                <History size={16} color="#6B7280" />
                <Text style={styles.historyCount}>
                  {backupHistory.length}件
                </Text>
              </View>
            </View>
            
            {backupHistory.length === 0 ? (
              <View style={styles.emptyHistory}>
                <FileArchive size={48} color="#9CA3AF" />
                <Text style={styles.emptyHistoryText}>
                  バックアップ履歴がありません
                </Text>
                <Text style={styles.emptyHistorySubtext}>
                  最初のバックアップを実行してください
                </Text>
              </View>
            ) : (
              <View style={styles.historyList}>
                {backupHistory.slice(0, 5).map((backup, index) => 
                  renderBackupHistoryItem(backup, index)
                )}
                
                {backupHistory.length > 5 && (
                  <TouchableOpacity style={styles.viewMoreButton}>
                    <Text style={styles.viewMoreText}>
                      他 {backupHistory.length - 5}件のバックアップを表示
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* 注意事項 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>注意事項</Text>
            <View style={styles.warningContainer}>
              <AlertCircle size={20} color="#F59E0B" />
              <View style={styles.warningContent}>
                <Text style={styles.warningText}>
                  • バックアップには数分かかる場合があります
                </Text>
                <Text style={styles.warningText}>
                  • 定期的なバックアップを推奨します（週1回以上）
                </Text>
                <Text style={styles.warningText}>
                  • バックアップファイルは安全な場所に保存してください
                </Text>
              </View>
            </View>
          </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  backupButton: {
    backgroundColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
    marginBottom: 12,
  },
  backupButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  customBackupButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DC2626',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  customBackupButtonText: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonDisabled: {
    backgroundColor: '#9CA3AF',
    borderColor: '#9CA3AF',
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
    marginBottom: 12,
  },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  progressInfoText: {
    fontSize: 12,
    color: '#DC2626',
    flex: 1,
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
  historyBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyCount: {
    fontSize: 12,
    color: '#6B7280',
  },
  historyList: {
    gap: 12,
  },
  historyItem: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#F9FAFB',
  },
  historyItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyInfo: {
    flex: 1,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
  },
  historyDetails: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  historyBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  historyBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  historyStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  historyStatsText: {
    fontSize: 11,
    color: '#6B7280',
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyHistoryText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 4,
  },
  emptyHistorySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  viewMoreButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  viewMoreText: {
    fontSize: 14,
    color: '#DC2626',
    fontWeight: '500',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  warningContent: {
    flex: 1,
  },
  warningText: {
    fontSize: 12,
    color: '#92400E',
    marginBottom: 4,
  },
});