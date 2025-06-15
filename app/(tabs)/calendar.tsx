import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  Pressable,
  ActivityIndicator,
  RefreshControl,
  Animated,
  Dimensions,
} from 'react-native';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight,
  Video,
  Clock,
  UserX,
  RefreshCw,
  Plus,
  AlertCircle,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { format, isSameDay, parseISO, startOfMonth, endOfMonth, addDays, subDays } from 'date-fns';
import { ja } from 'date-fns/locale';
import Reanimated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';

import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import AppHeader from '@/components/ui/AppHeader';
import type { Database } from '@/types/database.types';

type LessonSlot = Database['public']['Tables']['lesson_slots']['Row'];
type Teacher = Database['public']['Tables']['teachers']['Row'];

interface LessonSlotWithTeacher extends LessonSlot {
  teachers?: Teacher;
}

interface CalendarDay {
  date: Date;
  lessons: LessonSlotWithTeacher[];
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}

interface MonthData {
  title: string;
  days: CalendarDay[];
}

const { width: screenWidth } = Dimensions.get('window');

export default function CalendarScreen() {
  const { user, selectedStudent } = useAuth();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [monthLessons, setMonthLessons] = useState<LessonSlotWithTeacher[]>([]);
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<LessonSlotWithTeacher | null>(null);
  const [animatedValue] = useState(new Animated.Value(0));

  // 月のデータを生成
  const generateMonthData = useCallback((date: Date, lessons: LessonSlotWithTeacher[]): MonthData => {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    const startDate = subDays(monthStart, monthStart.getDay());
    const endDate = addDays(monthEnd, 6 - monthEnd.getDay());
    
    const days: CalendarDay[] = [];
    let currentDate = startDate;
    
    while (currentDate <= endDate) {
      const dayLessons = lessons.filter(lesson => 
        lesson.slot_date && isSameDay(parseISO(lesson.slot_date), currentDate)
      );
      
      days.push({
        date: new Date(currentDate),
        lessons: dayLessons,
        isCurrentMonth: currentDate.getMonth() === date.getMonth(),
        isToday: isSameDay(currentDate, new Date()),
        isSelected: isSameDay(currentDate, selectedDate),
      });
      
      currentDate = addDays(currentDate, 1);
    }
    
    return {
      title: format(date, 'yyyy年M月', { locale: ja }),
      days,
    };
  }, [selectedDate]);

  // 授業データを取得
  const fetchLessons = useCallback(async (month: Date) => {
    if (!selectedStudent) return;

    try {
      setLoading(true);
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const { data, error } = await supabase
        .from('lesson_slots')
        .select(`
          *,
          teachers (
            id,
            full_name,
            email
          )
        `)
        .eq('student_id', selectedStudent.id)
        .gte('slot_date', format(monthStart, 'yyyy-MM-dd'))
        .lte('slot_date', format(monthEnd, 'yyyy-MM-dd'))
        .order('slot_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;

      setMonthLessons(data || []);
      
      // 今日の授業があれば通知
      const todayLessons = (data || []).filter(lesson => 
        lesson.slot_date && isSameDay(parseISO(lesson.slot_date), new Date())
      );
      
      if (todayLessons.length > 0) {
        showNotification({
          type: 'info',
          title: '今日の授業',
          message: `本日は${todayLessons.length}件の授業があります`,
          autoHide: true,
          duration: 3000,
        });
      }
      
    } catch (error) {
      console.error('Error fetching lessons:', error);
      showNotification({
        type: 'error',
        title: 'エラー',
        message: '授業データの取得に失敗しました',
        autoHide: true,
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedStudent, showNotification]);

  useEffect(() => {
    if (selectedStudent) {
      fetchLessons(currentMonth);
    } else {
      setLoading(false);
    }
  }, [currentMonth, selectedStudent, fetchLessons]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchLessons(currentMonth);
  }, [currentMonth, fetchLessons]);

  const handlePrevMonth = () => {
    const today = new Date();
    const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 6, 1);
    const prevMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1);
    
    if (prevMonth >= sixMonthsAgo) {
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setCurrentMonth(prevMonth);
        animatedValue.setValue(0);
      });
    }
  };

  const handleNextMonth = () => {
    const today = new Date();
    const threeMonthsLater = new Date(today.getFullYear(), today.getMonth() + 3, 1);
    const nextMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    
    if (nextMonth <= threeMonthsLater) {
      Animated.timing(animatedValue, {
        toValue: -1,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setCurrentMonth(nextMonth);
        animatedValue.setValue(0);
      });
    }
  };

  const handleDateSelect = (day: CalendarDay) => {
    if (day.isCurrentMonth) {
      setSelectedDate(day.date);
    }
  };

  const handleLessonPress = (lesson: LessonSlotWithTeacher) => {
    setSelectedLesson(lesson);
    if (lesson.status === '予定通り') {
      setShowAbsenceModal(true);
    }
  };

  const handleAbsenceRequest = () => {
    setShowAbsenceModal(false);
    if (selectedLesson) {
      router.push({
        pathname: '/absence-request',
        params: { lessonId: selectedLesson.id }
      });
    }
  };

  const handleAddLessonRequest = () => {
    router.push('/additional-lesson-request');
  };

  const getLessonTypeColor = (type: string) => {
    switch (type) {
      case '通常授業': return '#3B82F6';
      case '固定面談': return '#10B981';
      case '振替授業': return '#F59E0B';
      case '追加授業': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  const getLessonStatusIcon = (status: string, type: string) => {
    if (status === '欠席') return <UserX size={16} color="#EF4444" />;
    if (type === '振替授業') return <RefreshCw size={16} color="#F59E0B" />;
    if (type === '追加授業') return <Plus size={16} color="#8B5CF6" />;
    return <Clock size={16} color="#3B82F6" />;
  };

  const monthData = generateMonthData(currentMonth, monthLessons);
  const selectedDayLessons = monthData.days.find(day => 
    isSameDay(day.date, selectedDate)
  )?.lessons || [];

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader title="授業予定" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>カレンダーを読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!selectedStudent) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader title="授業予定" />
        <View style={styles.emptyContainer}>
          <AlertCircle size={48} color="#9CA3AF" />
          <Text style={styles.emptyText}>生徒が選択されていません</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="授業予定" />
      
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#3B82F6']}
            tintColor="#3B82F6"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* カレンダーヘッダー */}
        <View style={styles.calendarHeader}>
          <TouchableOpacity 
            onPress={handlePrevMonth}
            style={styles.monthButton}
          >
            <ChevronLeft size={24} color="#374151" />
          </TouchableOpacity>
          
          <Animated.View style={{
            transform: [{
              translateX: animatedValue.interpolate({
                inputRange: [-1, 0, 1],
                outputRange: [-screenWidth, 0, screenWidth],
              })
            }]
          }}>
            <Text style={styles.monthTitle}>{monthData.title}</Text>
          </Animated.View>
          
          <TouchableOpacity 
            onPress={handleNextMonth}
            style={styles.monthButton}
          >
            <ChevronRight size={24} color="#374151" />
          </TouchableOpacity>
        </View>

        {/* 曜日ヘッダー */}
        <View style={styles.weekHeader}>
          {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
            <View key={day} style={styles.weekDay}>
              <Text style={[
                styles.weekDayText,
                index === 0 && styles.sundayText,
                index === 6 && styles.saturdayText,
              ]}>
                {day}
              </Text>
            </View>
          ))}
        </View>

        {/* カレンダーグリッド */}
        <View style={styles.calendarGrid}>
          {monthData.days.map((day, index) => (
            <TouchableOpacity
              key={`${day.date.toISOString()}`}
              style={[
                styles.calendarCell,
                !day.isCurrentMonth && styles.otherMonthCell,
                day.isToday && styles.todayCell,
                day.isSelected && styles.selectedCell,
              ]}
              onPress={() => handleDateSelect(day)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.dateText,
                !day.isCurrentMonth && styles.otherMonthText,
                day.isToday && styles.todayText,
                day.isSelected && styles.selectedText,
                index % 7 === 0 && day.isCurrentMonth && styles.sundayText,
                index % 7 === 6 && day.isCurrentMonth && styles.saturdayText,
              ]}>
                {day.date.getDate()}
              </Text>
              
              {day.lessons.length > 0 && (
                <View style={styles.lessonIndicators}>
                  {day.lessons.slice(0, 3).map((lesson, i) => (
                    <View
                      key={lesson.id}
                      style={[
                        styles.lessonDot,
                        { backgroundColor: getLessonTypeColor(lesson.slot_type) },
                      ]}
                    />
                  ))}
                  {day.lessons.length > 3 && (
                    <Text style={styles.moreLessons}>+{day.lessons.length - 3}</Text>
                  )}
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* 選択日の授業一覧 */}
        <View style={styles.daySchedule}>
          <View style={styles.scheduleHeader}>
            <CalendarIcon size={20} color="#3B82F6" />
            <Text style={styles.scheduleTitle}>
              {format(selectedDate, 'M月d日（E）', { locale: ja })}の予定
            </Text>
          </View>

          {selectedDayLessons.length === 0 ? (
            <View style={styles.noLessons}>
              <Text style={styles.noLessonsText}>この日の授業はありません</Text>
            </View>
          ) : (
            <Reanimated.View entering={FadeInDown} exiting={FadeOutUp}>
              {selectedDayLessons.map((lesson) => (
                <TouchableOpacity
                  key={lesson.id}
                  style={styles.lessonCard}
                  onPress={() => handleLessonPress(lesson)}
                  activeOpacity={0.8}
                >
                  <View style={styles.lessonHeader}>
                    <View style={styles.lessonTime}>
                      {getLessonStatusIcon(lesson.status, lesson.slot_type)}
                      <Text style={styles.lessonTimeText}>
                        {lesson.start_time?.substring(0, 5)} - {lesson.end_time?.substring(0, 5)}
                      </Text>
                    </View>
                    <View style={[
                      styles.lessonTypeBadge,
                      { backgroundColor: `${getLessonTypeColor(lesson.slot_type)}20` }
                    ]}>
                      <Text style={[
                        styles.lessonTypeText,
                        { color: getLessonTypeColor(lesson.slot_type) }
                      ]}>
                        {lesson.slot_type}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.lessonInfo}>
                    <Text style={styles.teacherName}>
                      {lesson.teachers?.full_name || '講師未定'}
                    </Text>
                    
                    {lesson.status !== '予定通り' && (
                      <Text style={[
                        styles.lessonStatus,
                        lesson.status === '欠席' && styles.absenceStatus,
                      ]}>
                        {lesson.status}
                      </Text>
                    )}
                  </View>

                  {lesson.google_meet_link && lesson.status === '予定通り' && (
                    <TouchableOpacity 
                      style={styles.meetButton}
                      onPress={() => {
                        // TODO: Open Google Meet link
                        showNotification({
                          type: 'info',
                          title: 'Google Meet',
                          message: '授業の開始時間になったらリンクが有効になります',
                          autoHide: true,
                        });
                      }}
                    >
                      <Video size={16} color="#FFFFFF" />
                      <Text style={styles.meetButtonText}>授業に参加</Text>
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
              ))}
            </Reanimated.View>
          )}

          {/* 追加授業申請ボタン */}
          <TouchableOpacity 
            style={styles.addLessonButton}
            onPress={handleAddLessonRequest}
          >
            <Plus size={20} color="#3B82F6" />
            <Text style={styles.addLessonText}>追加授業を申請する</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* 欠席申請モーダル */}
      <Modal
        visible={showAbsenceModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAbsenceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>欠席連絡</Text>
            
            {selectedLesson && (
              <View style={styles.modalContent}>
                <Text style={styles.modalText}>
                  以下の授業を欠席しますか？
                </Text>
                
                <View style={styles.lessonDetails}>
                  <Text style={styles.detailLabel}>日時</Text>
                  <Text style={styles.detailValue}>
                    {selectedLesson.slot_date && format(parseISO(selectedLesson.slot_date), 'M月d日（E）', { locale: ja })}
                    {' '}
                    {selectedLesson.start_time?.substring(0, 5)} - {selectedLesson.end_time?.substring(0, 5)}
                  </Text>
                  
                  <Text style={styles.detailLabel}>講師</Text>
                  <Text style={styles.detailValue}>
                    {selectedLesson.teachers?.full_name || '未定'}
                  </Text>
                  
                  <Text style={styles.detailLabel}>種別</Text>
                  <Text style={styles.detailValue}>{selectedLesson.slot_type}</Text>
                </View>
                
                <Text style={styles.warningText}>
                  ※ 授業開始5時間前までの連絡が必要です
                </Text>
              </View>
            )}
            
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowAbsenceModal(false)}
              >
                <Text style={styles.cancelButtonText}>キャンセル</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleAbsenceRequest}
              >
                <Text style={styles.confirmButtonText}>欠席連絡をする</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#9CA3AF',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  monthButton: {
    padding: 8,
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
  },
  weekHeader: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  weekDay: {
    flex: 1,
    alignItems: 'center',
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  calendarCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  otherMonthCell: {
    opacity: 0.3,
  },
  todayCell: {
    backgroundColor: '#EBF8FF',
    borderRadius: 8,
  },
  selectedCell: {
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  dateText: {
    fontSize: 16,
    color: '#111827',
    marginBottom: 4,
  },
  otherMonthText: {
    color: '#9CA3AF',
  },
  todayText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  selectedText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  sundayText: {
    color: '#EF4444',
  },
  saturdayText: {
    color: '#3B82F6',
  },
  lessonIndicators: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 4,
    gap: 2,
  },
  lessonDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  moreLessons: {
    fontSize: 8,
    color: '#6B7280',
    marginLeft: 2,
  },
  daySchedule: {
    margin: 16,
    backgroundColor: '#FFFFFF',
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
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  scheduleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  noLessons: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  noLessonsText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  lessonCard: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  lessonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  lessonTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lessonTimeText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  lessonTypeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  lessonTypeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  lessonInfo: {
    marginBottom: 8,
  },
  teacherName: {
    fontSize: 14,
    color: '#374151',
  },
  lessonStatus: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  absenceStatus: {
    color: '#EF4444',
    fontWeight: '500',
  },
  meetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 6,
    paddingVertical: 8,
    gap: 6,
  },
  meetButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  addLessonButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EBF8FF',
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 16,
    gap: 8,
  },
  addLessonText: {
    color: '#3B82F6',
    fontSize: 16,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalContent: {
    marginBottom: 24,
  },
  modalText: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 16,
    textAlign: 'center',
  },
  lessonDetails: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
    marginBottom: 12,
  },
  warningText: {
    fontSize: 12,
    color: '#EF4444',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F3F4F6',
  },
  cancelButtonText: {
    color: '#6B7280',
    fontWeight: '500',
  },
  confirmButton: {
    backgroundColor: '#EF4444',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
});