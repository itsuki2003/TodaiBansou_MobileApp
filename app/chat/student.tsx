import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import ChatRoom from '@/components/chat/ChatRoom';

export default function StudentChatScreen() {
  const router = useRouter();
  const { user, userRole, userRoleLoading, selectedStudent } = useAuth();
  const [chatGroupId, setChatGroupId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userRoleLoading && user && userRole === 'parent' && selectedStudent) {
      fetchStudentChatGroup();
    } else if (!userRoleLoading && (!user || userRole !== 'student')) {
      router.replace('/');
    }
  }, [user, userRole, userRoleLoading, selectedStudent]);

  const fetchStudentChatGroup = async () => {
    if (!user || userRole !== 'student' || !selectedStudent) return;

    try {
      setLoading(true);
      setError(null);

      // 生徒のチャットグループを取得
      const { data, error: queryError } = await supabase
        .from('chat_groups')
        .select('id')
        .eq('student_id', selectedStudent.id)
        .single();

      if (queryError) {
        if (queryError.code === 'PGRST116') {
          setError('チャットグループが見つかりません');
          return;
        }
        throw queryError;
      }

      if (data) {
        setChatGroupId(data.id);
      } else {
        setError('チャットグループが見つかりません');
      }
    } catch (err) {
      // エラーはsetErrorでハンドリング
      setError('チャットグループの取得に失敗しました');
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

  if (error || !chatGroupId) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error || 'チャットグループが見つかりません'}</Text>
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