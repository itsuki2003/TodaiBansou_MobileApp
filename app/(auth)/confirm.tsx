import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/lib/supabaseClient';

export default function ConfirmScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const params = useLocalSearchParams();

  useEffect(() => {
    const handleDeepLink = async () => {
      try {
        const { token, type } = params;
        
        if (!token || !type) {
          throw new Error('トークンまたはタイプが指定されていません。');
        }

        const { error: verifyError } = await supabase.auth.verifyOtp({
          token_hash: token as string,
          type: type as 'signup' | 'recovery' | 'invite' | 'magiclink' | 'email_change',
        });

        if (verifyError) {
          throw verifyError;
        }

        // 認証成功後、ユーザーの生徒情報をチェック
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // 生徒情報が存在するかチェック
          const { data: studentData } = await supabase
            .from('students')
            .select('id')
            .eq('user_id', user.id)
            .single();

          if (!studentData) {
            // 生徒情報が未登録の場合、生徒情報登録画面に遷移
            router.replace('/student-registration');
          } else {
            // 既存ユーザーの場合、メイン画面に遷移
            router.replace('/(tabs)');
          }
        } else {
          router.replace('/(tabs)');
        }
      } catch (err: any) {
        // エラーはAlertで表示するため、console.errorは削除
        setError('メールアドレスの確認に失敗しました。');
      } finally {
        setLoading(false);
      }
    };

    handleDeepLink();
  }, [params]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.text}>メールアドレスの確認中...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={[styles.text, styles.error]}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>メールアドレスの確認が完了しました。</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  text: {
    fontSize: 16,
    color: '#1E293B',
    textAlign: 'center',
    marginTop: 16,
  },
  error: {
    color: '#EF4444',
  },
}); 