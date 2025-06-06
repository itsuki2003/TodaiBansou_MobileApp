'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { AuthContextType, AuthUser } from '@/types/auth';
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
  const [signOutLoading, setSignOutLoading] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [processingSession, setProcessingSession] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    
    // 初期セッション確認
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔑 初期セッション確認:', !!session);
      }
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
        if (process.env.NODE_ENV === 'development') {
          console.log('🔄 Auth state change:', event);
        }
        if (event === 'SIGNED_IN' && session) {
          // 既に処理中でない場合のみ実行
          if (processingSession !== session.user.id) {
            await setUserFromSession(session);
          }
        } else if (event === 'SIGNED_OUT') {
          
          // クライアント側の状態を完全にクリア
          setUser(null);
          setLoading(false);
          setSignOutLoading(false);
          setSignOutError(null);
          setProcessingSession(null); // セッション処理状態もクリア
          
          // ローカルストレージの完全クリア
          if (typeof window !== 'undefined') {
            localStorage.removeItem('lastVisitedPage');
            sessionStorage.clear();
            
            // Supabase関連のローカルストレージもクリア
            Object.keys(localStorage).forEach(key => {
              if (key.startsWith('sb-') || key.startsWith('supabase')) {
                localStorage.removeItem(key);
              }
            });
          }
          
          if (process.env.NODE_ENV === 'development') {
            console.log('🔄 SIGNED_OUT - 状態クリア完了');
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const setUserFromSession = async (session: Session) => {
    try {
      const userId = session.user.id;
      const email = session.user.email || '';

      // 同じセッションIDで既に処理中の場合はスキップ
      if (processingSession === userId) {
        if (process.env.NODE_ENV === 'development') {
          console.log('👤 同じセッションで処理中のためスキップ:', userId);
        }
        return;
      }

      setProcessingSession(userId);
      setLoading(true);
      if (process.env.NODE_ENV === 'development') {
        console.log('👤 ユーザー情報設定開始:', { userId, email });
      }

      // まず administrators テーブルを確認
      const { data: adminData, error: adminError } = await supabase
        .from('administrators')
        .select('full_name, account_status')
        .eq('user_id', userId)
        .eq('account_status', '有効')
        .single();

      if (adminData && !adminError) {
        if (process.env.NODE_ENV === 'development') {
          console.log('👤 管理者として認証成功');
        }
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
        setProcessingSession(null);
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
        if (process.env.NODE_ENV === 'development') {
          console.log('👤 講師として認証成功');
        }
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
        setProcessingSession(null);
        return;
      }

      // どちらのテーブルにも存在しない、または無効なアカウント
      if (process.env.NODE_ENV === 'development') {
        console.warn('👤 権限のないユーザー、ログアウトします');
      }
      await supabase.auth.signOut();
      setUser(null);
      setLoading(false);
      setProcessingSession(null);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('👤 ユーザー設定エラー:', error);
      }
      setUser(null);
      setLoading(false);
      setProcessingSession(null);
    }
  };

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    setProcessingSession(null); // 新しいログイン処理開始時にリセット
    
    if (process.env.NODE_ENV === 'development') {
      console.log('🔑 AuthContext: signIn開始');
    }
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (process.env.NODE_ENV === 'development') {
        console.log('🔑 Supabase認証結果:', { hasSession: !!data.session, hasError: !!error });
      }

      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('🔑 Supabase認証エラー:', error);
        }
        setLoading(false);
        throw error;
      }

      if (data.session) {
        // setUserFromSessionを直接呼び出して、重複を防ぐ
        await setUserFromSession(data.session);
      } else {
        setLoading(false);
      }
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('🔑 signInエラー:', error);
      }
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setSignOutLoading(true);
      setSignOutError(null);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('🔓 ログアウト処理開始');
      }

      // Supabaseからのサインアウト（これによりSIGNED_OUTイベントが発火される）
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('🔓 Supabaseログアウトエラー:', error);
        }
        throw new Error('ログアウトに失敗しました。もう一度お試しください。');
      }
      
      // 注意: クライアント状態のクリアはonAuthStateChangeのSIGNED_OUTイベントで実行される
      // ここでは重複して実行しない
      
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('🔓 ログアウトエラー:', error);
      }
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'ログアウト中に予期しないエラーが発生しました。';
      setSignOutError(errorMessage);
      throw error;
    } finally {
      setSignOutLoading(false);
    }
  };

  const clearSignOutError = () => {
    setSignOutError(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    mounted,
    signOutLoading,
    signOutError,
    signIn,
    signOut,
    clearSignOutError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}