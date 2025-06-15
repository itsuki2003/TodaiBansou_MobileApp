import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { User, School } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function StudentRegistrationScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [enrollmentDate, setEnrollmentDate] = useState(new Date());
  const [formData, setFormData] = useState({
    fullName: '',
    furiganaName: '',
    grade: '',
    schoolAttended: '',
    parentName: '',
    parentPhoneNumber: '',
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      Alert.alert('エラー', '生徒氏名を入力してください。');
      return false;
    }
    if (!formData.parentName.trim()) {
      Alert.alert('エラー', '保護者氏名を入力してください。');
      return false;
    }
    return true;
  };

  const onDateChange = (_: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setEnrollmentDate(selectedDate);
    }
  };

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}年${month}月${day}日`;
  };

  const handleRegistration = async () => {
    if (!validateForm()) return;

    if (!user) {
      Alert.alert('エラー', 'ユーザー情報が取得できません。');
      return;
    }

    try {
      setLoading(true);

      // 生徒情報をstudentsテーブルに保存
      const { error: insertError } = await supabase
        .from('students')
        .insert({
          user_id: user.id,
          full_name: formData.fullName.trim(),
          furigana_name: formData.furiganaName.trim() || null,
          grade: formData.grade.trim() || null,
          school_attended: formData.schoolAttended.trim() || null,
          parent_name: formData.parentName.trim(),
          parent_phone_number: formData.parentPhoneNumber.trim() || null,
          enrollment_date: enrollmentDate.toISOString().split('T')[0],
          status: 'في籍中',
        });

      if (insertError) {
        throw insertError;
      }

      // チャットグループの自動作成
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id, full_name')
        .eq('user_id', user.id)
        .single();

      if (!studentError && studentData) {
        await supabase
          .from('chat_groups')
          .insert({
            student_id: studentData.id,
            group_name: `${studentData.full_name}さんのチャット`,
          });
      }

      Alert.alert(
        '登録完了',
        'お子様の情報が正常に登録されました。東大伴走をご利用いただけます。',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(tabs)'),
          },
        ]
      );
    } catch (error: any) {
      // エラーはAlertで表示するため、console.errorは削除
      Alert.alert('エラー', '生徒情報の登録に失敗しました。しばらく時間をおいて再度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Image source={require('../logo.png')} style={styles.logo} />
            <Text style={styles.title}>お子様情報の登録</Text>
            <Text style={styles.subtitle}>
              東大伴走をご利用いただくために、{'\n'}
              お子様の基本情報をご入力ください。
            </Text>
          </View>

          <View style={styles.formContainer}>
            <View style={styles.sectionHeader}>
              <User size={20} color="#3B82F6" />
              <Text style={styles.sectionTitle}>お子様の情報</Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                お子様の氏名 <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="例：田中 太郎"
                value={formData.fullName}
                onChangeText={(value) => handleInputChange('fullName', value)}
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>フリガナ（任意）</Text>
              <TextInput
                style={styles.input}
                placeholder="例：タナカ タロウ"
                value={formData.furiganaName}
                onChangeText={(value) => handleInputChange('furiganaName', value)}
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>学年（任意）</Text>
              <TextInput
                style={styles.input}
                placeholder="例：小学5年生"
                value={formData.grade}
                onChangeText={(value) => handleInputChange('grade', value)}
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>通塾先など（任意）</Text>
              <TextInput
                style={styles.input}
                placeholder="例：○○塾"
                value={formData.schoolAttended}
                onChangeText={(value) => handleInputChange('schoolAttended', value)}
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>入会日</Text>
              <TouchableOpacity 
                style={styles.dateInput}
                onPress={() => setShowDatePicker(true)}
              >
                <Text style={styles.dateText}>{formatDate(enrollmentDate)}</Text>
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={enrollmentDate}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDateChange}
                maximumDate={new Date()}
              />
            )}

            <View style={styles.sectionHeader}>
              <School size={20} color="#3B82F6" />
              <Text style={styles.sectionTitle}>保護者の情報</Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>
                保護者氏名 <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={styles.input}
                placeholder="例：田中 花子"
                value={formData.parentName}
                onChangeText={(value) => handleInputChange('parentName', value)}
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>電話番号（任意）</Text>
              <TextInput
                style={styles.input}
                placeholder="例：090-1234-5678"
                value={formData.parentPhoneNumber}
                onChangeText={(value) => handleInputChange('parentPhoneNumber', value)}
                keyboardType="phone-pad"
                placeholderTextColor="#94A3B8"
              />
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegistration}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>登録を完了する</Text>
              )}
            </TouchableOpacity>

            <Text style={styles.note}>
              <Text style={styles.required}>*</Text> は必須項目です。{'\n'}
              その他の項目は後から変更することも可能です。
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
  },
  logo: {
    width: 200,
    height: 50,
    marginBottom: 16,
    resizeMode: 'contain',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginLeft: 8,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    fontSize: 16,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dateInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dateText: {
    fontSize: 16,
    color: '#1E293B',
  },
  button: {
    backgroundColor: '#3B82F6',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  note: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 18,
  },
});