'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { AuthContextType, AuthUser, UserRole } from '@/types/auth';
import { Session } from '@supabase/supabase-js';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // 初期セッション確認
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔑 初期セッション確認:', !!session);
      if (session) {
        setUserFromSession(session);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    // 認証状態の変化を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state change:', event);
        if (event === 'SIGNED_IN' && session) {
          console.log('🔄 SIGNED_IN event - calling setUserFromSession');
          await setUserFromSession(session);
        } else if (event === 'SIGNED_OUT') {
          console.log('🔄 SIGNED_OUT event');
          setUser(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const setUserFromSession = async (session: Session) => {
    try {
      setLoading(true);
      const userId = session.user.id;
      const email = session.user.email || '';

      console.log('👤 ユーザー情報設定開始:', { userId, email });

      // まず administrators テーブルを確認
      const { data: adminData, error: adminError } = await supabase
        .from('administrators')
        .select('full_name, account_status')
        .eq('user_id', userId)
        .eq('account_status', '有効')
        .single();

      if (adminData && !adminError) {
        console.log('👤 管理者として認証成功');
        setUser({
          id: userId,
          email,
          role: 'admin',
          profile: {
            full_name: adminData.full_name,
            account_status: adminData.account_status,
          },
        });
        setLoading(false);
        return;
      }

      // 次に teachers テーブルを確認
      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .select('full_name, account_status')
        .eq('user_id', userId)
        .eq('account_status', '有効')
        .single();

      if (teacherData && !teacherError) {
        console.log('👤 講師として認証成功');
        setUser({
          id: userId,
          email,
          role: 'teacher',
          profile: {
            full_name: teacherData.full_name,
            account_status: teacherData.account_status,
          },
        });
        setLoading(false);
        return;
      }

      // どちらのテーブルにも存在しない、または無効なアカウント
      console.warn('👤 権限のないユーザー、ログアウトします');
      await supabase.auth.signOut();
      setUser(null);
      setLoading(false);
    } catch (error) {
      console.error('👤 ユーザー設定エラー:', error);
      setUser(null);
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    console.log('🔑 AuthContext: signIn開始');
    try {
      console.log('🔑 Supabase認証を実行中...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('🔑 Supabase認証結果:', { hasSession: !!data.session, hasError: !!error });

      if (error) {
        console.error('🔑 Supabase認証エラー:', error);
        setLoading(false);
        throw error;
      }

      if (data.session) {
        console.log('🔑 セッション取得成功 - onAuthStateChangeが処理します');
        // onAuthStateChangeで自動的に処理されるため、ここでは何もしない
      } else {
        console.log('🔑 セッションなし');
        setLoading(false);
      }
    } catch (error) {
      console.error('🔑 signInエラー:', error);
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    mounted,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}