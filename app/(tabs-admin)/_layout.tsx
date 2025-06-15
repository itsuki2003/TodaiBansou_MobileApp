import React from 'react';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { 
  BarChart3, 
  Users, 
  UserCheck, 
  Calendar, 
  Settings 
} from 'lucide-react-native';

export default function AdminTabLayout() {
  const insets = useSafeAreaInsets();
  
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#DC2626',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 8),
          height: 80 + Math.max(insets.bottom - 8, 0),
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'ダッシュボード',
          tabBarIcon: ({ color, size }) => (
            <BarChart3 size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="students"
        options={{
          title: '生徒管理',
          tabBarIcon: ({ color, size }) => (
            <Users size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="teachers"
        options={{
          title: '講師管理',
          tabBarIcon: ({ color, size }) => (
            <UserCheck size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="schedule"
        options={{
          title: '授業管理',
          tabBarIcon: ({ color, size }) => (
            <Calendar size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: '設定',
          tabBarIcon: ({ color, size }) => (
            <Settings size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="terms-of-service"
        options={{
          href: null, // Hide from tab bar
          title: '利用規約',
        }}
      />
      <Tabs.Screen
        name="privacy-policy"
        options={{
          href: null, // Hide from tab bar
          title: 'プライバシーポリシー',
        }}
      />
      <Tabs.Screen
        name="admin-profile"
        options={{
          href: null, // Hide from tab bar
          title: '管理者プロフィール',
        }}
      />
      <Tabs.Screen
        name="admin-teacher-applications"
        options={{
          href: null, // Hide from tab bar
          title: '講師申請管理',
        }}
      />
      <Tabs.Screen
        name="admin-student-form"
        options={{
          href: null, // Hide from tab bar
          title: '生徒登録',
        }}
      />
      <Tabs.Screen
        name="admin-teacher-detail"
        options={{
          href: null, // Hide from tab bar
          title: '講師詳細',
        }}
      />
      <Tabs.Screen
        name="admin-student-detail"
        options={{
          href: null, // Hide from tab bar
          title: '生徒詳細',
        }}
      />
      <Tabs.Screen
        name="admin-assignment-management"
        options={{
          href: null, // Hide from tab bar
          title: '担当管理',
        }}
      />
      <Tabs.Screen
        name="admin-notification-categories"
        options={{
          href: null, // Hide from tab bar
          title: 'お知らせカテゴリ',
        }}
      />
      <Tabs.Screen
        name="admin-notifications"
        options={{
          href: null, // Hide from tab bar
          title: 'お知らせ管理',
        }}
      />
      <Tabs.Screen
        name="admin-data-export"
        options={{
          href: null, // Hide from tab bar
          title: 'データエクスポート',
        }}
      />
      <Tabs.Screen
        name="admin-backup"
        options={{
          href: null, // Hide from tab bar
          title: 'システムバックアップ',
        }}
      />
    </Tabs>
  );
}