import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { format, addDays, parseISO } from 'date-fns';
import { ja } from 'date-fns/locale';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar, ClipboardList } from 'lucide-react-native';

import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import AppHeader from '../components/ui/AppHeader';
import {
  AdditionalLessonRequestFormData,
  TeacherOption,
  AvailableTimeSlot,
  TimeSlotOption,
  RequestError,
} from '../types/requests';

export default function AdditionalLessonRequestScreen() {
  const router = useRouter();
  const { user, selectedStudent } = useAuth();

  const [formData, setFormData] = useState<AdditionalLessonRequestFormData>({
    requested_date: format(addDays(new Date(), 1), 'yyyy-MM-dd'),
    requested_start_time: '16:00',
    requested_end_time: '17:30',
    teacher_id: null,
    lesson_type: '通常授業',
    notes: '',
  });

  const [lessonDuration, setLessonDuration] = useState(90); // デフォルト90分

  const [availableSlots, setAvailableSlots] = useState<AvailableTimeSlot[]>([]);
  const durationOptions = [
    { label: '30分', value: 30 },
    { label: '60分', value: 60 },
    { label: '90分', value: 90 },
    { label: '120分', value: 120 },
  ];

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<RequestError | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);


  // フォームバリデーション
  const validateForm = (): boolean => {
    // 日付チェック
    const requestedDate = new Date(formData.requested_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (requestedDate <= today) {
      setError({
        type: 'validation',
        message: '明日以降の日付を選択してください',
        field: 'requested_date',
        recoverable: true,
      });
      return false;
    }

    // 1ヶ月以上先の日付をチェック
    const oneMonthLater = new Date();
    oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);
    if (requestedDate > oneMonthLater) {
      setError({
        type: 'validation',
        message: '1ヶ月以内の日付を選択してください',
        field: 'requested_date',
        recoverable: true,
      });
      return false;
    }

    // 時間チェック
    const startTime = formData.requested_start_time;
    const endTime = formData.requested_end_time;
    
    if (startTime >= endTime) {
      setError({
        type: 'validation',
        message: '終了時刻は開始時刻より後に設定してください',
        field: 'time',
        recoverable: true,
      });
      return false;
    }

    // 開始時間の形式チェック
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime)) {
      setError({
        type: 'validation',
        message: '開始時間を正しい形式（HH:MM）で入力してください',
        field: 'time',
        recoverable: true,
      });
      return false;
    }

    return true;
  };

  // 追加授業申請の送信
  const submitAdditionalLessonRequest = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    setError(null);

    try {
      // 同じ時間帯の重複申請をチェック
      const { data: existingRequests, error: checkError } = await supabase
        .from('additional_lesson_requests')
        .select('id, status')
        .eq('student_id', selectedStudent!.id)
        .eq('requested_date', formData.requested_date)
        .eq('requested_start_time', formData.requested_start_time)
        .eq('requested_end_time', formData.requested_end_time)
        .eq('status', '申請中');

      if (checkError) throw checkError;

      if (existingRequests && existingRequests.length > 0) {
        setError({
          type: 'conflict',
          message: '同じ日時での申請が既に存在します',
          recoverable: false,
        });
        return;
      }


      const { data, error: submitError } = await supabase
        .from('additional_lesson_requests')
        .insert([{
          student_id: selectedStudent!.id,
          requested_date: formData.requested_date,
          requested_start_time: formData.requested_start_time,
          requested_end_time: formData.requested_end_time,
          teacher_id: null,
          notes: formData.notes?.trim() || null,
          request_timestamp: new Date().toISOString(),
          status: '申請中',
        }])
        .select()
        .single();

      if (submitError) throw submitError;

      // 成功メッセージ
      Alert.alert(
        '申請完了',
        '追加授業の申請を受け付けました。\n\n承認結果については、後日運営からご連絡いたします。承認後、カレンダーに授業が追加されます。',
        [
          {
            text: 'OK',
            onPress: () => {
              router.back();
            },
          },
        ],
        { cancelable: false }
      );

    } catch (err) {
      // エラーはAlertで表示するため、console.errorは削除
      setError({
        type: 'network',
        message: '追加授業申請の送信に失敗しました',
        details: err instanceof Error ? err.message : '不明なエラー',
        recoverable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // 確認ダイアログ
  const showConfirmDialog = () => {
    const selectedTeacher = teachers.find(t => t.id === formData.teacher_id);
    const dateStr = format(parseISO(formData.requested_date), 'M月d日(E)', { locale: ja });
    
    Alert.alert(
      '追加授業申請の確認',
      `以下の内容で追加授業を申請します。\n\n日時: ${dateStr} ${formData.requested_start_time}-${formData.requested_end_time}\n授業タイプ: ${formData.lesson_type}\n備考: ${formData.notes || 'なし'}\n\nよろしいですか？`,
      [
        {
          text: 'キャンセル',
          style: 'cancel',
        },
        {
          text: '申請する',
          onPress: submitAdditionalLessonRequest,
        },
      ]
    );
  };

  // 授業時間変更時の処理
  const handleDurationChange = (duration: number) => {
    setLessonDuration(duration);
    
    // 開始時間から終了時間を自動計算
    const startTime = formData.requested_start_time;
    if (startTime && /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(startTime)) {
      const [hours, minutes] = startTime.split(':').map(Number);
      const startMinutes = hours * 60 + minutes;
      const endMinutes = startMinutes + duration;
      
      const endHours = Math.floor(endMinutes / 60);
      const endMins = endMinutes % 60;
      const endTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
      
      setFormData(prev => ({
        ...prev,
        requested_end_time: endTime,
      }));
    }
  };

  // 開始時間変更時の処理
  const handleStartTimeChange = (startTime: string) => {
    setFormData(prev => ({ ...prev, requested_start_time: startTime }));
    
    // 開始時間が有効な場合、終了時間を自動計算
    if (/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(startTime)) {
      const [hours, minutes] = startTime.split(':').map(Number);
      const startMinutes = hours * 60 + minutes;
      const endMinutes = startMinutes + lessonDuration;
      
      const endHours = Math.floor(endMinutes / 60);
      const endMins = endMinutes % 60;
      const endTime = `${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`;
      
      setFormData(prev => ({
        ...prev,
        requested_end_time: endTime,
      }));
    }
  };

  // 初期データ取得
  useEffect(() => {
    setLoading(false);
  }, []);

  // ローディング表示
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader 
        title="追加授業申請" 
        showBackButton={true}
        onBackPress={() => router.back()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 日付選択 */}
        <View style={styles.formSection}>
          <Text style={styles.formLabel}>
            希望日 <Text style={styles.required}>*</Text>
          </Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateButtonText}>
              {format(parseISO(formData.requested_date), 'yyyy年M月d日(E)', { locale: ja })}
            </Text>
            <View style={styles.dateButtonIconContainer}>
              <Calendar size={20} color="#3B82F6" />
            </View>
          </TouchableOpacity>
        </View>

        {/* 時間選択 */}
        <View style={styles.formSection}>
          <Text style={styles.formLabel}>
            希望時間 <Text style={styles.required}>*</Text>
          </Text>
          
          {/* 開始時間入力 */}
          <View style={styles.timeInputSection}>
            <Text style={styles.timeInputSectionLabel}>開始時間</Text>
            <TextInput
              style={styles.startTimeInput}
              value={formData.requested_start_time}
              onChangeText={(text) => {
                handleStartTimeChange(text);
                if (error?.field === 'time') setError(null);
              }}
              placeholder="16:00"
              keyboardType="numeric"
            />
            <Text style={styles.timeInputHelper}>例: 16:00</Text>
          </View>
          
          {/* 授業時間選択 */}
          <View style={styles.durationSection}>
            <Text style={styles.timeInputSectionLabel}>授業時間</Text>
            <View style={styles.durationButtons}>
              {durationOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.durationButton,
                    lessonDuration === option.value && styles.durationButtonSelected,
                  ]}
                  onPress={() => handleDurationChange(option.value)}
                >
                  <Text style={[
                    styles.durationButtonText,
                    lessonDuration === option.value && styles.durationButtonTextSelected,
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          {/* 終了時間表示 */}
          <View style={styles.endTimeDisplay}>
            <Text style={styles.endTimeLabel}>終了時間: </Text>
            <Text style={styles.endTimeValue}>{formData.requested_end_time}</Text>
          </View>
        </View>

        {/* 授業タイプ選択 */}
        <View style={styles.formSection}>
          <Text style={styles.formLabel}>
            授業タイプ <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.lessonTypeOptions}>
            <TouchableOpacity
              style={[
                styles.lessonTypeOption,
                formData.lesson_type === '通常授業' && styles.lessonTypeOptionSelected,
              ]}
              onPress={() => setFormData(prev => ({ ...prev, lesson_type: '通常授業' }))}
            >
              <Text style={[
                styles.lessonTypeText,
                formData.lesson_type === '通常授業' && styles.lessonTypeTextSelected,
              ]}>
                通常授業
              </Text>
              <Text style={styles.lessonTypeDescription}>
                教科指導・問題演習
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[
                styles.lessonTypeOption,
                formData.lesson_type === '固定面談' && styles.lessonTypeOptionSelected,
              ]}
              onPress={() => setFormData(prev => ({ ...prev, lesson_type: '固定面談' }))}
            >
              <Text style={[
                styles.lessonTypeText,
                formData.lesson_type === '固定面談' && styles.lessonTypeTextSelected,
              ]}>
                面談
              </Text>
              <Text style={styles.lessonTypeDescription}>
                学習相談・進路相談
              </Text>
            </TouchableOpacity>
          </View>
        </View>


        {/* 備考 */}
        <View style={styles.formSection}>
          <Text style={styles.formLabel}>
            備考・特別な要望（任意）
          </Text>
          <TextInput
            style={styles.textInput}
            placeholder="追加授業に関する特別な要望があれば入力してください（例：特定の単元を重点的に、苦手分野の復習など）"
            value={formData.notes}
            onChangeText={(text) => setFormData(prev => ({ ...prev, notes: text }))}
            multiline
            numberOfLines={4}
            maxLength={300}
          />
          <Text style={styles.charCount}>
            {formData.notes?.length || 0}/300文字
          </Text>
        </View>

        {/* エラー表示 */}
        {error && (
          <View style={styles.formErrorContainer}>
            <Text style={styles.formErrorText}>{error.message}</Text>
          </View>
        )}

        {/* 申請ボタン */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              submitting && styles.submitButtonDisabled
            ]}
            onPress={showConfirmDialog}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitButtonText}>
                追加授業を申請
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* 注意事項 */}
        <View style={styles.noticeContainer}>
          <View style={styles.noticeTitleContainer}>
            <ClipboardList size={16} color="#1E40AF" />
            <Text style={styles.noticeTitle}>注意事項</Text>
          </View>
          <Text style={styles.noticeText}>
            • 申請は明日以降1ヶ月以内の日程で受け付けます{'\n'}
            • 担当講師と時間について合意の上ご申請をお願いします{'\n'}
            • 承認後にカレンダーに授業が追加されます{'\n'}
            • 申請後の内容変更は運営までご連絡ください
          </Text>
        </View>

        {/* 底部余白 */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* 日付ピッカー */}
      {showDatePicker && (
        <DateTimePicker
          value={parseISO(formData.requested_date)}
          mode="date"
          display="default"
          minimumDate={addDays(new Date(), 1)}
          maximumDate={addDays(new Date(), 30)}
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) {
              setFormData(prev => ({
                ...prev,
                requested_date: format(selectedDate, 'yyyy-MM-dd')
              }));
              if (error?.field === 'requested_date') setError(null);
            }
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    flex: 1,
    padding: 16,
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
  formSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  required: {
    color: '#DC2626',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 16,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '500',
  },
  dateButtonIconContainer: {
    marginLeft: 8,
  },
  timeInputSection: {
    marginBottom: 20,
  },
  timeInputSectionLabel: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    marginBottom: 8,
  },
  startTimeInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlign: 'center',
    backgroundColor: '#FFFFFF',
  },
  timeInputHelper: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  durationSection: {
    marginBottom: 20,
  },
  durationButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  durationButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  durationButtonSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EBF8FF',
  },
  durationButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  durationButtonTextSelected: {
    color: '#1D4ED8',
    fontWeight: '600',
  },
  endTimeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  endTimeLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  endTimeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
  },
  lessonTypeOptions: {
    flexDirection: 'row',
    gap: 12,
  },
  lessonTypeOption: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  lessonTypeOptionSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EBF8FF',
  },
  lessonTypeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  lessonTypeTextSelected: {
    color: '#1D4ED8',
  },
  lessonTypeDescription: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
  teacherList: {
    gap: 8,
  },
  teacherOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 16,
  },
  teacherOptionSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EBF8FF',
  },
  teacherInfo: {
    flex: 1,
  },
  teacherName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  teacherRole: {
    fontSize: 14,
    color: '#6B7280',
  },
  assignedBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  assignedBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    textAlignVertical: 'top',
    minHeight: 100,
  },
  charCount: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'right',
    marginTop: 4,
  },
  formErrorContainer: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  formErrorText: {
    fontSize: 14,
    color: '#991B1B',
  },
  buttonContainer: {
    marginBottom: 24,
  },
  submitButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  noticeContainer: {
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  noticeTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginLeft: 6,
  },
  noticeText: {
    fontSize: 14,
    color: '#1E40AF',
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 20,
  },
});