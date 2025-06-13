import { Stack } from 'expo-router';

export default function TeacherLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="students" options={{ headerShown: false }} />
      <Stack.Screen name="students/[studentId]" options={{ headerShown: false }} />
    </Stack>
  );
}