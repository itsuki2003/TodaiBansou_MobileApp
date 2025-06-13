import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

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
  // 暫定的に常に子コンポーネントを表示
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
  unauthorizedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 24,
  },
  roleInfo: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },
});