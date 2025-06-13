import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import ChatRoom from '@/components/chat/ChatRoom';

export default function ChatGroupScreen() {
  const { chatGroupId } = useLocalSearchParams<{ chatGroupId: string }>();
  const router = useRouter();
  const { user, userRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !chatGroupId) {
      router.replace('/');
      return;
    }

    checkAccess();
  }, [user, chatGroupId]);

  const checkAccess = async () => {
    if (!user) {
      setError('ログインが必要です');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('chat_groups')
        .select('id')
        .eq('id', chatGroupId);

      if (userRole === 'teacher') {
        // 講師の場合、担当している生徒のチャットグループかどうかを確認
        const { data: assignments } = await supabase
          .from('assignments')
          .select('student_id')
          .eq('teacher_id', user.id)
          .eq('status', '有効');

        if (!assignments?.length) {
          throw new Error('アクセス権限がありません');
        }

        const studentIds = assignments.map(a => a.student_id);
        query = query.in('student_id', studentIds);
      } else if (userRole === 'student') {
        // 生徒の場合、自分のチャットグループかどうかを確認
        query = query.eq('student_id', user.id);
      }

      const { data, error: queryError } = await query.single();

      if (queryError || !data) {
        throw new Error('アクセス権限がありません');
      }
    } catch (err) {
      // エラーはsetErrorでハンドリング
      setError(err instanceof Error ? err.message : 'アクセス権限の確認に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return <ChatRoom chatGroupId={chatGroupId} />;
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    textAlign: 'center',
  },
}); 