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
    requested_end_time: '17:00',
    teacher_id: '',
    lesson_type: '通常授業', // 授業タイプを追加
    notes: '',
  });

  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [availableSlots, setAvailableSlots] = useState<AvailableTimeSlot[]>([]);
  const [timeSlotOptions] = useState<TimeSlotOption[]>([
    { label: '15:00 - 16:00', value: '15:00-16:00', isAvailable: true },
    { label: '16:00 - 17:00', value: '16:00-17:00', isAvailable: true },
    { label: '17:00 - 18:00', value: '17:00-18:00', isAvailable: true },
    { label: '18:00 - 19:00', value: '18:00-19:00', isAvailable: true },
    { label: '19:00 - 20:00', value: '19:00-20:00', isAvailable: true },
    { label: '20:00 - 21:00', value: '20:00-21:00', isAvailable: true },
  ]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<RequestError | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // 講師一覧の取得
  const fetchTeachers = useCallback(async () => {
    if (!user || !selectedStudent) return;

    try {
      // 担当講師の取得
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select(`
          teacher_id,
          role,
          teachers (
            id,
            full_name,
            account_status
          )
        `)
        .eq('student_id', selectedStudent.id)
        .eq('status', '有効');

      if (assignmentsError) throw assignmentsError;

      const teacherOptions: TeacherOption[] = (assignmentsData || [])
        .filter(assignment => (assignment.teachers as any)?.account_status === '有効')
        .map(assignment => ({
          id: (assignment.teachers as any)!.id,
          name: (assignment.teachers as any)!.full_name,
          isAssigned: true,
          availability: 'unknown' as const,
          specialties: assignment.role === '面談担当（リスト編集可）' 
            ? ['面談', '学習プランニング'] 
            : ['授業'],
        }));

      setTeachers(teacherOptions);

      // デフォルトで面談担当講師を選択
      const interviewTeacher = teacherOptions.find(t => 
        t.specialties?.includes('面談')
      );
      if (interviewTeacher && !formData.teacher_id) {
        setFormData(prev => ({ ...prev, teacher_id: interviewTeacher.id }));
      }

    } catch (err) {
      // エラーハンドリング: 講師データ取得エラー
      setError({
        type: 'network',
        message: '講師情報の取得に失敗しました',
        details: err instanceof Error ? err.message : '不明なエラー',
        recoverable: true,
      });
    }
  }, [user, selectedStudent, formData.teacher_id]);

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

    // 授業時間の長さチェック（30分〜120分）
    const startMinutes = parseInt(startTime.split(':')[0]) * 60 + parseInt(startTime.split(':')[1]);
    const endMinutes = parseInt(endTime.split(':')[0]) * 60 + parseInt(endTime.split(':')[1]);
    const durationMinutes = endMinutes - startMinutes;

    if (durationMinutes < 30) {
      setError({
        type: 'validation',
        message: '授業時間は30分以上に設定してください',
        field: 'time',
        recoverable: true,
      });
      return false;
    }

    if (durationMinutes > 120) {
      setError({
        type: 'validation',
        message: '授業時間は2時間以内に設定してください',
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

      // 講師の空き時間もチェック（指定された場合）
      if (formData.teacher_id) {
        const { data: conflictingLessons, error: lessonCheckError } = await supabase
          .from('lesson_slots')
          .select('id')
          .eq('teacher_id', formData.teacher_id)
          .eq('slot_date', formData.requested_date)
          .gte('end_time', formData.requested_start_time)
          .lte('start_time', formData.requested_end_time)
          .neq('status', '欠席');

        if (lessonCheckError) throw lessonCheckError;

        if (conflictingLessons && conflictingLessons.length > 0) {
          setError({
            type: 'conflict',
            message: '指定した講師は該当時間帯に他の授業があります',
            recoverable: true,
          });
          return;
        }
      }

      const { data, error: submitError } = await supabase
        .from('additional_lesson_requests')
        .insert([{
          student_id: selectedStudent!.id,
          requested_date: formData.requested_date,
          requested_start_time: formData.requested_start_time,
          requested_end_time: formData.requested_end_time,
          teacher_id: formData.teacher_id || null,
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
      `以下の内容で追加授業を申請します。\n\n日時: ${dateStr} ${formData.requested_start_time}-${formData.requested_end_time}\n講師: ${selectedTeacher?.name || '指定なし'}\n備考: ${formData.notes || 'なし'}\n\nよろしいですか？`,
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

  // 時間選択の処理
  const handleTimeSlotSelect = (timeSlot: string) => {
    const [start, end] = timeSlot.split('-');
    setFormData(prev => ({
      ...prev,
      requested_start_time: start,
      requested_end_time: end,
    }));
  };

  // 初期データ取得
  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      await fetchTeachers();
      setLoading(false);
    };

    initialize();
  }, [fetchTeachers]);

  // ローディング表示
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>講師情報を読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => router.back()}
        >
          <Text style={styles.headerBackText}>‹ 戻る</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>追加授業申請</Text>
        <View style={{ width: 60 }} />
      </View>

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
          <View style={styles.timeSlotGrid}>
            {timeSlotOptions.map((slot) => {
              const isSelected = `${formData.requested_start_time}-${formData.requested_end_time}` === slot.value;
              return (
                <TouchableOpacity
                  key={slot.value}
                  style={[
                    styles.timeSlotButton,
                    isSelected && styles.timeSlotButtonSelected,
                    !slot.isAvailable && styles.timeSlotButtonDisabled,
                  ]}
                  onPress={() => slot.isAvailable && handleTimeSlotSelect(slot.value)}
                  disabled={!slot.isAvailable}
                >
                  <Text style={[
                    styles.timeSlotButtonText,
                    isSelected && styles.timeSlotButtonTextSelected,
                    !slot.isAvailable && styles.timeSlotButtonTextDisabled,
                  ]}>
                    {slot.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          
          {/* カスタム時間入力 */}
          <View style={styles.customTimeContainer}>
            <Text style={styles.customTimeLabel}>または時間を直接入力:</Text>
            <View style={styles.customTimeInputs}>
              <View style={styles.timeInputContainer}>
                <Text style={styles.timeInputLabel}>開始</Text>
                <TextInput
                  style={styles.timeInput}
                  value={formData.requested_start_time}
                  onChangeText={(text) => {
                    setFormData(prev => ({ ...prev, requested_start_time: text }));
                    if (error?.field === 'time') setError(null);
                  }}
                  placeholder="15:00"
                  keyboardType="numeric"
                />
              </View>
              <Text style={styles.timeSeparator}>〜</Text>
              <View style={styles.timeInputContainer}>
                <Text style={styles.timeInputLabel}>終了</Text>
                <TextInput
                  style={styles.timeInput}
                  value={formData.requested_end_time}
                  onChangeText={(text) => {
                    setFormData(prev => ({ ...prev, requested_end_time: text }));
                    if (error?.field === 'time') setError(null);
                  }}
                  placeholder="16:00"
                  keyboardType="numeric"
                />
              </View>
            </View>
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

        {/* 講師選択 */}
        <View style={styles.formSection}>
          <Text style={styles.formLabel}>
            希望講師（任意）
          </Text>
          <View style={styles.teacherList}>
            <TouchableOpacity
              style={[
                styles.teacherOption,
                !formData.teacher_id && styles.teacherOptionSelected,
              ]}
              onPress={() => setFormData(prev => ({ ...prev, teacher_id: '' }))}
            >
              <View style={styles.teacherInfo}>
                <Text style={styles.teacherName}>指定なし</Text>
                <Text style={styles.teacherRole}>運営が最適な講師を選定します</Text>
              </View>
            </TouchableOpacity>
            
            {teachers.map((teacher) => (
              <TouchableOpacity
                key={teacher.id}
                style={[
                  styles.teacherOption,
                  formData.teacher_id === teacher.id && styles.teacherOptionSelected,
                ]}
                onPress={() => setFormData(prev => ({ ...prev, teacher_id: teacher.id }))}
              >
                <View style={styles.teacherInfo}>
                  <Text style={styles.teacherName}>{teacher.name}</Text>
                  <Text style={styles.teacherRole}>
                    {teacher.specialties?.join('・')} {teacher.isAssigned && '（担当講師）'}
                  </Text>
                </View>
                {teacher.isAssigned && (
                  <View style={styles.assignedBadge}>
                    <Text style={styles.assignedBadgeText}>担当</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
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
            • 承認後にカレンダーに授業が追加されます{'\n'}
            • 講師の都合により希望日時を調整する場合があります{'\n'}
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    ...Platform.select({
      ios: {
        paddingTop: 0,
      },
      android: {
        paddingTop: 8,
      },
    }),
  },
  headerBackButton: {
    padding: 8,
  },
  headerBackText: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
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
  timeSlotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  timeSlotButton: {
    flexBasis: '48%',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    position: 'relative',
  },
  timeSlotButtonSelected: {
    borderColor: '#3B82F6',
    backgroundColor: '#EBF8FF',
  },
  timeSlotButtonDisabled: {
    backgroundColor: '#F3F4F6',
    borderColor: '#E5E7EB',
  },
  timeSlotButtonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  timeSlotButtonTextSelected: {
    color: '#1D4ED8',
    fontWeight: '600',
  },
  timeSlotButtonTextDisabled: {
    color: '#9CA3AF',
  },
  customTimeContainer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 16,
  },
  customTimeLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  customTimeInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeInputContainer: {
    flex: 1,
  },
  timeInputLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  timeInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    padding: 10,
    fontSize: 16,
    textAlign: 'center',
  },
  timeSeparator: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
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