import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Student, Teacher, Administrator } from '@/types/database.types';
import { APICache, PerformanceMonitor } from '@/utils/performanceHelpers';

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

  // エラーをクリアする関数（メモ化）
  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  // 生徒選択機能（メモ化）
  const selectStudent = useCallback(async (student: Student) => {
    setSelectedStudent(student);
    setNeedsStudentSelection(false);
    await AsyncStorage.setItem('selectedStudentId', student.id);
    
    // キャッシュを更新
    if (user?.id) {
      const cacheKey = `userRole:${user.id}`;
      const cachedData = APICache.get(cacheKey);
      if (cachedData && cachedData.role === 'parent') {
        APICache.set(cacheKey, cachedData, 5 * 60 * 1000); // キャッシュ期間を延長
      }
    }
  }, [user]);

  // 生徒選択をクリア（テスト用・メモ化）
  const clearStudentSelection = useCallback(async () => {
    setSelectedStudent(null);
    setNeedsStudentSelection(true);
    await AsyncStorage.removeItem('selectedStudentId');
    
    // 関連キャッシュをクリア
    if (user?.id) {
      const cacheKey = `userRole:${user.id}`;
      APICache.remove(cacheKey);
    }
  }, [user]);

  // 保存された生徒選択を復元（メモ化）
  const loadSelectedStudent = useCallback(async (availableStudents: Student[]) => {
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
  }, []);

  // ユーザーの役割を取得する関数（最適化版）
  const fetchUserRole = useCallback(async (userId: string) => {
    const endTiming = PerformanceMonitor.startTiming('fetchUserRole');
    
    try {
      setAuthError(null);
      
      // キャッシュから確認
      const cacheKey = `userRole:${userId}`;
      const cachedData = APICache.get(cacheKey);
      if (cachedData) {
        const { role, userData } = cachedData;
        setUserRole(role);
        
        if (role === 'admin') {
          setAdministrator(userData);
        } else if (role === 'teacher') {
          setTeacher(userData);
          setSelectedTeacher(userData);
        } else if (role === 'parent' && userData.length > 0) {
          setStudents(userData);
          if (userData.length === 1) {
            setSelectedStudent(userData[0]);
            setStudent(userData[0]);
            setNeedsStudentSelection(false);
          } else {
            const restored = await loadSelectedStudent(userData);
            if (!restored) {
              setNeedsStudentSelection(true);
            }
          }
        }
        
        setIsFirstTimeUser(false);
        return;
      }
      
      // 並行してすべてのテーブルをクエリ（パフォーマンス最適化）
      const [adminResult, teacherResult, studentResult] = await Promise.allSettled([
        supabase
          .from('administrators')
          .select('*')
          .eq('user_id', userId)
          .single(),
        supabase
          .from('teachers')
          .select('*')
          .eq('user_id', userId)
          .single(),
        supabase
          .from('students')
          .select('*')
          .eq('user_id', userId)
      ]);

      // 管理者チェック
      if (adminResult.status === 'fulfilled' && adminResult.value.data) {
        const adminData = adminResult.value.data;
        setUserRole('admin');
        setAdministrator(adminData);
        setIsFirstTimeUser(false);
        
        // キャッシュに保存（10分間）
        APICache.set(cacheKey, { role: 'admin', userData: adminData }, 10 * 60 * 1000);
        return;
      }

      // 講師チェック
      if (teacherResult.status === 'fulfilled' && teacherResult.value.data) {
        const teacherData = teacherResult.value.data;
        setUserRole('teacher');
        setTeacher(teacherData);
        setSelectedTeacher(teacherData);
        setIsFirstTimeUser(false);
        
        // キャッシュに保存（10分間）
        APICache.set(cacheKey, { role: 'teacher', userData: teacherData }, 10 * 60 * 1000);
        return;
      }

      // 生徒/保護者チェック
      if (studentResult.status === 'fulfilled' && studentResult.value.data) {
        const studentData = studentResult.value.data;
        
        if (studentData.length > 0) {
          setUserRole('parent');
          setIsFirstTimeUser(false);
          setStudents(studentData);

          // 生徒選択ロジック
          if (studentData.length === 1) {
            setSelectedStudent(studentData[0]);
            setStudent(studentData[0]);
            setNeedsStudentSelection(false);
          } else {
            const restored = await loadSelectedStudent(studentData);
            if (!restored) {
              setNeedsStudentSelection(true);
            }
          }
          
          // キャッシュに保存（5分間）
          APICache.set(cacheKey, { role: 'parent', userData: studentData }, 5 * 60 * 1000);
          return;
        }
      }

      // どちらにも該当しない場合（初回ユーザー）
      setUserRole('parent');
      setIsFirstTimeUser(true);
      
    } catch (error) {
      console.error('fetchUserRole error:', error);
      setAuthError('ユーザー情報の取得に失敗しました。もう一度お試しください。');
      setUserRole(null);
      setIsFirstTimeUser(false);
    } finally {
      setUserRoleLoading(false);
      endTiming();
    }
  }, [loadSelectedStudent]);

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

  // 認証メソッド（メモ化）
  const signIn = useCallback(async (email: string, password: string) => {
    const endTiming = PerformanceMonitor.startTiming('signIn');
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } finally {
      endTiming();
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const endTiming = PerformanceMonitor.startTiming('signUp');
    try {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) throw error;
    } finally {
      endTiming();
    }
  }, []);

  const signOut = useCallback(async () => {
    const endTiming = PerformanceMonitor.startTiming('signOut');
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // キャッシュとローカルストレージをクリア
      APICache.clear();
      await AsyncStorage.removeItem('selectedStudentId');
    } finally {
      endTiming();
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    const endTiming = PerformanceMonitor.startTiming('resetPassword');
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
    } finally {
      endTiming();
    }
  }, []);

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