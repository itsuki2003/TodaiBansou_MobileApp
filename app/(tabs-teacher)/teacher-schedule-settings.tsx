import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import {
  Calendar,
  Clock,
  Save,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react-native';

import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { TeacherGuard } from '@/components/common/RoleGuard';
import AppHeader from '@/components/ui/AppHeader';

interface TimeSlot {
  id: string;
  dayOfWeek: number; // 0: Sunday, 1: Monday, etc.
  startTime: string; // "HH:MM" format
  endTime: string;   // "HH:MM" format
  isAvailable: boolean;
}

interface ScheduleSettings {
  defaultLessonDuration: number; // minutes
  bufferTime: number; // minutes between lessons
  maxLessonsPerDay: number;
  autoAcceptRequests: boolean;
  weeklyAvailability: TimeSlot[];
}

const DAYS_OF_WEEK = [
  { id: 0, name: '日曜日', short: '日' },
  { id: 1, name: '月曜日', short: '月' },
  { id: 2, name: '火曜日', short: '火' },
  { id: 3, name: '水曜日', short: '水' },
  { id: 4, name: '木曜日', short: '木' },
  { id: 5, name: '金曜日', short: '金' },
  { id: 6, name: '土曜日', short: '土' },
];

const DEFAULT_TIME_SLOTS: TimeSlot[] = [
  { id: '1', dayOfWeek: 1, startTime: '16:00', endTime: '17:00', isAvailable: true },
  { id: '2', dayOfWeek: 1, startTime: '17:00', endTime: '18:00', isAvailable: true },
  { id: '3', dayOfWeek: 1, startTime: '19:00', endTime: '20:00', isAvailable: true },
  { id: '4', dayOfWeek: 2, startTime: '16:00', endTime: '17:00', isAvailable: true },
  { id: '5', dayOfWeek: 3, startTime: '19:00', endTime: '20:00', isAvailable: true },
  { id: '6', dayOfWeek: 4, startTime: '16:00', endTime: '17:00', isAvailable: true },
  { id: '7', dayOfWeek: 5, startTime: '16:00', endTime: '17:00', isAvailable: true },
];

export default function TeacherScheduleSettingsScreen() {
  const { teacher } = useAuth();
  const { showNotification } = useNotification();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [scheduleSettings, setScheduleSettings] = useState<ScheduleSettings>({
    defaultLessonDuration: 60,
    bufferTime: 15,
    maxLessonsPerDay: 5,
    autoAcceptRequests: false,
    weeklyAvailability: DEFAULT_TIME_SLOTS,
  });

  useEffect(() => {
    // In a real implementation, load settings from database
    // For now, use default settings
    setLoading(false);
  }, []);

  const handleSettingChange = (key: keyof ScheduleSettings, value: any) => {
    setScheduleSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleTimeSlotToggle = (slotId: string) => {
    setScheduleSettings(prev => ({
      ...prev,
      weeklyAvailability: prev.weeklyAvailability.map(slot =>
        slot.id === slotId ? { ...slot, isAvailable: !slot.isAvailable } : slot
      )
    }));
  };

  const handleAddTimeSlot = () => {
    Alert.alert(
      '時間枠追加',
      '新しい授業可能時間を追加する機能は今後実装予定です。',
      [{ text: 'OK' }]
    );
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      
      // In a real implementation, save to database
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      showNotification({
        type: 'success',
        title: '設定を保存しました',
        message: 'スケジュール設定が更新されました',
        autoHide: true,
      });
    } catch (error) {
      showNotification({
        type: 'error',
        title: 'エラー',
        message: '設定の保存に失敗しました',
        autoHide: true,
      });
    } finally {
      setSaving(false);
    }
  };

  const getDayName = (dayOfWeek: number) => {
    return DAYS_OF_WEEK.find(day => day.id === dayOfWeek)?.name || '';
  };

  const getAvailableSlotsByDay = (dayOfWeek: number) => {
    return scheduleSettings.weeklyAvailability.filter(slot => 
      slot.dayOfWeek === dayOfWeek
    );
  };

  if (loading) {
    return (
      <TeacherGuard>
        <SafeAreaView style={styles.container}>
          <AppHeader 
            title="スケジュール設定" 
            showBackButton 
            onBackPress={() => router.back()}
          />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>設定を読み込み中...</Text>
          </View>
        </SafeAreaView>
      </TeacherGuard>
    );
  }

  return (
    <TeacherGuard>
      <SafeAreaView style={styles.container}>
        <AppHeader 
          title="スケジュール設定" 
          showBackButton 
          onBackPress={() => router.back()}
        />

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 基本設定 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>基本設定</Text>
            
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Clock size={20} color="#3B82F6" />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>デフォルト授業時間</Text>
                  <Text style={styles.settingSubtitle}>
                    {scheduleSettings.defaultLessonDuration}分
                  </Text>
                </View>
              </View>
              <Text style={styles.settingNote}>設定変更は準備中</Text>
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Calendar size={20} color="#3B82F6" />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>授業間隔</Text>
                  <Text style={styles.settingSubtitle}>
                    {scheduleSettings.bufferTime}分
                  </Text>
                </View>
              </View>
              <Text style={styles.settingNote}>設定変更は準備中</Text>
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <AlertCircle size={20} color="#3B82F6" />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>1日最大授業数</Text>
                  <Text style={styles.settingSubtitle}>
                    {scheduleSettings.maxLessonsPerDay}コマ
                  </Text>
                </View>
              </View>
              <Text style={styles.settingNote}>設定変更は準備中</Text>
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <CheckCircle2 size={20} color="#3B82F6" />
                <View style={styles.settingText}>
                  <Text style={styles.settingTitle}>自動承認</Text>
                  <Text style={styles.settingSubtitle}>
                    授業リクエストの自動承認
                  </Text>
                </View>
              </View>
              <Switch
                value={scheduleSettings.autoAcceptRequests}
                onValueChange={(value) => handleSettingChange('autoAcceptRequests', value)}
                trackColor={{ false: '#E5E7EB', true: '#93C5FD' }}
                thumbColor={scheduleSettings.autoAcceptRequests ? '#3B82F6' : '#F3F4F6'}
              />
            </View>
          </View>

          {/* 週間スケジュール */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>週間スケジュール</Text>
              <TouchableOpacity 
                style={styles.addButton}
                onPress={handleAddTimeSlot}
              >
                <Plus size={16} color="#3B82F6" />
                <Text style={styles.addButtonText}>追加</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.sectionDescription}>
              授業可能な時間帯を設定してください
            </Text>

            {DAYS_OF_WEEK.slice(1, 6).map(day => { // 月-金のみ表示
              const slots = getAvailableSlotsByDay(day.id);
              return (
                <View key={day.id} style={styles.dayContainer}>
                  <Text style={styles.dayTitle}>{day.name}</Text>
                  {slots.length === 0 ? (
                    <Text style={styles.noSlotsText}>
                      設定されている時間枠がありません
                    </Text>
                  ) : (
                    slots.map(slot => (
                      <View key={slot.id} style={styles.timeSlotItem}>
                        <View style={styles.timeSlotInfo}>
                          <Text style={styles.timeSlotText}>
                            {slot.startTime} - {slot.endTime}
                          </Text>
                          <Text style={[
                            styles.timeSlotStatus,
                            slot.isAvailable ? styles.available : styles.unavailable
                          ]}>
                            {slot.isAvailable ? '利用可能' : '利用不可'}
                          </Text>
                        </View>
                        <Switch
                          value={slot.isAvailable}
                          onValueChange={() => handleTimeSlotToggle(slot.id)}
                          trackColor={{ false: '#E5E7EB', true: '#93C5FD' }}
                          thumbColor={slot.isAvailable ? '#3B82F6' : '#F3F4F6'}
                        />
                      </View>
                    ))
                  )}
                </View>
              );
            })}
          </View>

          {/* 注意事項 */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>注意事項</Text>
            <View style={styles.noteContainer}>
              <AlertCircle size={20} color="#F59E0B" />
              <View style={styles.noteContent}>
                <Text style={styles.noteText}>
                  • スケジュール変更は24時間前までに行ってください
                </Text>
                <Text style={styles.noteText}>
                  • 既に予約済みの授業には影響しません
                </Text>
                <Text style={styles.noteText}>
                  • 詳細な時間設定機能は今後のアップデートで追加予定です
                </Text>
              </View>
            </View>
          </View>

          {/* 保存ボタン */}
          <View style={styles.section}>
            <TouchableOpacity
              style={[styles.saveButton, saving && styles.saveButtonDisabled]}
              onPress={handleSaveSettings}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Save size={20} color="#FFFFFF" />
              )}
              <Text style={styles.saveButtonText}>
                {saving ? '保存中...' : '設定を保存'}
              </Text>
            </TouchableOpacity>
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  settingNote: {
    fontSize: 12,
    color: '#F59E0B',
    fontStyle: 'italic',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    gap: 4,
  },
  addButtonText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
  },
  dayContainer: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dayTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  noSlotsText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
  timeSlotItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginBottom: 8,
  },
  timeSlotInfo: {
    flex: 1,
  },
  timeSlotText: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '500',
  },
  timeSlotStatus: {
    fontSize: 12,
    marginTop: 2,
  },
  available: {
    color: '#10B981',
  },
  unavailable: {
    color: '#EF4444',
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 16,
    backgroundColor: '#FFFBEB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FEF3C7',
  },
  noteContent: {
    flex: 1,
  },
  noteText: {
    fontSize: 12,
    color: '#92400E',
    marginBottom: 4,
  },
  saveButton: {
    backgroundColor: '#3B82F6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});