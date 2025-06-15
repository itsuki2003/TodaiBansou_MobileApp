import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Shield, AlertTriangle, LogOut } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../contexts/AuthContext';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles?: string[];
  redirectTo?: string;
  fallbackComponent?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  children,
  allowedRoles = [],
  redirectTo = '/',
  fallbackComponent
}) => {
  const { user, userRole, userRoleLoading, signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // ロール確定後にリダイレクト判定
    if (!userRoleLoading && user && userRole && allowedRoles.length > 0) {
      if (!allowedRoles.includes(userRole)) {
        // 権限がない場合は指定されたパスにリダイレクト
        router.replace(redirectTo);
      }
    }
  }, [user, userRole, userRoleLoading, allowedRoles, redirectTo]);

  // ローディング中
  if (userRoleLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>認証情報を確認中...</Text>
      </View>
    );
  }

  // 未認証
  if (!user) {
    return fallbackComponent || (
      <View style={styles.unauthorizedContainer}>
        <AlertTriangle size={48} color="#EF4444" style={styles.icon} />
        <Text style={styles.title}>認証が必要です</Text>
        <Text style={styles.message}>
          この画面にアクセスするには{'\n'}ログインが必要です。
        </Text>
        <TouchableOpacity 
          style={styles.loginButton}
          onPress={() => router.replace('/login')}
        >
          <Text style={styles.loginButtonText}>ログイン画面へ</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 権限チェック
  if (allowedRoles.length > 0 && userRole && !allowedRoles.includes(userRole)) {
    return fallbackComponent || (
      <View style={styles.unauthorizedContainer}>
        <Shield size={48} color="#F59E0B" style={styles.icon} />
        <Text style={styles.title}>アクセス権限がありません</Text>
        <Text style={styles.message}>
          この画面にアクセスする権限がありません。{'\n'}
          現在のロール: {userRole === 'parent' ? '保護者' : userRole === 'teacher' ? '講師' : userRole === 'admin' ? '運営' : '不明'}
        </Text>
        <Text style={styles.roleInfo}>
          必要なロール: {allowedRoles.map(role => 
            role === 'parent' ? '保護者' : 
            role === 'teacher' ? '講師' : 
            role === 'admin' ? '運営' : role
          ).join(', ')}
        </Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>戻る</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={signOut}
          >
            <LogOut size={16} color="#FFFFFF" />
            <Text style={styles.logoutButtonText}>ログアウト</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // 権限OK
  return <>{children}</>;
};

// 特定のロール用のコンポーネント
export const ParentGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RoleGuard allowedRoles={['parent']}>{children}</RoleGuard>
);

export const TeacherGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RoleGuard allowedRoles={['teacher']}>{children}</RoleGuard>
);

export const AdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RoleGuard allowedRoles={['admin']}>{children}</RoleGuard>
);

export const TeacherOrAdminGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <RoleGuard allowedRoles={['teacher', 'admin']}>{children}</RoleGuard>
);

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F9FAFB',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  unauthorizedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F9FAFB',
  },
  icon: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 24,
  },
  roleInfo: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  loginButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});