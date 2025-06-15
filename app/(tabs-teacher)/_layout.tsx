import React from 'react';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  Home, 
  Users, 
  Calendar, 
  MessageCircle, 
  Settings 
} from 'lucide-react-native';

export default function TeacherTabLayout() {
  const insets = useSafeAreaInsets();
  
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingTop: 6,
          paddingBottom: Math.max(insets.bottom, 6),
          height: 70 + Math.max(insets.bottom - 6, 0),
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'ホーム',
          tabBarIcon: ({ color, size }) => (
            <Home size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="students"
        options={{
          title: '担当生徒',
          tabBarIcon: ({ color, size }) => (
            <Users size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: '授業予定',
          tabBarIcon: ({ color, size }) => (
            <Calendar size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'チャット',
          tabBarIcon: ({ color, size }) => (
            <MessageCircle size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '設定',
          tabBarIcon: ({ color, size }) => (
            <Settings size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="teacher-profile"
        options={{
          href: null, // タブバーに表示しない
          title: 'プロフィール編集',
        }}
      />
      <Tabs.Screen
        name="terms-of-service"
        options={{
          href: null, // タブバーに表示しない
          title: '利用規約',
        }}
      />
      <Tabs.Screen
        name="privacy-policy"
        options={{
          href: null, // タブバーに表示しない
          title: 'プライバシーポリシー',
        }}
      />
    </Tabs>
  );
}