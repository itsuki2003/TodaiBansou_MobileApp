import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

type UserRole = 'teacher' | 'student' | null;

type StudentData = {
  id: string;
  full_name: string;
  furigana_name?: string;
  grade?: string;
};

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isLoading: boolean;
  userRole: UserRole;
  userRoleLoading: boolean;
  isFirstTimeUser: boolean;
  students: StudentData[];
  selectedStudent: StudentData | null;
  selectStudent: (student: StudentData) => void;
  needsStudentSelection: boolean;
  clearStudentSelection: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  isLoading: true,
  userRole: null,
  userRoleLoading: true,
  isFirstTimeUser: false,
  students: [],
  selectedStudent: null,
  selectStudent: () => {},
  needsStudentSelection: false,
  clearStudentSelection: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [userRoleLoading, setUserRoleLoading] = useState(true);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);
  const [students, setStudents] = useState<StudentData[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);
  const [needsStudentSelection, setNeedsStudentSelection] = useState(false);

  // 生徒選択機能
  const selectStudent = async (student: StudentData) => {
    setSelectedStudent(student);
    setNeedsStudentSelection(false);
    await AsyncStorage.setItem('selectedStudentId', student.id);
    console.log('✅ AuthContext: Student selected:', student.full_name);
  };

  // 生徒選択をクリア（テスト用）
  const clearStudentSelection = async () => {
    setSelectedStudent(null);
    setNeedsStudentSelection(true);
    await AsyncStorage.removeItem('selectedStudentId');
    console.log('🧹 AuthContext: Student selection cleared');
  };

  // 保存された生徒選択を復元
  const loadSelectedStudent = async (availableStudents: StudentData[]) => {
    try {
      const savedStudentId = await AsyncStorage.getItem('selectedStudentId');
      console.log('🔍 AuthContext: Saved student ID from storage:', savedStudentId);
      
      if (savedStudentId && availableStudents.length > 0) {
        const savedStudent = availableStudents.find(s => s.id === savedStudentId);
        if (savedStudent) {
          // 保存されていた生徒が現在のリストに存在するかチェック
          const studentStillExists = availableStudents.some(s => s.id === savedStudentId);
          if (studentStillExists) {
            setSelectedStudent(savedStudent);
            setNeedsStudentSelection(false);
            console.log('✅ AuthContext: Restored student selection:', savedStudent.full_name);
            return true;
          } else {
            console.log('⚠️ AuthContext: Saved student no longer exists, clearing storage');
            await AsyncStorage.removeItem('selectedStudentId');
          }
        }
      }
    } catch (error) {
      console.error('❌ AuthContext: Error loading selected student:', error);
    }
    return false;
  };

  // ユーザーの役割を取得する関数
  const fetchUserRole = async (userId: string) => {
    try {
      console.log('🔍 AuthContext: Starting fetchUserRole for userId:', userId);
      
      // まず講師テーブルを確認
      console.log('🔍 AuthContext: Checking teachers table...');
      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

      console.log('🔍 AuthContext: Teacher query result:', { teacherData, teacherError });

      if (teacherError && teacherError.code !== 'PGRST116') {
        console.error('❌ AuthContext: Teacher query failed:', teacherError);
        throw teacherError;
      }

      if (teacherData && teacherData.length > 0) {
        console.log('✅ AuthContext: User is teacher, setting role');
        setUserRole('teacher');
        setIsFirstTimeUser(false);
        return;
      }

      // 次に生徒テーブルを確認（全ての生徒を取得）
      console.log('🔍 AuthContext: Checking students table...');
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id, full_name, furigana_name, grade')
        .eq('user_id', userId);

      console.log('🔍 AuthContext: Student query result:', { studentData, studentError });

      if (studentError) {
        console.error('❌ AuthContext: Student query failed:', studentError);
        throw studentError;
      }

      if (studentData && studentData.length > 0) {
        console.log('✅ AuthContext: User has students, setting role. Student count:', studentData.length);
        setUserRole('student');
        setIsFirstTimeUser(false);
        setStudents(studentData);

        // 生徒選択ロジック
        if (studentData.length === 1) {
          // 生徒が1人の場合は自動選択
          setSelectedStudent(studentData[0]);
          setNeedsStudentSelection(false);
          console.log('✅ AuthContext: Auto-selected single student:', studentData[0].full_name);
        } else {
          // 複数生徒の場合、以前の選択を復元を試みる
          const restored = await loadSelectedStudent(studentData);
          if (!restored) {
            // 復元できない場合は選択画面を表示
            setNeedsStudentSelection(true);
            console.log('📝 AuthContext: Multiple students found, needs selection');
          }
        }
        return;
      }

      // どちらにも該当しない場合（初回ユーザー）
      console.log('📝 AuthContext: User not found in either table, marking as first time user');
      setUserRole(null);
      setIsFirstTimeUser(true);
    } catch (error) {
      console.error('❌ AuthContext: Error in fetchUserRole:', error);
      setUserRole(null);
      setIsFirstTimeUser(false);
    } finally {
      console.log('🏁 AuthContext: fetchUserRole completed, setting userRoleLoading to false');
      setUserRoleLoading(false);
    }
  };

  useEffect(() => {
    // 現在のセッションを取得
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('AuthContext: Session obtained:', !!session);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        console.log('AuthContext: User found, fetching role for:', session.user.id);
        fetchUserRole(session.user.id);
      } else {
        console.log('AuthContext: No user, setting defaults');
        setUserRole(null);
        setUserRoleLoading(false);
        setIsFirstTimeUser(false);
      }
    }).catch((error) => {
      console.error('AuthContext: Error getting session:', error);
      setLoading(false);
      setUserRoleLoading(false);
    });

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('AuthContext: Auth state changed:', _event, !!session);
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
      
      if (session?.user) {
        console.log('AuthContext: User found in auth change, fetching role');
        fetchUserRole(session.user.id);
      } else {
        console.log('AuthContext: No user in auth change, setting defaults');
        setUserRole(null);
        setUserRoleLoading(false);
        setIsFirstTimeUser(false);
      }
    });

    return () => subscription.unsubscribe();
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
      students,
      selectedStudent,
      selectStudent,
      needsStudentSelection,
      clearStudentSelection
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