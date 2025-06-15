import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Send, Paperclip, X } from 'lucide-react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import ChatMessage from '@/components/ui/ChatMessage';
import AppHeader from '@/components/ui/AppHeader';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

type Message = {
  id: string;
  content: string;
  sender: {
    id: string;
    name: string;
    avatar?: string | null;
  };
  timestamp: Date;
  isCurrentUser: boolean;
  attachments?: Array<{
    type: 'image' | 'pdf';
    url: string;
    name?: string;
  }>;
};

type ChatMessage = {
  id: string;
  content: string;
  sent_at: string;
  sender_user_id: string;
  sender_role: '生徒' | '保護者' | '講師' | '運営' | 'システム';
  attachment_info: {
    type: 'image' | 'pdf';
    url: string;
    name?: string;
  } | null;
  students: {
    full_name: string;
    avatar_url: string | null;
  } | null;
  teachers: {
    full_name: string;
    avatar_url: string | null;
  } | null;
};

type ChatRoomProps = {
  chatGroupId: string;
};

export default function ChatRoom({ chatGroupId }: ChatRoomProps) {
  const { user, userRole } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [attachments, setAttachments] = useState<Array<{
    type: 'image' | 'pdf';
    url: string;
    name?: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const subscriptionRef = useRef<any>(null);
  
  useEffect(() => {
    if (!chatGroupId || !user) return;
    
    // 既存のサブスクリプションがあればクリーンアップ
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }
    
    fetchMessages();
    const unsubscribe = setupRealtimeSubscription();
    
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [chatGroupId, user?.id]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .from('chat_messages')
        .select(`
          id,
          content,
          sent_at,
          sender_user_id,
          sender_role,
          attachment_info
        `)
        .eq('chat_group_id', chatGroupId)
        .order('sent_at', { ascending: true })
        .returns<ChatMessage[]>();

      if (queryError) throw queryError;

      const getSenderName = (role: string) => {
        switch (role) {
          case '生徒': return '生徒';
          case '保護者': return '保護者';
          case '講師': return '講師';
          case '運営': return '運営';
          case 'システム': return 'システム';
          default: return '不明';
        }
      };

      const formattedMessages = data.map(msg => ({
        id: msg.id,
        content: msg.content,
        sender: {
          id: msg.sender_user_id,
          name: getSenderName(msg.sender_role),
          avatar: null, // 暫定的にnull
        },
        timestamp: new Date(msg.sent_at),
        isCurrentUser: msg.sender_user_id === user?.id,
        attachments: msg.attachment_info ? [msg.attachment_info] : [],
      }));

      setMessages(formattedMessages);
    } catch (err) {
      // エラーはsetErrorでハンドリング
      setError('メッセージの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channelName = `chat_messages_${chatGroupId}_${Date.now()}`;
    const subscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `chat_group_id=eq.${chatGroupId}`,
        },
        async (payload) => {
          const newMessage = payload.new;
          
          // 送信者の情報
          const getSenderName = (role: string) => {
            switch (role) {
              case '生徒': return '生徒';
              case '保護者': return '保護者';
              case '講師': return '講師';
              case '運営': return '運営';
              case 'システム': return 'システム';
              default: return '不明';
            }
          };
          const senderName = getSenderName(newMessage.sender_role);

          const message: Message = {
            id: newMessage.id,
            content: newMessage.content,
            sender: {
              id: newMessage.sender_user_id,
              name: senderName,
              avatar: null,
            },
            timestamp: new Date(newMessage.sent_at),
            isCurrentUser: newMessage.sender_user_id === user?.id,
            attachments: newMessage.attachment_info ? [newMessage.attachment_info] : [],
          };

          setMessages(prev => [...prev, message]);
          
          // スクロールを最下部に移動
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 100);
        }
      )
      .subscribe();

    // refに保存
    subscriptionRef.current = subscription;

    return () => {
      subscription.unsubscribe();
    };
  };

  const handleSend = async (retryCount = 0) => {
    if ((inputText.trim() === '' && attachments.length === 0) || !user) return;

    const maxRetries = 3;
    let uploadedFilePath: string | null = null;

    try {
      setSending(true);

      // 添付ファイルがある場合はSupabase Storageにアップロード
      let attachmentInfo = null;
      if (attachments.length > 0) {
        const attachment = attachments[0];
        const file = await fetch(attachment.url);
        const blob = await file.blob();
        
        const fileExt = attachment.type === 'image' ? 'jpg' : 'pdf';
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `chat-attachments/${chatGroupId}/${fileName}`;
        uploadedFilePath = filePath;

        const { error: uploadError } = await supabase.storage
          .from('chat-files')
          .upload(filePath, blob);

        if (uploadError) {
          // ファイルアップロード失敗時の詳細エラー
          if (uploadError.message.includes('file_size_limit')) {
            throw new Error('ファイルサイズが大きすぎます');
          }
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('chat-files')
          .getPublicUrl(filePath);

        attachmentInfo = {
          type: attachment.type,
          url: publicUrl,
          name: attachment.name,
        };
      }

      // メッセージを保存
      const { error: insertError } = await supabase
        .from('chat_messages')
        .insert({
          chat_group_id: chatGroupId,
          content: inputText.trim(),
          sender_user_id: user.id,
          sender_role: userRole === 'parent' ? '生徒' : '講師',
          attachment_info: attachmentInfo,
        });

      if (insertError) throw insertError;

      // 入力欄をクリア
      setInputText('');
      setAttachments([]);
      setError(null); // エラーをクリア

    } catch (err) {
      // エラーはAlertで表示するため、console.errorは削除
      
      // アップロードしたファイルをクリーンアップ
      if (uploadedFilePath) {
        await supabase.storage
          .from('chat-files')
          .remove([uploadedFilePath])
          .catch(cleanupErr => {}); // クリーンアップエラーは無視
      }

      // リトライ処理
      if (retryCount < maxRetries && 
          err instanceof Error && 
          (err.message.includes('network') || err.message.includes('timeout'))) {
        
        setTimeout(() => {
          handleSend(retryCount + 1);
        }, Math.pow(2, retryCount) * 1000); // 指数バックオフ
        
        setError(`メッセージの送信を再試行中... (${retryCount + 1}/${maxRetries})`);
        return;
      }

      const errorMessage = err instanceof Error ? err.message : 'メッセージの送信に失敗しました';
      setError(errorMessage);
    } finally {
      setSending(false);
    }
  };

  const handleAttachFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      const fileSize = file.size || 0;

      if (fileSize > 10 * 1024 * 1024) { // 10MB
        setError('ファイルサイズは10MB以下にしてください');
        return;
      }

      const type = file.mimeType?.startsWith('image/') ? 'image' : 'pdf';
      setAttachments([{
        type,
        url: file.uri,
        name: file.name,
      }]);
    } catch (err) {
      // エラーはAlertで表示するため、console.errorは削除
      setError('ファイルの選択に失敗しました');
    }
  };

  const removeAttachment = (index: number) => {
    const newAttachments = [...attachments];
    newAttachments.splice(index, 1);
    setAttachments(newAttachments);
  };

  const handleAttachmentPress = (url: string, type: string) => {
    // ファイルを開く処理（必要に応じて実装）
    // ファイルを開く処理
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader 
        title="チャット" 
        showBackButton={true}
        onBackPress={() => router.back()}
      />
      
      <KeyboardAvoidingView
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
        >
        {messages.map((message) => (
          <ChatMessage
            key={message.id}
            message={message}
            onAttachmentPress={handleAttachmentPress}
          />
        ))}
      </ScrollView>

      {attachments.length > 0 && (
        <View style={styles.attachmentsPreview}>
          {attachments.map((attachment, index) => (
            <View key={index} style={styles.attachmentPreview}>
              {attachment.type === 'image' ? (
                <Image
                  source={{ uri: attachment.url }}
                  style={styles.attachmentImage}
                />
              ) : (
                <View style={styles.pdfPreview}>
                  <Text style={styles.pdfName} numberOfLines={1}>
                    {attachment.name || 'Document.pdf'}
                  </Text>
                </View>
              )}
              <TouchableOpacity
                style={styles.removeAttachment}
                onPress={() => removeAttachment(index)}
              >
                <X size={14} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.attachButton}
          onPress={handleAttachFile}
          disabled={sending}
        >
          <Paperclip size={20} color="#64748B" />
        </TouchableOpacity>

        <TextInput
          style={styles.input}
          placeholder="メッセージを入力..."
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={1000}
          editable={!sending}
        />

        <TouchableOpacity
          style={[
            styles.sendButton,
            (inputText.trim() === '' && attachments.length === 0) && styles.sendButtonDisabled
          ]}
          onPress={handleSend}
          disabled={inputText.trim() === '' && attachments.length === 0 || sending}
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
    backgroundColor: '#FFFFFF',
  },
  chatContainer: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 16,
    textAlign: 'center',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  attachmentsPreview: {
    padding: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  attachmentPreview: {
    marginRight: 8,
    marginBottom: 8,
    position: 'relative',
  },
  attachmentImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  pdfPreview: {
    width: 100,
    height: 40,
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  pdfName: {
    fontSize: 12,
    color: '#1E293B',
  },
  removeAttachment: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  attachButton: {
    padding: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 8,
    maxHeight: 100,
    marginHorizontal: 8,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#3B82F6',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#94A3B8',
  },
}); 