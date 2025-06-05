import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Video, Users } from 'lucide-react-native';

interface ClassScheduleItemProps {
  type: 'lesson' | 'meeting';
  startTime: string;
  endTime: string;
  teacherName: string;
  isAbsent?: boolean;
  isTransferred?: boolean;
  isAdditional?: boolean;
  onPress: () => void;
}

export default function ClassScheduleItem({
  type,
  startTime,
  endTime,
  teacherName,
  isAbsent = false,
  isTransferred = false,
  isAdditional = false,
  onPress,
}: ClassScheduleItemProps) {
  // Determine style based on type and status
  const getBackgroundStyle = () => {
    if (isAbsent) return styles.absentBackground;
    if (isTransferred) return styles.transferredBackground;
    if (isAdditional) return styles.additionalBackground;
    return type === 'lesson' ? styles.lessonBackground : styles.meetingBackground;
  };
  
  // Icon based on type
  const IconComponent = type === 'lesson' ? Video : Users;
  
  return (
    <Pressable 
      style={[styles.container, getBackgroundStyle()]}
      onPress={onPress}
    >
      <View style={styles.timeContainer}>
        <Text style={styles.time}>{startTime} - {endTime}</Text>
      </View>
      
      <View style={styles.content}>
        <View style={styles.typeContainer}>
          <IconComponent size={16} color="#3B82F6" />
          <Text style={styles.type}>
            {type === 'lesson' ? '授業' : '面談'}
            {isTransferred && ' (振替)'}
            {isAdditional && ' (追加)'}
          </Text>
        </View>
        
        <Text style={styles.teacher}>{teacherName}</Text>
        
        {isAbsent && (
          <View style={styles.absentBadge}>
            <Text style={styles.absentText}>欠席</Text>
          </View>
        )}
      </View>
      
      <View style={styles.joinButton}>
        <Text style={styles.joinText}>参加</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    alignItems: 'center',
  },
  lessonBackground: {
    backgroundColor: '#EFF6FF',
  },
  meetingBackground: {
    backgroundColor: '#F0FDF4',
  },
  transferredBackground: {
    backgroundColor: '#FEF3C7',
  },
  additionalBackground: {
    backgroundColor: '#EDE9FE',
  },
  absentBackground: {
    backgroundColor: '#FEE2E2',
    opacity: 0.8,
  },
  timeContainer: {
    marginRight: 12,
  },
  time: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
  },
  content: {
    flex: 1,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  type: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginLeft: 4,
  },
  teacher: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 2,
  },
  absentBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  absentText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  joinButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  joinText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
});