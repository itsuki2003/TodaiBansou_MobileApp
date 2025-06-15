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
  TextInput,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { format, startOfWeek, addDays } from 'date-fns';
import { ja } from 'date-fns/locale';
import {
  ArrowLeft,
  User,
  Calendar,
  CheckCircle2,
  Clock,
  MessageCircle,
  Edit3,
  Plus,
  Send,
  BookOpen,
  AlertTriangle,
  GraduationCap,
  History,
} from 'lucide-react-native';

import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { TeacherGuard } from '../components/common/RoleGuard';
import type { Database } from '../types/database.types';

type Student = Database['public']['Tables']['students']['Row'];
type Assignment = Database['public']['Tables']['assignments']['Row'];
type TodoList = Database['public']['Tables']['todo_lists']['Row'];
type Task = Database['public']['Tables']['tasks']['Row'];
type TeacherComment = Database['public']['Tables']['teacher_comments']['Row'];

interface StudentDetails {
  student: Student;
  assignment: Assignment;
  currentTodoList?: TodoList & {
    tasks: Task[];
  };
  comments: (TeacherComment & {
    teachers: { full_name: string };
  })[];
}

export default function StudentDetailScreen() {
  const router = useRouter();
  const { studentId } = useLocalSearchParams();
  const { selectedTeacher } = useAuth();
  
  // studentIdをstringに変換
  const studentIdString = Array.isArray(studentId) ? studentId[0] : studentId;
  
  
  const [studentDetails, setStudentDetails] = useState<StudentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const fetchStudentDetails = useCallback(async () => {
    if (!selectedTeacher || !studentIdString || studentIdString === '') {
      return;
    }

    try {
      setError(null);

      // 生徒と担当情報の取得
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('assignments')
        .select(`
          *,
          students (*)
        `)
        .eq('teacher_id', selectedTeacher.id)
        .eq('student_id', studentIdString)
        .eq('status', '有効')
        .single();

      if (assignmentError) throw assignmentError;

      if (!assignmentData) {
        setError('この生徒を担当していません');
        return;
      }

      const student = assignmentData.students as Student;
      const assignment = assignmentData as Assignment;

      // 現在の週のやることリスト取得
      const currentWeekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const { data: todoListData } = await supabase
        .from('todo_lists')
        .select(`
          *,
          tasks (*)
        `)
        .eq('student_id', student.id)
        .eq('target_week_start_date', currentWeekStart)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      // 今週の講師コメント取得
      let commentsData = null;
      if (todoListData?.id) {
        const weekEnd = format(addDays(new Date(currentWeekStart), 6), 'yyyy-MM-dd');
        const { data: comments, error: commentsError } = await supabase
          .from('teacher_comments')
          .select(`
            *,
            teachers (full_name)
          `)
          .eq('todo_list_id', todoListData.id)
          .gte('target_date', currentWeekStart)
          .lte('target_date', weekEnd)
          .order('target_date', { ascending: true })
          .order('created_at', { ascending: true });

        if (commentsError && commentsError.code !== 'PGRST116') {
          throw commentsError;
        }
        commentsData = comments;
      }

      setStudentDetails({
        student,
        assignment,
        currentTodoList: todoListData || undefined,
        comments: commentsData || [],
      });

    } catch (err) {
      console.error('Student details fetch error:', err);
      setError('生徒詳細情報の取得に失敗しました');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedTeacher, studentIdString]);

  useEffect(() => {
    fetchStudentDetails();
  }, [fetchStudentDetails]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStudentDetails();
  }, [fetchStudentDetails]);

  const handleGoBack = () => {
    router.back();
  };

  const handleAddComment = (date: string) => {
    setSelectedDate(date);
    setNewComment('');
    setCommentModalVisible(true);
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !selectedTeacher || !studentDetails?.currentTodoList) {
      return;
    }

    try {
      setSubmittingComment(true);

      const { error } = await supabase
        .from('teacher_comments')
        .insert({
          todo_list_id: studentDetails.currentTodoList.id,
          target_date: selectedDate,
          teacher_id: selectedTeacher.id,
          comment_content: newComment.trim(),
        });

      if (error) throw error;

      setCommentModalVisible(false);
      setNewComment('');
      setSelectedDate('');
      
      // データを再取得
      fetchStudentDetails();

      Alert.alert('完了', 'コメントを追加しました');

    } catch (err) {
      console.error('Comment submission error:', err);
      Alert.alert('エラー', 'コメントの追加に失敗しました');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleToggleTask = async (taskId: string, isCompleted: boolean) => {
    // 講師は直接タスクの完了状態を変更できない（生徒・保護者のみ）
    Alert.alert(
      '操作不可',
      'タスクの完了状態は生徒・保護者のみが変更できます'
    );
  };

  const handleEditTodoList = () => {
    if (!studentDetails?.currentTodoList) return;
    router.push({
      pathname: '/teacher-edit-todolist',
      params: { studentId: studentIdString, todoListId: studentDetails.currentTodoList.id }
    });
  };

  const handleCreateTodoList = () => {
    router.push({
      pathname: '/teacher-edit-todolist',
      params: { studentId: studentIdString, todoListId: 'new' }
    });
  };

  const handleViewHistory = () => {
    router.push({
      pathname: '/teacher-history',
      params: { studentId: studentIdString }
    });
  };

  const canEditTodoList = studentDetails?.assignment.role === '面談担当（リスト編集可）';

  if (loading) {
    return (
      <TeacherGuard>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
              <ArrowLeft size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.title}>生徒詳細</Text>
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>生徒詳細を読み込み中...</Text>
          </View>
        </SafeAreaView>
      </TeacherGuard>
    );
  }

  if (error || !studentDetails) {
    return (
      <TeacherGuard>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
              <ArrowLeft size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.title}>生徒詳細</Text>
          </View>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error || '生徒情報が見つかりません'}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchStudentDetails}>
              <Text style={styles.retryButtonText}>再試行</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </TeacherGuard>
    );
  }

  return (
    <TeacherGuard>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <ArrowLeft size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.title}>{studentDetails.student.full_name}</Text>
        </View>

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
        >
          {/* 生徒基本情報 */}
          <View style={styles.section}>
            <View style={styles.studentHeader}>
              <View style={styles.studentIconContainer}>
                <User size={32} color="#3B82F6" />
              </View>
              <View style={styles.studentInfo}>
                <Text style={styles.studentName}>{studentDetails.student.full_name}</Text>
                {studentDetails.student.furigana_name && (
                  <Text style={styles.studentFurigana}>{studentDetails.student.furigana_name}</Text>
                )}
                <View style={styles.studentMeta}>
                  <Text style={styles.studentGrade}>{studentDetails.student.grade}</Text>
                  {studentDetails.student.school_attended && (
                    <Text style={styles.studentSchool}>• {studentDetails.student.school_attended}</Text>
                  )}
                </View>
                <View style={styles.roleContainer}>
                  <GraduationCap size={16} color="#3B82F6" />
                  <Text style={styles.roleText}>
                    {studentDetails.assignment.role === '面談担当（リスト編集可）' ? '面談担当' : '授業担当'}
                  </Text>
                </View>
              </View>
            </View>
            
            {/* 履歴ボタン */}
            <TouchableOpacity style={styles.historyButton} onPress={handleViewHistory}>
              <History size={16} color="#6B7280" />
              <Text style={styles.historyButtonText}>履歴を見る</Text>
            </TouchableOpacity>
          </View>

          {/* 今週のやることリスト */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>今週のやることリスト</Text>
              {canEditTodoList && (
                <TouchableOpacity style={styles.editButton} onPress={handleEditTodoList}>
                  <Edit3 size={16} color="#3B82F6" />
                  <Text style={styles.editButtonText}>編集</Text>
                </TouchableOpacity>
              )}
            </View>

            {!studentDetails.currentTodoList ? (
              <View style={styles.emptyCard}>
                <BookOpen size={48} color="#9CA3AF" />
                <Text style={styles.emptyTitle}>やることリストなし</Text>
                <Text style={styles.emptyText}>
                  {canEditTodoList 
                    ? 'この週のやることリストを作成してください'
                    : 'この週のやることリストはまだ作成されていません'
                  }
                </Text>
                {canEditTodoList && (
                  <TouchableOpacity style={styles.createButton} onPress={handleCreateTodoList}>
                    <Plus size={16} color="#FFFFFF" />
                    <Text style={styles.createButtonText}>リスト作成</Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.todoListCard}>
                <View style={styles.weekInfo}>
                  <Calendar size={16} color="#6B7280" />
                  <Text style={styles.weekText}>
                    {studentDetails.currentTodoList.target_week_start_date ? 
                      format(new Date(studentDetails.currentTodoList.target_week_start_date), 'yyyy年M月d日', { locale: ja }) + '週' :
                      '日付不明週'
                    }
                  </Text>
                  <View style={[
                    styles.statusBadge,
                    studentDetails.currentTodoList.status === '公開済み' ? styles.publishedBadge : styles.draftBadge
                  ]}>
                    <Text style={[
                      styles.statusText,
                      studentDetails.currentTodoList.status === '公開済み' ? styles.publishedText : styles.draftText
                    ]}>
                      {studentDetails.currentTodoList.status}
                    </Text>
                  </View>
                </View>

                {/* 日別タスク表示 */}
                {studentDetails.currentTodoList.target_week_start_date && Array.from({ length: 7 }, (_, i) => {
                  const baseDate = new Date(studentDetails.currentTodoList!.target_week_start_date);
                  if (isNaN(baseDate.getTime())) return null; // 無効な日付の場合はスキップ
                  
                  const date = addDays(baseDate, i);
                  const dateStr = format(date, 'yyyy-MM-dd');
                  const dayTasks = studentDetails.currentTodoList!.tasks.filter(task => task.target_date === dateStr);
                  const dayComments = studentDetails.comments.filter(comment => comment.target_date === dateStr);

                  return (
                    <View key={dateStr} style={styles.daySection}>
                      <View style={styles.dayHeader}>
                        <Text style={styles.dayTitle}>
                          {format(date, 'M/d(E)', { locale: ja })}
                        </Text>
                        <TouchableOpacity 
                          style={styles.addCommentButton}
                          onPress={() => handleAddComment(dateStr)}
                        >
                          <MessageCircle size={16} color="#3B82F6" />
                          <Text style={styles.addCommentText}>コメント追加</Text>
                        </TouchableOpacity>
                      </View>

                      {/* タスク一覧 */}
                      {dayTasks.length === 0 ? (
                        <Text style={styles.noTasksText}>タスクなし</Text>
                      ) : (
                        dayTasks.map(task => (
                          <TouchableOpacity
                            key={task.id}
                            style={styles.taskItem}
                            onPress={() => handleToggleTask(task.id, !task.is_completed)}
                          >
                            <View style={[
                              styles.taskCheckbox,
                              task.is_completed ? styles.taskChecked : styles.taskUnchecked
                            ]}>
                              {task.is_completed && <CheckCircle2 size={16} color="#10B981" />}
                            </View>
                            <Text style={[
                              styles.taskText,
                              task.is_completed ? styles.taskTextCompleted : styles.taskTextIncomplete
                            ]}>
                              {task.content}
                            </Text>
                          </TouchableOpacity>
                        ))
                      )}

                      {/* コメント表示 */}
                      {dayComments.map(comment => (
                        <View key={comment.id} style={styles.commentItem}>
                          <MessageCircle size={14} color="#3B82F6" />
                          <View style={styles.commentContent}>
                            <Text style={styles.commentText}>{comment.comment_content}</Text>
                            <Text style={styles.commentMeta}>
                              {comment.teachers.full_name} • {
                                comment.created_at && !isNaN(new Date(comment.created_at).getTime()) ? 
                                  format(new Date(comment.created_at), 'HH:mm') : 
                                  '時刻不明'
                              }
                            </Text>
                          </View>
                        </View>
                      ))}
                    </View>
                  );
                })}
              </View>
            )}
          </View>

        </ScrollView>

        {/* コメント追加モーダル */}
        <Modal
          visible={commentModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setCommentModalVisible(false)}>
                <Text style={styles.modalCancelText}>キャンセル</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {selectedDate && !isNaN(new Date(selectedDate).getTime()) ? 
                  format(new Date(selectedDate), 'M/d(E)', { locale: ja }) + 'のコメント' :
                  'コメント'
                }
              </Text>
              <TouchableOpacity 
                onPress={handleSubmitComment}
                disabled={!newComment.trim() || submittingComment}
              >
                <Text style={[
                  styles.modalSubmitText,
                  (!newComment.trim() || submittingComment) && styles.modalSubmitDisabled
                ]}>
                  送信
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              <TextInput
                style={styles.commentInput}
                placeholder="コメントを入力してください..."
                value={newComment}
                onChangeText={setNewComment}
                multiline
                maxLength={500}
                autoFocus
              />
              <Text style={styles.characterCount}>
                {newComment.length}/500文字
              </Text>
            </View>
          </SafeAreaView>
        </Modal>
      </SafeAreaView>
    </TeacherGuard>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
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
  section: {
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
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  studentIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#EBF8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  studentFurigana: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 8,
  },
  studentMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  studentGrade: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  studentSchool: {
    fontSize: 16,
    color: '#6B7280',
    marginLeft: 4,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
    marginLeft: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#EBF8FF',
    borderRadius: 6,
  },
  editButtonText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
    marginLeft: 4,
  },
  emptyCard: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 6,
  },
  todoListCard: {
    gap: 16,
  },
  weekInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  weekText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
    marginLeft: 6,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  publishedBadge: {
    backgroundColor: '#DCFCE7',
  },
  draftBadge: {
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  publishedText: {
    color: '#166534',
  },
  draftText: {
    color: '#92400E',
  },
  daySection: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F9FAFB',
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  dayTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  addCommentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
  },
  addCommentText: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
    marginLeft: 4,
  },
  noTasksText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
    paddingVertical: 8,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  taskCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskChecked: {
    backgroundColor: '#DCFCE7',
  },
  taskUnchecked: {
    backgroundColor: '#F3F4F6',
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  taskText: {
    flex: 1,
    fontSize: 16,
  },
  taskTextCompleted: {
    color: '#6B7280',
    textDecorationLine: 'line-through',
  },
  taskTextIncomplete: {
    color: '#111827',
  },
  commentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
  },
  commentContent: {
    flex: 1,
    marginLeft: 8,
  },
  commentText: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 4,
  },
  commentMeta: {
    fontSize: 12,
    color: '#9CA3AF',
  },
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
  modalSubmitText: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
  },
  modalSubmitDisabled: {
    color: '#9CA3AF',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  commentInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'right',
    marginTop: 8,
  },
  bottomSpacing: {
    height: 20,
  },
  historyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  historyButtonText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    marginLeft: 6,
  },
});