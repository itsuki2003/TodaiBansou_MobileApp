import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

export interface TeacherCommentProps {
  content: string;
  createdAt: string;
  teacherName?: string;
}

export default function TeacherComment({ content, createdAt, teacherName }: TeacherCommentProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  const formattedDate = new Date(createdAt).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // 文字数制限（50文字）
  const maxLength = 50;
  const isLongContent = content.length > maxLength;
  const displayContent = isLongContent && !isExpanded 
    ? content.substring(0, maxLength) + '...' 
    : content;

  return (
    <View style={styles.container}>
      <Text style={styles.content}>{displayContent}</Text>
      {isLongContent && (
        <TouchableOpacity
          style={styles.expandButton}
          onPress={() => setIsExpanded(!isExpanded)}
        >
          <Text style={styles.expandButtonText}>
            {isExpanded ? '閉じる' : 'もっと読む'}
          </Text>
        </TouchableOpacity>
      )}
      <Text style={styles.date}>{formattedDate}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  content: {
    fontSize: 16,
    color: '#1E293B',
    lineHeight: 24,
    marginBottom: 8,
  },
  date: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'right',
  },
  expandButton: {
    alignSelf: 'flex-start',
    marginTop: 8,
    marginBottom: 8,
  },
  expandButtonText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
});