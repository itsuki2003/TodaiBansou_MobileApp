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
  Platform,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { 
  User, 
  Phone, 
  Mail, 
  School, 
  Calendar,
  Save,
  User2,
  FileText,
} from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { AdminGuard } from '@/components/common/RoleGuard';
import AppHeader from '@/components/ui/AppHeader';
import type { Database } from '@/types/database.types';

type Student = Database['public']['Tables']['students']['Row'];
type StudentInsert = Database['public']['Tables']['students']['Insert'];
type StudentUpdate = Database['public']['Tables']['students']['Update'];

export default function AdminStudentFormScreen() {
  const { studentId } = useLocalSearchParams<{ studentId?: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(!!studentId);
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  const [formData, setFormData] = useState({
    full_name: '',
    furigana_name: '',
    grade: '',
    school_attended: '',
    enrollment_date: new Date().toISOString().split('T')[0],
    status: '在籍中' as '在籍中' | '休会中' | '退会済み',
    parent_name: '',
    parent_phone_number: '',
    notes: '',
  });
  
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const isEditing = !!studentId;

  useEffect(() => {
    if (isEditing) {
      fetchStudentData();
    }
  }, [studentId]);

  const fetchStudentData = async () => {
    if (!studentId) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single();

      if (error) throw error;

      setFormData({
        full_name: data.full_name || '',
        furigana_name: data.furigana_name || '',
        grade: data.grade || '',
        school_attended: data.school_attended || '',
        enrollment_date: data.enrollment_date || new Date().toISOString().split('T')[0],
        status: data.status || '在籍中',
        parent_name: data.parent_name || '',
        parent_phone_number: data.parent_phone_number || '',
        notes: data.notes || '',
      });
    } catch (error) {
      console.error('Error fetching student:', error);
      Alert.alert('エラー', '生徒情報の取得に失敗しました');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.full_name.trim()) {
      newErrors.full_name = '生徒氏名は必須です';
    }

    if (!formData.parent_name.trim()) {
      newErrors.parent_name = '保護者氏名は必須です';
    }

    if (!formData.enrollment_date) {
      newErrors.enrollment_date = '入会日は必須です';
    }

    if (formData.parent_phone_number && !/^[0-9\-\+\(\)\s]+$/.test(formData.parent_phone_number)) {
      newErrors.parent_phone_number = '電話番号の形式が正しくありません';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setSaving(true);

      const studentData = {
        full_name: formData.full_name.trim(),
        furigana_name: formData.furigana_name.trim() || null,
        grade: formData.grade.trim() || null,
        school_attended: formData.school_attended.trim() || null,
        enrollment_date: formData.enrollment_date,
        status: formData.status,
        parent_name: formData.parent_name.trim(),
        parent_phone_number: formData.parent_phone_number.trim() || null,
        notes: formData.notes.trim() || null,
      };

      if (isEditing) {
        const { error } = await supabase
          .from('students')
          .update({
            ...studentData,
            updated_at: new Date().toISOString(),
          } as StudentUpdate)
          .eq('id', studentId);

        if (error) throw error;
      } else {
        // 新規生徒の場合、保護者アカウントも作成する必要があるかもしれませんが、
        // 今回は基本情報のみ保存します
        const { error } = await supabase
          .from('students')
          .insert(studentData as StudentInsert);

        if (error) throw error;
      }

      Alert.alert(
        '保存完了',
        isEditing ? '生徒情報を更新しました' : '新しい生徒を登録しました',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error) {
      console.error('Error saving student:', error);
      Alert.alert('エラー', '生徒情報の保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setFormData(prev => ({
        ...prev,
        enrollment_date: selectedDate.toISOString().split('T')[0],
      }));
    }
  };

  if (loading) {
    return (
      <AdminGuard>
        <SafeAreaView style={styles.container}>
          <AppHeader 
            title={isEditing ? '生徒情報編集' : '新規生徒登録'} 
            showBackButton 
            onBackPress={() => router.back()} 
          />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#DC2626" />
            <Text style={styles.loadingText}>生徒情報を読み込み中...</Text>
          </View>
        </SafeAreaView>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <SafeAreaView style={styles.container}>
        <AppHeader 
          title={isEditing ? '生徒情報編集' : '新規生徒登録'} 
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
          {/* 生徒基本情報 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>生徒基本情報</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>生徒氏名 *</Text>
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
                  placeholder="山田 太郎"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              {errors.full_name && <Text style={styles.errorText}>{errors.full_name}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>フリガナ</Text>
              <View style={styles.inputContainer}>
                <User size={20} color="#6B7280" />
                <TextInput
                  style={styles.input}
                  value={formData.furigana_name}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, furigana_name: text }))}
                  placeholder="ヤマダ タロウ"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>学年</Text>
              <View style={styles.inputContainer}>
                <School size={20} color="#6B7280" />
                <TextInput
                  style={styles.input}
                  value={formData.grade}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, grade: text }))}
                  placeholder="小学6年生"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>通塾先</Text>
              <View style={styles.inputContainer}>
                <School size={20} color="#6B7280" />
                <TextInput
                  style={styles.input}
                  value={formData.school_attended}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, school_attended: text }))}
                  placeholder="SAPIX"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>入会日 *</Text>
              <TouchableOpacity
                style={[styles.inputContainer, errors.enrollment_date && styles.inputError]}
                onPress={() => setShowDatePicker(true)}
              >
                <Calendar size={20} color="#6B7280" />
                <Text style={styles.dateText}>
                  {new Date(formData.enrollment_date).toLocaleDateString('ja-JP')}
                </Text>
              </TouchableOpacity>
              {errors.enrollment_date && <Text style={styles.errorText}>{errors.enrollment_date}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>在籍状況</Text>
              <View style={styles.statusContainer}>
                {(['在籍中', '休会中', '退会済み'] as const).map(status => (
                  <TouchableOpacity
                    key={status}
                    style={[
                      styles.statusOption,
                      formData.status === status && styles.statusOptionSelected
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, status }))}
                  >
                    <Text style={[
                      styles.statusOptionText,
                      formData.status === status && styles.statusOptionTextSelected
                    ]}>
                      {status}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* 保護者情報 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>保護者情報</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>保護者氏名 *</Text>
              <View style={[styles.inputContainer, errors.parent_name && styles.inputError]}>
                <User2 size={20} color="#6B7280" />
                <TextInput
                  style={styles.input}
                  value={formData.parent_name}
                  onChangeText={(text) => {
                    setFormData(prev => ({ ...prev, parent_name: text }));
                    if (errors.parent_name) {
                      setErrors(prev => ({ ...prev, parent_name: '' }));
                    }
                  }}
                  placeholder="山田 花子"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
              {errors.parent_name && <Text style={styles.errorText}>{errors.parent_name}</Text>}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>保護者連絡先</Text>
              <View style={[styles.inputContainer, errors.parent_phone_number && styles.inputError]}>
                <Phone size={20} color="#6B7280" />
                <TextInput
                  style={styles.input}
                  value={formData.parent_phone_number}
                  onChangeText={(text) => {
                    setFormData(prev => ({ ...prev, parent_phone_number: text }));
                    if (errors.parent_phone_number) {
                      setErrors(prev => ({ ...prev, parent_phone_number: '' }));
                    }
                  }}
                  placeholder="090-1234-5678"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                />
              </View>
              {errors.parent_phone_number && <Text style={styles.errorText}>{errors.parent_phone_number}</Text>}
            </View>
          </View>

          {/* その他情報 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>その他情報</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>特記事項</Text>
              <View style={styles.textAreaContainer}>
                <FileText size={20} color="#6B7280" />
                <TextInput
                  style={styles.textArea}
                  value={formData.notes}
                  onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
                  placeholder="算数が得意。国語の読解に課題あり。"
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              </View>
            </View>
          </View>
        </ScrollView>

        {showDatePicker && (
          <DateTimePicker
            value={new Date(formData.enrollment_date)}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}
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
  dateText: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    marginLeft: 8,
  },
  textAreaContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  textArea: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    marginLeft: 8,
    minHeight: 80,
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  statusOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
  },
  statusOptionSelected: {
    borderColor: '#DC2626',
    backgroundColor: '#FEE2E2',
  },
  statusOptionText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  statusOptionTextSelected: {
    color: '#DC2626',
    fontWeight: '600',
  },
});