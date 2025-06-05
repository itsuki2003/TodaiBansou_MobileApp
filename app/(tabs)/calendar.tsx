import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react-native';
import ClassScheduleItem from '@/components/ui/ClassScheduleItem';

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
  const [month, setMonth] = useState(generateMonthData());
  const [selectedDate, setSelectedDate] = useState('30'); // Initial selected date
  const [selectedMonth, setSelectedMonth] = useState('May'); // For demonstration
  const [showAbsenceModal, setShowAbsenceModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  
  const handleDateSelect = (date: string, disabled: boolean) => {
    if (!disabled) {
      setSelectedDate(date);
    }
  };
  
  const handleClassPress = (classItem: any) => {
    setSelectedClass(classItem);
    // If class is in the future and not marked as absent
    if (!classItem.isAbsent) {
      setShowAbsenceModal(true);
    }
  };
  
  const handleAbsenceRequest = () => {
    // In a real app, this would send the absence request to the backend
    setShowAbsenceModal(false);
    // For demo purposes, mark the class as absent
    if (selectedClass) {
      // This would update the backend in a real app
      alert('欠席連絡を受け付けました');
    }
  };
  
  const handlePrevMonth = () => {
    // In a real app, this would fetch the previous month's data
    alert('前月のデータを表示します');
  };
  
  const handleNextMonth = () => {
    // In a real app, this would fetch the next month's data
    alert('翌月のデータを表示します');
  };
  
  // Get classes for the selected date
  const getClassesForSelectedDate = () => {
    const date = selectedMonth === 'May' 
      ? `2023-05-${selectedDate.padStart(2, '0')}` 
      : `2023-06-${selectedDate.padStart(2, '0')}`;
    return MOCK_CLASSES[date as keyof typeof MOCK_CLASSES] || [];
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>授業予定</Text>
      </View>
      
      <View style={styles.calendarHeader}>
        <TouchableOpacity onPress={handlePrevMonth}>
          <ChevronLeft size={24} color="#64748B" />
        </TouchableOpacity>
        <Text style={styles.monthTitle}>{month.title}</Text>
        <TouchableOpacity onPress={handleNextMonth}>
          <ChevronRight size={24} color="#64748B" />
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
          {selectedMonth === 'May' ? '5' : '6'}月{selectedDate}日の予定
        </Text>
      </View>
      
      <ScrollView style={styles.scheduleList}>
        {getClassesForSelectedDate().length > 0 ? (
          getClassesForSelectedDate().map((classItem) => (
            <ClassScheduleItem
              key={classItem.id}
              type={classItem.type}
              startTime={classItem.startTime}
              endTime={classItem.endTime}
              teacherName={classItem.teacherName}
              isAbsent={classItem.isAbsent}
              isTransferred={classItem.isTransferred}
              isAdditional={classItem.isAdditional}
              onPress={() => handleClassPress(classItem)}
            />
          ))
        ) : (
          <Text style={styles.noScheduleText}>
            予定はありません
          </Text>
        )}
        
        <TouchableOpacity style={styles.addClassButton}>
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
                    日時: {selectedMonth === 'May' ? '5' : '6'}月{selectedDate}日 {selectedClass.startTime}～{selectedClass.endTime}
                  </Text>
                  <Text style={styles.classDetailText}>
                    担当: {selectedClass.teacherName}
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
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
});