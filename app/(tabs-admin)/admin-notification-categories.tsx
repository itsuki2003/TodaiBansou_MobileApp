import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Tag,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
} from 'lucide-react-native';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { AdminGuard } from '@/components/common/RoleGuard';
import type { Database } from '@/types/database.types';

type NotificationCategory = Database['public']['Tables']['notification_categories']['Row'];

export default function AdminNotificationCategoriesScreen() {
  const router = useRouter();
  const { administrator } = useAuth();

  const [categories, setCategories] = useState<NotificationCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<NotificationCategory | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    try {
      setError(null);

      const { data, error } = await supabase
        .from('notification_categories')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      setCategories(data || []);

    } catch (err) {
      console.error('Categories fetch error:', err);
      setError('カテゴリーの取得に失敗しました');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchCategories();
  }, [fetchCategories]);

  const handleCreateOrUpdateCategory = async () => {
    try {
      if (!categoryName.trim()) {
        Alert.alert('エラー', 'カテゴリー名を入力してください');
        return;
      }

      if (editingCategory) {
        // 更新
        const { error } = await supabase
          .from('notification_categories')
          .update({ name: categoryName })
          .eq('id', editingCategory.id);

        if (error) throw error;

        Alert.alert('成功', 'カテゴリーを更新しました');
      } else {
        // 新規作成
        const { error } = await supabase
          .from('notification_categories')
          .insert([{ name: categoryName }]);

        if (error) throw error;

        Alert.alert('成功', 'カテゴリーを作成しました');
      }

      setCreateModalVisible(false);
      setEditingCategory(null);
      setCategoryName('');
      fetchCategories();

    } catch (err) {
      console.error('Category save error:', err);
      Alert.alert('エラー', 'カテゴリーの保存に失敗しました');
    }
  };

  const handleEditCategory = (category: NotificationCategory) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCreateModalVisible(true);
  };

  const handleDeleteCategory = async (categoryId: string, categoryName: string) => {
    Alert.alert(
      'カテゴリー削除',
      `「${categoryName}」を削除しますか？\nこのカテゴリーを使用しているお知らせがある場合、カテゴリーが未設定になります。`,
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              // カテゴリーを使用しているお知らせのカテゴリーをnullに更新
              await supabase
                .from('notifications')
                .update({ category_id: null })
                .eq('category_id', categoryId);

              // カテゴリーを削除
              const { error } = await supabase
                .from('notification_categories')
                .delete()
                .eq('id', categoryId);

              if (error) throw error;

              Alert.alert('成功', 'カテゴリーを削除しました');
              fetchCategories();
            } catch (err) {
              console.error('Category deletion error:', err);
              Alert.alert('エラー', 'カテゴリーの削除に失敗しました');
            }
          }
        },
      ]
    );
  };

  if (loading) {
    return (
      <AdminGuard>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>カテゴリー管理</Text>
            <View style={{ width: 24 }} />
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#DC2626" />
            <Text style={styles.loadingText}>カテゴリーを読み込み中...</Text>
          </View>
        </SafeAreaView>
      </AdminGuard>
    );
  }

  if (error) {
    return (
      <AdminGuard>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()}>
              <ArrowLeft size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>カテゴリー管理</Text>
            <View style={{ width: 24 }} />
          </View>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchCategories}>
              <Text style={styles.retryButtonText}>再試行</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <SafeAreaView style={styles.container}>
        {/* ヘッダー */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>カテゴリー管理</Text>
          <TouchableOpacity onPress={() => {
            setEditingCategory(null);
            setCategoryName('');
            setCreateModalVisible(true);
          }}>
            <Plus size={24} color="#374151" />
          </TouchableOpacity>
        </View>

        {/* カテゴリー一覧 */}
        <ScrollView
          style={styles.list}
          contentContainerStyle={categories.length === 0 ? styles.emptyContainer : undefined}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#DC2626']}
              tintColor="#DC2626"
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {categories.length === 0 ? (
            <View style={styles.emptyState}>
              <Tag size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>
                カテゴリーがありません
              </Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => {
                  setEditingCategory(null);
                  setCategoryName('');
                  setCreateModalVisible(true);
                }}
              >
                <Plus size={16} color="#FFFFFF" />
                <Text style={styles.addButtonText}>カテゴリーを作成</Text>
              </TouchableOpacity>
            </View>
          ) : (
            categories.map((category) => (
              <View key={category.id} style={styles.categoryCard}>
                <View style={styles.categoryInfo}>
                  <View style={styles.categoryIcon}>
                    <Tag size={20} color="#6B7280" />
                  </View>
                  <View style={styles.categoryDetails}>
                    <Text style={styles.categoryName}>{category.name}</Text>
                    <Text style={styles.categoryDate}>
                      作成日: {category.created_at && !isNaN(new Date(category.created_at).getTime()) ? 
                        format(new Date(category.created_at), 'yyyy年M月d日', { locale: ja }) : 
                        '日付不明'
                      }
                    </Text>
                  </View>
                </View>

                <View style={styles.categoryActions}>
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleEditCategory(category)}
                  >
                    <Edit3 size={16} color="#6B7280" />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => handleDeleteCategory(category.id, category.name)}
                  >
                    <Trash2 size={16} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>

        {/* 作成・編集モーダル */}
        <Modal
          visible={createModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => {
                setCreateModalVisible(false);
                setEditingCategory(null);
              }}>
                <Text style={styles.modalCancelText}>キャンセル</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {editingCategory ? 'カテゴリー編集' : '新規カテゴリー'}
              </Text>
              <TouchableOpacity onPress={handleCreateOrUpdateCategory}>
                <Text style={styles.modalDoneText}>
                  {editingCategory ? '更新' : '作成'}
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalContent}>
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>カテゴリー名</Text>
                <TextInput
                  style={styles.input}
                  value={categoryName}
                  onChangeText={setCategoryName}
                  placeholder="例: 重要なお知らせ"
                  autoFocus
                />
              </View>
            </View>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </AdminGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DC2626',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  categoryCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryDetails: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  categoryDate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  categoryActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F9FAFB',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#6B7280',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalDoneText: {
    fontSize: 16,
    color: '#DC2626',
    fontWeight: '600',
  },
  modalContent: {
    padding: 16,
  },
  formSection: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
  },
});