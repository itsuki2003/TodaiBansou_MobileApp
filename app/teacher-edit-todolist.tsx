import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { format, startOfWeek, addDays } from 'date-fns';
import { ja } from 'date-fns/locale';
import {
  ArrowLeft,
  Calendar,
  Plus,
  Trash2,
  Save,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react-native';

import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { TeacherGuard } from '../components/common/RoleGuard';
import type { Database } from '../types/database.types';

type Student = Database['public']['Tables']['students']['Row'];
type TodoList = Database['public']['Tables']['todo_lists']['Row'];
type Task = Database['public']['Tables']['tasks']['Row'];

interface TodoListData extends TodoList {
  tasks: Task[];
}

interface TaskInput {
  id?: string;
  target_date: string;
  content: string;
  display_order: number;
  isNew?: boolean;
  isDeleted?: boolean;
}

export default function EditTodoListScreen() {
  const router = useRouter();
  const { studentId, todoListId } = useLocalSearchParams();
  const { selectedTeacher } = useAuth();
  
  const [student, setStudent] = useState<Student | null>(null);
  const [todoList, setTodoList] = useState<TodoListData | null>(null);
  const [tasks, setTasks] = useState<TaskInput[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newTaskModalVisible, setNewTaskModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [newTaskContent, setNewTaskContent] = useState('');

  const isCreateMode = todoListId === 'new';
  const currentWeekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

  const fetchData = useCallback(async () => {
    if (!selectedTeacher || !studentId) return;

    try {
      setError(null);

      // 生徒情報と権限確認
      const { data: assignmentData, error: assignmentError } = await supabase
        .from('assignments')
        .select(`
          *,
          students (*)
        `)
        .eq('teacher_id', selectedTeacher.id)
        .eq('student_id', studentId)
        .eq('status', '有効')
        .eq('role', '面談担当（リスト編集可）')
        .single();

      if (assignmentError) throw assignmentError;

      if (!assignmentData) {
        setError('この生徒のやることリストを編集する権限がありません');
        return;
      }

      const studentData = assignmentData.students as Student;
      setStudent(studentData);

      if (isCreateMode) {
        // 新規作成モード
        setTodoList({
          id: '',
          created_at: '',
          updated_at: '',
          student_id: studentData.id,
          target_week_start_date: currentWeekStart,
          list_creation_date: format(new Date(), 'yyyy-MM-dd'),
          status: '下書き',
          notes: null,
          tasks: [],
        });
        setTasks([]);
      } else {
        // 編集モード
        const { data: todoListData, error: todoListError } = await supabase
          .from('todo_lists')
          .select(`
            *,
            tasks (*)
          `)
          .eq('id', todoListId)
          .eq('student_id', studentData.id)
          .single();

        if (todoListError) throw todoListError;

        if (!todoListData) {
          setError('やることリストが見つかりません');
          return;
        }

        setTodoList(todoListData as TodoListData);
        setTasks(
          (todoListData.tasks as Task[])
            .sort((a, b) => a.display_order - b.display_order)
            .map(task => ({
              id: task.id,
              target_date: task.target_date,
              content: task.content,
              display_order: task.display_order,
            }))
        );
      }
    } catch (err) {
      console.error('Data fetch error:', err);
      setError('データの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [selectedTeacher, studentId, todoListId, isCreateMode, currentWeekStart]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleGoBack = () => {
    router.back();
  };

  const handleAddTask = (date: string) => {
    setSelectedDate(date);
    setNewTaskContent('');
    setNewTaskModalVisible(true);
  };

  const handleCreateTask = () => {
    if (!newTaskContent.trim()) return;

    const newTask: TaskInput = {
      target_date: selectedDate,
      content: newTaskContent.trim(),
      display_order: tasks.filter(t => t.target_date === selectedDate && !t.isDeleted).length,
      isNew: true,
    };

    setTasks(prev => [...prev, newTask]);
    setNewTaskModalVisible(false);
    setNewTaskContent('');
    setSelectedDate('');
  };

  const handleDeleteTask = (index: number) => {
    Alert.alert(
      'タスク削除',
      'このタスクを削除しますか？',
      [
        { text: 'キャンセル', style: 'cancel' },
        {
          text: '削除',
          style: 'destructive',
          onPress: () => {
            setTasks(prev => {
              const newTasks = [...prev];
              if (newTasks[index].isNew) {
                // 新規タスクは配列から削除
                newTasks.splice(index, 1);
              } else {
                // 既存タスクは削除フラグを立てる
                newTasks[index] = { ...newTasks[index], isDeleted: true };
              }
              return newTasks;
            });
          },
        },
      ]
    );
  };

  const handleUpdateTaskContent = (index: number, content: string) => {
    setTasks(prev => {
      const newTasks = [...prev];
      newTasks[index] = { ...newTasks[index], content };
      return newTasks;
    });
  };

  const handleSave = async (publish: boolean = false) => {
    if (!todoList || !student) return;

    setSaving(true);

    try {
      let todoListId = todoList.id;

      if (isCreateMode) {
        // 新規作成
        const { data: newTodoList, error: createError } = await supabase
          .from('todo_lists')
          .insert({
            student_id: student.id,
            target_week_start_date: currentWeekStart,
            list_creation_date: format(new Date(), 'yyyy-MM-dd'),
            status: publish ? '公開済み' : '下書き',
          })
          .select()
          .single();

        if (createError) throw createError;
        todoListId = newTodoList.id;
      } else {
        // 既存更新
        const { error: updateError } = await supabase
          .from('todo_lists')
          .update({
            status: publish ? '公開済み' : '下書き',
            updated_at: new Date().toISOString(),
          })
          .eq('id', todoListId);

        if (updateError) throw updateError;
      }

      // タスクの処理
      const activeTasks = tasks.filter(task => !task.isDeleted);
      const deletedTasks = tasks.filter(task => task.isDeleted);
      const newTasks = activeTasks.filter(task => task.isNew);
      const updatedTasks = activeTasks.filter(task => !task.isNew);

      // 削除されたタスクを削除
      if (deletedTasks.length > 0) {
        const { error: deleteError } = await supabase
          .from('tasks')
          .delete()
          .in('id', deletedTasks.map(t => t.id).filter(Boolean));

        if (deleteError) throw deleteError;
      }

      // 新規タスクを挿入
      if (newTasks.length > 0) {
        const { error: insertError } = await supabase
          .from('tasks')
          .insert(
            newTasks.map(task => ({
              todo_list_id: todoListId,
              target_date: task.target_date,
              content: task.content,
              display_order: task.display_order,
              is_completed: false,
            }))
          );

        if (insertError) throw insertError;
      }

      // 既存タスクを更新
      for (const task of updatedTasks) {
        if (task.id) {
          const { error: updateTaskError } = await supabase
            .from('tasks')
            .update({
              content: task.content,
              display_order: task.display_order,
              updated_at: new Date().toISOString(),
            })
            .eq('id', task.id);

          if (updateTaskError) throw updateTaskError;
        }
      }

      Alert.alert(
        '保存完了',
        publish ? 'やることリストを公開しました' : 'やることリストを下書き保存しました',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );

    } catch (err) {
      console.error('Save error:', err);
      Alert.alert('エラー', 'やることリストの保存に失敗しました');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <TeacherGuard>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
              <ArrowLeft size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.title}>やることリスト編集</Text>
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>読み込み中...</Text>
          </View>
        </SafeAreaView>
      </TeacherGuard>
    );
  }

  if (error || !todoList || !student) {
    return (
      <TeacherGuard>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleGoBack}>
              <ArrowLeft size={24} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.title}>やることリスト編集</Text>
          </View>
          <View style={styles.errorContainer}>
            <AlertTriangle size={64} color="#EF4444" />
            <Text style={styles.errorText}>{error || 'データが見つかりません'}</Text>
            <TouchableOpacity style={styles.retryButton} onPress={fetchData}>
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
          <Text style={styles.title}>
            {isCreateMode ? 'やることリスト作成' : 'やることリスト編集'}
          </Text>
        </View>

        <ScrollView style={styles.content}>
          {/* 生徒情報 */}
          <View style={styles.section}>
            <Text style={styles.studentName}>{student.full_name}</Text>
            <View style={styles.weekInfo}>
              <Calendar size={16} color="#6B7280" />
              <Text style={styles.weekText}>
                {format(new Date(currentWeekStart), 'yyyy年M月d日', { locale: ja })}週
              </Text>
              <View style={[
                styles.statusBadge,
                todoList.status === '公開済み' ? styles.publishedBadge : styles.draftBadge
              ]}>
                {todoList.status === '公開済み' ? (
                  <Eye size={12} color="#166534" />
                ) : (
                  <EyeOff size={12} color="#92400E" />
                )}
                <Text style={[
                  styles.statusText,
                  todoList.status === '公開済み' ? styles.publishedText : styles.draftText
                ]}>
                  {todoList.status}
                </Text>
              </View>
            </View>
          </View>

          {/* 日別タスク編集 */}
          <View style={styles.section}>
            {Array.from({ length: 7 }, (_, i) => {
              const date = addDays(new Date(currentWeekStart), i);
              const dateStr = format(date, 'yyyy-MM-dd');
              const dayTasks = tasks.filter(task => 
                task.target_date === dateStr && !task.isDeleted
              );

              return (
                <View key={dateStr} style={styles.daySection}>
                  <View style={styles.dayHeader}>
                    <Text style={styles.dayTitle}>
                      {format(date, 'M/d(E)', { locale: ja })}
                    </Text>
                    <TouchableOpacity 
                      style={styles.addTaskButton}
                      onPress={() => handleAddTask(dateStr)}
                    >
                      <Plus size={16} color="#3B82F6" />
                      <Text style={styles.addTaskText}>追加</Text>
                    </TouchableOpacity>
                  </View>

                  {dayTasks.length === 0 ? (
                    <Text style={styles.noTasksText}>タスクなし</Text>
                  ) : (
                    dayTasks.map((task, index) => {
                      const taskIndex = tasks.findIndex(t => t === task);
                      return (
                        <View key={`${task.id || 'new'}-${index}`} style={styles.taskItem}>
                          <View style={styles.taskCheckbox}>
                            <CheckCircle2 size={16} color="#D1D5DB" />
                          </View>
                          <TextInput
                            style={styles.taskInput}
                            value={task.content}
                            onChangeText={(text) => handleUpdateTaskContent(taskIndex, text)}
                            placeholder="タスクを入力..."
                            multiline
                          />
                          <TouchableOpacity
                            style={styles.deleteButton}
                            onPress={() => handleDeleteTask(taskIndex)}
                          >
                            <Trash2 size={16} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      );
                    })
                  )}
                </View>
              );
            })}
          </View>

          {/* 保存ボタン */}
          <View style={styles.section}>
            <View style={styles.saveButtons}>
              <TouchableOpacity
                style={[styles.saveButton, styles.draftButton]}
                onPress={() => handleSave(false)}
                disabled={saving}
              >
                <Save size={16} color="#6B7280" />
                <Text style={styles.draftButtonText}>
                  {saving ? '保存中...' : '下書き保存'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.saveButton, styles.publishButton]}
                onPress={() => handleSave(true)}
                disabled={saving}
              >
                <Eye size={16} color="#FFFFFF" />
                <Text style={styles.publishButtonText}>
                  {saving ? '保存中...' : '公開'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* タスク追加モーダル */}
        <Modal
          visible={newTaskModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setNewTaskModalVisible(false)}>
                <Text style={styles.modalCancelText}>キャンセル</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>
                {format(new Date(selectedDate), 'M/d(E)', { locale: ja })}のタスク追加
              </Text>
              <TouchableOpacity 
                onPress={handleCreateTask}
                disabled={!newTaskContent.trim()}
              >
                <Text style={[
                  styles.modalSubmitText,
                  !newTaskContent.trim() && styles.modalSubmitDisabled
                ]}>
                  追加
                </Text>
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              <TextInput
                style={styles.taskModalInput}
                placeholder="タスクを入力してください..."
                value={newTaskContent}
                onChangeText={setNewTaskContent}
                multiline
                maxLength={200}
                autoFocus
              />
              <Text style={styles.characterCount}>
                {newTaskContent.length}/200文字
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
    marginTop: 16,
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
  studentName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  weekInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weekText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
    marginLeft: 6,
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginLeft: 4,
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
  addTaskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
  },
  addTaskText: {
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
    alignItems: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    marginBottom: 8,
  },
  taskCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 12,
    marginTop: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
    textAlignVertical: 'top',
  },
  deleteButton: {
    marginLeft: 8,
    padding: 8,
  },
  saveButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  draftButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  publishButton: {
    backgroundColor: '#3B82F6',
  },
  draftButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginLeft: 6,
  },
  publishButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 6,
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
  taskModalInput: {
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
});