import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

interface TeacherCommentBadgeProps {
  count: number;
  size?: 'small' | 'medium';
}

export default function TeacherCommentBadge({ 
  count, 
  size = 'small' 
}: TeacherCommentBadgeProps) {
  
  if (count === 0) return null;

  const isSmall = size === 'small';

  return (
    <View style={[
      styles.container,
      isSmall ? styles.containerSmall : styles.containerMedium
    ]}>
      <Text style={styles.emoji}>💬</Text>
      <Text style={[
        styles.count,
        isSmall ? styles.countSmall : styles.countMedium
      ]}>
        {count}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  containerSmall: {
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  containerMedium: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  emoji: {
    fontSize: 10,
    marginRight: 2,
  },
  count: {
    fontWeight: '600',
    color: '#1E40AF',
  },
  countSmall: {
    fontSize: 10,
  },
  countMedium: {
    fontSize: 12,
  },
});