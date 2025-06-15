import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { useRouter, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { ErrorBoundary } from '../components/common/ErrorBoundary';
import NotificationOverlay from '../components/common/NotificationOverlay';
import { View, ActivityIndicator, StatusBar } from 'react-native';

// 認証が必要なルートグループ
const AUTH_GROUP = '(auth)';
// 認証済みユーザー専用のルートグループ
const PROTECTED_GROUP = '(tabs)';

function RootLayoutNav() {
  const { user, loading, userRole, userRoleLoading, needsStudentSelection } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (loading || userRoleLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inParentGroup = segments[0] === '(tabs)';
    const inTeacherGroup = segments[0] === '(tabs-teacher)';
    const inAdminGroup = segments[0] === '(tabs-admin)';
    const inStudentSelection = segments[0] === 'student-selection';
    
    // 講師用の追加画面を許可
    const isTeacherScreen = inTeacherGroup || 
      segments[0] === 'teacher-student-detail' ||
      segments[0] === 'teacher-history' ||
      segments[0] === 'teacher-edit-todolist' ||
      segments[0] === 'teacher-view-todolist';


    if (!user && !inAuthGroup) {
      // 未認証ユーザーを認証画面にリダイレクト
      router.replace('/login');
    } else if (user && userRole && inAuthGroup) {
      // 認証済みユーザーの場合、ロールに応じてリダイレクト
      if (userRole === 'parent') {
        if (needsStudentSelection && !inStudentSelection) {
          // 複数生徒がいて選択が必要な場合は生徒選択画面へ
          router.replace('/student-selection');
        } else if (!needsStudentSelection) {
          // 生徒選択が不要な場合は保護者画面へ
          router.replace('/(tabs)');
        }
      } else if (userRole === 'teacher') {
        // 講師は講師画面へ
        router.replace('/(tabs-teacher)');
      } else if (userRole === 'admin') {
        // 運営は運営画面へ
        router.replace('/(tabs-admin)');
      }
    } else if (user && userRole && !inAuthGroup) {
      // 既にログイン済みで適切でないグループにいる場合
      if (userRole === 'parent') {
        if (needsStudentSelection && !inStudentSelection && !inParentGroup) {
          router.replace('/student-selection');
        } else if (!needsStudentSelection && !inParentGroup && !inStudentSelection) {
          router.replace('/(tabs)');
        }
      } else if (userRole === 'teacher' && !isTeacherScreen) {
        router.replace('/(tabs-teacher)');
      } else if (userRole === 'admin' && !inAdminGroup) {
        router.replace('/(tabs-admin)');
      }
    }
  }, [user, loading, userRole, userRoleLoading, needsStudentSelection, segments]);

  if (loading || userRoleLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />
      <Stack 
        screenOptions={{ 
          headerShown: false,
          contentStyle: { backgroundColor: '#FFFFFF' }
        }}
      >
      <Stack.Screen 
        name="index" 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="(auth)" 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="(tabs)" 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="(tabs-teacher)" 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="(tabs-admin)" 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="notifications/index" 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="notifications/[notificationId]" 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="weekly-tasks" 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="absence-request" 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="additional-lesson-request" 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="terms-of-service" 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="privacy-policy" 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="student-selection" 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="student-registration" 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="chat/[chatGroupId]" 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="chat/student" 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="teacher-student-detail" 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="teacher-history" 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="teacher-edit-todolist" 
        options={{ headerShown: false }}
      />
      <Stack.Screen 
        name="teacher-view-todolist" 
        options={{ headerShown: false }}
      />
    </Stack>
      <NotificationOverlay />
    </>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <NotificationProvider>
          <RootLayoutNav />
        </NotificationProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}
