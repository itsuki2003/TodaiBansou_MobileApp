import React, { useState, useEffect, memo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { X, BarChart3, RefreshCw, Trash2 } from 'lucide-react-native';
import { PerformanceMonitor, APICache, useMemoryMonitor } from '@/utils/performanceHelpers';

interface PerformanceDebugPanelProps {
  visible: boolean;
  onClose: () => void;
}

const PerformanceDebugPanel: React.FC<PerformanceDebugPanelProps> = memo(({
  visible,
  onClose
}) => {
  const [metrics, setMetrics] = useState<Record<string, any>>({});
  const [cacheStats, setCacheStats] = useState({ size: 0 });
  const { checkMemory } = useMemoryMonitor();

  const refreshMetrics = () => {
    setMetrics(PerformanceMonitor.getAllMetrics());
    setCacheStats({ size: APICache.getSize() });
    checkMemory();
  };

  const clearMetrics = () => {
    PerformanceMonitor.clear();
    setMetrics({});
  };

  const clearCache = () => {
    APICache.clear();
    setCacheStats({ size: 0 });
  };

  useEffect(() => {
    if (visible) {
      refreshMetrics();
      const interval = setInterval(refreshMetrics, 2000);
      return () => clearInterval(interval);
    }
  }, [visible]);

  if (!__DEV__) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <BarChart3 size={20} color="#3B82F6" />
              <Text style={styles.title}>パフォーマンス監視</Text>
            </View>
            <View style={styles.headerRight}>
              <TouchableOpacity onPress={refreshMetrics} style={styles.iconButton}>
                <RefreshCw size={18} color="#6B7280" />
              </TouchableOpacity>
              <TouchableOpacity onPress={clearMetrics} style={styles.iconButton}>
                <Trash2 size={18} color="#EF4444" />
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={styles.iconButton}>
                <X size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.content}>
            {/* Cache Statistics */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>キャッシュ統計</Text>
              <View style={styles.statGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{cacheStats.size}</Text>
                  <Text style={styles.statLabel}>キャッシュエントリ</Text>
                </View>
                <TouchableOpacity style={styles.clearButton} onPress={clearCache}>
                  <Text style={styles.clearButtonText}>キャッシュクリア</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Performance Metrics */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>パフォーマンス指標</Text>
              {Object.keys(metrics).length === 0 ? (
                <Text style={styles.emptyText}>データがありません</Text>
              ) : (
                Object.entries(metrics).map(([label, data]) => (
                  <View key={label} style={styles.metricItem}>
                    <Text style={styles.metricLabel}>{label}</Text>
                    <View style={styles.metricData}>
                      <View style={styles.metricRow}>
                        <Text style={styles.metricKey}>平均:</Text>
                        <Text style={styles.metricValue}>{data.avg.toFixed(2)}ms</Text>
                      </View>
                      <View style={styles.metricRow}>
                        <Text style={styles.metricKey}>最小:</Text>
                        <Text style={styles.metricValue}>{data.min.toFixed(2)}ms</Text>
                      </View>
                      <View style={styles.metricRow}>
                        <Text style={styles.metricKey}>最大:</Text>
                        <Text style={[
                          styles.metricValue,
                          data.max > 500 && styles.slowMetric
                        ]}>
                          {data.max.toFixed(2)}ms
                        </Text>
                      </View>
                      <View style={styles.metricRow}>
                        <Text style={styles.metricKey}>回数:</Text>
                        <Text style={styles.metricValue}>{data.count}</Text>
                      </View>
                    </View>
                  </View>
                ))
              )}
            </View>

            {/* Memory Usage (if available) */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>メモリ使用量</Text>
              <TouchableOpacity style={styles.memoryButton} onPress={checkMemory}>
                <Text style={styles.memoryButtonText}>メモリチェック</Text>
              </TouchableOpacity>
              <Text style={styles.memoryNote}>
                コンソールでメモリ使用量を確認してください
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
});

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  iconButton: {
    padding: 4,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  statGrid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '600',
    color: '#3B82F6',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  clearButton: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  clearButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    padding: 20,
  },
  metricItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 8,
  },
  metricData: {
    gap: 4,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricKey: {
    fontSize: 12,
    color: '#6B7280',
  },
  metricValue: {
    fontSize: 12,
    color: '#111827',
    fontWeight: '500',
  },
  slowMetric: {
    color: '#EF4444',
  },
  memoryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  memoryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  memoryNote: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

PerformanceDebugPanel.displayName = 'PerformanceDebugPanel';

export default PerformanceDebugPanel;