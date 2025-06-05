import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import ChatGroupList from '@/components/chat/ChatGroupList';
import { useRouter } from 'expo-router';

export default function ChatScreen() {
  const { user, userRole, userRoleLoading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!userRoleLoading && userRole === 'student' && user) {
      // 生徒の場合は、自分のチャットグループを直接表示
      router.replace('/chat/student');
    }
  }, [userRole, userRoleLoading, user]);

  if (userRoleLoading) {
    return null; // ローディング中は何も表示しない（AuthContextのローディング表示に任せる）
  }

  // 講師の場合はチャットグループ一覧を表示
  return (
    <View style={styles.container}>
      <ChatGroupList />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
});