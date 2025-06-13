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
import { format, parseISO, startOfWeek, endOfWeek } from 'date-fns';
import { ja } from 'date-fns/locale';
import {
  ArrowLeft,
  User,
  BookOpen,
  MessageCircle,
  Calendar,
  CheckCircle2,
  Circle,
  Plus,
  Edit3,
  Send,
  Clock,
  AlertTriangle,
} from 'lucide-react-native';

import { useAuth } from '../../../contexts/AuthContext';
import { supabase } from '../../../lib/supabaseClient';
import type { Database } from '../../../types/database.types';

type Student = Database['public']['Tables']['students']['Row'];
type Assignment = Database['public']['Tables']['assignments']['Row'];
type TodoList = Database['public']['Tables']['todo_lists']['Row'];
type Task = Database['public']['Tables']['tasks']['Row'];
type TeacherComment = Database['public']['Tables']['teacher_comments']['Row'];

interface StudentDetailData {
  student: Student;
  assignment: Assignment;
  currentTodoList?: TodoList & {
    tasks: Task[];
  };
  recentComments: TeacherComment[];
  completionStats: {
    thisWeek: { completed: number; total: number };
    thisMonth: { completed: number; total: number };
  };
}

export default function TeacherStudentDetailScreen() {
  const router = useRouter();
  const { studentId } = useLocalSearchParams();
  const { selectedTeacher } = useAuth();
  
  const [studentData, setStudentData] = useState<StudentDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // コメント機能
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [commentDate, setCommentDate] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  const fetchStudentDetail = useCallback(async () => {
    if (!selectedTeacher || !studentId) return;

    try {
      setError(null);

      // 生徒情報と担当情報を取得
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('assignments')
        .select(`
          *,
          students (*)
        `)
        .eq('teacher_id', selectedTeacher.id)
        .eq('student_id', studentId)
        .eq('status', '有効')
        .single();

      if (assignmentError) throw assignmentError;
      if (!assignmentData) throw new Error('担当生徒が見つかりません');

      // 現在の週のやることリスト取得
      const currentWeekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
      const { data: todoListData } = await supabase
        .from('todo_lists')
        .select(`
          *,
          tasks (*)
        `)
        .eq('student_id', studentId)
        .eq('target_week_start_date', currentWeekStart)
        .eq('status', '公開済み')
        .single();

      // 最近のコメント取得
      const { data: commentsData } = await supabase
        .from('teacher_comments')
        .select('*')
        .eq('todo_list_id', todoListData?.id || '')
        .eq('teacher_id', selectedTeacher.id)
        .order('created_at', { ascending: false })
        .limit(5);

      // 完了統計の計算（簡易版）
      const thisWeekStats = todoListData?.tasks 
        ? {
            completed: todoListData.tasks.filter(t => t.is_completed).length,
            total: todoListData.tasks.length,
          }
        : { completed: 0, total: 0 };

      setStudentData({
        student: assignmentData.students as Student,
        assignment: assignmentData as Assignment,
        currentTodoList: todoListData || undefined,
        recentComments: commentsData || [],
        completionStats: {
          thisWeek: thisWeekStats,
          thisMonth: { completed: 0, total: 0 }, // TODO: 実装
        },
      });

      // デフォルトコメント日付を今日に設定
      setCommentDate(format(new Date(), 'yyyy-MM-dd'));

    } catch (err) {
      console.error('Student detail fetch error:', err);
      setError('生徒詳細情報の取得に失敗しました');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedTeacher, studentId]);

  useEffect(() => {
    fetchStudentDetail();
  }, [fetchStudentDetail]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchStudentDetail();
  }, [fetchStudentDetail]);

  const handleTaskToggle = async (taskId: string, currentStatus: boolean) => {
    if (!studentData?.assignment || studentData.assignment.role !== '面談担当（リスト編集可）') {
      Alert.alert(
        '権限エラー',
        '面談担当講師のみタスクの編集が可能です'
      );
      return;
    }

    try {
      const { error } = await supabase
        .from('tasks')
        .update({ is_completed: !currentStatus })
        .eq('id', taskId);

      if (error) throw error;

      // ローカル状態を更新
      setStudentData(prev => {
        if (!prev?.currentTodoList) return prev;
        
        return {
          ...prev,
          currentTodoList: {
            ...prev.currentTodoList,
            tasks: prev.currentTodoList.tasks.map(task => 
              task.id === taskId 
                ? { ...task, is_completed: !currentStatus }
                : task
            ),
          },
          completionStats: {
            ...prev.completionStats,
            thisWeek: {
              ...prev.completionStats.thisWeek,
              completed: !currentStatus 
                ? prev.completionStats.thisWeek.completed + 1
                : prev.completionStats.thisWeek.completed - 1,
            },
          },
        };
      });

    } catch (err) {
      console.error('Task toggle error:', err);
      Alert.alert('エラー', 'タスクの更新に失敗しました');
    }
  };

  const handleSubmitComment = async () => {
    if (!commentText.trim() || !commentDate || !studentData?.currentTodoList) {
      Alert.alert('入力エラー', 'コメント内容と日付を入力してください');
      return;
    }

    setSubmittingComment(true);

    try {
      const { error } = await supabase
        .from('teacher_comments')
        .insert([{
          todo_list_id: studentData.currentTodoList.id,
          target_date: commentDate,
          teacher_id: selectedTeacher!.id,
          comment_content: commentText.trim(),
        }]);

      if (error) throw error;

      setCommentText('');
      setShowCommentModal(false);
      
      // コメント一覧を再取得
      await fetchStudentDetail();

    } catch (err) {
      console.error('Comment submit error:', err);
      Alert.alert('エラー', 'コメントの送信に失敗しました');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleGoBack = () => {
    router.back();
  };

  const handleViewWeeklyPlan = () => {
    if (studentData?.currentTodoList) {
      router.push(`/teacher/todo-lists/${studentData.currentTodoList.id}`);
    }
  };

  const handleOpenChat = () => {
    router.push(`/chat/${studentData?.student.id}`);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <ArrowLeft size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.title}>生徒詳細</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>生徒情報を読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !studentData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
            <ArrowLeft size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.title}>生徒詳細</Text>
        </View>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error || '生徒情報が見つかりません'}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchStudentDetail}>
            <Text style={styles.retryButtonText}>再試行</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isInterviewTeacher = studentData.assignment.role === '面談担当（リスト編集可）';
  const hasCurrentTodoList = !!studentData.currentTodoList;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.title}>生徒詳細</Text>
        <TouchableOpacity style={styles.chatButton} onPress={handleOpenChat}>
          <MessageCircle size={24} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* 生徒情報カード */}
        <View style={styles.studentInfoCard}>
          <View style={styles.studentHeader}>
            <View style={styles.studentIconContainer}>
              <User size={32} color="#3B82F6" />
            </View>
            <View style={styles.studentInfo}>
              <Text style={styles.studentName}>{studentData.student.full_name}</Text>
              {studentData.student.furigana_name && (
                <Text style={styles.studentFurigana}>{studentData.student.furigana_name}</Text>
              )}
              <View style={styles.studentDetails}>
                <Text style={styles.studentGrade}>{studentData.student.grade}</Text>
                {studentData.student.school_attended && (
                  <Text style={styles.studentSchool}>• {studentData.student.school_attended}</Text>
                )}
              </View>
            </View>
            {isInterviewTeacher && (
              <View style={styles.roleTag}>
                <Text style={styles.roleTagText}>面談担当</Text>
              </View>
            )}
          </View>
        </View>

        {/* 今週の進捗 */}
        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <BookOpen size={20} color="#10B981" />
            <Text style={styles.progressTitle}>今週の進捗</Text>
            {hasCurrentTodoList && (
              <TouchableOpacity onPress={handleViewWeeklyPlan}>
                <Text style={styles.viewDetailText}>詳細表示 ›</Text>
              </TouchableOpacity>
            )}
          </View>
          
          {hasCurrentTodoList ? (
            <View style={styles.progressContent}>
              <View style={styles.progressStats}>
                <Text style={styles.progressNumber}>
                  {studentData.completionStats.thisWeek.completed}/
                  {studentData.completionStats.thisWeek.total}
                </Text>
                <Text style={styles.progressLabel}>タスク完了</Text>
              </View>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill,
                    {
                      width: `${
                        studentData.completionStats.thisWeek.total > 0
                          ? (studentData.completionStats.thisWeek.completed / studentData.completionStats.thisWeek.total) * 100
                          : 0
                      }%`,
                    },
                  ]}
                />
              </View>
            </View>
          ) : (
            <View style={styles.noTodoList}>
              <AlertTriangle size={24} color="#F59E0B" />
              <Text style={styles.noTodoListText}>今週のやることリストがありません</Text>
            </View>
          )}
        </View>

        {/* 今週のタスク一覧 */}
        {hasCurrentTodoList && (
          <View style={styles.tasksCard}>
            <View style={styles.tasksHeader}>
              <Text style={styles.tasksTitle}>今週のタスク</Text>
              {isInterviewTeacher && (
                <TouchableOpacity
                  style={styles.addCommentButton}
                  onPress={() => setShowCommentModal(true)}
                >
                  <Plus size={16} color="#3B82F6" />
                  <Text style={styles.addCommentText}>コメント</Text>
                </TouchableOpacity>
              )}
            </View>
            
            <View style={styles.tasksList}>
              {studentData.currentTodoList!.tasks
                .sort((a, b) => a.target_date.localeCompare(b.target_date))
                .map((task) => (
                  <TouchableOpacity
                    key={task.id}
                    style={styles.taskItem}
                    onPress={() => isInterviewTeacher && handleTaskToggle(task.id, task.is_completed)}
                    disabled={!isInterviewTeacher}
                  >
                    <View style={styles.taskCheckbox}>
                      {task.is_completed ? (
                        <CheckCircle2 size={20} color="#10B981" />
                      ) : (
                        <Circle size={20} color="#D1D5DB" />
                      )}
                    </View>
                    <View style={styles.taskContent}>
                      <Text style={[
                        styles.taskText,
                        task.is_completed && styles.taskTextCompleted,
                      ]}>
                        {task.content}
                      </Text>
                      <Text style={styles.taskDate}>
                        {format(parseISO(task.target_date), 'M/d(E)', { locale: ja })}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
            </View>
          </View>
        )}

        {/* 最近のコメント */}
        {studentData.recentComments.length > 0 && (
          <View style={styles.commentsCard}>
            <Text style={styles.commentsTitle}>最近のコメント</Text>
            <View style={styles.commentsList}>
              {studentData.recentComments.map((comment) => (
                <View key={comment.id} style={styles.commentItem}>
                  <View style={styles.commentHeader}>
                    <Text style={styles.commentDate}>
                      {format(parseISO(comment.target_date), 'M/d(E)', { locale: ja })}
                    </Text>
                    <Text style={styles.commentTime}>
                      {format(parseISO(comment.created_at), 'HH:mm')}
                    </Text>
                  </View>
                  <Text style={styles.commentContent}>{comment.comment_content}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* 底部余白 */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* コメント追加モーダル */}
      <Modal
        visible={showCommentModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowCommentModal(false)}>
              <Text style={styles.modalCancelText}>キャンセル</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>コメント追加</Text>
            <TouchableOpacity
              onPress={handleSubmitComment}
              disabled={submittingComment || !commentText.trim()}
            >
              {submittingComment ? (
                <ActivityIndicator size="small" color="#3B82F6" />
              ) : (
                <Text style={[
                  styles.modalSendText,
                  (!commentText.trim()) && styles.modalSendTextDisabled,
                ]}>
                  送信
                </Text>
              )}
            </TouchableOpacity>
          </View>
          
          <View style={styles.modalContent}>
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>対象日</Text>
              <TextInput
                style={styles.dateInput}
                value={commentDate}
                onChangeText={setCommentDate}
                placeholder="YYYY-MM-DD"
              />
            </View>
            
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>コメント内容</Text>
              <TextInput
                style={styles.commentInput}
                value={commentText}
                onChangeText={setCommentText}
                placeholder="生徒へのコメントを入力してください..."
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>
          </View>
        </SafeAreaView>
      </Modal>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
    textAlign: 'center',
  },
  chatButton: {
    padding: 4,
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
  studentInfoCard: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  studentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  studentFurigana: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  studentDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  studentGrade: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  studentSchool: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  roleTag: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  roleTagText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginLeft: 8,
    flex: 1,
  },
  viewDetailText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  progressContent: {
    alignItems: 'center',
  },
  progressStats: {
    alignItems: 'center',
    marginBottom: 16,
  },
  progressNumber: {
    fontSize: 32,
    fontWeight: '700',
    color: '#10B981',
  },
  progressLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
  },
  noTodoList: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  noTodoListText: {
    fontSize: 16,
    color: '#F59E0B',
    marginTop: 8,
  },
  tasksCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tasksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  tasksTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  addCommentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF8FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  addCommentText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
    marginLeft: 4,
  },
  tasksList: {
    gap: 12,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  taskCheckbox: {
    marginRight: 12,
    marginTop: 2,
  },
  taskContent: {
    flex: 1,
  },
  taskText: {
    fontSize: 16,
    color: '#111827',
    marginBottom: 4,
  },
  taskTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#6B7280',
  },
  taskDate: {
    fontSize: 12,
    color: '#6B7280',
  },
  commentsCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  commentsList: {
    gap: 12,
  },
  commentItem: {
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  commentDate: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  commentTime: {
    fontSize: 12,
    color: '#6B7280',
  },
  commentContent: {
    fontSize: 14,
    color: '#111827',
    lineHeight: 20,
  },
  bottomSpacing: {
    height: 20,
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
    paddingVertical: 16,
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
  modalSendText: {
    fontSize: 16,
    color: '#3B82F6',
    fontWeight: '600',
  },
  modalSendTextDisabled: {
    color: '#D1D5DB',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#111827',
    minHeight: 120,
  },
});