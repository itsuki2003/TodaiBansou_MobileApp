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
import { useLocalSearchParams, useRouter } from 'expo-router';
import { format, parseISO, differenceInHours } from 'date-fns';
import { ja } from 'date-fns/locale';

import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import {
  LessonForCalendar,
  AbsenceRequestFormData,
  AbsenceTimeCheck,
  RequestError,
  RequestSubmissionResponse,
} from '../types/requests';

export default function AbsenceRequestScreen() {
  const router = useRouter();
  const { user, selectedStudent } = useAuth();
  const params = useLocalSearchParams();
  const lessonId = params.lessonId as string;

  const [lesson, setLesson] = useState<LessonForCalendar | null>(null);
  const [formData, setFormData] = useState<AbsenceRequestFormData>({
    lesson_slot_id: lessonId || '',
    reason: '',
  });
  const [timeCheck, setTimeCheck] = useState<AbsenceTimeCheck | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<RequestError | null>(null);

  // 授業情報の取得
  const fetchLessonData = useCallback(async () => {
    if (!user || !selectedStudent || !lessonId) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fetchError } = await supabase
        .from('lesson_slots')
        .select(`
          *,
          teachers (full_name),
          absence_requests (id, status)
        `)
        .eq('id', lessonId)
        .eq('student_id', selectedStudent.id)
        .single();

      if (fetchError) throw fetchError;

      if (!data) {
        throw new Error('指定された授業が見つかりません');
      }

      // 時間制限をチェック（JST基準で正確に計算）
      const lessonDateTime = new Date(`${data.slot_date}T${data.start_time}+09:00`); // JST明示
      const now = new Date();
      
      // サーバー時刻との差異を考慮（必要に応じて調整）
      const hoursUntilLesson = differenceInHours(lessonDateTime, now);
      const minutesUntilLesson = (lessonDateTime.getTime() - now.getTime()) / (1000 * 60);

      let canRequest = true;
      let deadlineMessage = '';
      let timeRemaining;

      // 5時間 = 300分前チェック
      if (minutesUntilLesson < 300) {
        canRequest = false;
        if (minutesUntilLesson < 0) {
          deadlineMessage = '授業が既に開始されているため、欠席申請はできません';
        } else {
          deadlineMessage = '授業開始5時間前を過ぎているため、欠席申請はできません';
        }
      } else {
        const deadlineTime = new Date(lessonDateTime.getTime() - 5 * 60 * 60 * 1000);
        deadlineMessage = `申請期限: ${format(deadlineTime, 'M月d日 HH:mm', { locale: ja })}まで`;
        
        const remainingMinutes = minutesUntilLesson - 300;
        timeRemaining = {
          hours: Math.floor(remainingMinutes / 60),
          minutes: Math.floor(remainingMinutes % 60),
        };
      }

      // 既に申請済みかチェック
      const hasAbsenceRequest = data.absence_requests && data.absence_requests.length > 0;

      if (hasAbsenceRequest) {
        canRequest = false;
        deadlineMessage = 'この授業は既に欠席申請済みです';
      }

      // 過去の授業かチェック
      if (lessonDateTime < now) {
        canRequest = false;
        deadlineMessage = '過去の授業のため、欠席申請はできません';
      }

      const lessonData: LessonForCalendar = {
        ...data,
        teacher_name: data.teachers?.full_name,
        canRequestAbsence: canRequest,
        hasAbsenceRequest,
        absenceRequestStatus: data.absence_requests?.[0]?.status,
      };

      setLesson(lessonData);
      setTimeCheck({
        canRequest,
        timeRemaining,
        deadlineMessage,
      });

      setFormData(prev => ({
        ...prev,
        lesson_slot_id: data.id,
      }));

    } catch (err) {
      console.error('授業データ取得エラー:', err);
      setError({
        type: 'network',
        message: '授業情報の取得に失敗しました',
        details: err instanceof Error ? err.message : '不明なエラー',
        recoverable: true,
      });
    } finally {
      setLoading(false);
    }
  }, [user, selectedStudent, lessonId]);

  // フォームバリデーション
  const validateForm = (): boolean => {
    if (!formData.reason.trim()) {
      setError({
        type: 'validation',
        message: '欠席理由を入力してください',
        field: 'reason',
        recoverable: true,
      });
      return false;
    }

    if (formData.reason.length < 5) {
      setError({
        type: 'validation',
        message: '欠席理由は5文字以上で入力してください',
        field: 'reason',
        recoverable: true,
      });
      return false;
    }

    if (!timeCheck?.canRequest) {
      setError({
        type: 'time_limit',
        message: timeCheck?.deadlineMessage || '申請期限を過ぎています',
        recoverable: false,
      });
      return false;
    }

    return true;
  };

  // 欠席申請の送信
  const submitAbsenceRequest = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    setError(null);

    try {
      // 欠席申請を挿入
      const { data, error: submitError } = await supabase
        .from('absence_requests')
        .insert([{
          student_id: selectedStudent!.id,
          lesson_slot_id: formData.lesson_slot_id,
          reason: formData.reason.trim(),
          request_timestamp: new Date().toISOString(),
          status: '未振替',
        }])
        .select()
        .single();

      if (submitError) throw submitError;

      // 同時に授業ステータスを「欠席」に更新
      const { error: updateLessonError } = await supabase
        .from('lesson_slots')
        .update({ status: '欠席' })
        .eq('id', formData.lesson_slot_id);

      if (updateLessonError) {
        console.error('授業ステータス更新エラー:', updateLessonError);
        // エラーがあっても欠席申請自体は成功しているので続行
      }

      // 成功メッセージ
      Alert.alert(
        '申請完了',
        '欠席申請を受け付けました。\n\n振替授業の日程については、後日講師または運営からご連絡いたします。',
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
      console.error('欠席申請エラー:', err);
      setError({
        type: 'network',
        message: '欠席申請の送信に失敗しました',
        details: err instanceof Error ? err.message : '不明なエラー',
        recoverable: true,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // 確認ダイアログ
  const showConfirmDialog = () => {
    if (!lesson) return;

    const lessonInfo = `${format(parseISO(lesson.slot_date), 'M月d日(E)', { locale: ja })} ${lesson.start_time.slice(0, 5)}-${lesson.end_time.slice(0, 5)}`;
    
    Alert.alert(
      '欠席申請の確認',
      `以下の授業の欠席申請を行います。\n\n${lessonInfo}\n${lesson.slot_type}\n講師: ${lesson.teacher_name || '未定'}\n\n欠席理由: ${formData.reason}\n\nよろしいですか？`,
      [
        {
          text: 'キャンセル',
          style: 'cancel',
        },
        {
          text: '申請する',
          onPress: submitAbsenceRequest,
        },
      ]
    );
  };

  // 初期データ取得
  useEffect(() => {
    fetchLessonData();
  }, [fetchLessonData]);

  // ローディング表示
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>授業情報を読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // エラー表示
  if (error && !lesson) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>エラー</Text>
          <Text style={styles.errorMessage}>{error.message}</Text>
          {error.recoverable && (
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => {
                setError(null);
                fetchLessonData();
              }}
            >
              <Text style={styles.retryButtonText}>再試行</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>戻る</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  if (!lesson) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>授業が見つかりません</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>戻る</Text>
          </TouchableOpacity>
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
        <Text style={styles.headerTitle}>欠席申請</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 授業情報 */}
        <View style={styles.lessonCard}>
          <Text style={styles.sectionTitle}>授業情報</Text>
          <View style={styles.lessonInfo}>
            <Text style={styles.lessonDate}>
              {format(parseISO(lesson.slot_date), 'M月d日(E)', { locale: ja })}
            </Text>
            <Text style={styles.lessonTime}>
              {lesson.start_time.slice(0, 5)} - {lesson.end_time.slice(0, 5)}
            </Text>
            <Text style={styles.lessonType}>{lesson.slot_type}</Text>
            {lesson.teacher_name && (
              <Text style={styles.lessonTeacher}>
                講師: {lesson.teacher_name}
              </Text>
            )}
          </View>
        </View>

        {/* 申請期限の警告 */}
        <View style={[
          styles.deadlineCard,
          !timeCheck?.canRequest && styles.deadlineCardError
        ]}>
          <Text style={[
            styles.deadlineText,
            !timeCheck?.canRequest && styles.deadlineTextError
          ]}>
            {timeCheck?.deadlineMessage}
          </Text>
          {timeCheck?.timeRemaining && (
            <Text style={styles.timeRemainingText}>
              残り約 {timeCheck.timeRemaining.hours}時間{timeCheck.timeRemaining.minutes}分
            </Text>
          )}
        </View>

        {/* 欠席理由入力 */}
        <View style={styles.formSection}>
          <Text style={styles.formLabel}>
            欠席理由 <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={[
              styles.textInput,
              error?.field === 'reason' && styles.textInputError
            ]}
            placeholder="欠席理由を詳しく入力してください（例：体調不良、家族の予定など）"
            value={formData.reason}
            onChangeText={(text) => {
              setFormData(prev => ({ ...prev, reason: text }));
              if (error?.field === 'reason') {
                setError(null);
              }
            }}
            multiline
            numberOfLines={4}
            maxLength={200}
            editable={timeCheck?.canRequest}
          />
          <Text style={styles.charCount}>
            {formData.reason.length}/200文字
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
              (!timeCheck?.canRequest || !formData.reason.trim() || submitting) && styles.submitButtonDisabled
            ]}
            onPress={showConfirmDialog}
            disabled={!timeCheck?.canRequest || !formData.reason.trim() || submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={[
                styles.submitButtonText,
                (!timeCheck?.canRequest || !formData.reason.trim()) && styles.submitButtonTextDisabled
              ]}>
                欠席申請を送信
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* 注意事項 */}
        <View style={styles.noticeContainer}>
          <Text style={styles.noticeTitle}>📋 注意事項</Text>
          <Text style={styles.noticeText}>
            • 欠席申請は授業開始5時間前まで可能です{'\n'}
            • 振替授業の日程は後日ご連絡いたします{'\n'}
            • 緊急時は直接講師または運営にご連絡ください{'\n'}
            • 申請後のキャンセルはできません
          </Text>
        </View>

        {/* 底部余白 */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#DC2626',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '600',
  },
  lessonCard: {
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
  },
  lessonInfo: {
    gap: 8,
  },
  lessonDate: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#3B82F6',
  },
  lessonTime: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  lessonType: {
    fontSize: 14,
    color: '#6B7280',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  lessonTeacher: {
    fontSize: 14,
    color: '#6B7280',
  },
  deadlineCard: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  deadlineCardError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
  },
  deadlineText: {
    fontSize: 14,
    color: '#92400E',
    fontWeight: '500',
  },
  deadlineTextError: {
    color: '#991B1B',
  },
  timeRemainingText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
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
    marginBottom: 8,
  },
  required: {
    color: '#DC2626',
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
  textInputError: {
    borderColor: '#DC2626',
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
  submitButtonTextDisabled: {
    color: '#9CA3AF',
  },
  noticeContainer: {
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E40AF',
    marginBottom: 8,
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