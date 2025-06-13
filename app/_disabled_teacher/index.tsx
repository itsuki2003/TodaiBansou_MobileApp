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
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { format, isToday, isThisWeek, parseISO, addHours } from 'date-fns';
import { ja } from 'date-fns/locale';
import {
  BookOpen,
  Calendar,
  Users,
  MessageCircle,
  Bell,
  Clock,
  CheckCircle2,
  AlertCircle,
  User,
  ChevronRight,
} from 'lucide-react-native';

import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { TeacherGuard } from '../../components/common/RoleGuard';
import ScreenWrapper from '../../components/common/ScreenWrapper';
import type { Database } from '../../types/database.types';

type Student = Database['public']['Tables']['students']['Row'];
type LessonSlot = Database['public']['Tables']['lesson_slots']['Row'];
type Assignment = Database['public']['Tables']['assignments']['Row'];
type TodoList = Database['public']['Tables']['todo_lists']['Row'];
type Task = Database['public']['Tables']['tasks']['Row'];

interface TeacherDashboardData {
  assignedStudents: Array<{
    student: Student;
    assignment: Assignment;
    recentTodoList?: TodoList & {
      tasks: Task[];
    };
  }>;
  todayLessons: Array<LessonSlot & {
    students: { full_name: string };
  }>;
  upcomingLessons: Array<LessonSlot & {
    students: { full_name: string };
  }>;
  pendingComments: number;
  unreadMessages: number;
}

export default function TeacherHomeScreen() {
  const router = useRouter();
  const { user, userRole, userRoleLoading, selectedTeacher } = useAuth();
  
  const [dashboardData, setDashboardData] = useState<TeacherDashboardData>({
    assignedStudents: [],
    todayLessons: [],
    upcomingLessons: [],
    pendingComments: 0,
    unreadMessages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // リダイレクト制御
  useEffect(() => {
    if (!userRoleLoading && (!user || userRole !== 'teacher')) {
      router.replace('/');
    }
  }, [user, userRole, userRoleLoading]);

  const fetchDashboardData = useCallback(async () => {
    if (!selectedTeacher) return;

    try {
      setError(null);

      // 担当生徒の取得
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select(`
          *,
          students (*)
        `)
        .eq('teacher_id', selectedTeacher.id)
        .eq('status', '有効');

      if (assignmentsError) throw assignmentsError;

      // 担当生徒の最新のやることリスト取得
      const studentsWithTodoLists = await Promise.all(
        (assignmentsData || []).map(async (assignment) => {
          const { data: todoListData } = await supabase
            .from('todo_lists')
            .select(`
              *,
              tasks (*)
            `)
            .eq('student_id', assignment.student_id)
            .eq('status', '公開済み')
            .order('target_week_start_date', { ascending: false })
            .limit(1)
            .single();

          return {
            student: assignment.students as Student,
            assignment: assignment as Assignment,
            recentTodoList: todoListData || undefined,
          };
        })
      );

      // 今日の授業の取得
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data: todayLessonsData, error: todayLessonsError } = await supabase
        .from('lesson_slots')
        .select(`
          *,
          students (full_name)
        `)
        .eq('teacher_id', selectedTeacher.id)
        .eq('slot_date', today)
        .neq('status', '欠席')
        .order('start_time', { ascending: true });

      if (todayLessonsError) throw todayLessonsError;

      // 今後の授業の取得（今日を除く近日7日間）
      const tomorrow = format(addHours(new Date(), 24), 'yyyy-MM-dd');
      const oneWeekLater = format(addHours(new Date(), 7 * 24), 'yyyy-MM-dd');
      const { data: upcomingLessonsData, error: upcomingLessonsError } = await supabase
        .from('lesson_slots')
        .select(`
          *,
          students (full_name)
        `)
        .eq('teacher_id', selectedTeacher.id)
        .gte('slot_date', tomorrow)
        .lte('slot_date', oneWeekLater)
        .neq('status', '欠席')
        .order('slot_date', { ascending: true })
        .order('start_time', { ascending: true })
        .limit(5);

      if (upcomingLessonsError) throw upcomingLessonsError;

      // TODO: 未読メッセージ数とコメント保留数の取得
      // チャットメッセージとコメント機能の実装後に追加

      setDashboardData({
        assignedStudents: studentsWithTodoLists,
        todayLessons: todayLessonsData || [],
        upcomingLessons: upcomingLessonsData || [],
        pendingComments: 0, // TODO: 実装
        unreadMessages: 0, // TODO: 実装
      });

    } catch (err) {
      console.error('Dashboard data fetch error:', err);
      setError('ダッシュボードデータの取得に失敗しました');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedTeacher]);

  useEffect(() => {
    if (selectedTeacher) {
      fetchDashboardData();
    }
  }, [fetchDashboardData]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleStudentPress = (studentId: string) => {
    router.push(`/teacher/students/${studentId}`);
  };

  const handleLessonPress = (lessonId: string) => {
    router.push(`/teacher/lessons/${lessonId}`);
  };

  const handleViewAllStudents = () => {
    router.push('/teacher/students');
  };

  const handleViewSchedule = () => {
    router.push('/teacher/schedule');
  };

  const handleViewMessages = () => {
    router.push('/teacher/messages');
  };


  return (
    <TeacherGuard>
      <ScreenWrapper 
        loading={userRoleLoading || loading}
        error={error ? { message: error, recoverable: true } : null}
        onRetry={fetchDashboardData}
        loadingMessage="ダッシュボードを読み込み中..."
      >
      {/* ヘッダー */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.greeting}>
            おはようございます{selectedTeacher?.full_name ? `、${selectedTeacher.full_name}先生` : ''}
          </Text>
          <Text style={styles.date}>
            {format(new Date(), 'yyyy年M月d日(E)', { locale: ja })}
          </Text>
        </View>
        <TouchableOpacity style={styles.notificationButton} onPress={handleViewMessages}>
          <Bell size={24} color="#374151" />
          {dashboardData.unreadMessages > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {dashboardData.unreadMessages > 99 ? '99+' : dashboardData.unreadMessages}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* 今日の授業 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Calendar size={20} color="#3B82F6" />
              <Text style={styles.sectionTitle}>今日の授業</Text>
            </View>
            <TouchableOpacity onPress={handleViewSchedule}>
              <Text style={styles.viewAllText}>スケジュール ›</Text>
            </TouchableOpacity>
          </View>
          
          {dashboardData.todayLessons.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>今日の授業はありません</Text>
            </View>
          ) : (
            <View style={styles.cardContainer}>
              {dashboardData.todayLessons.map((lesson) => (
                <TouchableOpacity
                  key={lesson.id}
                  style={styles.lessonCard}
                  onPress={() => handleLessonPress(lesson.id)}
                >
                  <View style={styles.lessonTimeContainer}>
                    <Text style={styles.lessonTime}>
                      {lesson.start_time.slice(0, 5)} - {lesson.end_time.slice(0, 5)}
                    </Text>
                    <Text style={styles.lessonType}>{lesson.slot_type}</Text>
                  </View>
                  <View style={styles.lessonInfo}>
                    <Text style={styles.studentName}>{lesson.students?.full_name}</Text>
                    <View style={styles.lessonStatusContainer}>
                      <Clock size={14} color="#6B7280" />
                      <Text style={styles.lessonStatus}>{lesson.status}</Text>
                    </View>
                  </View>
                  <ChevronRight size={20} color="#9CA3AF" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* 担当生徒一覧 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Users size={20} color="#10B981" />
              <Text style={styles.sectionTitle}>担当生徒</Text>
            </View>
            <TouchableOpacity onPress={handleViewAllStudents}>
              <Text style={styles.viewAllText}>すべて表示 ›</Text>
            </TouchableOpacity>
          </View>
          
          {dashboardData.assignedStudents.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>担当生徒がいません</Text>
            </View>
          ) : (
            <View style={styles.cardContainer}>
              {dashboardData.assignedStudents.slice(0, 5).map((item) => (
                <TouchableOpacity
                  key={item.student.id}
                  style={styles.studentCard}
                  onPress={() => handleStudentPress(item.student.id)}
                >
                  <View style={styles.studentIconContainer}>
                    <User size={24} color="#10B981" />
                  </View>
                  <View style={styles.studentInfo}>
                    <Text style={styles.studentName}>{item.student.full_name}</Text>
                    <View style={styles.studentDetails}>
                      <Text style={styles.studentGrade}>{item.student.grade}</Text>
                      <Text style={styles.assignmentRole}>
                        {item.assignment.role === '面談担当（リスト編集可）' ? '面談担当' : '授業担当'}
                      </Text>
                    </View>
                    {item.recentTodoList && (
                      <View style={styles.todoProgress}>
                        <CheckCircle2 size={12} color="#10B981" />
                        <Text style={styles.todoProgressText}>
                          今週のタスク {item.recentTodoList.tasks?.filter(t => t.is_completed).length || 0}/
                          {item.recentTodoList.tasks?.length || 0}
                        </Text>
                      </View>
                    )}
                  </View>
                  <ChevronRight size={20} color="#9CA3AF" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* 今後の授業 */}
        {dashboardData.upcomingLessons.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Clock size={20} color="#F59E0B" />
                <Text style={styles.sectionTitle}>今後の授業</Text>
              </View>
            </View>
            
            <View style={styles.cardContainer}>
              {dashboardData.upcomingLessons.map((lesson) => (
                <TouchableOpacity
                  key={lesson.id}
                  style={styles.upcomingLessonCard}
                  onPress={() => handleLessonPress(lesson.id)}
                >
                  <View style={styles.upcomingLessonDate}>
                    <Text style={styles.upcomingLessonDateText}>
                      {format(parseISO(lesson.slot_date), 'M/d(E)', { locale: ja })}
                    </Text>
                    <Text style={styles.upcomingLessonTime}>
                      {lesson.start_time.slice(0, 5)}
                    </Text>
                  </View>
                  <View style={styles.upcomingLessonInfo}>
                    <Text style={styles.upcomingStudentName}>{lesson.students?.full_name}</Text>
                    <Text style={styles.upcomingLessonType}>{lesson.slot_type}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* クイックアクション */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>クイックアクション</Text>
          <View style={styles.quickActionsContainer}>
            <TouchableOpacity style={styles.quickActionCard} onPress={handleViewMessages}>
              <MessageCircle size={32} color="#3B82F6" />
              <Text style={styles.quickActionTitle}>メッセージ</Text>
              <Text style={styles.quickActionSubtitle}>生徒とのやり取り</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionCard} onPress={handleViewAllStudents}>
              <BookOpen size={32} color="#10B981" />
              <Text style={styles.quickActionTitle}>やることリスト</Text>
              <Text style={styles.quickActionSubtitle}>課題管理</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 底部余白 */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
      </ScreenWrapper>
    </TeacherGuard>
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
    marginVertical: 16,
  },
  retryButton: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerContent: {
    flex: 1,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: '#6B7280',
  },
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    margin: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
  },
  viewAllText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
  },
  lessonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  lessonTimeContainer: {
    alignItems: 'center',
    marginRight: 16,
  },
  lessonTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  lessonType: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  lessonInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 4,
  },
  lessonStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lessonStatus: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  studentIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  studentInfo: {
    flex: 1,
  },
  studentDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  studentGrade: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 8,
  },
  assignmentRole: {
    fontSize: 12,
    color: '#3B82F6',
    backgroundColor: '#EBF8FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  todoProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  todoProgressText: {
    fontSize: 12,
    color: '#10B981',
    marginLeft: 4,
  },
  upcomingLessonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  upcomingLessonDate: {
    alignItems: 'center',
    marginRight: 16,
    minWidth: 60,
  },
  upcomingLessonDateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
  },
  upcomingLessonTime: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  upcomingLessonInfo: {
    flex: 1,
  },
  upcomingStudentName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  upcomingLessonType: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  quickActionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginTop: 12,
  },
  quickActionSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 20,
  },
});