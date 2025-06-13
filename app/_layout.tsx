import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import { View, ActivityIndicator } from 'react-native';

// 認証が必要なルートグループ
const AUTH_GROUP = '(auth)';
// 認証済みユーザー専用のルートグループ
const PROTECTED_GROUP = '(tabs)';

function RootLayoutNav() {
  const { user, loading, userRole, userRoleLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading || userRoleLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inProtectedGroup = segments[0] === '(tabs)';

    if (!user && !inAuthGroup) {
      // 未認証ユーザーを認証画面にリダイレクト
      router.replace('/login');
    } else if (user && userRole && inAuthGroup) {
      // 認証済みユーザーをメイン画面にリダイレクト
      router.replace('/(tabs)');
    }
  }, [user, loading, userRole, userRoleLoading, segments]);

  if (loading || userRoleLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </ErrorBoundary>
  );
}
