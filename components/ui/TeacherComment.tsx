import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MessageCircle } from 'lucide-react-native';

interface TeacherCommentProps {
  comment: string | null;
  onReadMore?: () => void;
}

export default function TeacherComment({ comment, onReadMore }: TeacherCommentProps) {
  const [expanded, setExpanded] = React.useState(false);
  
  // If no comment exists
  if (!comment) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <MessageCircle size={18} color="#3B82F6" />
          <Text style={styles.title}>せんせいからのコメント</Text>
        </View>
        <Text style={styles.emptyComment}>まだコメントはありません</Text>
      </View>
    );
  }
  
  // Determine if comment is long enough to truncate
  const isLongComment = comment.length > 100;
  const displayComment = isLongComment && !expanded
    ? comment.substring(0, 100) + '...'
    : comment;
  
  const handleReadMore = () => {
    if (onReadMore) {
      onReadMore();
    } else {
      setExpanded(true);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MessageCircle size={18} color="#3B82F6" />
        <Text style={styles.title}>せんせいからのコメント</Text>
      </View>
      <Text style={styles.comment}>{displayComment}</Text>
      
      {isLongComment && !expanded && (
        <Pressable onPress={handleReadMore}>
          <Text style={styles.readMore}>もっと読む</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    marginTop: 24,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginLeft: 6,
  },
  comment: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
  },
  emptyComment: {
    fontSize: 15,
    color: '#94A3B8',
    fontStyle: 'italic',
  },
  readMore: {
    color: '#3B82F6',
    marginTop: 8,
    fontWeight: '500',
  },
});