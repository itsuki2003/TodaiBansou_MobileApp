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
  Modal,
} from 'react-native';
import {
  MessageCircle,
  User,
  Users,
  Send,
  Clock,
  CheckCircle2,
  ArrowLeft,
  Search,
  X,
} from 'lucide-react-native';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';

import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabaseClient';
import { TeacherGuard } from '../../components/common/RoleGuard';
import AppHeader from '../../components/ui/AppHeader';
import type { Database } from '../../types/database.types';

type ChatMessage = Database['public']['Tables']['chat_messages']['Row'];
type ChatGroup = Database['public']['Tables']['chat_groups']['Row'];
type Student = Database['public']['Tables']['students']['Row'];

interface ChatGroupWithStudent extends ChatGroup {
  student: Student;
  unreadCount: number;
  lastMessage?: {
    content: string;
    sent_at: string;
    sender_role: string;
  };
}

interface MessageWithDetails extends ChatMessage {
  senderName?: string;
  isCurrentUser: boolean;
}

export default function TeacherChatScreen() {
  const { user, teacher } = useAuth();
  
  const [chatGroups, setChatGroups] = useState<ChatGroupWithStudent[]>([]);
  const [selectedChatGroup, setSelectedChatGroup] = useState<ChatGroupWithStudent | null>(null);
  const [messages, setMessages] = useState<MessageWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  
  const scrollViewRef = useRef<ScrollView>(null);

  // 担当生徒のチャットグループを取得
  const fetchChatGroups = useCallback(async () => {
    if (!teacher?.id) return;

    try {
      setError(null);

      // 担当生徒を取得
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('assignments')
        .select(`
          student_id,
          students (
            id,
            full_name,
            grade
          )
        `)
        .eq('teacher_id', teacher.id)
        .eq('status', '有効');

      if (assignmentsError) throw assignmentsError;

      if (!assignmentsData || assignmentsData.length === 0) {
        setChatGroups([]);
        return;
      }

      const studentIds = assignmentsData.map(a => a.student_id);

      // チャットグループを取得
      const { data: chatGroupsData, error: chatGroupsError } = await supabase
        .from('chat_groups')
        .select(`
          *,
          students (
            id,
            full_name,
            grade
          )
        `)
        .in('student_id', studentIds)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (chatGroupsError) throw chatGroupsError;

      // 各チャットグループの最新メッセージと未読数を取得
      const chatGroupsWithDetails = await Promise.all(
        (chatGroupsData || []).map(async (chatGroup): Promise<ChatGroupWithStudent> => {
          // 最新メッセージを取得
          const { data: lastMessageData } = await supabase
            .from('chat_messages')
            .select('content, sent_at, sender_role')
            .eq('chat_group_id', chatGroup.id)
            .order('sent_at', { ascending: false })
            .limit(1)
            .single();

          // TODO: 未読数計算（実装は簡略化）
          const unreadCount = 0;

          return {
            ...chatGroup,
            student: chatGroup.students as Student,
            unreadCount,
            lastMessage: lastMessageData || undefined,
          };
        })
      );

      setChatGroups(chatGroupsWithDetails);

    } catch (err) {
      console.error('Chat groups fetch error:', err);
      setError('チャットグループの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  }, [teacher?.id]);

  // メッセージを取得
  const fetchMessages = useCallback(async (chatGroupId: string) => {
    try {
      setError(null);

      const { data: messagesData, error: messagesError } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('chat_group_id', chatGroupId)
        .order('sent_at', { ascending: true })
        .limit(100);

      if (messagesError) throw messagesError;

      // 送信者名を取得してメッセージを整形
      const messagesWithDetails = await Promise.all(
        (messagesData || []).map(async (message): Promise<MessageWithDetails> => {
          let senderName = 'システム';
          
          if (message.sender_role === '生徒' || message.sender_role === '保護者') {
            // 生徒・保護者の名前を取得
            const { data: studentData } = await supabase
              .from('students')
              .select('full_name, parent_name')
              .eq('user_id', message.sender_user_id)
              .single();
            
            if (studentData) {
              senderName = message.sender_role === '生徒' ? studentData.full_name : studentData.parent_name;
            }
          } else if (message.sender_role === '講師') {
            if (message.sender_user_id === user?.id) {
              senderName = '自分';
            } else {
              const { data: teacherData } = await supabase
                .from('teachers')
                .select('full_name')
                .eq('user_id', message.sender_user_id)
                .single();
              
              senderName = teacherData?.full_name || '講師';
            }
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
    fetchChatGroups();
  }, [fetchChatGroups]);

  // リアルタイム更新の設定
  useEffect(() => {
    if (!selectedChatGroup?.id) return;

    const subscription = supabase
      .channel(`chat_messages:chat_group_id=eq.${selectedChatGroup.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages',
          filter: `chat_group_id=eq.${selectedChatGroup.id}`,
        },
        () => {
          // メッセージが変更されたら再取得
          fetchMessages(selectedChatGroup.id);
          // チャットグループリストも更新
          fetchChatGroups();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [selectedChatGroup?.id, fetchMessages, fetchChatGroups]);

  // メッセージ送信
  const sendMessage = async () => {
    if (!messageText.trim() || !selectedChatGroup || !user || sending) return;

    try {
      setSending(true);
      setError(null);

      const { error: sendError } = await supabase
        .from('chat_messages')
        .insert([{
          chat_group_id: selectedChatGroup.id,
          sender_user_id: user.id,
          sender_role: '講師',
          content: messageText.trim(),
          sent_at: new Date().toISOString(),
        }]);

      if (sendError) throw sendError;

      // チャットグループの最終メッセージ日時を更新
      await supabase
        .from('chat_groups')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', selectedChatGroup.id);

      setMessageText('');

    } catch (err) {
      console.error('Message send error:', err);
      setError('メッセージの送信に失敗しました');
      Alert.alert('エラー', 'メッセージの送信に失敗しました');
    } finally {
      setSending(false);
    }
  };

  // チャットグループ選択
  const handleChatGroupPress = (chatGroup: ChatGroupWithStudent) => {
    setSelectedChatGroup(chatGroup);
    fetchMessages(chatGroup.id);
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

  // フィルタリングされたチャットグループ
  const filteredChatGroups = chatGroups.filter(chatGroup =>
    chatGroup.student.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <TeacherGuard>
        <SafeAreaView style={styles.container}>
          <AppHeader title="チャット" />
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3B82F6" />
            <Text style={styles.loadingText}>チャットを読み込み中...</Text>
          </View>
        </SafeAreaView>
      </TeacherGuard>
    );
  }

  // チャット詳細表示
  if (selectedChatGroup) {
    return (
      <TeacherGuard>
        <SafeAreaView style={styles.container}>
          <View style={styles.chatDetailHeader}>
            <TouchableOpacity 
              onPress={() => setSelectedChatGroup(null)}
              style={styles.backButton}
            >
              <ArrowLeft size={24} color="#374151" />
            </TouchableOpacity>
            <View style={styles.chatDetailInfo}>
              <Text style={styles.chatDetailTitle}>{selectedChatGroup.student.full_name}さん</Text>
              <Text style={styles.chatDetailSubtitle}>
                {selectedChatGroup.student.grade} | 相談チャット
              </Text>
            </View>
          </View>
          
          <KeyboardAvoidingView 
            style={styles.chatDetailContent}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
          >
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
                    生徒・保護者と相談を始めましょう
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
      </TeacherGuard>
    );
  }

  // チャットグループ一覧表示
  return (
    <TeacherGuard>
      <SafeAreaView style={styles.container}>
        <AppHeader title="チャット" />
        
        {/* 検索バー */}
        <View style={styles.searchSection}>
          <View style={styles.searchContainer}>
            <Search size={20} color="#9CA3AF" />
            <TextInput
              style={styles.searchInput}
              placeholder="生徒名で検索..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <X size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* チャットグループ一覧 */}
        <ScrollView
          style={styles.content}
          contentContainerStyle={filteredChatGroups.length === 0 ? styles.emptyContainer : undefined}
          showsVerticalScrollIndicator={false}
        >
          {filteredChatGroups.length === 0 ? (
            <View style={styles.emptyState}>
              <MessageCircle size={48} color="#9CA3AF" />
              <Text style={styles.emptyStateText}>
                {chatGroups.length === 0 
                  ? '担当生徒のチャットがありません'
                  : '該当する生徒が見つかりません'
                }
              </Text>
            </View>
          ) : (
            filteredChatGroups.map((chatGroup) => (
              <TouchableOpacity
                key={chatGroup.id}
                style={styles.chatGroupCard}
                onPress={() => handleChatGroupPress(chatGroup)}
              >
                <View style={styles.chatGroupIcon}>
                  <User size={24} color="#3B82F6" />
                </View>
                
                <View style={styles.chatGroupInfo}>
                  <View style={styles.chatGroupHeader}>
                    <Text style={styles.studentName}>{chatGroup.student.full_name}さん</Text>
                    <Text style={styles.chatGroupGrade}>{chatGroup.student.grade}</Text>
                    {chatGroup.unreadCount > 0 && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadCount}>{chatGroup.unreadCount}</Text>
                      </View>
                    )}
                  </View>
                  
                  {chatGroup.lastMessage ? (
                    <View style={styles.lastMessageContainer}>
                      <Text style={styles.lastMessageText} numberOfLines={1}>
                        {chatGroup.lastMessage.content}
                      </Text>
                      <Text style={styles.lastMessageTime}>
                        {chatGroup.lastMessage.sent_at && !isNaN(new Date(chatGroup.lastMessage.sent_at).getTime()) ? 
                          format(new Date(chatGroup.lastMessage.sent_at), 'M/d HH:mm', { locale: ja }) : 
                          ''
                        }
                      </Text>
                    </View>
                  ) : (
                    <Text style={styles.noMessages}>メッセージがありません</Text>
                  )}
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </TeacherGuard>
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
  searchSection: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#111827',
    marginLeft: 8,
  },
  content: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
  },
  chatGroupCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  chatGroupIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EBF8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  chatGroupInfo: {
    flex: 1,
  },
  chatGroupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  chatGroupGrade: {
    fontSize: 12,
    color: '#6B7280',
    marginRight: 8,
  },
  unreadBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: 'center',
  },
  unreadCount: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  lastMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessageText: {
    fontSize: 14,
    color: '#6B7280',
    flex: 1,
    marginRight: 8,
  },
  lastMessageTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  noMessages: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  // チャット詳細画面のスタイル
  chatDetailHeader: {
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
  },
  chatDetailInfo: {
    flex: 1,
  },
  chatDetailTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  chatDetailSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  chatDetailContent: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  messagesContent: {
    padding: 16,
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