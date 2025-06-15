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
  Alert,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import {
  UserPlus,
  CheckCircle2,
  X,
  Clock,
  GraduationCap,
  Mail,
  Phone,
  Eye,
  ChevronRight,
} from 'lucide-react-native';

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { AdminGuard } from '@/components/common/RoleGuard';
import AppHeader from '@/components/ui/AppHeader';
import type { Database } from '@/types/database.types';

type Teacher = Database['public']['Tables']['teachers']['Row'];

export default function AdminTeacherApplicationsScreen() {
  const { administrator } = useAuth();
  const [applications, setApplications] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processing, setProcessing] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<Teacher | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const fetchApplications = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('teachers')
        .select('*')
        .eq('account_status', '承認待ち')
        .order('registration_application_date', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      Alert.alert('エラー', '申請データの取得に失敗しました');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchApplications();
  }, [fetchApplications]);

  const handleApplicationAction = async (teacherId: string, approve: boolean) => {
    try {
      setProcessing(teacherId);
      
      const status = approve ? '有効' : '無効';
      const approvalDate = approve ? new Date().toISOString().split('T')[0] : null;
      
      const { error } = await supabase
        .from('teachers')
        .update({ 
          account_status: status,
          account_approval_date: approvalDate 
        })
        .eq('id', teacherId);

      if (error) throw error;

      Alert.alert(
        '処理完了',
        approve ? '講師申請を承認しました' : '講師申請を却下しました',
        [{ text: 'OK' }]
      );
      
      // リストから削除
      setApplications(prev => prev.filter(app => app.id !== teacherId));
      setModalVisible(false);
      
    } catch (error) {
      console.error('Error processing application:', error);
      Alert.alert('エラー', '処理に失敗しました');
    } finally {
      setProcessing(null);
    }
  };

  const handleViewDetail = (application: Teacher) => {
    setSelectedApplication(application);
    setModalVisible(true);
  };

  const handleNavigateToTeacherDetail = (teacherId: string) => {
    router.push({
      pathname: '/(tabs-admin)/admin-teacher-detail',
      params: { teacherId }
    });
  };

  const renderApplicationItem = (application: Teacher) => (
    <TouchableOpacity
      key={application.id}
      style={styles.applicationCard}
      onPress={() => handleViewDetail(application)}
    >
      <View style={styles.applicationHeader}>
        <View style={styles.applicationIconContainer}>
          <UserPlus size={24} color="#F59E0B" />
        </View>
        <View style={styles.applicationInfo}>
          <Text style={styles.applicationName}>{application.full_name}</Text>
          {application.furigana_name && (
            <Text style={styles.applicationFurigana}>{application.furigana_name}</Text>
          )}
          <View style={styles.applicationMeta}>
            <Clock size={12} color="#6B7280" />
            <Text style={styles.applicationDate}>
              申請日: {application.registration_application_date 
                ? new Date(application.registration_application_date).toLocaleDateString('ja-JP')
                : '不明'
              }
            </Text>
          </View>
        </View>
        <ChevronRight size={20} color="#9CA3AF" />
      </View>

      <View style={styles.applicationDetails}>
        <View style={styles.detailItem}>
          <GraduationCap size={14} color="#6B7280" />
          <Text style={styles.detailText}>
            {application.education_background_university || '大学情報なし'}
          </Text>
        </View>
        
        <View style={styles.detailItem}>
          <Mail size={14} color="#6B7280" />
          <Text style={styles.detailText} numberOfLines={1}>
            {application.email}
          </Text>
        </View>
        
        {application.phone_number && (
          <View style={styles.detailItem}>
            <Phone size={14} color="#6B7280" />
            <Text style={styles.detailText}>
              {application.phone_number}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.applicationActions}>
        <TouchableOpacity
          style={styles.rejectButton}
          onPress={() => handleApplicationAction(application.id, false)}
          disabled={processing === application.id}
        >
          {processing === application.id ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <X size={16} color="#FFFFFF" />
              <Text style={styles.rejectButtonText}>却下</Text>
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.approveButton}
          onPress={() => handleApplicationAction(application.id, true)}
          disabled={processing === application.id}
        >
          {processing === application.id ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <CheckCircle2 size={16} color="#FFFFFF" />
              <Text style={styles.approveButtonText}>承認</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <AdminGuard>
        <SafeAreaView style={styles.container}>
          <AppHeader title="講師申請一覧" showBackButton onBackPress={() => router.back()} />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#DC2626" />
            <Text style={styles.loadingText}>申請データを読み込み中...</Text>
          </View>
        </SafeAreaView>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <SafeAreaView style={styles.container}>
        <AppHeader title="講師申請一覧" showBackButton onBackPress={() => router.back()} />

        <View style={styles.statsBar}>
          <Text style={styles.statsText}>
            承認待ち申請: {applications.length}件
          </Text>
        </View>

        <ScrollView
          style={styles.list}
          contentContainerStyle={applications.length === 0 ? styles.emptyContainer : styles.listContent}
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
          {applications.length === 0 ? (
            <View style={styles.emptyState}>
              <UserPlus size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>
                承認待ちの講師申請はありません
              </Text>
            </View>
          ) : (
            applications.map(application => renderApplicationItem(application))
          )}
        </ScrollView>

        {/* 詳細モーダル */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.modalCancelText}>閉じる</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>申請詳細</Text>
              {selectedApplication && (
                <TouchableOpacity 
                  onPress={() => {
                    setModalVisible(false);
                    handleNavigateToTeacherDetail(selectedApplication.id);
                  }}
                >
                  <Text style={styles.modalViewText}>詳細表示</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {selectedApplication && (
              <ScrollView style={styles.modalContent}>
                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>基本情報</Text>
                  <Text style={styles.modalDetailText}>
                    氏名: {selectedApplication.full_name}
                  </Text>
                  {selectedApplication.furigana_name && (
                    <Text style={styles.modalDetailText}>
                      フリガナ: {selectedApplication.furigana_name}
                    </Text>
                  )}
                  <Text style={styles.modalDetailText}>
                    メール: {selectedApplication.email}
                  </Text>
                  {selectedApplication.phone_number && (
                    <Text style={styles.modalDetailText}>
                      電話: {selectedApplication.phone_number}
                    </Text>
                  )}
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.modalSectionTitle}>学歴</Text>
                  {selectedApplication.education_background_university && (
                    <Text style={styles.modalDetailText}>
                      大学: {selectedApplication.education_background_university}
                    </Text>
                  )}
                  {selectedApplication.education_background_faculty && (
                    <Text style={styles.modalDetailText}>
                      学部: {selectedApplication.education_background_faculty}
                    </Text>
                  )}
                  {selectedApplication.education_background_high_school && (
                    <Text style={styles.modalDetailText}>
                      高校: {selectedApplication.education_background_high_school}
                    </Text>
                  )}
                  {selectedApplication.education_background_cram_school && (
                    <Text style={styles.modalDetailText}>
                      塾歴: {selectedApplication.education_background_cram_school}
                    </Text>
                  )}
                </View>

                {selectedApplication.appeal_points && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>アピールポイント</Text>
                    <Text style={styles.modalDetailText}>
                      {selectedApplication.appeal_points}
                    </Text>
                  </View>
                )}

                {selectedApplication.hobbies_special_skills && (
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>趣味・特技</Text>
                    <Text style={styles.modalDetailText}>
                      {selectedApplication.hobbies_special_skills}
                    </Text>
                  </View>
                )}
              </ScrollView>
            )}
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
  statsBar: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  statsText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 20,
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
  },
  applicationCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  applicationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  applicationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  applicationInfo: {
    flex: 1,
  },
  applicationName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  applicationFurigana: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  applicationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  applicationDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  applicationDetails: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  applicationActions: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  rejectButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  approveButton: {
    flex: 1,
    backgroundColor: '#10B981',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  approveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
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
  modalViewText: {
    fontSize: 16,
    color: '#DC2626',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  modalDetailText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 8,
    lineHeight: 20,
  },
});