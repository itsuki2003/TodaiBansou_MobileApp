import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  Send,
  MessageCircle,
  User,
  Users,
  Clock,
  CheckCircle2,
} from 'lucide-react-native';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import AppHeader from '../../components/ui/AppHeader';
import type { Database } from '../../types/database.types';

type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];
type ChatGroup = Database['public']['Tables']['chat_groups']['Row'];

interface MessageWithDetails extends ChatMessage {
  senderName?: string;
  isCurrentUser: boolean;
}

export default function ChatScreen() {
  const { user, userRole, student } = useAuth();
  
  const [chatGroup, setChatGroup] = useState<ChatGroup | null>(null);
  const [messages, setMessages] = useState<MessageWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const scrollViewRef = useRef<ScrollView>(null);

  // チャットグループを取得または作成
  const fetchOrCreateChatGroup = useCallback(async () => {
    if (!student?.id) return;

    try {
      setError(null);

      // 既存のチャットグループを確認
      let { data: existingGroup, error: groupError } = await supabase
        .from('chat_groups')
        .select('*')
        .eq('student_id', student.id)
        .single();

      if (groupError && groupError.code !== 'PGRST116') {
        throw groupError;
      }

      // チャットグループが存在しない場合は作成
      if (!existingGroup) {
        const { data: newGroup, error: createError } = await supabase
          .from('chat_groups')
          .insert([{
            student_id: student.id,
            group_name: `${student.full_name}さんのチャット`,
            last_message_at: new Date().toISOString(),
          }])
          .select()
          .single();

        if (createError) throw createError;
        existingGroup = newGroup;
      }

      setChatGroup(existingGroup);
      return existingGroup;

    } catch (err) {
      console.error('Chat group fetch/create error:', err);
      setError('チャットの準備に失敗しました');
      return null;
    }
  }, [student?.id]);

  // メッセージを取得
  const fetchMessages = useCallback(async (groupId: string) => {
    try {
      setError(null);

      const { data: messagesData, error: messagesError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('chat_group_id', groupId)
        .order('sent_at', { ascending: true })
        .limit(100);

      if (messagesError) throw messagesError;

      // 送信者名を取得してメッセージを整形
      const messagesWithDetails = await Promise.all(
        (messagesData || []).map(async (message): Promise<MessageWithDetails> => {
          let senderName = 'システム';
          
          if (message.sender_role === '生徒' || message.sender_role === '保護者') {
            if (message.sender_user_id === user?.id) {
              senderName = message.sender_role === '生徒' ? '自分' : '保護者';
            } else {
              // 生徒・保護者の名前を取得
              const { data: studentData } = await supabase
                .from('students')
                .select('full_name, parent_name')
                .eq('user_id', message.sender_user_id)
                .single();
              
              if (studentData) {
                senderName = message.sender_role === '生徒' ? studentData.full_name : studentData.parent_name;
              }
            }
          } else if (message.sender_role === '講師') {
            const { data: teacherData } = await supabase
              .from('teachers')
              .select('full_name')
              .eq('user_id', message.sender_user_id)
              .single();
            
            senderName = teacherData?.full_name || '講師';
          } else if (message.sender_role === '運営') {
            const { data: adminData } = await supabase
              .from('administrators')
              .select('full_name')
              .eq('user_id', message.sender_user_id)
              .single();
            
            senderName = adminData?.full_name || '運営';
          }

          return {
            ...message,
            senderName,
            isCurrentUser: message.sender_user_id === user?.id,
          };
        })
      );

      setMessages(messagesWithDetails);
      
      // スクロールを最下部に移動
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);

    } catch (err) {
      console.error('Messages fetch error:', err);
      setError('メッセージの取得に失敗しました');
    }
  }, [user?.id]);

  // 初期化
  useEffect(() => {
    const initialize = async () => {
      setLoading(true);
      const group = await fetchOrCreateChatGroup();
      if (group) {
        await fetchMessages(group.id);
      }
      setLoading(false);
    };

    if (student?.id && user?.id) {
      initialize();
    }
  }, [student?.id, user?.id, fetchOrCreateChatGroup, fetchMessages]);

  // リアルタイム更新の設定
  useEffect(() => {
    if (!chatGroup?.id) return;

    const subscription = supabase
      .channel(`chat_messages:chat_group_id=eq.${chatGroup.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `chat_group_id=eq.${chatGroup.id}`,
        },
        () => {
          // メッセージが変更されたら再取得
          fetchMessages(chatGroup.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [chatGroup?.id, fetchMessages]);

  // メッセージ送信
  const sendMessage = async () => {
    if (!messageText.trim() || !chatGroup || !user || sending) return;

    try {
      setSending(true);
      setError(null);

      const senderRole = userRole === 'parent' ? '生徒' : '保護者';
      
      const { error: sendError } = await supabase
        .from('chat_messages')
        .insert([{
          chat_group_id: chatGroup.id,
          sender_user_id: user.id,
          sender_role: senderRole,
          content: messageText.trim(),
          sent_at: new Date().toISOString(),
        }]);

      if (sendError) throw sendError;

      // チャットグループの最終メッセージ日時を更新
      await supabase
        .from('chat_groups')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', chatGroup.id);

      setMessageText('');

    } catch (err) {
      console.error('Message send error:', err);
      setError('メッセージの送信に失敗しました');
      Alert.alert('エラー', 'メッセージの送信に失敗しました');
    } finally {
      setSending(false);
    }
  };

  // メッセージ表示コンポーネント
  const renderMessage = (message: MessageWithDetails) => (
    <View
      key={message.id}
      style={[
        styles.messageContainer,
        message.isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage,
      ]}
    >
      {!message.isCurrentUser && (
        <View style={styles.messageHeader}>
          <View style={styles.senderIcon}>
            {message.sender_role === '生徒' || message.sender_role === '保護者' ? (
              <User size={12} color="#6B7280" />
            ) : message.sender_role === '講師' ? (
              <Users size={12} color="#3B82F6" />
            ) : (
              <CheckCircle2 size={12} color="#10B981" />
            )}
          </View>
          <Text style={styles.senderName}>{message.senderName}</Text>
        </View>
      )}
      
      <View
        style={[
          styles.messageBubble,
          message.isCurrentUser ? styles.currentUserBubble : styles.otherUserBubble,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            message.isCurrentUser ? styles.currentUserText : styles.otherUserText,
          ]}
        >
          {message.content}
        </Text>
      </View>
      
      <View style={styles.messageFooter}>
        <Clock size={10} color="#9CA3AF" />
        <Text style={styles.messageTime}>
          {message.sent_at && !isNaN(new Date(message.sent_at).getTime()) ? 
            format(new Date(message.sent_at), 'HH:mm', { locale: ja }) : 
            '--:--'
          }
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader title="チャット" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>チャットを読み込み中...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !chatGroup) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader title="チャット" />
        <View style={styles.errorContainer}>
          <MessageCircle size={48} color="#9CA3AF" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton} 
            onPress={() => {
              setLoading(true);
              fetchOrCreateChatGroup().then(group => {
                if (group) fetchMessages(group.id);
                setLoading(false);
              });
            }}
          >
            <Text style={styles.retryButtonText}>再試行</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="チャット" />
      
      <KeyboardAvoidingView 
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* チャット情報ヘッダー */}
        <View style={styles.chatHeader}>
          <MessageCircle size={20} color="#3B82F6" />
          <Text style={styles.chatTitle}>
            {student?.full_name}さんとの相談チャット
          </Text>
        </View>

        {/* メッセージ一覧 */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.length === 0 ? (
            <View style={styles.emptyState}>
              <MessageCircle size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>
                まだメッセージがありません{'\n'}
                講師や運営スタッフとの相談にご利用ください
              </Text>
            </View>
          ) : (
            messages.map(renderMessage)
          )}
        </ScrollView>

        {/* エラー表示 */}
        {error && (
          <View style={styles.errorBanner}>
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        )}

        {/* メッセージ入力エリア */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="メッセージを入力..."
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={1000}
            editable={!sending}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!messageText.trim() || sending) && styles.sendButtonDisabled,
            ]}
            onPress={sendMessage}
            disabled={!messageText.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Send size={20} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
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
    padding: 32,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
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
  content: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 8,
  },
  chatTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  messagesContent: {
    padding: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
  },
  messageContainer: {
    marginBottom: 16,
  },
  currentUserMessage: {
    alignItems: 'flex-end',
  },
  otherUserMessage: {
    alignItems: 'flex-start',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  senderIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  senderName: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  currentUserBubble: {
    backgroundColor: '#3B82F6',
  },
  otherUserBubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  currentUserText: {
    color: '#FFFFFF',
  },
  otherUserText: {
    color: '#111827',
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  messageTime: {
    fontSize: 10,
    color: '#9CA3AF',
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    margin: 16,
  },
  errorBannerText: {
    fontSize: 14,
    color: '#DC2626',
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 12,
  },
  textInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#F9FAFB',
  },
  sendButton: {
    width: 40,
    height: 40,
    backgroundColor: '#3B82F6',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
});