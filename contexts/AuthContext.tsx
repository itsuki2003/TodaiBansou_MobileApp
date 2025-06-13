import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Student, Teacher, Administrator } from '@/types/database.types';

export type UserRole = 'parent' | 'teacher' | 'admin' | null;

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isLoading: boolean;
  userRole: UserRole;
  userRoleLoading: boolean;
  isFirstTimeUser: boolean;
  authError: string | null;
  student: Student | null;
  teacher: Teacher | null;
  administrator: Administrator | null;
  students: Student[];
  selectedStudent: Student | null;
  selectedTeacher: Teacher | null;
  selectStudent: (student: Student) => void;
  needsStudentSelection: boolean;
  clearStudentSelection: () => Promise<void>;
  clearAuthError: () => void;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isLoading: true,
  userRole: null,
  userRoleLoading: true,
  isFirstTimeUser: false,
  authError: null,
  student: null,
  teacher: null,
  administrator: null,
  students: [],
  selectedStudent: null,
  selectedTeacher: null,
  selectStudent: () => {},
  needsStudentSelection: false,
  clearStudentSelection: async () => {},
  clearAuthError: () => {},
  signIn: async () => {},
  signUp: async () => {},
  signOut: async () => {},
  resetPassword: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [userRoleLoading, setUserRoleLoading] = useState(true);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const [student, setStudent] = useState<Student | null>(null);
  const [teacher, setTeacher] = useState<Teacher | null>(null);
  const [administrator, setAdministrator] = useState<Administrator | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [needsStudentSelection, setNeedsStudentSelection] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // エラーをクリアする関数
  const clearAuthError = () => {
    setAuthError(null);
  };

  // 生徒選択機能
  const selectStudent = async (student: Student) => {
    setSelectedStudent(student);
    setNeedsStudentSelection(false);
    await AsyncStorage.setItem('selectedStudentId', student.id);
  };

  // 生徒選択をクリア（テスト用）
  const clearStudentSelection = async () => {
    setSelectedStudent(null);
    setNeedsStudentSelection(true);
    await AsyncStorage.removeItem('selectedStudentId');
  };

  // 保存された生徒選択を復元
  const loadSelectedStudent = async (availableStudents: Student[]) => {
    try {
      const savedStudentId = await AsyncStorage.getItem('selectedStudentId');
      
      if (savedStudentId && availableStudents.length > 0) {
        const savedStudent = availableStudents.find(s => s.id === savedStudentId);
        if (savedStudent) {
          // 保存されていた生徒が現在のリストに存在するかチェック
          const studentStillExists = availableStudents.some(s => s.id === savedStudentId);
          if (studentStillExists) {
            setSelectedStudent(savedStudent);
            setNeedsStudentSelection(false);
            return true;
          } else {
            await AsyncStorage.removeItem('selectedStudentId');
          }
        }
      }
    } catch (error) {
      // エラーハンドリング: 保存された生徒選択の読み込みエラー
    }
    return false;
  };

  // ユーザーの役割を取得する関数
  const fetchUserRole = async (userId: string) => {
    try {
      setAuthError(null);
      
      // まず管理者テーブルを確認
      const { data: adminData, error: adminError } = await supabase
        .from('administrators')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (adminError && adminError.code !== 'PGRST116') {
        // エラーハンドリング: 管理者クエリエラー
      }

      if (adminData) {
        setUserRole('admin');
        setAdministrator(adminData);
        setIsFirstTimeUser(false);
        return;
      }

      // 次に講師テーブルを確認
      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (teacherError && teacherError.code !== 'PGRST116') {
        // エラーハンドリング: 講師クエリエラー
      }

      if (teacherData) {
        setUserRole('teacher');
        setTeacher(teacherData);
        setSelectedTeacher(teacherData);
        setIsFirstTimeUser(false);
        return;
      }

      // 最後に生徒テーブルを確認（全ての生徒を取得）
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('*')
        .eq('user_id', userId);

      if (studentError) {
        // エラーハンドリング: 生徒クエリエラー
        throw studentError;
      }

      if (studentData && studentData.length > 0) {
        setUserRole('parent');
        setIsFirstTimeUser(false);
        setStudents(studentData);

        // 生徒選択ロジック
        if (studentData.length === 1) {
          // 生徒が1人の場合は自動選択
          setSelectedStudent(studentData[0]);
          setStudent(studentData[0]);
          setNeedsStudentSelection(false);
        } else {
          // 複数生徒の場合、以前の選択を復元を試みる
          const restored = await loadSelectedStudent(studentData);
          if (!restored) {
            // 復元できない場合は選択画面を表示
            setNeedsStudentSelection(true);
          }
        }
        return;
      }

      // どちらにも該当しない場合（初回ユーザー）
      setUserRole('parent');
      setIsFirstTimeUser(true);
    } catch (error) {
      // エラーハンドリング: ユーザーロール取得エラー
      setAuthError('ユーザー情報の取得に失敗しました。もう一度お試しください。');
      setUserRole(null);
      setIsFirstTimeUser(false);
    } finally {
      setUserRoleLoading(false);
    }
  };

  useEffect(() => {
    // 現在のセッションを取得
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setUserRole(null);
        setUserRoleLoading(false);
        setIsFirstTimeUser(false);
      }
    }).catch((error) => {
      // エラーハンドリング: セッション取得エラー
      setAuthError('セッションの取得に失敗しました。');
      setLoading(false);
      setUserRoleLoading(false);
    });

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        fetchUserRole(session.user.id);
      } else {
        setUserRole(null);
        setUserRoleLoading(false);
        setIsFirstTimeUser(false);
        setStudent(null);
        setTeacher(null);
        setSelectedTeacher(null);
        setAdministrator(null);
        setStudents([]);
        setSelectedStudent(null);
        setAuthError(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // 認証メソッド
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    // ローカルストレージもクリア
    await AsyncStorage.removeItem('selectedStudentId');
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      loading, 
      isLoading: loading, 
      userRole, 
      userRoleLoading,
      isFirstTimeUser,
      authError,
      student,
      teacher,
      administrator,
      students,
      selectedStudent,
      selectedTeacher,
      selectStudent,
      needsStudentSelection,
      clearStudentSelection,
      clearAuthError,
      signIn,
      signUp,
      signOut,
      resetPassword
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 