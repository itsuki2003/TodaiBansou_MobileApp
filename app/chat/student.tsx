import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import ChatRoom from '@/components/chat/ChatRoom';

export default function StudentChatScreen() {
  const router = useRouter();
  const { user, userRole, userRoleLoading } = useAuth();
  const [chatGroupId, setChatGroupId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userRoleLoading && user && userRole === 'student') {
      fetchStudentChatGroup();
    } else if (!userRoleLoading && (!user || userRole !== 'student')) {
      router.replace('/');
    }
  }, [user, userRole, userRoleLoading]);

  const fetchStudentChatGroup = async () => {
    if (!user || userRole !== 'student') return;

    try {
      setLoading(true);
      setError(null);

      // まず、ユーザーに紐づく生徒IDを取得
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (studentError) {
        if (studentError.code === 'PGRST116') {
          setError('生徒情報が登録されていません。');
        } else {
          throw studentError;
        }
        return;
      }

      // 生徒のチャットグループを取得
      const { data, error: queryError } = await supabase
        .from('chat_groups')
        .select('id')
        .eq('student_id', studentData.id)
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
      console.error('Error fetching student chat group:', err);
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