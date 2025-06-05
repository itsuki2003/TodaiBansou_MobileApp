import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MessageCircle, CircleCheck as CheckCircle2 } from 'lucide-react-native';

interface WeeklyTaskCardProps {
  date: string;
  dayOfWeek: string;
  totalTasks: number;
  completedTasks: number;
  hasComments: boolean;
  onPress: () => void;
  onCommentPress?: () => void;
}

export default function WeeklyTaskCard({
  date,
  dayOfWeek,
  totalTasks,
  completedTasks,
  hasComments,
  onPress,
  onCommentPress,
}: WeeklyTaskCardProps) {
  // Determine if this is the current day
  const isToday = new Date().getDate() === parseInt(date);
  
  return (
    <Pressable
      style={[styles.container, isToday && styles.todayContainer]}
      onPress={onPress}
    >
      <View style={styles.dateSection}>
        <Text style={[styles.day, isToday && styles.todayText]}>{date}</Text>
        <Text style={[styles.dayOfWeek, isToday && styles.todayText]}>
          {dayOfWeek}
        </Text>
      </View>
      
      <View style={styles.content}>
        {totalTasks > 0 ? (
          <View style={styles.taskInfo}>
            <View style={styles.taskCountRow}>
              <Text style={styles.taskCount}>
                {completedTasks}
                <Text style={styles.taskCountOf}> / {totalTasks}</Text>
              </Text>
              <Text style={styles.taskLabel}>クリア！</Text>
            </View>
            
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill,
                  { width: `${(completedTasks / totalTasks) * 100}%` }
                ]} 
              />
            </View>
          </View>
        ) : (
          <Text style={styles.noTasks}>タスクなし</Text>
        )}
        
        {hasComments && (
          <Pressable 
            style={styles.commentIcon}
            onPress={onCommentPress || onPress}
            hitSlop={8}
          >
            <MessageCircle size={18} color="#3B82F6" />
          </Pressable>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  todayContainer: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  dateSection: {
    width: 40,
    alignItems: 'center',
    marginRight: 12,
  },
  day: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
  },
  dayOfWeek: {
    fontSize: 14,
    color: '#64748B',
  },
  todayText: {
    color: '#3B82F6',
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  taskInfo: {
    flex: 1,
  },
  taskCountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  taskCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  taskCountOf: {
    color: '#64748B',
    fontWeight: 'normal',
  },
  taskLabel: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    marginTop: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 2,
  },
  noTasks: {
    fontSize: 14,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  commentIcon: {
    marginLeft: 12,
  },
});