import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';

import { DayTasks } from '../../types/weeklyTasks';
import ProgressIndicator from './ProgressIndicator';
import TeacherCommentBadge from './TeacherCommentBadge';
import TaskCompletionAnimation from './TaskCompletionAnimation';

// Android でLayoutAnimationを有効化
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface DayTaskCardProps {
  day: DayTasks;
  onTaskToggle: (taskId: string, isCompleted: boolean) => void;
  onPress: () => void;
  index: number;
}

export default function DayTaskCard({ 
  day, 
  onTaskToggle, 
  onPress, 
  index 
}: DayTaskCardProps) {
  const [animatingTasks, setAnimatingTasks] = useState<Set<string>>(new Set());

  const handleTaskToggle = async (taskId: string, currentlyCompleted: boolean) => {
    const newCompletedState = !currentlyCompleted;
    
    // アニメーション開始
    setAnimatingTasks(prev => new Set(prev).add(taskId));
    
    // レイアウトアニメーション
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    
    try {
      await onTaskToggle(taskId, newCompletedState);
    } finally {
      // アニメーション終了
      setTimeout(() => {
        setAnimatingTasks(prev => {
          const newSet = new Set(prev);
          newSet.delete(taskId);
          return newSet;
        });
      }, 300);
    }
  };

  const getProgressColor = (completionRate: number): 'green' | 'yellow' | 'red' | 'gray' => {
    if (day.tasks.length === 0) return 'gray';
    if (completionRate >= 80) return 'green';
    if (completionRate >= 50) return 'yellow';
    return 'red';
  };

  const getTodayIndicator = () => {
    const today = new Date().toISOString().split('T')[0];
    return day.date === today;
  };

  const isToday = getTodayIndicator();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isToday && styles.containerToday,
        { opacity: index === 0 ? 1 : 0.95 - (index * 0.02) } // 微細なフェード効果
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {/* ヘッダー */}
      <View style={styles.header}>
        <View style={styles.dateContainer}>
          <Text style={[styles.dayOfWeek, isToday && styles.dayOfWeekToday]}>
            {day.dayOfWeek}
          </Text>
          <Text style={[styles.date, isToday && styles.dateToday]}>
            {day.dateDisplay}
          </Text>
          {isToday && <View style={styles.todayIndicator} />}
        </View>

        {/* 進捗とコメントバッジ */}
        <View style={styles.headerRight}>
          {day.hasComments && (
            <TeacherCommentBadge count={day.comments.length} />
          )}
          <ProgressIndicator
            current={day.tasks.filter(t => t.is_completed).length}
            total={day.tasks.length}
            percentage={day.completionRate}
            color={getProgressColor(day.completionRate)}
            size="small"
          />
        </View>
      </View>

      {/* タスク一覧 */}
      <View style={styles.tasksContainer}>
        {day.tasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>
              やることがありません
            </Text>
          </View>
        ) : (
          day.tasks.slice(0, 3).map((task, taskIndex) => (
            <TaskCompletionAnimation
              key={task.id}
              isAnimating={animatingTasks.has(task.id)}
              type={task.is_completed ? 'complete' : 'incomplete'}
            >
              <TouchableOpacity
                style={[
                  styles.taskItem,
                  task.is_completed && styles.taskItemCompleted,
                  taskIndex === day.tasks.length - 1 && styles.taskItemLast,
                ]}
                onPress={() => handleTaskToggle(task.id, task.is_completed)}
                activeOpacity={0.7}
              >
                {/* チェックボックス */}
                <View style={[
                  styles.checkbox,
                  task.is_completed && styles.checkboxCompleted
                ]}>
                  {task.is_completed && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>

                {/* タスク内容 */}
                <Text
                  style={[
                    styles.taskContent,
                    task.is_completed && styles.taskContentCompleted
                  ]}
                  numberOfLines={2}
                >
                  {task.content}
                </Text>
              </TouchableOpacity>
            </TaskCompletionAnimation>
          ))
        )}

        {/* 残りタスク数表示 */}
        {day.tasks.length > 3 && (
          <View style={styles.moreTasksIndicator}>
            <Text style={styles.moreTasksText}>
              他 {day.tasks.length - 3} 件のタスク
            </Text>
          </View>
        )}
      </View>

      {/* 講師コメントプレビュー */}
      {day.comments.length > 0 && (
        <View style={styles.commentPreview}>
          <Text style={styles.commentLabel}>💬 講師コメント</Text>
          <Text
            style={styles.commentText}
            numberOfLines={2}
          >
            {day.comments[0].comment_content}
          </Text>
          {day.comments.length > 1 && (
            <Text style={styles.moreCommentsText}>
              他 {day.comments.length - 1} 件のコメント
            </Text>
          )}
        </View>
      )}

      {/* 進捗バー */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                width: `${day.completionRate}%`,
                backgroundColor: 
                  getProgressColor(day.completionRate) === 'green' ? '#10B981' :
                  getProgressColor(day.completionRate) === 'yellow' ? '#F59E0B' :
                  getProgressColor(day.completionRate) === 'red' ? '#EF4444' :
                  '#9CA3AF',
              },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {day.completionRate}%
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  containerToday: {
    borderWidth: 2,
    borderColor: '#3B82F6',
    shadowOpacity: 0.1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dayOfWeek: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginRight: 8,
  },
  dayOfWeekToday: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  date: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  dateToday: {
    color: '#3B82F6',
    fontWeight: 'bold',
  },
  todayIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3B82F6',
    marginLeft: 8,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tasksContainer: {
    marginBottom: 12,
  },
  emptyState: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  taskItemCompleted: {
    opacity: 0.6,
  },
  taskItemLast: {
    borderBottomWidth: 0,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxCompleted: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  taskContent: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    color: '#374151',
  },
  taskContentCompleted: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  moreTasksIndicator: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  moreTasksText: {
    fontSize: 12,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  commentPreview: {
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  commentLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 4,
  },
  commentText: {
    fontSize: 13,
    lineHeight: 18,
    color: '#1E40AF',
  },
  moreCommentsText: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
    fontStyle: 'italic',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBarBackground: {
    flex: 1,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    minWidth: 32,
    textAlign: 'right',
  },
});