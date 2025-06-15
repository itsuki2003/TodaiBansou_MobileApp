import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Mail } from 'lucide-react-native';
import * as Linking from 'expo-linking';
import AppHeader from '@/components/ui/AppHeader';

export default function ResetPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();

  const handleResetPassword = async () => {
    if (!email) {
      Alert.alert('エラー', 'メールアドレスを入力してください。');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('エラー', '正しいメールアドレスを入力してください。');
      return;
    }

    try {
      setLoading(true);
      await resetPassword(email);

      Alert.alert(
        'パスワードリセット',
        'パスワードリセット用のリンクをメールで送信しました。メール内のリンクをクリックして新しいパスワードを設定してください。',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/login'),
          },
        ]
      );
    } catch (error: any) {
      // エラーはAlertで表示するため、console.errorは削除
      Alert.alert('エラー', 'パスワードリセットメールの送信に失敗しました。しばらく時間をおいて再度お試しください。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
        <AppHeader 
          title="パスワードリセット" 
          showBackButton={true}
          onBackPress={() => router.back()}
        />
        
        <View style={styles.logoContainer}>
          <Image source={require('../../logo.png')} style={styles.logo} />
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.description}>
            ご登録いただいたメールアドレスを入力してください。{'\n'}
            パスワードリセット用のリンクをお送りします。
          </Text>

          <View style={styles.inputContainer}>
            <Mail size={20} color="#64748B" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="メールアドレス"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleResetPassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>リセットメールを送信</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.backToLoginButton}
            onPress={() => router.replace('/login')}
          >
            <Text style={styles.backToLoginText}>ログイン画面に戻る</Text>
          </TouchableOpacity>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    width: 200,
    height: 50,
    marginBottom: 16,
    resizeMode: 'contain',
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  description: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1E293B',
  },
  button: {
    backgroundColor: '#3B82F6',
    height: 56,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  backToLoginButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  backToLoginText: {
    color: '#64748B',
    fontSize: 15,
  },
});