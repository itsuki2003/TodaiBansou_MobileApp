import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { User, Mail, Shield, Save, ArrowLeft } from 'lucide-react-native';

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { AdminGuard } from '@/components/common/RoleGuard';
import AppHeader from '@/components/ui/AppHeader';
import type { Database } from '@/types/database.types';

type Administrator = Database['public']['Tables']['administrators']['Row'];

export default function AdminProfileScreen() {
  const { user, userRole } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [admin, setAdmin] = useState<Administrator | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    if (!user || userRole !== 'admin') return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('administrators')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      setAdmin(data);
      setFormData({
        full_name: data.full_name || '',
        email: data.email || '',
      });
    } catch (error) {
      console.error('Error fetching admin data:', error);
      Alert.alert('エラー', '管理者情報の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = '氏名は必須です';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'メールアドレスは必須です';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'メールアドレスの形式が正しくありません';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || !admin) return;

    try {
      setSaving(true);

      const { error } = await supabase
        .from('administrators')
        .update({
          full_name: formData.full_name.trim(),
          email: formData.email.trim(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', admin.id);

      if (error) throw error;

      Alert.alert(
        '保存完了',
        'プロフィール情報を更新しました',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error updating admin profile:', error);
      Alert.alert('エラー', 'プロフィールの更新に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminGuard>
        <SafeAreaView style={styles.container}>
          <AppHeader title="プロフィール編集" showBackButton onBackPress={() => router.back()} />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#DC2626" />
            <Text style={styles.loadingText}>プロフィール情報を読み込み中...</Text>
          </View>
        </SafeAreaView>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <SafeAreaView style={styles.container}>
        <AppHeader 
          title="プロフィール編集" 
          showBackButton 
          onBackPress={() => router.back()}
          rightElement={
            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Save size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          }
        />

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 管理者情報 */}
          <View style={styles.section}>
            <View style={styles.adminInfo}>
              <View style={styles.adminIconContainer}>
                <Shield size={32} color="#DC2626" />
              </View>
              <View style={styles.adminDetails}>
                <Text style={styles.adminRole}>システム管理者</Text>
                <Text style={styles.adminId}>ID: {admin?.id.slice(0, 8)}...</Text>
                <Text style={styles.adminDate}>
                  作成日: {admin?.created_at ? new Date(admin.created_at).toLocaleDateString('ja-JP') : '-'}
                </Text>
              </View>
            </View>
          </View>

          {/* 編集フォーム */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>基本情報</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>氏名 *</Text>
              <View style={[styles.inputContainer, errors.full_name && styles.inputError]}>
                <User size={20} color="#6B7280" />
                <TextInput
                  style={styles.input}
                  value={formData.full_name}
                  onChangeText={(text) => {
                    setFormData(prev => ({ ...prev, full_name: text }));
                    if (errors.full_name) {
                      setErrors(prev => ({ ...prev, full_name: '' }));
                    }
                  }}
                  placeholder="管理者の氏名を入力"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              {errors.full_name && <Text style={styles.errorText}>{errors.full_name}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>メールアドレス *</Text>
              <View style={[styles.inputContainer, errors.email && styles.inputError]}>
                <Mail size={20} color="#6B7280" />
                <TextInput
                  style={styles.input}
                  value={formData.email}
                  onChangeText={(text) => {
                    setFormData(prev => ({ ...prev, email: text }));
                    if (errors.email) {
                      setErrors(prev => ({ ...prev, email: '' }));
                    }
                  }}
                  placeholder="メールアドレスを入力"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>
          </View>

          {/* アカウント情報 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>アカウント情報</Text>
            
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>アカウント状況</Text>
              <Text style={[styles.infoValue, { color: '#10B981' }]}>
                {admin?.account_status}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>最終更新日</Text>
              <Text style={styles.infoValue}>
                {admin?.updated_at ? new Date(admin.updated_at).toLocaleDateString('ja-JP') : '-'}
              </Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </AdminGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
  saveButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 40,
    alignItems: 'center',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  adminInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  adminIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  adminDetails: {
    flex: 1,
  },
  adminRole: {
    fontSize: 16,
    fontWeight: '600',
    color: '#DC2626',
    marginBottom: 4,
  },
  adminId: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  adminDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    marginLeft: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },
});