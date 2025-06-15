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
  Users,
  Filter,
  X,
} from 'lucide-react-native';
import { router } from 'expo-router';
import { format, isSameDay, parseISO, startOfMonth, endOfMonth, addDays, subDays } from 'date-fns';
import { ja } from 'date-fns/locale';
import Reanimated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';

import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { TeacherGuard } from '../../components/common/RoleGuard';
import AppHeader from '@/components/ui/AppHeader';
import type { Database } from '@/types/database.types';

type LessonSlot = Database['public']['Tables']['lesson_slots']['Row'];
type Student = Database['public']['Tables']['students']['Row'];

interface LessonSlotWithStudent extends LessonSlot {
  students?: Student;
}

interface CalendarDay {
  date: Date;
  lessons: LessonSlotWithStudent[];
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
}

interface MonthData {
  title: string;
  days: CalendarDay[];
}

const { width: screenWidth } = Dimensions.get('window');

export default function TeacherCalendarScreen() {
  const { user, userRole } = useAuth();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [monthLessons, setMonthLessons] = useState<LessonSlotWithStudent[]>([]);
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [assignedStudents, setAssignedStudents] = useState<Student[]>([]);
  const [selectedStudentFilter, setSelectedStudentFilter] = useState<string>('all');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [animatedValue] = useState(new Animated.Value(0));

  // 講師IDを取得
  useEffect(() => {
    const fetchTeacherId = async () => {
      if (!user || userRole !== 'teacher') return;

      try {
        const { data: teacherData, error } = await supabase
          .from('teachers')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        if (teacherData) {
          setTeacherId(teacherData.id);
        }
      } catch (error) {
        console.error('Error fetching teacher ID:', error);
        showNotification({
          type: 'error',
          title: 'エラー',
          message: '講師情報の取得に失敗しました',
          autoHide: true,
        });
      }
    };

    fetchTeacherId();
  }, [user, userRole, showNotification]);

  // 担当生徒を取得
  useEffect(() => {
    const fetchAssignedStudents = async () => {
      if (!teacherId) return;

      try {
        const { data, error } = await supabase
          .from('assignments')
          .select(`
            student_id,
            students (
              id,
              full_name,
              grade
            )
          `)
          .eq('teacher_id', teacherId)
          .eq('status', '有効');

        if (error) throw error;

        const students = data
          ?.map(a => a.students)
          .filter(Boolean) as Student[];
        
        setAssignedStudents(students || []);
      } catch (error) {
        console.error('Error fetching assigned students:', error);
      }
    };

    if (teacherId) {
      fetchAssignedStudents();
    }
  }, [teacherId]);

  // 月のデータを生成
  const generateMonthData = useCallback((date: Date, lessons: LessonSlotWithStudent[]): MonthData => {
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
    if (!teacherId) return;

    try {
      setLoading(true);
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const { data, error } = await supabase
        .from('lesson_slots')
        .select(`
          *,
          students (
            id,
            full_name,
            grade,
            school_attended
          )
        `)
        .eq('teacher_id', teacherId)
        .gte('slot_date', format(monthStart, 'yyyy-MM-dd'))
        .lte('slot_date', format(monthEnd, 'yyyy-MM-dd'))
        .order('slot_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;

      setMonthLessons(data || []);
      
      // 今日の授業数を通知
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
  }, [teacherId, showNotification]);

  useEffect(() => {
    if (teacherId) {
      fetchLessons(currentMonth);
    } else {
      setLoading(false);
    }
  }, [currentMonth, teacherId, fetchLessons]);

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

  const handleLessonPress = (lesson: LessonSlotWithStudent) => {
    if (lesson.google_meet_link && lesson.status === '予定通り') {
      // TODO: Open Google Meet link
      showNotification({
        type: 'info',
        title: 'Google Meet',
        message: '授業の開始時間になったらリンクが有効になります',
        autoHide: true,
      });
    }
  };

  const handleStudentPress = (student: Student) => {
    router.push({
      pathname: '/teacher-student-detail',
      params: { studentId: student.id }
    });
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

  // フィルター適用
  const filteredLessons = selectedStudentFilter === 'all' 
    ? monthLessons 
    : monthLessons.filter(lesson => lesson.student_id === selectedStudentFilter);

  const monthData = generateMonthData(currentMonth, filteredLessons);
  const selectedDayLessons = monthData.days.find(day => 
    isSameDay(day.date, selectedDate)
  )?.lessons || [];

  if (loading && !refreshing) {
    return (
      <TeacherGuard>
        <SafeAreaView style={styles.container}>
          <AppHeader title="授業スケジュール" />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>カレンダーを読み込み中...</Text>
          </View>
        </SafeAreaView>
      </TeacherGuard>
    );
  }

  return (
    <TeacherGuard>
      <SafeAreaView style={styles.container}>
        <AppHeader 
          title="授業スケジュール"
          rightElement={
            <TouchableOpacity onPress={() => setShowFilterModal(true)}>
              <Filter size={24} color="#374151" />
            </TouchableOpacity>
          }
        />
        
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

          {/* フィルター表示 */}
          {selectedStudentFilter !== 'all' && (
            <View style={styles.activeFilter}>
              <Text style={styles.activeFilterText}>
                {assignedStudents.find(s => s.id === selectedStudentFilter)?.full_name}の授業のみ表示
              </Text>
              <TouchableOpacity onPress={() => setSelectedStudentFilter('all')}>
                <X size={18} color="#6B7280" />
              </TouchableOpacity>
            </View>
          )}

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
                {format(selectedDate, 'M月d日（E）', { locale: ja })}の授業
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

                    <TouchableOpacity 
                      style={styles.studentInfo}
                      onPress={() => lesson.students && handleStudentPress(lesson.students)}
                    >
                      <View style={styles.studentDetails}>
                        <Text style={styles.studentName}>
                          {lesson.students?.full_name || '生徒未定'}
                        </Text>
                        {lesson.students?.grade && (
                          <Text style={styles.studentGrade}>
                            {lesson.students.grade}
                          </Text>
                        )}
                      </View>
                      <ChevronRight size={16} color="#9CA3AF" />
                    </TouchableOpacity>

                    {lesson.status !== '予定通り' && (
                      <Text style={[
                        styles.lessonStatus,
                        lesson.status === '欠席' && styles.absenceStatus,
                      ]}>
                        {lesson.status}
                      </Text>
                    )}

                    {lesson.google_meet_link && lesson.status === '予定通り' && (
                      <TouchableOpacity 
                        style={styles.meetButton}
                        onPress={() => handleLessonPress(lesson)}
                      >
                        <Video size={16} color="#FFFFFF" />
                        <Text style={styles.meetButtonText}>授業に参加</Text>
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                ))}
              </Reanimated.View>
            )}
          </View>

          {/* 統計情報 */}
          <View style={styles.statsContainer}>
            <Text style={styles.statsTitle}>今月の授業統計</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {monthLessons.filter(l => l.slot_type === '通常授業').length}
                </Text>
                <Text style={styles.statLabel}>通常授業</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {monthLessons.filter(l => l.slot_type === '固定面談').length}
                </Text>
                <Text style={styles.statLabel}>面談</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {monthLessons.filter(l => l.slot_type === '振替授業').length}
                </Text>
                <Text style={styles.statLabel}>振替</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {assignedStudents.length}
                </Text>
                <Text style={styles.statLabel}>担当生徒数</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* フィルターモーダル */}
        <Modal
          visible={showFilterModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowFilterModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>生徒でフィルター</Text>
                <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                  <X size={24} color="#374151" />
                </TouchableOpacity>
              </View>
              
              <ScrollView style={styles.modalContent}>
                <TouchableOpacity
                  style={[
                    styles.filterOption,
                    selectedStudentFilter === 'all' && styles.filterOptionActive
                  ]}
                  onPress={() => {
                    setSelectedStudentFilter('all');
                    setShowFilterModal(false);
                  }}
                >
                  <Users size={20} color={selectedStudentFilter === 'all' ? '#3B82F6' : '#6B7280'} />
                  <Text style={[
                    styles.filterOptionText,
                    selectedStudentFilter === 'all' && styles.filterOptionTextActive
                  ]}>
                    全生徒
                  </Text>
                  {selectedStudentFilter === 'all' && (
                    <View style={styles.checkMark} />
                  )}
                </TouchableOpacity>

                {assignedStudents.map((student) => (
                  <TouchableOpacity
                    key={student.id}
                    style={[
                      styles.filterOption,
                      selectedStudentFilter === student.id && styles.filterOptionActive
                    ]}
                    onPress={() => {
                      setSelectedStudentFilter(student.id);
                      setShowFilterModal(false);
                    }}
                  >
                    <View style={styles.studentIcon}>
                      <Text style={styles.studentInitial}>
                        {student.full_name.charAt(0)}
                      </Text>
                    </View>
                    <View style={styles.filterStudentInfo}>
                      <Text style={[
                        styles.filterOptionText,
                        selectedStudentFilter === student.id && styles.filterOptionTextActive
                      ]}>
                        {student.full_name}
                      </Text>
                      {student.grade && (
                        <Text style={styles.filterStudentGrade}>{student.grade}</Text>
                      )}
                    </View>
                    {selectedStudentFilter === student.id && (
                      <View style={styles.checkMark} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </TeacherGuard>
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
  activeFilter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EBF8FF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 8,
  },
  activeFilterText: {
    fontSize: 14,
    color: '#3B82F6',
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
    marginBottom: 12,
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
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
  studentGrade: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
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
    marginTop: 8,
  },
  meetButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  statsContainer: {
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
  statsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  statItem: {
    width: '50%',
    paddingVertical: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '600',
    color: '#3B82F6',
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalContent: {
    padding: 16,
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  filterOptionActive: {
    backgroundColor: '#EBF8FF',
  },
  filterOptionText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
    flex: 1,
  },
  filterOptionTextActive: {
    color: '#3B82F6',
    fontWeight: '500',
  },
  studentIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentInitial: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterStudentInfo: {
    flex: 1,
    marginLeft: 12,
  },
  filterStudentGrade: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  checkMark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#3B82F6',
    marginLeft: 8,
  },
});