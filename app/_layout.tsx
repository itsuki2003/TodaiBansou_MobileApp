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
  const { session, isLoading, isFirstTimeUser, userRoleLoading, needsStudentSelection } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading || userRoleLoading) {
      console.log('🔄 _layout: Still loading...', { isLoading, userRoleLoading });
      return;
    }

    const inAuthGroup = segments[0] === AUTH_GROUP;
    const inProtectedGroup = segments[0] === PROTECTED_GROUP;
    const inStudentRegistration = segments[0] === 'student-registration';
    const inStudentSelection = segments[0] === 'student-selection';

    console.log('🧭 _layout: Navigation check', {
      session: !!session,
      isFirstTimeUser,
      needsStudentSelection,
      segments: segments[0],
      inAuthGroup,
      inProtectedGroup,
      inStudentRegistration,
      inStudentSelection
    });

    if (session) {
      if (isFirstTimeUser && !inStudentRegistration) {
        console.log('➡️ _layout: Redirecting to student registration (first time user)');
        router.replace('/student-registration');
      } else if (needsStudentSelection && !inStudentSelection) {
        console.log('➡️ _layout: Redirecting to student selection (multiple students)');
        router.replace('/student-selection');
      } else if (!isFirstTimeUser && !needsStudentSelection && inAuthGroup) {
        console.log('➡️ _layout: Redirecting to main app (existing user in auth group)');
        router.replace('/(tabs)');
      } else if (isFirstTimeUser && inAuthGroup) {
        console.log('➡️ _layout: Redirecting to student registration (first time user in auth group)');
        router.replace('/student-registration');
      } else {
        console.log('✅ _layout: No redirect needed');
      }
    } else if (!session && (inProtectedGroup || inStudentRegistration || inStudentSelection)) {
      console.log('➡️ _layout: Redirecting to login (no session)');
      router.replace('/login');
    }
  }, [session, segments, isLoading, isFirstTimeUser, userRoleLoading, needsStudentSelection]);

  if (isLoading || userRoleLoading) {
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
      <Stack.Screen name="notifications/index" options={{ headerShown: false }} />
      <Stack.Screen name="notifications/[notificationId]" options={{ headerShown: false }} />
      <Stack.Screen name="chat/[chatGroupId]" options={{ headerShown: false }} />
      <Stack.Screen name="chat/student" options={{ headerShown: false }} />
      <Stack.Screen name="student-registration" options={{ headerShown: false }} />
      <Stack.Screen name="student-selection" options={{ headerShown: false }} />
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
