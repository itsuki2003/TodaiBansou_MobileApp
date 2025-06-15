import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Image,
} from 'react-native';
import {
  ArrowLeft,
  Save,
  Camera,
  GraduationCap,
  Mail,
  Phone,
  MapPin,
  Star,
  Award,
  BookOpen,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { TeacherGuard } from '@/components/common/RoleGuard';
import { handleAppError } from '@/utils/errorHandling';
import type { Database } from '@/types/database.types';

type Teacher = Database['public']['Tables']['teachers']['Row'];

export default function TeacherProfileScreen() {
  const { user, userRole } = useAuth();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [teacher, setTeacher] = useState<Teacher | null>(null);

  // フォーム状態
  const [formData, setFormData] = useState({
    full_name: '',
    furigana_name: '',
    email: '',
    phone_number: '',
    appeal_points: '',
    hobbies_special_skills: '',
    education_background_university: '',
    education_background_faculty: '',
    education_background_high_school: '',
    education_background_middle_school: '',
    education_background_cram_school: '',
  });

  // 講師データを取得
  useEffect(() => {
    const fetchTeacherData = async () => {
      if (!user || userRole !== 'teacher') {
        router.back();
        return;
      }

      try {
        setLoading(true);

        const { data: teacherData, error } = await supabase
          .from('teachers')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;

        setTeacher(teacherData);
        setFormData({
          full_name: teacherData.full_name || '',
          furigana_name: teacherData.furigana_name || '',
          email: teacherData.email || '',
          phone_number: teacherData.phone_number || '',
          appeal_points: teacherData.appeal_points || '',
          hobbies_special_skills: teacherData.hobbies_special_skills || '',
          education_background_university: teacherData.education_background_university || '',
          education_background_faculty: teacherData.education_background_faculty || '',
          education_background_high_school: teacherData.education_background_high_school || '',
          education_background_middle_school: teacherData.education_background_middle_school || '',
          education_background_cram_school: teacherData.education_background_cram_school || '',
        });

      } catch (error) {
        handleAppError(error, 'teacher profile fetch', user?.id);
      } finally {
        setLoading(false);
      }
    };

    fetchTeacherData();
  }, [user, userRole]);

  // プロフィール更新
  const handleSave = async () => {
    if (!teacher) return;

    try {
      setSaving(true);

      // 必須項目チェック
      if (!formData.full_name.trim() || !formData.furigana_name.trim()) {
        showNotification({
          type: 'warning',
          title: '入力エラー',
          message: '氏名とフリガナは必須項目です',
          autoHide: true,
        });
        return;
      }

      const { error } = await supabase
        .from('teachers')
        .update({
          full_name: formData.full_name.trim(),
          furigana_name: formData.furigana_name.trim(),
          phone_number: formData.phone_number.trim() || null,
          appeal_points: formData.appeal_points.trim() || null,
          hobbies_special_skills: formData.hobbies_special_skills.trim() || null,
          education_background_university: formData.education_background_university.trim() || null,
          education_background_faculty: formData.education_background_faculty.trim() || null,
          education_background_high_school: formData.education_background_high_school.trim() || null,
          education_background_middle_school: formData.education_background_middle_school.trim() || null,
          education_background_cram_school: formData.education_background_cram_school.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', teacher.id);

      if (error) throw error;

      showNotification({
        type: 'success',
        title: '保存完了',
        message: 'プロフィールを更新しました',
        autoHide: true,
      });

      router.back();

    } catch (error) {
      handleAppError(error, 'teacher profile update', user?.id);
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoEdit = () => {
    showNotification({
      type: 'info',
      title: '準備中',
      message: 'プロフィール写真の編集機能は今後のアップデートで実装予定です',
      autoHide: true,
    });
  };

  if (loading) {
    return (
      <TeacherGuard>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>プロフィール編集</Text>
            <View style={styles.placeholder} />
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>プロフィールを読み込み中...</Text>
          </View>
        </SafeAreaView>
      </TeacherGuard>
    );
  }

  return (
    <TeacherGuard>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>プロフィール編集</Text>
          <TouchableOpacity 
            onPress={handleSave} 
            style={styles.saveButton}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#3B82F6" />
            ) : (
              <Save size={24} color="#3B82F6" />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* プロフィール写真セクション */}
          <View style={styles.photoSection}>
            <View style={styles.photoContainer}>
              {teacher?.profile_formal_photo_url ? (
                <Image
                  source={{ uri: teacher.profile_formal_photo_url }}
                  style={styles.profilePhoto}
                />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <GraduationCap size={48} color="#9CA3AF" />
                </View>
              )}
              <TouchableOpacity style={styles.photoEditButton} onPress={handlePhotoEdit}>
                <Camera size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <Text style={styles.photoHint}>正装の写真を使用してください</Text>
          </View>

          {/* 基本情報 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>基本情報</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>氏名 *</Text>
              <TextInput
                style={styles.textInput}
                value={formData.full_name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, full_name: text }))}
                placeholder="山田 太郎"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>フリガナ *</Text>
              <TextInput
                style={styles.textInput}
                value={formData.furigana_name}
                onChangeText={(text) => setFormData(prev => ({ ...prev, furigana_name: text }))}
                placeholder="ヤマダ タロウ"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>メールアドレス</Text>
              <View style={styles.inputWithIcon}>
                <Mail size={20} color="#9CA3AF" />
                <TextInput
                  style={[styles.textInput, styles.textInputWithIcon]}
                  value={formData.email}
                  editable={false}
                  placeholder="email@example.com"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                />
              </View>
              <Text style={styles.inputHint}>メールアドレスは変更できません</Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>電話番号</Text>
              <View style={styles.inputWithIcon}>
                <Phone size={20} color="#9CA3AF" />
                <TextInput
                  style={[styles.textInput, styles.textInputWithIcon]}
                  value={formData.phone_number}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, phone_number: text }))}
                  placeholder="090-1234-5678"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </View>

          {/* 学歴情報 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>学歴</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>大学</Text>
              <TextInput
                style={styles.textInput}
                value={formData.education_background_university}
                onChangeText={(text) => setFormData(prev => ({ ...prev, education_background_university: text }))}
                placeholder="東京大学"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>学部</Text>
              <TextInput
                style={styles.textInput}
                value={formData.education_background_faculty}
                onChangeText={(text) => setFormData(prev => ({ ...prev, education_background_faculty: text }))}
                placeholder="理学部"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>出身高校</Text>
              <TextInput
                style={styles.textInput}
                value={formData.education_background_high_school}
                onChangeText={(text) => setFormData(prev => ({ ...prev, education_background_high_school: text }))}
                placeholder="○○高等学校"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>出身中学校</Text>
              <TextInput
                style={styles.textInput}
                value={formData.education_background_middle_school}
                onChangeText={(text) => setFormData(prev => ({ ...prev, education_background_middle_school: text }))}
                placeholder="○○中学校"
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>塾歴</Text>
              <TextInput
                style={styles.textInput}
                value={formData.education_background_cram_school}
                onChangeText={(text) => setFormData(prev => ({ ...prev, education_background_cram_school: text }))}
                placeholder="SAPIX、四谷大塚 など"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          {/* 自己PR */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>自己PR</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>アピールポイント</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={formData.appeal_points}
                onChangeText={(text) => setFormData(prev => ({ ...prev, appeal_points: text }))}
                placeholder="指導における強みや特徴をご記入ください"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>趣味・特技</Text>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                value={formData.hobbies_special_skills}
                onChangeText={(text) => setFormData(prev => ({ ...prev, hobbies_special_skills: text }))}
                placeholder="生徒との距離を縮めるための趣味や特技をご記入ください"
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* アカウント情報 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>アカウント情報</Text>
            
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Award size={20} color="#3B82F6" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>アカウント状況</Text>
                <Text style={[
                  styles.infoValue,
                  teacher?.account_status === '有効' ? styles.activeStatus : styles.inactiveStatus
                ]}>
                  {teacher?.account_status || '不明'}
                </Text>
              </View>
            </View>

            {teacher?.registration_application_date && (
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <BookOpen size={20} color="#6B7280" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>登録申請日</Text>
                  <Text style={styles.infoValue}>
                    {new Date(teacher.registration_application_date).toLocaleDateString('ja-JP')}
                  </Text>
                </View>
              </View>
            )}

            {teacher?.account_approval_date && (
              <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                  <Star size={20} color="#10B981" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>承認日</Text>
                  <Text style={styles.infoValue}>
                    {new Date(teacher.account_approval_date).toLocaleDateString('ja-JP')}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </TeacherGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  saveButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
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
  photoSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  photoContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  photoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoEditButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  photoHint: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  inputGroup: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#FFFFFF',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  textInputWithIcon: {
    flex: 1,
    marginLeft: 8,
    borderWidth: 0,
    paddingHorizontal: 0,
  },
  inputHint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  activeStatus: {
    color: '#10B981',
  },
  inactiveStatus: {
    color: '#EF4444',
  },
});