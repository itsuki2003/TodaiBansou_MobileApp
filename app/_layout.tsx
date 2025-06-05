import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { View, ActivityIndicator } from 'react-native';

// 認証が必要なルートグループ
const AUTH_GROUP = '(auth)';
// 認証済みユーザー専用のルートグループ
const PROTECTED_GROUP = '(tabs)';

function RootLayoutNav() {
  const { session, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === AUTH_GROUP;
    const inProtectedGroup = segments[0] === PROTECTED_GROUP;

    if (session && inAuthGroup) {
      // 認証済みユーザーが認証画面にアクセスした場合、メイン画面にリダイレクト
      router.replace('/(tabs)');
    } else if (!session && inProtectedGroup) {
      // 未認証ユーザーが保護された画面にアクセスした場合、ログイン画面にリダイレクト
      router.replace('/login');
    }
  }, [session, segments, isLoading]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}
