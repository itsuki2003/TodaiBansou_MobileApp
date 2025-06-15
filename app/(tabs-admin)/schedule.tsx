import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Calendar,
  Clock,
  Plus,
  Search,
  Filter,
  Edit3,
  Trash2,
  User,
  Users,
  Video,
  AlertTriangle,
  CheckCircle2,
  X,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react-native';
import { format, addDays, startOfWeek, endOfWeek, isSameDay, parseISO, addWeeks, subWeeks } from 'date-fns';
import { ja } from 'date-fns/locale';

import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { AdminGuard } from '../../components/common/RoleGuard';
import AppHeader from '../../components/ui/AppHeader';
import type { Database } from '../../types/database.types';

type LessonSlot = Database['public']['Tables']['lesson_slots']['Row'];
type Student = Database['public']['Tables']['students']['Row'];
type Teacher = Database['public']['Tables']['teachers']['Row'];

interface LessonSlotWithDetails extends LessonSlot {
  student: Student;
  teacher: Teacher | null;
}

interface NewLessonSlot {
  student_id: string;
  teacher_id: string;
  slot_type: '通常授業' | '固定面談' | '振替授業' | '追加授業';
  slot_date: string;
  start_time: string;
  end_time: string;
  google_meet_link: string;
}

type ViewMode = 'week' | 'list';
type StatusFilter = 'all' | '予定通り' | '実施済み' | '欠席' | '振替済み（振替元）';

export default function AdminScheduleScreen() {
  const router = useRouter();
  const { administrator } = useAuth();
  
  const [lessons, setLessons] = useState<LessonSlotWithDetails[]>([]);
  const [filteredLessons, setFilteredLessons] = useState<LessonSlotWithDetails[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [newLesson, setNewLesson] = useState<NewLessonSlot>({
    student_id: '',
    teacher_id: '',
    slot_type: '通常授業',
    slot_date: new Date().toISOString().split('T')[0],
    start_time: '17:00',
    end_time: '18:00',
    google_meet_link: '',
  });
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setError(null);

      const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 }); // 月曜始まり
      const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 1 });

      // 授業コマ一覧を取得
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lesson_slots')
        .select(`
          *,
          students (*),
          teachers (*)
        `)
        .gte('slot_date', format(weekStart, 'yyyy-MM-dd'))
        .lte('slot_date', format(weekEnd, 'yyyy-MM-dd'))
        .order('slot_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (lessonsError) throw lessonsError;

      // 生徒一覧を取得
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .eq('status', '在籍中')
        .order('full_name', { ascending: true });

      if (studentsError) throw studentsError;

      // 講師一覧を取得
      const { data: teachersData, error: teachersError } = await supabase
        .from('teachers')
        .select('*')
        .eq('account_status', '有効')
        .order('full_name', { ascending: true });

      if (teachersError) throw teachersError;

      const lessonsWithDetails = (lessonsData || []).map(lesson => ({
        ...lesson,
        student: lesson.students as Student,
        teacher: lesson.teachers as Teacher | null,
      }));

      setLessons(lessonsWithDetails);
      setFilteredLessons(lessonsWithDetails);
      setStudents(studentsData || []);
      setTeachers(teachersData || []);

    } catch (err) {
      console.error('Schedule data fetch error:', err);
      setError('データの取得に失敗しました');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentWeek]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // フィルタリング
  useEffect(() => {
    let filtered = lessons;

    // 検索フィルター
    if (searchQuery.trim()) {
      filtered = filtered.filter(lesson =>
        lesson.student.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lesson.teacher?.full_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // ステータスフィルター
    if (statusFilter !== 'all') {
      filtered = filtered.filter(lesson => lesson.status === statusFilter);
    }

    setFilteredLessons(filtered);
  }, [lessons, searchQuery, statusFilter]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchData();
  }, [fetchData]);

  const handleCreateLesson = async () => {
    try {
      if (!newLesson.student_id || !newLesson.teacher_id) {
        Alert.alert('エラー', '生徒と講師を選択してください');
        return;
      }

      const { error } = await supabase
        .from('lesson_slots')
        .insert([{
          student_id: newLesson.student_id,
          teacher_id: newLesson.teacher_id,
          slot_type: newLesson.slot_type,
          slot_date: newLesson.slot_date,
          start_time: newLesson.start_time + ':00',
          end_time: newLesson.end_time + ':00',
          google_meet_link: newLesson.google_meet_link || null,
          status: '予定通り',
          notes: null,
        }]);

      if (error) throw error;

      Alert.alert('成功', '授業コマを作成しました');
      setCreateModalVisible(false);
      setNewLesson({
        student_id: '',
        teacher_id: '',
        slot_type: '通常授業',
        slot_date: new Date().toISOString().split('T')[0],
        start_time: '17:00',
        end_time: '18:00',
        google_meet_link: '',
      });
      fetchData();

    } catch (err) {
      console.error('Lesson creation error:', err);
      Alert.alert('エラー', '授業コマの作成に失敗しました');
    }
  };

  const handleLessonStatusChange = async (lessonId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('lesson_slots')
        .update({ status: newStatus })
        .eq('id', lessonId);

      if (error) throw error;

      Alert.alert('成功', 'ステータスを更新しました');
      fetchData();
    } catch (err) {
      console.error('Lesson status update error:', err);
      Alert.alert('エラー', 'ステータスの更新に失敗しました');
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    Alert.alert(
      '授業コマ削除',
      '本当に削除しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('lesson_slots')
                .delete()
                .eq('id', lessonId);

              if (error) throw error;

              Alert.alert('成功', '授業コマを削除しました');
              fetchData();
            } catch (err) {
              console.error('Lesson deletion error:', err);
              Alert.alert('エラー', '授業コマの削除に失敗しました');
            }
          }
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case '予定通り': return '#3B82F6';
      case '実施済み': return '#10B981';
      case '欠席': return '#EF4444';
      case '振替済み（振替元）': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case '予定通り': return '#EBF8FF';
      case '実施済み': return '#ECFDF5';
      case '欠席': return '#FEF2F2';
      case '振替済み（振替元）': return '#FFFBEB';
      default: return '#F9FAFB';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case '通常授業': return '#3B82F6';
      case '固定面談': return '#8B5CF6';
      case '振替授業': return '#F59E0B';
      case '追加授業': return '#10B981';
      default: return '#6B7280';
    }
  };

  const previousWeek = () => {
    setCurrentWeek(subWeeks(currentWeek, 1));
  };

  const nextWeek = () => {
    setCurrentWeek(addWeeks(currentWeek, 1));
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

    return (
      <View style={styles.weekContainer}>
        {/* 週ナビゲーション */}
        <View style={styles.weekNavigation}>
          <TouchableOpacity onPress={previousWeek}>
            <ChevronLeft size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.weekTitle}>
            {format(weekStart, 'M月d日', { locale: ja })} - {format(addDays(weekStart, 6), 'M月d日', { locale: ja })}
          </Text>
          <TouchableOpacity onPress={nextWeek}>
            <ChevronRight size={24} color="#374151" />
          </TouchableOpacity>
        </View>

        {/* 曜日ヘッダー */}
        <View style={styles.weekHeader}>
          {weekDays.map((day, index) => (
            <View key={index} style={styles.dayHeader}>
              <Text style={styles.dayName}>
                {format(day, 'E', { locale: ja })}
              </Text>
              <Text style={[styles.dayNumber, isSameDay(day, new Date()) && styles.today]}>
                {format(day, 'd')}
              </Text>
            </View>
          ))}
        </View>

        {/* 授業コマグリッド */}
        <ScrollView style={styles.weekGrid} showsVerticalScrollIndicator={false}>
          {weekDays.map((day, dayIndex) => {
            const dayLessons = filteredLessons.filter(lesson => {
              if (!lesson.slot_date || isNaN(new Date(lesson.slot_date).getTime())) {
                return false;
              }
              return isSameDay(parseISO(lesson.slot_date), day);
            });

            return (
              <View key={dayIndex} style={styles.dayColumn}>
                {dayLessons.map((lesson) => (
                  <TouchableOpacity
                    key={lesson.id}
                    style={[
                      styles.lessonBlock,
                      { backgroundColor: getStatusBgColor(lesson.status) }
                    ]}
                    onPress={() => router.push({
                      pathname: '/admin-lesson-detail',
                      params: { lessonId: lesson.id }
                    })}
                  >
                    <Text style={styles.lessonTime}>
                      {lesson.start_time.slice(0, 5)}-{lesson.end_time.slice(0, 5)}
                    </Text>
                    <Text style={styles.lessonStudent} numberOfLines={1}>
                      {lesson.student.full_name}
                    </Text>
                    <Text style={styles.lessonTeacher} numberOfLines={1}>
                      {lesson.teacher?.full_name || '未割当'}
                    </Text>
                    <View style={[
                      styles.lessonTypeBadge,
                      { backgroundColor: getTypeColor(lesson.slot_type) }
                    ]}>
                      <Text style={styles.lessonTypeText}>{lesson.slot_type}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            );
          })}
        </ScrollView>
      </View>
    );
  };

  const renderListView = () => (
    <ScrollView
      style={styles.list}
      contentContainerStyle={filteredLessons.length === 0 ? styles.emptyContainer : undefined}
      showsVerticalScrollIndicator={false}
    >
      {filteredLessons.length === 0 ? (
        <View style={styles.emptyState}>
          <Calendar size={48} color="#9CA3AF" />
          <Text style={styles.emptyStateText}>
            {searchQuery || statusFilter !== 'all'
              ? '該当する授業が見つかりません'
              : 'この週に授業がありません'
            }
          </Text>
        </View>
      ) : (
        filteredLessons.map((lesson) => (
          <TouchableOpacity
            key={lesson.id}
            style={styles.lessonCard}
            onPress={() => router.push({
              pathname: '/admin-lesson-detail',
              params: { lessonId: lesson.id }
            })}
          >
            <View style={styles.lessonHeader}>
              <View style={styles.lessonInfo}>
                <Text style={styles.lessonDate}>
                  {lesson.slot_date && !isNaN(new Date(lesson.slot_date).getTime()) ? 
                    format(parseISO(lesson.slot_date), 'M月d日(E)', { locale: ja }) : 
                    '日付不明'
                  }
                </Text>
                <Text style={styles.lessonTimeRange}>
                  {lesson.start_time.slice(0, 5)} - {lesson.end_time.slice(0, 5)}
                </Text>
              </View>
              
              <View style={styles.lessonBadges}>
                <View style={[
                  styles.typeBadge,
                  { backgroundColor: getTypeColor(lesson.slot_type) + '20' }
                ]}>
                  <Text style={[
                    styles.typeBadgeText,
                    { color: getTypeColor(lesson.slot_type) }
                  ]}>
                    {lesson.slot_type}
                  </Text>
                </View>
                
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusBgColor(lesson.status) }
                ]}>
                  <Text style={[
                    styles.statusBadgeText,
                    { color: getStatusColor(lesson.status) }
                  ]}>
                    {lesson.status}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.lessonDetails}>
              <View style={styles.lessonDetailRow}>
                <User size={16} color="#6B7280" />
                <Text style={styles.lessonDetailText}>
                  生徒: {lesson.student.full_name}
                </Text>
              </View>
              
              <View style={styles.lessonDetailRow}>
                <Users size={16} color="#6B7280" />
                <Text style={styles.lessonDetailText}>
                  講師: {lesson.teacher?.full_name || '未割当'}
                </Text>
              </View>
              
              {lesson.google_meet_link && (
                <View style={styles.lessonDetailRow}>
                  <Video size={16} color="#6B7280" />
                  <Text style={styles.lessonDetailText} numberOfLines={1}>
                    {lesson.google_meet_link}
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.lessonActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={(e) => {
                  e.stopPropagation();
                  Alert.alert(
                    'ステータス変更',
                    '新しいステータスを選択してください',
                    [
                      { text: 'キャンセル', style: 'cancel' },
                      { text: '予定通り', onPress: () => handleLessonStatusChange(lesson.id, '予定通り') },
                      { text: '実施済み', onPress: () => handleLessonStatusChange(lesson.id, '実施済み') },
                      { text: '欠席', onPress: () => handleLessonStatusChange(lesson.id, '欠席') },
                    ]
                  );
                }}
              >
                <Edit3 size={16} color="#6B7280" />
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.actionButton}
                onPress={(e) => {
                  e.stopPropagation();
                  handleDeleteLesson(lesson.id);
                }}
              >
                <Trash2 size={16} color="#EF4444" />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );

  if (loading) {
    return (
      <AdminGuard>
        <SafeAreaView style={styles.container}>
          <AppHeader title="授業管理" />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#DC2626" />
            <Text style={styles.loadingText}>スケジュールを読み込み中...</Text>
          </View>
        </SafeAreaView>
      </AdminGuard>
    );
  }

  if (error) {
    return (
      <AdminGuard>
        <SafeAreaView style={styles.container}>
          <AppHeader title="授業管理" />
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
              <Text style={styles.retryButtonText}>再試行</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </AdminGuard>
    );
  }

  return (
    <AdminGuard>
      <SafeAreaView style={styles.container}>
        <AppHeader
          title="授業管理"
          rightElement={
            <TouchableOpacity onPress={() => setCreateModalVisible(true)}>
              <Plus size={24} color="#374151" />
            </TouchableOpacity>
          }
        />

        {/* ビュー切り替えと検索 */}
        <View style={styles.controlsSection}>
          <View style={styles.viewToggle}>
            <TouchableOpacity
              style={[styles.toggleButton, viewMode === 'week' && styles.activeToggle]}
              onPress={() => setViewMode('week')}
            >
              <Calendar size={16} color={viewMode === 'week' ? '#FFFFFF' : '#6B7280'} />
              <Text style={[styles.toggleText, viewMode === 'week' && styles.activeToggleText]}>
                週表示
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, viewMode === 'list' && styles.activeToggle]}
              onPress={() => setViewMode('list')}
            >
              <Clock size={16} color={viewMode === 'list' ? '#FFFFFF' : '#6B7280'} />
              <Text style={[styles.toggleText, viewMode === 'list' && styles.activeToggleText]}>
                一覧
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.searchControls}>
            <View style={styles.searchContainer}>
              <Search size={16} color="#9CA3AF" />
              <TextInput
                style={styles.searchInput}
                placeholder="生徒名、講師名で検索..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <X size={16} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>
            
            <TouchableOpacity 
              style={styles.filterButton}
              onPress={() => setFilterModalVisible(true)}
            >
              <Filter size={16} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 統計情報 */}
        <View style={styles.statsBar}>
          <Text style={styles.statsText}>
            全{lessons.length}件 | 表示中{filteredLessons.length}件
          </Text>
          {statusFilter !== 'all' && (
            <Text style={styles.filterInfo}>{statusFilter}</Text>
          )}
        </View>

        {/* メインコンテンツ */}
        <View style={styles.content}>
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#DC2626']}
            tintColor="#DC2626"
          >
            {viewMode === 'week' ? renderWeekView() : renderListView()}
          </RefreshControl>
        </View>

        {/* 新規作成モーダル */}
        <Modal
          visible={createModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setCreateModalVisible(false)}>
                <Text style={styles.modalCancelText}>キャンセル</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>新規授業コマ</Text>
              <TouchableOpacity onPress={handleCreateLesson}>
                <Text style={styles.modalDoneText}>作成</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              {/* 生徒選択 */}
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>生徒</Text>
                <ScrollView style={styles.optionsContainer} nestedScrollEnabled>
                  {students.map(student => (
                    <TouchableOpacity
                      key={student.id}
                      style={[
                        styles.optionItem,
                        newLesson.student_id === student.id && styles.selectedOption
                      ]}
                      onPress={() => setNewLesson({...newLesson, student_id: student.id})}
                    >
                      <Text style={[
                        styles.optionText,
                        newLesson.student_id === student.id && styles.selectedOptionText
                      ]}>
                        {student.full_name} ({student.grade})
                      </Text>
                      {newLesson.student_id === student.id && (
                        <CheckCircle2 size={20} color="#DC2626" />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* 講師選択 */}
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>講師</Text>
                <ScrollView style={styles.optionsContainer} nestedScrollEnabled>
                  {teachers.map(teacher => (
                    <TouchableOpacity
                      key={teacher.id}
                      style={[
                        styles.optionItem,
                        newLesson.teacher_id === teacher.id && styles.selectedOption
                      ]}
                      onPress={() => setNewLesson({...newLesson, teacher_id: teacher.id})}
                    >
                      <Text style={[
                        styles.optionText,
                        newLesson.teacher_id === teacher.id && styles.selectedOptionText
                      ]}>
                        {teacher.full_name}
                      </Text>
                      {newLesson.teacher_id === teacher.id && (
                        <CheckCircle2 size={20} color="#DC2626" />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* コマ種別 */}
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>コマ種別</Text>
                {(['通常授業', '固定面談', '振替授業', '追加授業'] as const).map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.optionItem,
                      newLesson.slot_type === type && styles.selectedOption
                    ]}
                    onPress={() => setNewLesson({...newLesson, slot_type: type})}
                  >
                    <Text style={[
                      styles.optionText,
                      newLesson.slot_type === type && styles.selectedOptionText
                    ]}>
                      {type}
                    </Text>
                    {newLesson.slot_type === type && (
                      <CheckCircle2 size={20} color="#DC2626" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              {/* 日時設定 */}
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>日時</Text>
                <TextInput
                  style={styles.input}
                  value={newLesson.slot_date}
                  onChangeText={(text) => setNewLesson({...newLesson, slot_date: text})}
                  placeholder="YYYY-MM-DD"
                />
                
                <View style={styles.timeRow}>
                  <View style={styles.timeInput}>
                    <Text style={styles.timeLabel}>開始時刻</Text>
                    <TextInput
                      style={styles.input}
                      value={newLesson.start_time}
                      onChangeText={(text) => setNewLesson({...newLesson, start_time: text})}
                      placeholder="HH:MM"
                    />
                  </View>
                  
                  <View style={styles.timeInput}>
                    <Text style={styles.timeLabel}>終了時刻</Text>
                    <TextInput
                      style={styles.input}
                      value={newLesson.end_time}
                      onChangeText={(text) => setNewLesson({...newLesson, end_time: text})}
                      placeholder="HH:MM"
                    />
                  </View>
                </View>
              </View>

              {/* Google Meetリンク */}
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>Google Meetリンク（任意）</Text>
                <TextInput
                  style={styles.input}
                  value={newLesson.google_meet_link}
                  onChangeText={(text) => setNewLesson({...newLesson, google_meet_link: text})}
                  placeholder="https://meet.google.com/..."
                />
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* フィルターモーダル */}
        <Modal
          visible={filterModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Text style={styles.modalCancelText}>キャンセル</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>フィルター</Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Text style={styles.modalDoneText}>完了</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalContent}>
              <View style={styles.formSection}>
                <Text style={styles.formLabel}>ステータス</Text>
                {(['all', '予定通り', '実施済み', '欠席', '振替済み（振替元）'] as const).map(status => (
                  <TouchableOpacity
                    key={status}
                    style={styles.optionItem}
                    onPress={() => setStatusFilter(status)}
                  >
                    <Text style={styles.optionText}>
                      {status === 'all' ? 'すべて' : status}
                    </Text>
                    {statusFilter === status && (
                      <CheckCircle2 size={20} color="#DC2626" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </AdminGuard>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  controlsSection: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    padding: 16,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 2,
    marginBottom: 12,
  },
  toggleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    gap: 6,
  },
  activeToggle: {
    backgroundColor: '#DC2626',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeToggleText: {
    color: '#FFFFFF',
  },
  searchControls: {
    flexDirection: 'row',
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    marginLeft: 8,
  },
  filterButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
  },
  statsBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
  },
  statsText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  filterInfo: {
    fontSize: 12,
    color: '#6B7280',
  },
  content: {
    flex: 1,
  },
  // 週表示スタイル
  weekContainer: {
    flex: 1,
  },
  weekNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  weekTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  weekHeader: {
    flexDirection: 'row',
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  dayName: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  today: {
    color: '#DC2626',
    fontWeight: '600',
  },
  weekGrid: {
    flex: 1,
  },
  dayColumn: {
    flexDirection: 'row',
    minHeight: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  lessonBlock: {
    flex: 1,
    margin: 2,
    padding: 8,
    borderRadius: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#3B82F6',
  },
  lessonTime: {
    fontSize: 10,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 2,
  },
  lessonStudent: {
    fontSize: 12,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  lessonTeacher: {
    fontSize: 10,
    color: '#6B7280',
    marginBottom: 4,
  },
  lessonTypeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  lessonTypeText: {
    fontSize: 8,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // 一覧表示スタイル
  list: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
  },
  lessonCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 8,
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
  lessonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  lessonInfo: {
    flex: 1,
  },
  lessonDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  lessonTimeRange: {
    fontSize: 14,
    color: '#6B7280',
  },
  lessonBadges: {
    gap: 6,
  },
  typeBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-end',
  },
  typeBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-end',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  lessonDetails: {
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    paddingTop: 12,
    marginBottom: 12,
    gap: 8,
  },
  lessonDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  lessonDetailText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  lessonActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#F9FAFB',
  },
  // モーダルスタイル
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#6B7280',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  modalDoneText: {
    fontSize: 16,
    color: '#DC2626',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  formSection: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
  },
  timeRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  timeInput: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 6,
  },
  optionsContainer: {
    maxHeight: 150,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectedOption: {
    backgroundColor: '#FEF2F2',
  },
  optionText: {
    fontSize: 14,
    color: '#374151',
    flex: 1,
  },
  selectedOptionText: {
    color: '#DC2626',
    fontWeight: '500',
  },
});