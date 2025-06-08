/**
 * パフォーマンス監視コンポーネント
 * - リアルタイムパフォーマンス統計
 * - クエリ実行時間の監視
 * - メモリ使用量の追跡
 * - キャッシュヒット率の表示
 */

'use client';

import { useState, useEffect, memo } from 'react';
import { supabaseOptimized } from '@/lib/supabaseOptimized';

interface PerformanceStats {
  averageQueryTime: number;
  slowQueries: Array<{
    query: string;
    duration: number;
    timestamp: Date;
    success: boolean;
  }>;
  successRate: number;
  cacheHitRate: number;
  memoryUsage?: {
    used: number;
    total: number;
    percentage: number;
  };
  renderCount: number;
  lastUpdate: Date;
}

interface PerformanceMonitorProps {
  showDetails?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  compact?: boolean;
}

const PerformanceMonitor = memo<PerformanceMonitorProps>(({
  showDetails = false,
  position = 'bottom-right',
  compact = false,
}) => {
  const [stats, setStats] = useState<PerformanceStats>({
    averageQueryTime: 0,
    slowQueries: [],
    successRate: 1,
    cacheHitRate: 0,
    renderCount: 0,
    lastUpdate: new Date(),
  });
  const [isVisible, setIsVisible] = useState(showDetails);
  const [renderCount, setRenderCount] = useState(0);

  // レンダリング回数をカウント
  useEffect(() => {
    setRenderCount(prev => prev + 1);
  });

  // パフォーマンス統計の更新
  useEffect(() => {
    const updateStats = () => {
      try {
        const supabaseStats = supabaseOptimized.getPerformanceStats();
        
        // メモリ使用量の取得（ブラウザ対応チェック）
        let memoryUsage;
        if ('memory' in performance && (performance as any).memory) {
          const memory = (performance as any).memory;
          memoryUsage = {
            used: Math.round(memory.usedJSHeapSize / 1024 / 1024), // MB
            total: Math.round(memory.totalJSHeapSize / 1024 / 1024), // MB
            percentage: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100),
          };
        }

        setStats({
          ...supabaseStats,
          memoryUsage,
          renderCount,
          lastUpdate: new Date(),
        });
      } catch (error) {
        console.warn('パフォーマンス統計の取得に失敗:', error);
      }
    };

    updateStats();
    const interval = setInterval(updateStats, 5000); // 5秒ごとに更新

    return () => clearInterval(interval);
  }, [renderCount]);

  // 位置スタイルの決定
  const getPositionClasses = () => {
    const baseClasses = 'fixed z-50';
    switch (position) {
      case 'top-left':
        return `${baseClasses} top-4 left-4`;
      case 'top-right':
        return `${baseClasses} top-4 right-4`;
      case 'bottom-left':
        return `${baseClasses} bottom-4 left-4`;
      case 'bottom-right':
      default:
        return `${baseClasses} bottom-4 right-4`;
    }
  };

  // パフォーマンススコアの計算
  const getPerformanceScore = () => {
    const queryScore = stats.averageQueryTime < 500 ? 100 : Math.max(0, 100 - (stats.averageQueryTime - 500) / 10);
    const successScore = stats.successRate * 100;
    const cacheScore = stats.cacheHitRate * 100;
    
    return Math.round((queryScore + successScore + cacheScore) / 3);
  };

  // スコアによる色の決定
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const performanceScore = getPerformanceScore();
  const scoreColorClass = getScoreColor(performanceScore);

  // コンパクト表示
  if (compact) {
    return (
      <div className={getPositionClasses()}>
        <button
          onClick={() => setIsVisible(!isVisible)}
          className={`px-3 py-2 rounded-lg shadow-lg border ${scoreColorClass} font-mono text-sm hover:shadow-xl transition-all`}
          title={`パフォーマンススコア: ${performanceScore}/100`}
        >
          ⚡ {performanceScore}
        </button>
      </div>
    );
  }

  if (!isVisible) {
    return (
      <div className={getPositionClasses()}>
        <button
          onClick={() => setIsVisible(true)}
          className="bg-gray-800 text-white px-3 py-2 rounded-lg shadow-lg hover:bg-gray-700 transition-colors"
        >
          📊 Performance
        </button>
      </div>
    );
  }

  return (
    <div className={getPositionClasses()}>
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 max-w-sm">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <span className="mr-2">📊</span>
            Performance
          </h3>
          <button
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* パフォーマンススコア */}
        <div className="mb-4">
          <div className={`text-center py-3 px-4 rounded-lg ${scoreColorClass}`}>
            <div className="text-2xl font-bold">{performanceScore}</div>
            <div className="text-sm">Performance Score</div>
          </div>
        </div>

        {/* 統計情報 */}
        <div className="space-y-3">
          {/* クエリ平均時間 */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Avg Query Time:</span>
            <span className="text-sm font-mono font-medium">
              {stats.averageQueryTime.toFixed(1)}ms
            </span>
          </div>

          {/* 成功率 */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Success Rate:</span>
            <span className="text-sm font-mono font-medium">
              {(stats.successRate * 100).toFixed(1)}%
            </span>
          </div>

          {/* キャッシュヒット率 */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Cache Hit Rate:</span>
            <span className="text-sm font-mono font-medium">
              {(stats.cacheHitRate * 100).toFixed(1)}%
            </span>
          </div>

          {/* レンダー回数 */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Renders:</span>
            <span className="text-sm font-mono font-medium">
              {stats.renderCount}
            </span>
          </div>

          {/* メモリ使用量 */}
          {stats.memoryUsage && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Memory:</span>
              <span className="text-sm font-mono font-medium">
                {stats.memoryUsage.used}MB ({stats.memoryUsage.percentage}%)
              </span>
            </div>
          )}
        </div>

        {/* 詳細情報（展開可能） */}
        {showDetails && stats.slowQueries.length > 0 && (
          <div className="mt-4 pt-3 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Slow Queries:</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {stats.slowQueries.slice(0, 3).map((query, index) => (
                <div key={index} className="text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600 truncate max-w-32">
                      {query.query}
                    </span>
                    <span className="font-mono text-red-600">
                      {query.duration.toFixed(0)}ms
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 最終更新時刻 */}
        <div className="mt-3 pt-2 border-t border-gray-100">
          <div className="text-xs text-gray-500 text-center">
            Last update: {stats.lastUpdate.toLocaleTimeString()}
          </div>
        </div>

        {/* アクションボタン */}
        <div className="mt-3 flex space-x-2">
          <button
            onClick={() => supabaseOptimized.clearCache()}
            className="flex-1 text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 transition-colors"
          >
            Clear Cache
          </button>
          <button
            onClick={() => window.location.reload()}
            className="flex-1 text-xs bg-gray-50 text-gray-600 px-2 py-1 rounded hover:bg-gray-100 transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
});

PerformanceMonitor.displayName = 'PerformanceMonitor';

export default PerformanceMonitor;