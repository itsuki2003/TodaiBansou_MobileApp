import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';

export interface TeacherCommentProps {
  content: string;
  createdAt: string;
}

export default function TeacherComment({ content, createdAt }: TeacherCommentProps) {
  const formattedDate = new Date(createdAt).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={styles.container}>
      <Text style={styles.content}>{content}</Text>
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
});