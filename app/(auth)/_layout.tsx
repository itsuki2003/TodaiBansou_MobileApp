import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        gestureEnabled: true,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="login"
        options={{
          title: 'ログイン',
        }}
      />
      <Stack.Screen
        name="signup"
        options={{
          title: '新規登録',
        }}
      />
      <Stack.Screen
        name="confirm"
        options={{
          title: 'メール確認',
        }}
      />
      <Stack.Screen
        name="reset-password"
        options={{
          title: 'パスワードリセット',
        }}
      />
    </Stack>
  );
}