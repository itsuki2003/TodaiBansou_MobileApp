import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import AppHeader from '@/components/ui/AppHeader';

type ChatGroup = {
  id: string;
  group_name: string;
  last_message_at: string | null;
  student: {
    id: string;
    full_name: string;
  };
};

export default function ChatGroupList() {
  const router = useRouter();
  const { user, userRole } = useAuth();
  const [chatGroups, setChatGroups] = useState<ChatGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchChatGroups();
  }, [user, userRole]);

  const fetchChatGroups = async () => {
    if (!user || !userRole) return;

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('chat_groups')
        .select(`
          id,
          group_name,
          last_message_at,
          student:students (
            id,
            full_name
          )
        `);

      if (userRole === 'teacher') {
        // 講師の場合、担当している生徒のチャットグループを取得
        const { data: assignments, error: assignmentsError } = await supabase
          .from('assignments')
          .select('student_id')
          .eq('teacher_id', user.id)
          .eq('status', '有効');

        if (assignmentsError) throw assignmentsError;

        const studentIds = assignments.map(a => a.student_id);
        query = query.in('student_id', studentIds);
      } else if (userRole === 'parent') {
        // 生徒の場合、自分のチャットグループを取得
        query = query.eq('student_id', user.id);
      }

      const { data, error: queryError } = await query
        .order('last_message_at', { ascending: false });

      if (queryError) throw queryError;

      setChatGroups(data || []);
    } catch (err) {
      // エラーはsetErrorでハンドリング
      setError('チャットグループの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleChatGroupPress = (chatGroupId: string) => {
    router.push(`/chat/${chatGroupId}`);
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

  if (chatGroups.length === 0) {
    return (
      <View style={styles.centered}>
        <Text style={styles.emptyText}>チャットグループがありません</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="チャット" />
      
      <FlatList
        data={chatGroups}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.chatGroupItem}
            onPress={() => handleChatGroupPress(item.id)}
          >
            <View style={styles.chatGroupInfo}>
              <Text style={styles.studentName}>{item.student.full_name}</Text>
              <Text style={styles.groupName}>{item.group_name}</Text>
            </View>
            {item.last_message_at && (
              <Text style={styles.lastMessageTime}>
                {new Date(item.last_message_at).toLocaleString('ja-JP', {
                  month: 'numeric',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            )}
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
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
  emptyText: {
    color: '#64748B',
    fontSize: 16,
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
  },
  chatGroupItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chatGroupInfo: {
    flex: 1,
    marginRight: 12,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  groupName: {
    fontSize: 14,
    color: '#64748B',
  },
  lastMessageTime: {
    fontSize: 12,
    color: '#94A3B8',
  },
}); 