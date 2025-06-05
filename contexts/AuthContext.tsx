import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Session, User } from '@supabase/supabase-js';

type UserRole = 'teacher' | 'student' | null;

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: UserRole;
  userRoleLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  userRole: null,
  userRoleLoading: true,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [userRoleLoading, setUserRoleLoading] = useState(true);

  // ユーザーの役割を取得する関数
  const fetchUserRole = async (userId: string) => {
    try {
      // まず講師テーブルを確認
      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (teacherError && teacherError.code !== 'PGRST116') {
        throw teacherError;
      }

      if (teacherData) {
        setUserRole('teacher');
        return;
      }

      // 次に生徒テーブルを確認
      const { data: studentData, error: studentError } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (studentError && studentError.code !== 'PGRST116') {
        throw studentError;
      }

      if (studentData) {
        setUserRole('student');
        return;
      }

      // どちらにも該当しない場合
      setUserRole(null);
    } catch (error) {
      console.error('Error fetching user role:', error);
      setUserRole(null);
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
      }
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
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading, userRole, userRoleLoading }}>
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