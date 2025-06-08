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
} from 'react-native';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import ClassScheduleItem from '@/components/ui/ClassScheduleItem';

// 型定義
type Teacher = {
  full_name: string;
};

type LessonSlot = {
  id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  slot_type: '通常授業' | '固定面談' | '振替授業' | '追加授業';
  status: '予定通り' | '実施済み' | '欠席' | '振替済み（振替元）';
  teacher_id: string;
  teachers: Teacher;
  google_meet_link: string | null;
};

type ProcessedLessonSlot = Omit<LessonSlot, 'teachers'> & {
  teacher_name: string;
};

type CalendarData = {
  [date: string]: ProcessedLessonSlot[];
};

// 型の変換関数
const convertSlotType = (type: LessonSlot['slot_type']): 'lesson' | 'meeting' => {
  return type === '固定面談' ? 'meeting' : 'lesson';
};

// Mock data for demonstration
const MOCK_CLASSES = {
  '2023-05-30': [
    {
      id: '1',
      type: 'lesson',
      startTime: '16:00',
      endTime: '17:30',
      teacherName: '田中先生',
      isAbsent: false,
      isTransferred: false,
      isAdditional: false,
    },
    {
      id: '2',
      type: 'meeting',
      startTime: '18:00',
      endTime: '18:30',
      teacherName: '鈴木先生',
      isAbsent: false,
      isTransferred: false,
      isAdditional: false,
    }
  ],
  '2023-06-01': [
    {
      id: '3',
      type: 'lesson',
      startTime: '16:00',
      endTime: '17:30',
      teacherName: '田中先生',
      isAbsent: true,
      isTransferred: false,
      isAdditional: false,
    }
  ],
  '2023-06-03': [
    {
      id: '4',
      type: 'lesson',
      startTime: '10:00',
      endTime: '11:30',
      teacherName: '田中先生',
      isAbsent: false,
      isTransferred: true,
      isAdditional: false,
    }
  ],
  '2023-06-06': [
    {
      id: '5',
      type: 'lesson',
      startTime: '16:00',
      endTime: '17:30',
      teacherName: '田中先生',
      isAbsent: false,
      isTransferred: false,
      isAdditional: false,
    }
  ],
  '2023-06-10': [
    {
      id: '6',
      type: 'lesson',
      startTime: '10:00',
      endTime: '11:30',
      teacherName: '田中先生',
      isAbsent: false,
      isTransferred: false,
      isAdditional: true,
    }
  ]
};

// Mock month data for the calendar
const generateMonthData = () => {
  const month = { 
    title: '2023年6月',
    days: [] as Array<{ date: string; hasClass: boolean; disabled: boolean; }>
  };
  
  // Add days from previous month to align calendar grid
  for (let i = 0; i < 4; i++) {
    month.days.push({
      date: `${28 + i}`,
      hasClass: i === 2, // Example for May 30
      disabled: true,
    });
  }
  
  // Current month days
  for (let i = 1; i <= 30; i++) {
    month.days.push({
      date: `${i}`,
      hasClass: [1, 3, 6, 10].includes(i), // Classes on these days
      disabled: false,
    });
  }
  
  // Next month days to complete the grid
  for (let i = 1; i <= 8; i++) {
    month.days.push({
      date: `${i}`,
      hasClass: false,
      disabled: true,
    });
  }
  
  return month;
};

export default function CalendarScreen() {
  const { user, selectedStudent } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [calendarData, setCalendarData] = useState<CalendarData>({});
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date().getDate().toString());
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<LessonSlot | null>(null);

  // 月のデータを生成する関数
  const generateMonthData = useCallback((date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const monthData = {
      title: `${year}年${month + 1}月`,
      days: [] as Array<{ date: string; hasClass: boolean; disabled: boolean; }>
    };

    // 前月の日付を追加
    const firstDayOfWeek = firstDay.getDay();
    for (let i = 0; i < firstDayOfWeek; i++) {
      const prevDate = new Date(year, month, -i);
      monthData.days.unshift({
        date: prevDate.getDate().toString(),
        hasClass: false,
        disabled: true,
      });
    }

    // 当月の日付を追加
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      monthData.days.push({
        date: i.toString(),
        hasClass: !!calendarData[dateStr]?.length,
        disabled: false,
      });
    }

    // 翌月の日付を追加
    const remainingDays = 42 - monthData.days.length; // 6行×7列のグリッド
    for (let i = 1; i <= remainingDays; i++) {
      monthData.days.push({
        date: i.toString(),
        hasClass: false,
        disabled: true,
      });
    }

    return monthData;
  }, [calendarData]);

  // カレンダーデータを取得する関数
  const fetchCalendarData = useCallback(async (date: Date) => {
    try {
      setLoading(true);
      setError(null);

      if (!selectedStudent) {
        console.log('No student selected for calendar');
        setCalendarData({});
        setLoading(false);
        return;
      }

      const year = date.getFullYear();
      const month = date.getMonth();
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0);

      // 授業スロットを取得
      const { data: slots, error: slotsError } = await supabase
        .from('lesson_slots')
        .select(`
          id,
          slot_date,
          start_time,
          end_time,
          slot_type,
          status,
          teacher_id,
          google_meet_link,
          teachers:teacher_id (
            full_name
          )
        `)
        .eq('student_id', selectedStudent.id)
        .gte('slot_date', startDate.toISOString().split('T')[0])
        .lte('slot_date', endDate.toISOString().split('T')[0])
        .order('slot_date')
        .order('start_time');

      if (slotsError) throw slotsError;

      // 通常授業の回数制限を適用
      const processedSlots = (slots as any[]).map(slot => ({
        ...slot,
        teacher_name: slot.teachers?.full_name || '未定',
      }));

      // 日付ごとにデータを整理
      const groupedData = processedSlots.reduce((acc, slot) => {
        const date = slot.slot_date;
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(slot);
        return acc;
      }, {} as CalendarData);

      setCalendarData(groupedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : '予期せぬエラーが発生しました');
    } finally {
      setLoading(false);
    }
  }, [selectedStudent?.id]);

  // 初期データ取得
  useEffect(() => {
    if (selectedStudent) {
      fetchCalendarData(currentMonth);
    }
  }, [currentMonth, fetchCalendarData, selectedStudent]);

  const handlePrevMonth = () => {
    const newDate = new Date(currentMonth);
    const today = new Date();
    
    // 過去6ヶ月までしか遡れない制限
    const sixMonthsAgo = new Date(today);
    sixMonthsAgo.setMonth(today.getMonth() - 6);
    
    newDate.setMonth(newDate.getMonth() - 1);
    
    // 制限をチェック
    if (newDate >= sixMonthsAgo) {
      setCurrentMonth(newDate);
    }
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentMonth);
    const today = new Date();
    
    // 未来3ヶ月までしか進めない制限
    const threeMonthsLater = new Date(today);
    threeMonthsLater.setMonth(today.getMonth() + 3);
    
    newDate.setMonth(newDate.getMonth() + 1);
    
    // 制限をチェック
    if (newDate <= threeMonthsLater) {
      setCurrentMonth(newDate);
    }
  };

  const handleDateSelect = (date: string, disabled: boolean) => {
    if (!disabled) {
      setSelectedDate(date);
    }
  };

  const handleClassPress = (classItem: ProcessedLessonSlot) => {
    setSelectedClass(classItem as any);
    if (classItem.status !== '欠席') {
      setShowAbsenceModal(true);
    }
  };

  const handleAbsenceRequest = () => {
    setShowAbsenceModal(false);
    if (selectedClass) {
      router.push({
        pathname: '/absence-request' as any,
        params: { lessonId: selectedClass.id }
      });
    }
  };

  const handleAddClassRequest = () => {
    router.push('/additional-lesson-request' as any);
  };

  // 選択された日付の予定を取得
  const getClassesForSelectedDate = () => {
    const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${selectedDate.padStart(2, '0')}`;
    return calendarData[dateStr] || [];
  };

  const month = generateMonthData(currentMonth);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>データを読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => fetchCalendarData(currentMonth)}
          >
            <Text style={styles.retryButtonText}>再試行</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>東大伴走</Text>
        <Text style={styles.title}>授業予定</Text>
      </View>
      
      <View style={styles.calendarHeader}>
        <TouchableOpacity 
          onPress={handlePrevMonth}
          disabled={(() => {
            const today = new Date();
            const sixMonthsAgo = new Date(today);
            sixMonthsAgo.setMonth(today.getMonth() - 6);
            const prevMonth = new Date(currentMonth);
            prevMonth.setMonth(prevMonth.getMonth() - 1);
            return prevMonth < sixMonthsAgo;
          })()}
          style={(() => {
            const today = new Date();
            const sixMonthsAgo = new Date(today);
            sixMonthsAgo.setMonth(today.getMonth() - 6);
            const prevMonth = new Date(currentMonth);
            prevMonth.setMonth(prevMonth.getMonth() - 1);
            return prevMonth < sixMonthsAgo ? styles.disabledButton : {};
          })()}
        >
          <ChevronLeft 
            size={24} 
            color={(() => {
              const today = new Date();
              const sixMonthsAgo = new Date(today);
              sixMonthsAgo.setMonth(today.getMonth() - 6);
              const prevMonth = new Date(currentMonth);
              prevMonth.setMonth(prevMonth.getMonth() - 1);
              return prevMonth < sixMonthsAgo ? "#CBD5E1" : "#64748B";
            })()} 
          />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>{month.title}</Text>
        <TouchableOpacity 
          onPress={handleNextMonth}
          disabled={(() => {
            const today = new Date();
            const threeMonthsLater = new Date(today);
            threeMonthsLater.setMonth(today.getMonth() + 3);
            const nextMonth = new Date(currentMonth);
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            return nextMonth > threeMonthsLater;
          })()}
          style={(() => {
            const today = new Date();
            const threeMonthsLater = new Date(today);
            threeMonthsLater.setMonth(today.getMonth() + 3);
            const nextMonth = new Date(currentMonth);
            nextMonth.setMonth(nextMonth.getMonth() + 1);
            return nextMonth > threeMonthsLater ? styles.disabledButton : {};
          })()}
        >
          <ChevronRight 
            size={24} 
            color={(() => {
              const today = new Date();
              const threeMonthsLater = new Date(today);
              threeMonthsLater.setMonth(today.getMonth() + 3);
              const nextMonth = new Date(currentMonth);
              nextMonth.setMonth(nextMonth.getMonth() + 1);
              return nextMonth > threeMonthsLater ? "#CBD5E1" : "#64748B";
            })()} 
          />
        </TouchableOpacity>
      </View>
      
      <View style={styles.calendarGrid}>
        {['日', '月', '火', '水', '木', '金', '土'].map((day, index) => (
          <View key={`header-${index}`} style={styles.calendarHeaderCell}>
            <Text style={[
              styles.calendarHeaderText,
              index === 0 ? styles.sundayText : {},
              index === 6 ? styles.saturdayText : {},
            ]}>
              {day}
            </Text>
          </View>
        ))}
        
        {month.days.map((day, index) => (
          <TouchableOpacity
            key={`day-${index}`}
            style={[
              styles.calendarCell,
              day.disabled ? styles.disabledCell : {},
              day.date === selectedDate && !day.disabled ? styles.selectedCell : {},
            ]}
            onPress={() => handleDateSelect(day.date, day.disabled)}
            disabled={day.disabled}
          >
            <Text style={[
              styles.calendarCellText,
              day.disabled ? styles.disabledText : {},
              day.date === selectedDate && !day.disabled ? styles.selectedCellText : {},
              index % 7 === 0 ? styles.sundayText : {},
              index % 7 === 6 ? styles.saturdayText : {},
            ]}>
              {day.date}
            </Text>
            {day.hasClass && (
              <View style={[
                styles.classDot,
                day.date === selectedDate && !day.disabled ? styles.selectedClassDot : {},
              ]} />
            )}
          </TouchableOpacity>
        ))}
      </View>
      
      <View style={styles.scheduleHeader}>
        <CalendarIcon size={18} color="#3B82F6" />
        <Text style={styles.scheduleTitle}>
          {currentMonth.toLocaleString('default', { month: 'long' })} {selectedDate}日の予定
        </Text>
      </View>
      
      <ScrollView style={styles.scheduleList}>
        {getClassesForSelectedDate().length > 0 ? (
          getClassesForSelectedDate().map((classItem) => (
            <ClassScheduleItem
              key={classItem.id}
              type={convertSlotType(classItem.slot_type)}
              startTime={classItem.start_time}
              endTime={classItem.end_time}
              teacherName={classItem.teacher_name}
              isAbsent={classItem.status === '欠席'}
              isTransferred={classItem.slot_type === '振替授業'}
              isAdditional={classItem.slot_type === '追加授業'}
              googleMeetLink={classItem.google_meet_link}
              onPress={() => handleClassPress(classItem)}
            />
          ))
        ) : (
          <Text style={styles.noScheduleText}>
            予定はありません
          </Text>
        )}
        
        <TouchableOpacity style={styles.addClassButton} onPress={handleAddClassRequest}>
          <Text style={styles.addClassButtonText}>
            ＋ 追加授業を申請する
          </Text>
        </TouchableOpacity>
      </ScrollView>
      
      {/* Absence Request Modal */}
      <Modal
        visible={showAbsenceModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAbsenceModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>欠席連絡</Text>
            
            {selectedClass && (
              <View style={styles.modalContent}>
                <Text style={styles.modalText}>
                  以下の授業を欠席しますか？
                </Text>
                
                <View style={styles.classDetails}>
                  <Text style={styles.classDetailText}>
                    日時: {currentMonth.toLocaleString('default', { month: 'long' })} {selectedDate}日 {selectedClass.start_time}～{selectedClass.end_time}
                  </Text>
                  <Text style={styles.classDetailText}>
                    担当: {(selectedClass as any).teacher_name || '未定'}
                  </Text>
                </View>
                
                <Text style={styles.absenceNote}>
                  ※授業開始5時間前までに連絡が必要です
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
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  logo: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3B82F6',
    position: 'absolute',
    left: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1E293B',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#1E293B',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 8,
  },
  calendarHeaderCell: {
    width: '14.28%',
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarHeaderText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  calendarCell: {
    width: '14.28%',
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  calendarCellText: {
    fontSize: 16,
    color: '#1E293B',
  },
  classDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3B82F6',
    position: 'absolute',
    bottom: 8,
  },
  disabledCell: {
    opacity: 0.4,
  },
  disabledText: {
    color: '#94A3B8',
  },
  selectedCell: {
    backgroundColor: '#3B82F6',
    borderRadius: 24,
  },
  selectedCellText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  selectedClassDot: {
    backgroundColor: '#FFFFFF',
  },
  sundayText: {
    color: '#EF4444',
  },
  saturdayText: {
    color: '#3B82F6',
  },
  scheduleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  scheduleTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1E293B',
    marginLeft: 8,
  },
  scheduleList: {
    flex: 1,
    padding: 16,
  },
  noScheduleText: {
    fontSize: 16,
    color: '#94A3B8',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 24,
  },
  addClassButton: {
    marginTop: 24,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  addClassButtonText: {
    color: '#3B82F6',
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
    borderRadius: 12,
    padding: 20,
    width: '85%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
    textAlign: 'center',
  },
  modalContent: {
    marginBottom: 20,
  },
  modalText: {
    fontSize: 16,
    color: '#1E293B',
    marginBottom: 12,
    textAlign: 'center',
  },
  classDetails: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  classDetailText: {
    fontSize: 14,
    color: '#334155',
    marginBottom: 4,
  },
  absenceNote: {
    fontSize: 12,
    color: '#EF4444',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F1F5F9',
  },
  cancelButtonText: {
    color: '#64748B',
    fontWeight: '500',
  },
  confirmButton: {
    backgroundColor: '#EF4444',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  disabledButton: {
    opacity: 0.4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#3B82F6',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    color: '#EF4444',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    padding: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
});